# Process

## Starting idea

I began with a question rather than a plot: if a digital archive can reconstruct a person from fragments, does it have the right to do so? I chose a small browser-based mystery because an old personal webpage can itself become both the setting and the interface. The intended user is someone interested in short narrative games, web nostalgia, and light puzzles. A first playthrough is designed to take roughly five to eight minutes.

The central interaction loop is: inspect damaged material, make a repair or judgement, receive a visible archival response, and use that response to decide what to inspect next. The four tasks move from the satisfying act of restoring an image to a more uncomfortable act of deciding whether a restoration should happen at all.

## Design and code changes

After a design review, I removed the simulated browser chrome, floating archive panels, optional hint system, and URL-rearrangement task. They made the interface look busier than the game needed to be, and hid the next action. The revised structure has one main visual area and four numbered tasks: photograph, messages, evidence, and final choice. Each screen states the action in one sentence and only shows its forward button after the required action is complete.

I also made every interaction a native button. Players click two photograph tiles to exchange them, load a floating word and launch it with the slingshot, and use clear two-option buttons for evidence classification. This keeps the project workable with mouse, keyboard, and touch. The page retains visible focus states and honours reduced-motion preferences.

The small amount of game state is deliberately kept local. It remembers only puzzle progress and the fictional archive outcome in browser `localStorage`; no identity information or activity is sent to a server.

## AI tools and judgement

I used an AI coding assistant during development to help shape the React/TypeScript implementation, identify edge cases, and review wording and accessibility alternatives.

- **Suggestion kept:** use a small, deterministic six-tile image puzzle plus click-to-swap. This fit the short target playtime while giving the player a real action-and-response loop.
- **Suggestion changed:** an early direction treated the project as a dense old-browser simulation with several simultaneous puzzle surfaces. I changed it after reviewing the wayfinding: the final version has one task at a time and a calmer archive-game layout. It preserves the retro, damaged-web mood with file labels, scan lines, an original portrait, and restrained glitches rather than large amounts of interface chrome.

AI output was reviewed and adapted for the project. The narrative, project decisions, credits, and final submission claims must remain the author's responsibility.

## User trial and iteration

**Trial date / build:** 27 October 2026, GitHub Pages build. One person tried the game without a spoken explanation; no name or personal information was recorded.

**What happened:** The participant responded positively to the overall black-and-white archive atmosphere and could move through the photograph and evidence interactions. However, they could not clearly explain the story at first: the connection between the damaged photo, Mira's choice to delete, and the final responsibility was too implicit. At the slingshot screen they paused before making their first move because the floating words, aiming and charge/release controls appeared at once. They did not immediately understand that the action sequence was “select word → aim at matching blank → hold and release”.

**Decision and change:** I kept the four-task structure because the participant found the individual screens visually coherent, but added narrative signposts rather than adding more plot or another puzzle. The opening now states that Mira asked to disappear and that the archive kept traces; each task now has a compact **Archive Note** explaining its role in the story. I also turned the slingshot's instructions into a numbered three-step strip, added a live prompt that changes from loading to aiming to firing, and visually marks the first available word as the starting point. This makes the first attempt understandable while preserving free aiming and the original game mechanic.

**What I learned:** The participant feedback showed that visual mood alone did not communicate the ethical conflict. The revised guidance is intentionally short and appears immediately before each action, so the player receives story context, a deliberate input, a visible response, and a clear next action without interrupting the pace of the game.
