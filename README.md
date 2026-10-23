# 404: Memory Not Found

**An Interactive Web Mystery About Remembering and Forgetting**

A browser-based narrative puzzle set in 2089. As a digital archivist, you enter Mira's damaged personal website, recover fragments, compare conflicting records, and decide what should remain. The archive also keeps a small fictional record of your choices.

## Play

1. Find the responsive `archive-recovery` link on the broken 404 page.
2. Reassemble Mira's six-piece photograph by dragging pieces or clicking two pieces to swap them.
3. Reveal all three guestbook fragments by hovering, focusing, or clicking. This unlocks the path puzzle; arrange its fragments using the board's ROOT → PERSON → REQUEST clue.
4. Switch between three versions of the archive and classify the dated deletion request and unsupported Lisbon reconstruction.
5. Choose whether to restore everything, preserve verified fragments, or respect the deletion. The ending includes a local visitor record.

Hints are available at every puzzle and can be requested three times for progressively more direct help. Recovered files can be revisited through **Archive Index**. **Restart / Clear Progress** resets the run. Sound is optional and off by default. Use the language control to switch interface labels between English and Chinese.

The visitor record is fictional game state stored in this browser's local storage. No analytics, identity data, or activity is sent to a server.

## Design concept

The site is presented as a damaged personal web page rather than a dashboard. Browser chrome, old links, a locally authored portrait, cache stamps, corrupted text, and changing file states make the web archive itself the setting and the puzzle surface.

## Technology

- React 18 and TypeScript
- Vite 5
- CSS; no game engine, backend, external API, or runtime UI dependency
- A custom SVG portrait and native browser drag/click interactions

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
3. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, select `main`, and select `/docs` only if you first copy the generated `dist/` directory there. Otherwise use a Pages workflow that builds the project and publishes `dist/`.
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
  styles.css              Retro browser design system and responsive layout
```

## Design principles

- **Web as artifact:** The browser frame, broken links, address bar, and directory are part of the fiction.
- **Failure as interaction:** Corruption invites inspection and reconstruction instead of acting only as decoration.
- **Evidence over completion:** The version puzzle distinguishes a signed request from an unsupported but plausible reconstruction.
- **Agency without a verdict:** Three endings show distinct consequences without declaring one morally correct.
- **Privacy by construction:** Visitor counters use only local game state and local storage; there is no analytics or network submission.
- **Accessible alternatives:** Puzzle pieces and path fragments support click-to-swap, hidden text can be focused, buttons are keyboard-operable, and reduced-motion preferences are respected.

## Known limitations

- Narrative prose is in English; the language toggle translates core interface labels and controls.
- Progress is saved per browser on the current device and is not synchronized.
- Browser-native drag and drop is supplemented by click-to-swap for touch and keyboard users.
- The story and evidence are deliberately compact; the intended first playthrough is a short-form experience.

## Assignment submission check

- [x] A complete input → response → feedback loop across five short chapters
- [x] A relevant mistake state: wrong path/evidence attempts produce a recoverable message; the private path is locked until its three clues are inspected
- [x] Keyboard/click alternatives for drag, hover, and focus interactions
- [x] Original in-repository visual asset and credits below
- [x] `README.md`, `DESIGN_RATIONALE.md`, tests, and documented setup
- [ ] Add one actual screenshot or short screen recording before submission
- [ ] Complete the real-person trial section in `PROCESS.md`
- [ ] Push to a public GitHub repository and verify its link while signed out

## Credits

- **Original work:** Interface, story, CSS, React/TypeScript implementation, and `public/mira-portrait.svg` were created for this project.
- **Course-material relationship:** This is an original narrative experience; it does not reuse a course example or a previous visualisation.
- **AI disclosure:** See `PROCESS.md` for a precise record of how AI assistance was used during development.
