# Process

## Starting idea

I began with a question rather than a plot: if a digital archive can reconstruct a person from fragments, does it have the right to do so? I chose a small browser-based mystery because an old personal webpage can itself become both the setting and the interface. The intended user is someone interested in short narrative games, web nostalgia, and light puzzles. A first playthrough is designed to take roughly five to eight minutes.

The central interaction loop is: inspect damaged material, make a repair or judgement, receive a visible archival response, and use that response to decide what to inspect next. The five chapters move from the satisfying act of restoring an image to a more uncomfortable act of deciding whether a restoration should happen at all.

## Design and code changes

The initial interaction plan treated the broken URL as a standalone rearrangement task. During implementation, I changed it so that the three URL fragments remain visibly locked until the player has exposed all three message-board clues. This makes the sequence clearer: the player first discovers the evidence, then uses it to reconstruct the address. The locked state includes an explanation, and the puzzle remains playable through drag-and-drop or click-to-swap.

I also added click and keyboard alternatives to interactions that would otherwise depend on hover or dragging. For example, players can click two photograph tiles to exchange them, focus a corrupted message to reveal it, and use standard buttons for the evidence classification. This keeps the intended interaction while making the experience workable on touch devices and with keyboard navigation.

The visitor record was deliberately kept local. It counts only in-game restoration attempts, accessed pages, requested hints, and the final fictional archive decision. It uses browser `localStorage`, has a visible privacy notice, and sends no data to a server.

## AI tools and judgement

I used an AI coding assistant during development to help shape the React/TypeScript implementation, identify edge cases, and review wording and accessibility alternatives.

- **Suggestion kept:** use a small, deterministic six-tile image puzzle plus a click-to-swap fallback. This fit the short target playtime while giving the player a real action-and-response loop.
- **Suggestion changed:** an early direction would have made the experience look like a futuristic analytics dashboard. I rejected that visual approach because it weakened the premise of encountering an abandoned personal webpage. The implemented visual language instead uses a retro browser frame, damaged links, flat paper-like documents, and restrained glitches.

AI output was reviewed and adapted for the project. The narrative, project decisions, credits, and final submission claims must remain the author's responsibility.

## User trial — complete before submission

The assignment requires a real trial with at least one other person before explaining the game. I have not fabricated one. Before submitting, ask one person to play without instructions, then replace the brackets below with your actual observation and decision.

- **Trial date / build:** [for example: 30 October 2026, local Vite build]
- **What the participant tried first:** [what they clicked, hovered, dragged, or ignored]
- **Where they hesitated or misunderstood:** [specific chapter/control]
- **Did the response make sense to them?:** [brief observation]
- **Change made after the trial, or reason for retaining the design:** [specific change and why]

Do not include the participant's name or identifying information.
