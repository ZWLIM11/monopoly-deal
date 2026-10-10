# Monopoly Deal — The Deal Club

A playable 3D Monopoly Deal fan game for 2–5 players. Built for the same shared-table experience as the earlier Monopoly project, with a separate repository, rules engine, and multiplayer service.

## Play

[Play the live game](https://monopoly-deal-3d.limziwei2004.workers.dev).

Run with Node.js 22 or newer. No dependency installation or build is needed for local play.

```sh
node server/node.mjs
```

Open **http://localhost:8790**. Choose **Play with bots** for an immediate three-player match, or **Host a table**, share its six-character code, and invite friends. The host can mix human players and bots, up to five seats.

For two local players, use separate browser tabs. Sessions are stored per tab so refreshing reconnects to the same seat. For other devices on your LAN, use the server computer’s LAN address rather than localhost. Node rooms are held in memory and reset if the server restarts.

## Features

- Locally bundled Three.js: a walnut and leather table, gold trim, red game box, brass lamp, rounded layered card stacks, warm lighting, shadows, hover lift, smooth orbit/zoom, top view, and draw/property-movement animations.
- Illustrated city and action cards, engraved money, rainbow wilds, and reversible red card backs. The same high-resolution card painter supplies the 3D scene, hand, and click-to-flip inspector.
- Readable card inspection and keyboard-accessible buttons; mobile hand scrolling; a functional control interface even without WebGL.
- Automatic first-game tutorial with six steps, skip/replay controls, contextual “What now?” explanations, and a first-discard reminder. Action/payment dialogs take priority over help.
- Switch between an Amber lounge and Midnight skyline using **Background**. Your choice and hint preference are saved in the current browser.
- Complete 106-card playable deck: 28 fixed properties, 11 wild properties, 20 money cards, 34 actions, and 13 rent cards.
- Banking, property sets, wild rearrangement, rent combinations, houses/hotels, Sly Deal, Forced Deal, Deal Breaker, birthdays, debt collection, and Just Say No counter chains.
- Player-selected debt payments, no change, hand-size enforcement, three different complete sets to win, and rematch lobby.
- Server-side validation and random shuffling, secret seat tokens, private hand snapshots, revision checks against duplicate/stale plays, same-origin checks, and request limits.
- Solo practice with heuristic bots. Bots are intended as approachable opponents rather than expert players.

## Controls

Drag the table to orbit; scroll to zoom. Click a table card to inspect it. Click a card in your hand to play it or bank its value. **Manage properties** lets you move wilds. The response panel pauses actions for a choice; use **Respond** to reopen it after closing. Toggle sounds using the music button.

**Tutorial** replays the six-step introduction. **What now?** explains the current turn phase. **Background** changes the room lighting/skyline and lets you disable the inline hints. Help does not pause multiplayer; an incoming response replaces it when your decision is needed.

## Rules

The implementation uses the standard 106-card deck described in Hasbro’s 2008 leaflet. See [rules research and digital conventions](docs/rules.md) for the sources, edition differences, and edge-case decisions. The in-game guide links to the original sources.

## Verification

```sh
node --test tests/*.test.mjs
```

The engine suite includes complete seeded bot matches with card conservation checks. HTTP tests cover access control, hidden information, and synchronization. Browser checks cover desktop/mobile layouts, card play, two isolated player sessions, reconnects, and client errors:

```sh
# Requires Playwright and an installed browser.
node tests/browser.mjs
```

Optional test environment variables: `TEST_URL`, `BROWSER_CHANNEL` (e.g. `msedge`), `PLAYWRIGHT_PATH`, and `SCREENSHOT_DIR`.

## Cloudflare hosting

`wrangler.jsonc` serves the static client and a separate Durable Object per room. Room state survives worker restarts; inactive rooms expire after 24 hours. The browser and API use the same origin.

```sh
npx wrangler@4 deploy
```

Sign in to your Cloudflare account first. This creates the `monopoly-deal-3d` Worker; it does not modify the earlier Monopoly deployment. Cloudflare plan limits apply. A plain static host or GitHub Pages alone cannot run the room API.

## Structure

- `public/cards.mjs`: shared deck definitions and display text.
- `public/tabletop.mjs`: 3D environment, rendering, and camera controls.
- `public/card-art.mjs`: shared illustrated card faces, rent tables, banknotes, and backs.
- `public/assets/deal-illustrations.webp`: locally hosted generated illustration atlas; see [art direction and prompt](docs/art-direction.md).
- `public/luxury.css`: the leather, walnut, brass, and ivory interface theme.
- `public/app.mjs`: lobby, card controls, responses, and synchronization.
- `server/engine.mjs`: rules, private views, and bot choices.
- `server/rooms.mjs`: sessions, lobby, atomic commands, and bot pacing.
- `server/node.mjs`: dependency-free local HTTP server.
- `server/worker.mjs`: persistent Cloudflare room adapter.

## Known boundaries

Human turns and response windows have no automatic timeout; disconnected players can hold up a game until they reconnect. Leaving a running match does not substitute a bot. There are no accounts, matchmaking, chat, or cross-device seat recovery. The visual interface is English. Table conventions for ambiguous rules are explicitly documented rather than described as official rulings.

This is an independent fan project, not an official Hasbro product. Card artwork and UI are original; the bundled Three.js MIT license is in `public/vendor/THREE-LICENSE.txt`.
