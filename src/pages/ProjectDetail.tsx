import type { ProjectData } from '../config';
import { projectDetailConfig } from '../config';

interface Props {
  project: ProjectData;
  onBack: () => void;
}

const SOURCE_FILES: Record<string, { name: string; path: string; lang: string }> = {
  'EDGE-001': { name: 'esp32_edge_firmware.cpp', path: 'scripts/esp32_edge_firmware.cpp', lang: 'cpp' },
  'COMP-002': { name: 'compression_pipeline.py', path: 'scripts/compression_pipeline.py', lang: 'python' },
  'ML-003': { name: 'meta_ensemble_model.py', path: 'scripts/meta_ensemble_model.py', lang: 'python' },
  'SYN-004': { name: 'synthetic_data_generator.py', path: 'scripts/synthetic_data_generator.py', lang: 'python' },
};

const ARCHITECTURE_LINK = { name: 'ARCHITECTURE.md', path: 'scripts/ARCHITECTURE.md' };

export default function ProjectDetail({ project, onBack }: Props) {
  const textShadow = '0 2px 24px rgba(0,0,0,0.45)';
  const sourceFile = SOURCE_FILES[project.id];

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        width: '100%',
        color: '#ffffff',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          padding: '28px 4vw',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(5,10,15,0.25)',
        }}
      >
        <button
          onClick={onBack}
          className="font-sans-body"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)',
            color: '#ffffff',
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            padding: '10px 22px',
            borderRadius: 30,
            cursor: 'pointer',
            textShadow,
          }}
        >
          {projectDetailConfig.backLabel || '←'}
        </button>
        <div
          className="font-sans-body"
          style={{
            fontSize: 10,
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.65)',
            textTransform: 'uppercase',
            textShadow,
          }}
        >
          {project.id} / {project.year}
        </div>
      </div>

      {/* Content — left article / right image */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '6vw',
          padding: '6vh 5vw 12vh',
          alignItems: 'start',
        }}
      >
        {/* Left — article */}
        <article style={{ maxWidth: 560 }}>
          <div
            className="font-sans-body"
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              marginBottom: 18,
              textShadow,
            }}
          >
            {project.location} · {project.year}
          </div>
          <h1
            className="font-serif-display"
            style={{
              fontSize: 'clamp(36px, 5vw, 72px)',
              fontWeight: 200,
              letterSpacing: '0.06em',
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 24,
              color: '#ffffff',
              textShadow,
            }}
          >
            {project.title}
          </h1>
          <p
            className="font-serif-display"
            style={{
              fontSize: 'clamp(16px, 1.4vw, 20px)',
              fontWeight: 300,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.82)',
              fontStyle: 'italic',
              margin: 0,
              marginBottom: 48,
              textShadow,
            }}
          >
            {project.subtitle}
          </p>

          {/* Meta rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 48,
              paddingTop: 20,
              paddingBottom: 24,
              borderTop: '1px solid rgba(255,255,255,0.18)',
              borderBottom: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            {project.meta.map((m) => (
              <div
                key={m.label}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}
              >
                <span
                  className="font-sans-body"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.25em',
                    color: 'rgba(255,255,255,0.55)',
                    textTransform: 'uppercase',
                    textShadow,
                  }}
                >
                  {m.label}
                </span>
                <span
                  className="font-sans-body"
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.88)',
                    textAlign: 'right',
                    textShadow,
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Body paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {project.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="font-sans-body"
                style={{
                  fontSize: 15,
                  lineHeight: 2,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.82)',
                  margin: 0,
                  textShadow,
                }}
              >
                {p}
              </p>
            ))}
          </div>

          {/* Source Code Download */}
          {sourceFile && (
            <div
              style={{
                marginTop: 48,
                paddingTop: 32,
                borderTop: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="font-sans-body"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.25em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                Source Code
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href={sourceFile.path}
                  download={sourceFile.name}
                  className="font-sans-body"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(48, 176, 208, 0.08)',
                    border: '1px solid rgba(48, 176, 208, 0.25)',
                    borderRadius: 8,
                    color: '#30B0D0',
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(48, 176, 208, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(48, 176, 208, 0.08)';
                  }}
                >
                  <span>{sourceFile.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>↓ Download</span>
                </a>
                <a
                  href={ARCHITECTURE_LINK.path}
                  download={ARCHITECTURE_LINK.name}
                  className="font-sans-body"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <span>{ARCHITECTURE_LINK.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>↓ Download</span>
                </a>
              </div>
            </div>
          )}
        </article>

        {/* Right — image, sticky so it stays in view while article scrolls */}
        <div
          style={{
            position: 'sticky',
            top: 120,
            width: '100%',
            maxWidth: 420,
            justifySelf: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '1024 / 1536',
              overflow: 'hidden',
            }}
          >
            <img
              src={project.image}
              alt={project.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
