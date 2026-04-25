/**
 * Edge-Optimized Meta-Ensemble Anomaly Detector
 * ESP32 Edge Device Firmware
 * 
 * Hardware: ESP32-D0WD with SCT-013 current clamps & ACS712 modules
 * Function: Real-time voltage/current acquisition, filtering, RMS computation,
 *           tamper detection, and MQTT telemetry transmission.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <driver/adc.h>
#include <esp_adc_cal.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ==================== CONFIGURATION ====================
const char* WIFI_SSID       = "GRID_OPS_WIFI";
const char* WIFI_PASSWORD   = "SECURE_PASS";
const char* MQTT_BROKER     = "mqtt.smartgrid.local";
const int   MQTT_PORT       = 1883;
const char* MQTT_TOPIC      = "meter/edge/esp32_001";
const char* CLIENT_ID       = "esp32-edge-001";

// ADC Configuration
#define ADC_CHANNEL_L1      ADC1_CHANNEL_6   // GPIO34
#define ADC_CHANNEL_L2      ADC1_CHANNEL_7   // GPIO35
#define ADC_CHANNEL_L3      ADC1_CHANNEL_4   // GPIO32
#define ADC_CHANNEL_V1      ADC1_CHANNEL_5   // GPIO33
#define ADC_CHANNEL_V2      ADC1_CHANNEL_3   // GPIO39 (Vn)
#define ADC_CHANNEL_V3      ADC1_CHANNEL_0   // GPIO36

#define SAMPLE_RATE_HZ      1000
#define CYCLE_SAMPLES       20               // 20ms @ 1kHz = 1 mains cycle
#define RMS_WINDOW_MS       1000             // 1-second RMS output
#define TAMPER_THRESHOLD    50               // ADC counts open-circuit bias shift
#define NOTCH_DEPTH         0.95f            // 50/60 Hz notch attenuation

// ==================== GLOBAL STATE ====================
WiFiClient      wifiClient;
PubSubClient    mqtt(wifiClient);
Preferences     prefs;
esp_adc_cal_characteristics_t adcCal;

struct SensorState {
    // Raw sample buffers (double-buffered)
    uint16_t rawL1[CYCLE_SAMPLES];
    uint16_t rawL2[CYCLE_SAMPLES];
    uint16_t rawL3[CYCLE_SAMPLES];
    uint16_t rawV1[CYCLE_SAMPLES];
    uint16_t rawV2[CYCLE_SAMPLES];
    uint16_t rawV3[CYCLE_SAMPLES];
    
    // Filtered & processed
    float filtL1[CYCLE_SAMPLES];
    float filtL2[CYCLE_SAMPLES];
    float filtL3[CYCLE_SAMPLES];
    
    // RMS accumulators
    double sumSqL1, sumSqL2, sumSqL3;
    double sumSqV1, sumSqV2, sumSqV3;
    uint32_t sampleCount;
    
    // Tamper detection
    uint16_t baselineBiasL1, baselineBiasL2, baselineBiasL3;
    bool tamperL1, tamperL2, tamperL3;
    uint32_t tamperLatchTime;
    
    // Calibration constants (loaded from NVS)
    float calCurrentL1, calCurrentL2, calCurrentL3;  // A / ADC count
    float calVoltageL1, calVoltageL2, calVoltageL3;    // V / ADC count
    float phaseOffsetL1, phaseOffsetL2, phaseOffsetL3; // radians
} state;

// ==================== FILTERING ====================
// 3-tap median filter for impulse suppression
inline float median3(float a, float b, float c) {
    if (a > b) {
        if (b > c) return b;
        else if (a > c) return c;
        else return a;
    } else {
        if (a > c) return a;
        else if (b > c) return c;
        else return b;
    }
}

// Simple IIR notch at 50/60 Hz: y[n] = x[n] - NOTCH_DEPTH * x[n-1] + NOTCH_DEPTH * y[n-1]
struct NotchFilter {
    float xPrev, yPrev;
    float process(float x) {
        float y = x - NOTCH_DEPTH * xPrev + NOTCH_DEPTH * yPrev;
        xPrev = x;
        yPrev = y;
        return y;
    }
} notchL1, notchL2, notchL3, notchV1, notchV2, notchV3;

// 3-pole median filter state
struct Median3State {
    float buf[3];
    uint8_t idx;
    float process(float x) {
        buf[idx] = x;
        idx = (idx + 1) % 3;
        return median3(buf[0], buf[1], buf[2]);
    }
} medL1, medL2, medL3;

// ==================== SETUP ====================
void setupADC() {
    // Configure ADC1: 12-bit, 11dB attenuation (0-3.3V range)
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(ADC_CHANNEL_L1, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(ADC_CHANNEL_L2, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(ADC_CHANNEL_L3, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(ADC_CHANNEL_V1, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(ADC_CHANNEL_V2, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(ADC_CHANNEL_V3, ADC_ATTEN_DB_11);
    
    // Characterize ADC for voltage-to-count calibration
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, 1100, &adcCal);
}

void loadCalibration() {
    prefs.begin("edge_cal", true); // read-only
    state.calCurrentL1 = prefs.getFloat("cal_i1", 0.01465f);  // ~5A SCT-013
    state.calCurrentL2 = prefs.getFloat("cal_i2", 0.01465f);
    state.calCurrentL3 = prefs.getFloat("cal_i3", 0.01465f);
    state.calVoltageL1 = prefs.getFloat("cal_v1", 0.000805f); // 230V/3.3V divider
    state.calVoltageL2 = prefs.getFloat("cal_v2", 0.000805f);
    state.calVoltageL3 = prefs.getFloat("cal_v3", 0.000805f);
    state.phaseOffsetL1 = prefs.getFloat("ph_1", 0.0f);
    state.phaseOffsetL2 = prefs.getFloat("ph_2", 0.0f);
    state.phaseOffsetL3 = prefs.getFloat("ph_3", 0.0f);
    prefs.end();
}

void connectWiFi() {
    WiFi.setSleep(false);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
        delay(500);
        retries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        WiFi.setAutoReconnect(true);
        WiFi.persistent(true);
    }
}

void connectMQTT() {
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setBufferSize(1024);
    int retries = 0;
    while (!mqtt.connected() && retries < 10) {
        if (mqtt.connect(CLIENT_ID)) break;
        delay(1000);
        retries++;
    }
}

void setup() {
    Serial.begin(115200);
    delay(100);
    
    // Load persistent calibration & tamper state
    loadCalibration();
    prefs.begin("edge_state", true);
    state.tamperL1 = prefs.getBool("tamper1", false);
    state.tamperL2 = prefs.getBool("tamper2", false);
    state.tamperL3 = prefs.getBool("tamper3", false);
    state.tamperLatchTime = prefs.getUInt("tamper_t", 0);
    prefs.end();
    
    setupADC();
    connectWiFi();
    connectMQTT();
    
    // Initialize filter states
    memset(&notchL1, 0, sizeof(NotchFilter));
    memset(&notchL2, 0, sizeof(NotchFilter));
    memset(&notchL3, 0, sizeof(NotchFilter));
    memset(&notchV1, 0, sizeof(NotchFilter));
    memset(&notchV2, 0, sizeof(NotchFilter));
    memset(&notchV3, 0, sizeof(NotchFilter));
    memset(&medL1, 0, sizeof(Median3State));
    memset(&medL2, 0, sizeof(Median3State));
    memset(&medL3, 0, sizeof(Median3State));
    
    // Clear accumulators
    state.sumSqL1 = state.sumSqL2 = state.sumSqL3 = 0;
    state.sumSqV1 = state.sumSqV2 = state.sumSqV3 = 0;
    state.sampleCount = 0;
    
    // Establish baseline bias for tamper detection (quiet line assumption)
    uint32_t biasSumL1 = 0, biasSumL2 = 0, biasSumL3 = 0;
    for (int i = 0; i < 100; i++) {
        biasSumL1 += adc1_get_raw(ADC_CHANNEL_L1);
        biasSumL2 += adc1_get_raw(ADC_CHANNEL_L2);
        biasSumL3 += adc1_get_raw(ADC_CHANNEL_L3);
        delay(1);
    }
    state.baselineBiasL1 = biasSumL1 / 100;
    state.baselineBiasL2 = biasSumL2 / 100;
    state.baselineBiasL3 = biasSumL3 / 100;
}

// ==================== ACQUISITION LOOP ====================
inline void readCycle() {
    for (int i = 0; i < CYCLE_SAMPLES; i++) {
        state.rawL1[i] = adc1_get_raw(ADC_CHANNEL_L1);
        state.rawL2[i] = adc1_get_raw(ADC_CHANNEL_L2);
        state.rawL3[i] = adc1_get_raw(ADC_CHANNEL_L3);
        state.rawV1[i] = adc1_get_raw(ADC_CHANNEL_V1);
        state.rawV2[i] = adc1_get_raw(ADC_CHANNEL_V2);
        state.rawV3[i] = adc1_get_raw(ADC_CHANNEL_V3);
        delayMicroseconds(1000); // ~1 kHz inter-sample
    }
}

inline void processCycle() {
    for (int i = 0; i < CYCLE_SAMPLES; i++) {
        // Convert to voltage (mV) then to physical units
        float vL1 = esp_adc_cal_raw_to_voltage(state.rawL1[i], &adcCal);
        float vL2 = esp_adc_cal_raw_to_voltage(state.rawL2[i], &adcCal);
        float vL3 = esp_adc_cal_raw_to_voltage(state.rawL3[i], &adcCal);
        float vV1 = esp_adc_cal_raw_to_voltage(state.rawV1[i], &adcCal);
        float vV2 = esp_adc_cal_raw_to_voltage(state.rawV2[i], &adcCal);
        float vV3 = esp_adc_cal_raw_to_voltage(state.rawV3[i], &adcCal);
        
        // Notch filter (50/60 Hz mains rejection)
        float fL1 = notchL1.process(vL1);
        float fL2 = notchL2.process(vL2);
        float fL3 = notchL3.process(vL3);
        float fV1 = notchV1.process(vV1);
        float fV2 = notchV2.process(vV2);
        float fV3 = notchV3.process(vV3);
        
        // Median filter (impulse noise suppression)
        state.filtL1[i] = medL1.process(fL1);
        state.filtL2[i] = medL2.process(fL2);
        state.filtL3[i] = medL3.process(fL3);
        
        // Accumulate squares for RMS (current channels only; voltage channels for power factor)
        state.sumSqL1 += (double)(state.filtL1[i] * state.filtL1[i]);
        state.sumSqL2 += (double)(state.filtL2[i] * state.filtL2[i]);
        state.sumSqL3 += (double)(state.filtL3[i] * state.filtL3[i]);
        state.sumSqV1 += (double)(fV1 * fV1);
        state.sumSqV2 += (double)(fV2 * fV2);
        state.sumSqV3 += (double)(fV3 * fV3);
    }
    state.sampleCount += CYCLE_SAMPLES;
}

inline void detectTamper() {
    // Open-circuit detection: sudden bias shift when clamp is removed
    uint16_t instL1 = adc1_get_raw(ADC_CHANNEL_L1);
    uint16_t instL2 = adc1_get_raw(ADC_CHANNEL_L2);
    uint16_t instL3 = adc1_get_raw(ADC_CHANNEL_L3);
    
    int16_t diffL1 = (int16_t)instL1 - (int16_t)state.baselineBiasL1;
    int16_t diffL2 = (int16_t)instL2 - (int16_t)state.baselineBiasL2;
    int16_t diffL3 = (int16_t)instL3 - (int16_t)state.baselineBiasL3;
    
    if (abs(diffL1) > TAMPER_THRESHOLD && !state.tamperL1) {
        state.tamperL1 = true;
        state.tamperLatchTime = millis();
    }
    if (abs(diffL2) > TAMPER_THRESHOLD && !state.tamperL2) {
        state.tamperL2 = true;
        state.tamperLatchTime = millis();
    }
    if (abs(diffL3) > TAMPER_THRESHOLD && !state.tamperL3) {
        state.tamperL3 = true;
        state.tamperLatchTime = millis();
    }
}

// ==================== TELEMETRY ====================
inline void transmitPayload() {
    if (!mqtt.connected()) {
        connectMQTT();
        if (!mqtt.connected()) return; // Skip this cycle if broker unreachable
    }
    
    // Compute RMS values
    double n = (double)state.sampleCount;
    float rmsL1 = sqrt(state.sumSqL1 / n) * state.calCurrentL1;
    float rmsL2 = sqrt(state.sumSqL2 / n) * state.calCurrentL2;
    float rmsL3 = sqrt(state.sumSqL3 / n) * state.calCurrentL3;
    float rmsV1 = sqrt(state.sumSqV1 / n) * state.calVoltageL1;
    float rmsV2 = sqrt(state.sumSqV2 / n) * state.calVoltageL2;
    float rmsV3 = sqrt(state.sumSqV3 / n) * state.calVoltageL3;
    
    // Estimate power factor from L1/V1 phase correlation (simplified)
    float apparentP = rmsV1 * rmsL1;
    float reactiveQ = apparentP * 0.3f; // placeholder: full PF requires zero-crossing
    float powerFactor = 0.95f; // default; refined by edge FFT in production
    
    // Build JSON payload
    StaticJsonDocument<512> doc;
    doc["ts"]          = millis();
    doc["device_id"]   = CLIENT_ID;
    doc["rms_i1"]      = round(rmsL1 * 1000.0f) / 1000.0f;
    doc["rms_i2"]      = round(rmsL2 * 1000.0f) / 1000.0f;
    doc["rms_i3"]      = round(rmsL3 * 1000.0f) / 1000.0f;
    doc["rms_v1"]      = round(rmsV1 * 1000.0f) / 1000.0f;
    doc["rms_v2"]      = round(rmsV2 * 1000.0f) / 1000.0f;
    doc["rms_v3"]      = round(rmsV3 * 1000.0f) / 1000.0f;
    doc["pf"]          = round(powerFactor * 1000.0f) / 1000.0f;
    doc["tamper_l1"]   = state.tamperL1;
    doc["tamper_l2"]   = state.tamperL2;
    doc["tamper_l3"]   = state.tamperL3;
    doc["samples"]     = state.sampleCount;
    doc["heap"]        = ESP.getFreeHeap();
    
    char buf[512];
    size_t len = serializeJson(doc, buf, sizeof(buf));
    mqtt.publish(MQTT_TOPIC, buf, len);
    
    // Persist tamper flags to RTC memory
    if (state.tamperL1 || state.tamperL2 || state.tamperL3) {
        prefs.begin("edge_state", false);
        prefs.putBool("tamper1", state.tamperL1);
        prefs.putBool("tamper2", state.tamperL2);
        prefs.putBool("tamper3", state.tamperL3);
        prefs.putUInt("tamper_t", state.tamperLatchTime);
        prefs.end();
    }
    
    // Reset accumulators
    state.sumSqL1 = state.sumSqL2 = state.sumSqL3 = 0;
    state.sumSqV1 = state.sumSqV2 = state.sumSqV3 = 0;
    state.sampleCount = 0;
}

// ==================== MAIN LOOP ====================
void loop() {
    unsigned long tStart = millis();
    
    // Wi-Fi health check
    if (WiFi.status() != WL_CONNECTED) {
        connectWiFi();
    }
    mqtt.loop();
    
    // Acquisition + processing
    readCycle();
    processCycle();
    detectTamper();
    
    // Transmit every RMS_WINDOW_MS
    static unsigned long lastTx = 0;
    if (millis() - lastTx >= RMS_WINDOW_MS) {
        transmitPayload();
        lastTx = millis();
    }
    
    // Maintain target sample cadence
    unsigned long elapsed = millis() - tStart;
    if (elapsed < 20) {
        delay(20 - elapsed); // align to ~50 cycles/sec
    }
}
