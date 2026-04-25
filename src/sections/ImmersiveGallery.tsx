import { galleryConfig } from '../config';

interface Props {
  onSelect: (id: string) => void;
}

export default function ImmersiveGallery({ onSelect }: Props) {
  const textShadow = '0 2px 24px rgba(0,0,0,0.45)';
  const PROJECTS = galleryConfig.projects;

  if (PROJECTS.length === 0 && !galleryConfig.title) {
    return null;
  }

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 2,
        background: 'transparent',
        paddingTop: '15vh',
        paddingBottom: '15vh',
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '0 2rem',
          marginBottom: '10vh',
        }}
      >
        <div
          className="font-sans-body"
          style={{
            fontSize: 10,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            marginBottom: 16,
            textShadow,
          }}
        >
          {galleryConfig.sectionLabel}
        </div>
        <h2
          className="font-serif-display"
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 200,
            color: '#ffffff',
            letterSpacing: '0.05em',
            lineHeight: 1.2,
            margin: 0,
            textShadow,
          }}
        >
          {galleryConfig.title}
        </h2>
      </div>

      {/* Projects — asymmetric alternating layout */}
      <div
        style={{
          position: 'relative',
          padding: '0 2rem',
        }}
      >
        {PROJECTS.map((project, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={project.id}
              style={{
                display: 'flex',
                justifyContent: isLeft ? 'flex-start' : 'flex-end',
                marginTop: i === 0 ? 0 : i === 1 ? '-55vh' : i === 2 ? '-20vh' : '-45vh',
                marginBottom: 0,
                paddingLeft: isLeft ? '5vw' : '40vw',
                paddingRight: isLeft ? '40vw' : '5vw',
              }}
            >
              <div
                style={{
                  width: '45vw',
                  maxWidth: 600,
                }}
              >
                <div
                  onClick={() => onSelect(project.id)}
                  style={{
                    width: '100%',
                    aspectRatio: '1024 / 1536',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
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
                      transition: 'transform 0.6s ease',
                    }}
                    loading="lazy"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </div>

                {/* Meta */}
                <div
                  style={{
                    marginTop: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <div
                      className="font-sans-body"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                        textShadow,
                      }}
                    >
                      {project.id}
                    </div>
                    <h3
                      className="font-serif-display"
                      onClick={() => onSelect(project.id)}
                      style={{
                        fontSize: 20,
                        fontWeight: 300,
                        color: '#ffffff',
                        letterSpacing: '0.08em',
                        margin: 0,
                        textShadow,
                        cursor: 'pointer',
                        display: 'inline-block',
                        borderBottom: '1px solid transparent',
                        transition: 'border-color 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.55)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor = 'transparent';
                      }}
                    >
                      {project.title}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="font-sans-body"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        color: 'rgba(255,255,255,0.6)',
                        textShadow,
                      }}
                    >
                      {project.location}
                    </div>
                    <div
                      className="font-sans-body"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        color: 'rgba(255,255,255,0.6)',
                        marginTop: 4,
                        textShadow,
                      }}
                    >
                      {project.year}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
