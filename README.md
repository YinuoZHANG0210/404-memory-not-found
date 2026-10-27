# 404: Memory Not Found

**An Interactive Web Mystery About Remembering and Forgetting**

A browser-based narrative puzzle set in 2089. Mira asked for her private archive to disappear, but a damaged system retained traces. As a digital archivist, you recover fragments, separate a signed request from an attractive system guess, and decide what should remain. The archive keeps only a small fictional record of your choices in this browser.

**Intended user:** someone who enjoys short narrative games, digital nostalgia, and a light puzzle with an ethical choice. A first playthrough takes about five to eight minutes.

## Play

1. Start a recovery session from the opening file.
2. Reassemble Mira's six-piece photograph by clicking two pieces to swap them.
3. In the monochrome pixel slingshot game, follow the visible three-step strip: select a floating word, freely aim the sling at its matching blank with the pointer (or use ↑/↓ to fine-tune), then hold <kbd>Space</kbd> to charge and release to fire. The projectile must cross the correct blank to score. A press-and-hold **Fire** button provides the touch alternative. Recover all three transmissions.
4. Read the two source files and classify each claim as something the archive can or cannot prove.
5. Choose whether to restore everything, preserve verified fragments, or respect the deletion.

Every stage is contained in one fixed game viewport, with no page-level vertical scrolling. Each has a short action instruction, an **Archive Note** that explains its place in Mira's story, visible progress, an accessible button action, and a response line explaining what happened. Use the **EN / 中文** control in the top-right corner to switch the complete game interface between English and Simplified Chinese; the preference is saved locally. **Restart** always begins a clean run.

**Live version:** <https://yinuozhang0210.github.io/404-memory-not-found/>

![The opening recovery session in the archive interface](public/intro-screenshot.png)

The visitor record is fictional game state stored in this browser's local storage. No analytics, identity data, or activity is sent to a server.

## Design concept

The site is presented as a damaged personal archive rather than a dashboard. A black-and-white pixel-desktop surface uses CRT scan lines, monochrome file cards, damaged photographs, and high-contrast archive states to evoke an old computer without obscuring the next action.

## Technology

- React 18 and TypeScript
- Vite 6
- CSS; no game engine, backend, external API, or runtime UI dependency
- A custom SVG portrait and click-to-swap interaction

## Run locally

Requires Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Checks and production build

```sh
npm test
npm run build
npm run preview
```

`npm run build` performs the TypeScript project checks before creating the static site in `dist/`.

## Static deployment

Deploy the contents of `dist/` to any static host (for example GitHub Pages, Netlify, or Cloudflare Pages). Build with `npm run build`; set the publish directory to `dist`. The game uses in-page chapter state rather than client-side URL routes, so it does not need a host-side SPA fallback. The public portrait is a same-origin SVG asset.

### GitHub Pages

1. Create a **public** GitHub repository in your own account and push this project to its `main` branch.
2. Run `npm run build` locally.
3. This repository includes a GitHub Actions Pages workflow. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source; pushes to `main` build and publish `dist/` automatically.
4. Open the resulting link in a signed-out/private browser window before submitting the repository URL to Canvas.

The assignment asks for the public repository URL, not a deployment URL. A live link is an optional addition to the README.

## Project structure

```text
public/
  mira-portrait.svg       Original portrait used by the six-tile puzzle
src/
  App.tsx                 Story scenes, interactions, and game state
  game.ts                 State model and reusable puzzle rules
  game.test.ts            Focused puzzle/state tests
  main.tsx                React entry point
  styles.css              Archive-game visual system and responsive layout
```

## Design principles

- **Web as artifact:** File labels, damaged photographs, scan lines, and recovery states make the archive the setting.
- **One task at a time:** Each stage has a single visible instruction and primary action, so the mystery stays legible; the message stage adds a small aim-and-fill slingshot challenge rather than simple card clicks.
- **Evidence over completion:** The version puzzle distinguishes a signed request from an unsupported but plausible reconstruction.
- **Agency without a verdict:** Three endings show distinct consequences without declaring one morally correct.
- **Privacy by construction:** Visitor counters use only local game state and local storage; there is no analytics or network submission.
- **Accessible alternatives:** All interactions use native buttons, retain visible keyboard focus, respond on touch devices, and respect reduced-motion preferences.

## Known limitations

- The interface and narrative guidance are available in English and Simplified Chinese; the file names remain deliberately archival/English.
- Progress is saved per browser on the current device and is not synchronized.
- The story and evidence are deliberately compact; the intended first playthrough is a short-form experience.

## Assignment submission check

- [x] A complete input → response → feedback loop across four short tasks and an ending
- [x] Relevant mistake states: incomplete image recovery, an unloaded/undercharged/missed slingshot shot, and incorrect evidence classifications receive recoverable feedback
- [x] Keyboard and touch-accessible button interactions with visible focus and reduced-motion support
- [x] Original in-repository visual asset and credits below
- [x] `README.md`, `DESIGN_RATIONALE.md`, tests, and documented setup
- [ ] Add one actual screenshot or short screen recording before submission
- [x] Complete an anonymised real-person trial and document the resulting change in `PROCESS.md`
- [x] Push to the public GitHub repository and verify the GitHub Pages link

## Credits

- **Original work:** Interface, story, CSS, React/TypeScript implementation, and `public/mira-portrait.svg` were created for this project.
- **Course-material relationship:** This is an original narrative experience; it does not reuse a course example or a previous visualisation.
- **AI disclosure:** See `PROCESS.md` for a precise record of how AI assistance was used during development.
