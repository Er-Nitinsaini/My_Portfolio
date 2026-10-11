# Nitin Saini — Cinematic Portfolio V6

Original React / Vite portfolio built with GSAP ScrollTrigger + Lenis. It uses a generated, motion-echo portrait based on the previous design iteration, huge layered typography, dark/orange atmospheric visuals, scroll-driven parallax, project mockup artwork and responsive styling.

## Run locally
```bash
npm install
npm run dev
```

## Build and deploy to Netlify
```bash
npm run build
```
Deploy the `dist` folder. For Netlify import the repository, use **Build command:** `npm run build` and **Publish directory:** `dist`.

## Modify
- `src/content.html` is the **single source of truth** for editable text, sections, links and image paths. Vite imports it via `?raw` in `App.jsx`; edit it once.
- `src/styles.css` provides layouts and animation styles.
- `src/behavior.js` mounts interactions and scroll effects with cleanup.
- `public/assets/nitin-motion-portrait.webp` is the generated hero portrait; replace with an approved real edited portrait if you need an exact verified likeness.
- `public/assets/hero-chrome.webp` is atmospheric art; SVGs are conceptual project mockups, not screenshots.

The preview HTML is a standalone demo with embedded assets. It attempts to load GSAP/Lenis from CDN, but the React app has dependencies declared in `package.json` and runs the actual libraries via bundler. Reduced-motion preference is honored.

All four featured project links were taken from Nitin's earlier portfolio iteration; verify that the repositories and demos are still live before publishing.


## V5 expertise gallery improvements

- Desktop: Hover or keyboard-focus one of the four expertise rows to show its generated, photorealistic laptop preview.
- The image floats slightly to the left of the row's right-aligned description.
- Subtle cursor tracking and full-card top-down fabric-like curtain reveal.
- On touch devices, tap a row to display the same preview above the list.
- `standalone-preview.html` and the React site are generated from the same source HTML/CSS/behavior.
- The four `*-laptop.png` files are conceptual mockups, not screenshots of deployed client work.

## V6 animation performance fix
- Replaced multi-stop polygon mask with a single 920ms Web Animations API top-to-bottom clip reveal.
- Removed full-panel rotation and moving blur; highlight edge is transform-only.
- Decodes the four PNG assets early and avoids forced layout on hover.
- Mouse-follow now moves the preview surface without restarting its entrance transition.
- Kept standalone preview in sync with React source.


## V7 hero spacing adjustment
Moved the hero description and Explore My Work CTA below the oversized NITIN lettering on wide, short desktop viewports, preserving the heading, portrait, existing hover previews and mobile stacking. The change is limited to `src/content.html` and `src/styles.css`.


## V8 changes
- Scroll-triggered reveals now replay every time sections/elements re-enter the viewport (down and up).
- The hero headline replays its GSAP entrance on viewport re-entry.
- Hero/About/Work/Expertise/Contact/Footer share a coordinated near-black, warm-stone palette with softly connected gradient endpoints. Coral is retained as an accent.
- Reduced-motion preference is respected; existing project and hover logic is preserved.
- `standalone-preview.html` is generated from `src/content.html`, `src/styles.css`, and `src/behavior.js`.


## V9 — Original background restored
V9 restores the exact V7 black, cream and orange section backgrounds and accent color while preserving V8 repeat-on-scroll text and hero entrance effects. React source: `src/styles.css`; standalone HTML includes the same CSS and interaction code. No other sections or layouts were modified.


## V10 — project covers, favicon, contact form, and cursor lens
- Replaced the four vector project cover placeholders with locally bundled generated WebP raster cover artwork (`project-*.webp`). These are conceptual visualizations, not verified captures of the live applications.
- Added a custom N-dot favicon and Apple touch icon.
- Removed the `ORIGINAL SITE` footer link.
- Added an accessible Name/Email/Budget/Message contact form inspired by PortfolioOne's structure. Netlify static form registration lives in index.html; React submits URL-encoded POST and falls back to an email draft if unavailable. Local file previews use email draft.
- Added a fine-pointer magnifier that clones only the hovered site section and renders a slightly magnified slice under the cursor (no inert decorative blur falsely presented as zoom). Disabled for coarse pointers and reduced motion.
- Contact markup, interactions, and asset references sync into standalone-preview.html.

## V11 — Web3Forms + social profiles + lens-free contact
- Contact form posts `FormData` via fetch to `https://api.web3forms.com/submit` using the public access key shown in the user's Web3Forms dashboard. Confirm your Web3Forms destination email is verified in your dashboard.
- Name, email, budget and message are submitted. Submit button shows a sending state. Success/error feedback is displayed inline, without an email-app redirect; fields reset only after a verified API success response.
- Magnifying lens hides over the entire Contact section, including form and contact links, with pointer-position and keyboard-focus safeguards.
- Added LinkedIn (`https://www.linkedin.com/in/dev-nitin-saini/`) and Instagram (`https://www.instagram.com/codi2craft/`) links in contact and footer.
- All other backgrounds, project artwork and animated sections are preserved from V10.
- Don't assume submissions work until you make one manual test on the deployed domain; domain filtering and recipient confirmation depend on Web3Forms.
