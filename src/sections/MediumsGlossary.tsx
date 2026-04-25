import { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { mediumsConfig } from '../config';
import type { MediumItem } from '../config';

function GooeyTextRow({ item, filterId, onHover, onLeaveHover }: { item: MediumItem; filterId: string; onHover: () => void; onLeaveHover: () => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<SVGTextElement>(null);
  const text2Ref = useRef<SVGTextElement>(null);
  const textsGroupRef = useRef<SVGGElement>(null);
  const feBlurRef = useRef<SVGFEGaussianBlurElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const primitiveValues = useRef({ stdDeviation: 0 });
  const isHovered = useRef(false);

  const buildTimeline = useCallback(() => {
    if (!text1Ref.current || !text2Ref.current || !textsGroupRef.current || !feBlurRef.current) return;

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        if (textsGroupRef.current) textsGroupRef.current.style.filter = 'none';
      },
      onReverseComplete: () => {
        if (textsGroupRef.current) textsGroupRef.current.style.filter = 'none';
      },
      onUpdate: () => {
        if (feBlurRef.current) {
          feBlurRef.current.setAttribute('stdDeviation', String(primitiveValues.current.stdDeviation));
        }
      },
    });

    // stdDeviation 0 -> 1.5
    tl.to(primitiveValues.current, {
      duration: 0.5,
      ease: 'none',
      stdDeviation: 1.5,
      startAt: { stdDeviation: 0 },
    }, 0);

    // stdDeviation 1.5 -> 0
    tl.to(primitiveValues.current, {
      duration: 0.5,
      ease: 'none',
      stdDeviation: 0,
    });

    // text_1 opacity fade out
    tl.to(text1Ref.current, {
      duration: 1,
      ease: 'none',
      opacity: 0,
    }, 0);

    // text_2 opacity fade in
    tl.to(text2Ref.current, {
      duration: 1,
      ease: 'none',
      opacity: 1,
    }, 0);

    // text_1 slide right
    tl.to(text1Ref.current, {
      duration: 1,
      ease: 'Power2.easeInOut',
      x: 8,
    }, 0);

    // text_2 slide from left
    tl.to(text2Ref.current, {
      duration: 1,
      ease: 'Power2.easeInOut',
      startAt: { x: -8 },
      x: 0,
    }, 0);

    tlRef.current = tl;
  }, []);

  useEffect(() => {
    // Set initial state
    if (text2Ref.current) {
      gsap.set(text2Ref.current, { opacity: 0 });
    }
    buildTimeline();

    return () => {
      if (tlRef.current) tlRef.current.kill();
    };
  }, [buildTimeline]);

  const onEnter = () => {
    isHovered.current = true;
    if (textsGroupRef.current) {
      textsGroupRef.current.style.filter = `url(#${filterId})`;
    }
    if (tlRef.current) tlRef.current.play();
    onHover();
  };

  const onLeave = () => {
    isHovered.current = false;
    if (textsGroupRef.current) {
      textsGroupRef.current.style.filter = `url(#${filterId})`;
    }
    if (tlRef.current) tlRef.current.reverse();
    onLeaveHover();
  };

  return (
    <div
      ref={rowRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '28px 0',
        transition: 'border-color 0.4s',
      }}
    >
      <svg
        viewBox="0 0 400 50"
        style={{ width: '100%', maxWidth: '500px', height: '50px', overflow: 'visible' }}
        preserveAspectRatio="xMinYMid meet"
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur
              ref={feBlurRef}
              in="SourceGraphic"
              stdDeviation="0"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  1 0 1 0 0  0 0 0 16 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g ref={textsGroupRef}>
          <text
            ref={text1Ref}
            x="0"
            y="35"
            fill="#EDE8E4"
            fontFamily="'Noto Serif SC', Georgia, serif"
            fontSize="32"
            fontWeight="300"
            letterSpacing="0.08em"
          >
            {item.cn}
          </text>
          <text
            ref={text2Ref}
            x="0"
            y="35"
            fill="#30B0D0"
            fontFamily="'Noto Sans SC', Helvetica, sans-serif"
            fontSize="28"
            fontWeight="700"
            letterSpacing="0.12em"
          >
            {item.en}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function MediumsGlossary() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const mediums = mediumsConfig.items;
  const hovered = hoveredIndex !== null ? mediums[hoveredIndex] : null;

  if (mediums.length === 0) {
    return null;
  }

  return (
    <section
      id="mediums"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '80vh',
        background: '#050A0F',
        zIndex: 4,
        display: 'flex',
        padding: '16vh 8vw',
        gap: '8vw',
      }}
    >
      {/* Left — titles */}
      <div style={{ flex: '0 0 50%' }}>
        <p
          className="font-sans-body"
          style={{
            fontSize: '12px',
            letterSpacing: '0.3em',
            color: 'rgba(237,232,228,0.35)',
            textTransform: 'uppercase',
            marginBottom: '48px',
          }}
        >
          {mediumsConfig.sectionLabel}
        </p>
        <div>
          {mediums.map((item, idx) => (
            <GooeyTextRow
              key={idx}
              item={item}
              filterId={`goo-suliu-${idx}`}
              onHover={() => setHoveredIndex(idx)}
              onLeaveHover={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </div>

      {/* Right — description on hover */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            maxWidth: '420px',
          }}
        >
          {hovered && (
            <>
              <p
                className="font-sans-body"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.25em',
                  color: '#30B0D0',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                {hovered.en}
              </p>
              <p
                className="font-sans-body"
                style={{
                  fontSize: '22px',
                  lineHeight: 2,
                  color: 'rgba(237,232,228,0.65)',
                  fontWeight: 300,
                }}
              >
                {hovered.description}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
