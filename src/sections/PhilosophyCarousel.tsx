import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { philosophyConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

export default function PhilosophyCarousel() {
  const WORDS = philosophyConfig.rollingWords;
  const sectionRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ value: 0 });
  const speedRef = useRef({ value: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const section = sectionRef.current;
    const ring = ringRef.current;
    if (!section || !ring) return;

    const ctx = gsap.context(() => {
      gsap.to(rotationRef.current, {
        value: 360,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          onUpdate: (self) => {
            speedRef.current.value = self.getVelocity() * 0.0003;
          },
        },
      });
    });

    let currentRotation = 0;
    let currentSpeed = 0;

    const animateRing = () => {
      rafRef.current = requestAnimationFrame(animateRing);
      currentRotation += (rotationRef.current.value - currentRotation) * 0.08;
      currentSpeed += (speedRef.current.value - currentSpeed) * 0.1;
      speedRef.current.value *= 0.95;

      const absSpeed = Math.abs(currentSpeed);
      const skewAmount = Math.min(absSpeed * 12, 10);
      const scaleX = 1 + Math.min(absSpeed * 0.2, 0.12);

      ring.style.transform = `rotateX(${currentRotation}deg)`;

      const items = ring.querySelectorAll<HTMLElement>('[data-ring-item]');
      items.forEach((item) => {
        const blurVal = Math.min(absSpeed * 1.5, 2);
        item.style.filter = blurVal > 0.1 ? `blur(${blurVal}px)` : 'none';
        const inner = item.querySelector<HTMLElement>('span');
        if (inner) {
          inner.style.transform = `skewX(${currentSpeed > 0 ? skewAmount : -skewAmount}deg) scaleX(${scaleX})`;
        }
      });
    };

    animateRing();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.revert();
    };
  }, []);

  const totalItems = WORDS.length * 2;
  const angleStep = 360 / totalItems;
  const radius = 280;

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main content area — left/right split, transparent so fluid shader shows through */}
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          background: 'transparent',
          display: 'flex',
        }}
      >
        {/* Left 30% — text panel */}
        <div
          style={{
            flex: '0 0 30%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 5vw 0 4vw',
            }}
          >
            {philosophyConfig.eyebrow && (
              <p
                className="font-sans-body"
                style={{
                  fontSize: '13px',
                  letterSpacing: '0.25em',
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  marginBottom: '24px',
                  textShadow: '0 2px 24px rgba(0,0,0,0.45)',
                }}
              >
                {philosophyConfig.eyebrow}
              </p>
            )}
            {philosophyConfig.title && (
              <h2
                className="font-serif-display"
                style={{
                  fontSize: 'clamp(28px, 2.5vw, 42px)',
                  fontWeight: 300,
                  lineHeight: 1.35,
                  color: '#ffffff',
                  marginBottom: '28px',
                  textShadow: '0 2px 24px rgba(0,0,0,0.45)',
                }}
              >
                {philosophyConfig.title}
              </h2>
            )}
            {philosophyConfig.body && (
              <p
                className="font-sans-body"
                style={{
                  fontSize: '15px',
                  lineHeight: 2,
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 300,
                  textShadow: '0 2px 24px rgba(0,0,0,0.45)',
                }}
              >
                {philosophyConfig.body}
              </p>
            )}
          </div>
        </div>

        {/* Right 70% — rolling text ring */}
        <div
          style={{
            flex: '0 0 70%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              width: '100%',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '6vh',
              perspective: '1000px',
              perspectiveOrigin: '50% 55%',
            }}
          >
            <div
              ref={ringRef}
              style={{
                position: 'relative',
                width: '100%',
                height: `${radius * 2}px`,
                transformStyle: 'preserve-3d',
              }}
            >
              {[...WORDS, ...WORDS].map((word, i) => {
                const angle = i * angleStep;
                return (
                  <div
                    key={`${word}-${i}`}
                    data-ring-item
                    style={{
                      position: 'absolute',
                      width: '100%',
                      textAlign: 'center',
                      left: 0,
                      top: '50%',
                      transform: `rotateX(${angle}deg) translateZ(${radius}px) translateY(-50%)`,
                      backfaceVisibility: 'hidden',
                      willChange: 'filter',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: "'Noto Serif SC', Georgia, serif",
                        fontSize: 'clamp(42px, 8vw, 100px)',
                        fontWeight: 300,
                        color: '#ffffff',
                        letterSpacing: '0.06em',
                        lineHeight: 1.1,
                        willChange: 'transform',
                        textShadow: '0 2px 30px rgba(0,0,0,0.55)',
                      }}
                    >
                      {word}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
