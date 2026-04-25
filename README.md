# Flow Shader Frontend Template

An immersive studio / portfolio template built around a persistent full-screen WebGL fluid shader background. Hero, philosophy carousel and featured-works gallery all share the same living shader, then the page transitions into a solid-dark mediums glossary and footer. Clicking any gallery project opens a detail page with a full editorial article on the left and a sticky image on the right.

## Features

- Persistent Three.js fluid shader background (`FluidBackground`), shared across the first three sections
- GSAP + Lenis smooth scroll
- Full-screen hero with large bilingual wordmark, eyebrow + title + description + CTA
- Scroll-driven 3D rolling text ring with speed-reactive skew and blur
- Asymmetric, vertically-staggered featured works gallery
- Detail sub-page with sticky article-style layout (left article, right sticky image), preserves scroll position on back
- Gooey-SVG hover rows in the mediums glossary
- Full-width footer with ambient video background

## Tech Stack

- React 19 + TypeScript + Vite
- Three.js (fluid background shader)
- GSAP + ScrollTrigger (rolling ring animation)
- Lenis (smooth scroll)
- Tailwind CSS + shadcn/ui primitives

## Quick Start

1. `npm install`
2. Edit `src/config.ts` with your content
3. Add images and videos into `public/images/` and `public/videos/`
4. `npm run dev`
5. `npm run build` for production

## Configuration

All editable content lives in `src/config.ts`. Do not modify component files unless you are fixing a real bug.

### `siteConfig`

```ts
export const siteConfig = {
  language: "",          // e.g. "en", "zh-CN"
  siteTitle: "",         // Browser tab title
  siteDescription: "",   // Meta description
}
```

### `navigationConfig`

```ts
export const navigationConfig = {
  brandMark: "",         // Short brand mark shown in the nav (1–3 chars works best)
  links: [
    // { label: "项目", targetId: "gallery" },
    // { label: "介质", targetId: "mediums" },
    // { label: "哲思", targetId: "philosophy" },
    // { label: "联络", targetId: "footer" },
  ],
}
```

`targetId` must match the id of the section wrapper in `App.tsx`. Valid ids: `hero-section`, `philosophy`, `gallery`, `mediums`, `footer`.

### `heroConfig`

```ts
export const heroConfig = {
  wordmarkText: "",       // Large wordmark on the left half
  eyebrow: "",            // Small uppercase label
  titleLine1: "",         // Title line 1
  titleLine2: "",         // Title line 2 (optional)
  descriptionLine1: "",   // Description line 1
  descriptionLine2: "",   // Description line 2 (optional)
  ctaText: "",            // Button text
  ctaTargetId: "",        // Scroll target on CTA click, e.g. "philosophy"
}
```

### `philosophyConfig`

```ts
export const philosophyConfig = {
  eyebrow: "",            // Small uppercase label
  title: "",              // Section title
  body: "",               // Short paragraph
  rollingWords: [],       // Words shown in the 3D rolling ring on the right
}
```

### `galleryConfig`

```ts
export const galleryConfig = {
  sectionLabel: "",       // Uppercase section label, e.g. "FEATURED WORKS / 002"
  title: "",              // Section heading
  projects: [
    // {
    //   id: "P-001",                        // Unique id
    //   title: "",                           // Short title
    //   location: "",                        // Location string
    //   year: "",                            // Year string
    //   image: "images/project-1.jpg",       // Main image
    //   subtitle: "",                        // One-line italic subtitle in the detail page
    //   meta: [
    //     { label: "", value: "" },
    //   ],
    //   paragraphs: [                        // 2–4 paragraphs of body copy
    //     "",
    //   ],
    // }
  ],
}
```

### `mediumsConfig`

```ts
export const mediumsConfig = {
  sectionLabel: "",       // Uppercase label above the list
  items: [
    // { cn: "", en: "", description: "" }
  ],
}
```

### `footerConfig`

```ts
export const footerConfig = {
  visionText: "",         // Long vision paragraph (serif display)
  brandName: "",          // Bottom-left brand name
  columns: [
    // {
    //   heading: "",
    //   entries: [
    //     { text: "hello@example.com", href: "mailto:hello@example.com" },
    //     { text: "Instagram", href: "#" },
    //     { text: "Multi\nline\naddress" },   // No href = plain text
    //   ],
    // }
  ],
  copyright: "",
  videoPath: "",          // Optional ambient footer video, e.g. "videos/footer.mp4"
}
```

### `projectDetailConfig`

```ts
export const projectDetailConfig = {
  backLabel: "",          // Back button label, e.g. "← 返回" or "← Back"
}
```

## Required Images

Paths are relative to `public/`.

### Projects (1 per entry in `galleryConfig.projects`)
- `images/project-*.jpg` — 1024×1536 portrait recommended

### Videos
- `videos/footer-*.mp4` — optional ambient footer loop (muted, short, looping)

## Design

**Colors:**
- Base: `#050A0F` (deep blue-black)
- Text on shader: white with text-shadow `0 2px 24px rgba(0,0,0,0.45)`
- Warm ivory on dark sections: `#EDE8E4`
- Cyan accent: `#30B0D0`

**Fonts:** (loaded from Google Fonts in `index.html`)
- Display: Noto Serif SC
- Body: Noto Sans SC

**Animations:**
- Full-screen Three.js fluid shader, shared across hero / philosophy / gallery
- IntersectionObserver toggles the shader render loop so it pauses below the fold
- GSAP ScrollTrigger + scrub drives the 3D rolling ring with skew + motion-blur
- Lenis smooth scroll globally
- Gooey SVG blur + swap on mediums rows

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Project Structure

```
3-flow-shader-frontend/
├── index.html
├── package.json
├── public/
│   ├── images/.gitkeep       # Drop project images here
│   └── videos/.gitkeep       # Optional footer video
└── src/
    ├── config.ts             # ⭐ All editable content
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── FluidBackground.tsx
    │   └── Navigation.tsx
    ├── sections/
    │   ├── HeroField.tsx
    │   ├── PhilosophyCarousel.tsx
    │   ├── ImmersiveGallery.tsx
    │   ├── MediumsGlossary.tsx
    │   └── Footer.tsx
    └── pages/
        └── ProjectDetail.tsx
```

## Notes

- All content goes in `src/config.ts`.
- Images and videos go in `public/images/` and `public/videos/`.
- Don't modify component files unless fixing a real bug — the fluid shader, scroll ring, and detail-page scroll restoration are load-bearing.
- Color / font / spacing tokens are hardcoded in component styles and in `tailwind.config.js`.
