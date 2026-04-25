import { useEffect, useRef, useState } from 'react';
import { navigationConfig } from '../config';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!navigationConfig.brandMark && navigationConfig.links.length === 0) {
    return null;
  }

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 100,
        padding: '24px 4vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background-color 0.5s ease',
        backgroundColor: scrolled ? 'rgba(5, 10, 15, 0.7)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
      }}
    >
      <div
        className="font-serif-display"
        style={{
          fontSize: '18px',
          fontWeight: 400,
          letterSpacing: '0.15em',
          color: '#FFFFFF',
        }}
      >
        {navigationConfig.brandMark}
      </div>
      <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
        {navigationConfig.links.map((item) => (
          <button
            key={item.targetId}
            onClick={() => handleNavClick(item.targetId)}
            className="font-sans-body"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              opacity: 0.6,
              fontSize: '14px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'opacity 0.4s ease',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = '0.6';
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
