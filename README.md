# Makruk — The Temple of Kings

A playable local two-player Thai chess game in an original, procedurally generated 3D temple. Built with Vite and Three.js. No server, account, or network service is required to play.

## Run locally

Requires Node.js 20+ or 22+ (verified on Node.js 20.17).

```sh
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173). For production, run `npm run build`; deploy `dist/` as a static website. `npm run preview` previews the build. `npm test` runs the rules tests.

## Play and explore

- Share the device with another player; Ivory moves first. Click a piece and a highlighted destination. The game implements check, checkmate, captures, stalemate, turn validation, promotion, threefold repetition, and honor counting.
- Orbit: drag to rotate, right-drag to pan, wheel to zoom.
- Free fly: toggle the camera or press V. WASD / arrow keys move, Shift accelerates, Space rises, Ctrl descends, and the wheel changes movement speed.
- Click **Enter mouse look** for pointer lock. Aim the center crosshair and click to select and move pieces. Esc releases the pointer. Pointer lock requires browser support and permission; free flight with ordinary pointer selection remains available.
- Home restores the board view. Sound is opt-in using the music button; effects are synthesized with Web Audio. Fullscreen uses the browser Fullscreen API.
- Undo restores the previous action, including counting state and captured pieces. New game asks before clearing a match. Matches are in memory and reset on reload.

## Rules convention

Uses the contemporary setup: Ivory Khun d1 / Met e1, Obsidian Khun e8 / Met d8, Bia on ranks 3 and 6. Khon moves one diagonal or one forward; Met one diagonal; Ma makes knight jumps; Ruea moves along ranks/files. Bia have no double step or en passant and automatically promote to Bia Ngai on the opposing Bia starting rank. No castling or historic first-move privileges.

Endgame counting follows [PyChess’s documented Makruk convention](https://www.pychess.org/variants/makruk): a player may activate board honor when no unpromoted pawns remain; piece honor automatically supersedes it for a bare king. Piece limits take the minimum applicable material limit and remain fixed after subsequent captures. Each escaping player's completed move increments the count; exceeding the limit draws. A counting player delivering mate receives a draw. Board honor advantage is declared by the player, rather than inferred from material. Threefold repetition is automatically adjudicated. Regional counting conventions can differ.

## Project structure

```
src/game/rules.js       Pure rules, serializable state, legal actions, end conditions
src/game/store.js       Action dispatch, snapshots, subscriptions, undo
src/scene/pieces.js     Warrior assembly, equipment, and per-role profiles
src/scene/sculpture.js  Custom geometry, rigid mesh batching, fracture shader
src/scene/warrior-parts.js Sculpted faces, armor, crowns, weapons, and cloaks
src/scene/poses.js      Articulated poses and two-link walking leg IK
src/scene/world.js      Hall, board, lighting, renderer, selection indicators
src/scene/camera.js     Orbit / free flight, damping, collision boundaries
src/scene/animation.js  Turn / approach / attack / reaction / claim state machine
src/scene/effects.js    Weapon trails, projectiles, detached relics, debris, audio
src/ui.js              Interface and state rendering
src/main.js            Input, orchestration, animation loop
src/style.css          Responsive visual design
tests/rules.test.js    Rules regression tests
tests/animation.test.js Capture ordering, physical contact, and effect cleanup
```

For future Firebase Realtime Database integration, send versioned actions (`MOVE`, `COUNT`, `DRAW`) through a transport adapter and validate them against `state.ply` and the authorized player's color on a trusted authority. `applyAction(state, action)` is pure and returns JSON-serializable state. The scene subscribes to local actions; it never owns rule decisions. Undo is currently local and would require multiplayer agreement. No Firebase or networking is implemented.

## Art, dependencies, and scope

Every chess piece, board component, ornament, column, brazier, and particle system is built from code. There are no downloaded chess models, environmental models, image textures, copyrighted franchise assets, or AI-generated assets. The armies use ivory-bronze and jade-obsidian materials with procedural surface grain and emissive fracture seams.

### The living army

| Makruk piece | Original sculpture | Movement and combat |
| --- | --- | --- |
| Khun | Crowned sovereign, five-tier crown, engraved cuirass, cloak, royal sword and shield | Deliberate steps, shoulder-led sword cleave, kneeling collapse |
| Met | Lotus oracle, layered robes, ritual staff, floating hand crystal | Short measured gait, charging gesture and visible magical projectile, upward disintegration |
| Khon | Naga guardian, curling shoulder crests, tower shield and ornate spear | Braced gait, shield feint followed by spear extension, shield drop and forward collapse |
| Ma | Armored horse and articulated rider, barding, reins, mane, sabre | Alternating diagonal trot, routes around occupied squares, flank sabre strike, horse-and-rider collapse |
| Ruea | Barge sentinel, boat-prow back fins, heavy armor, war-anchor and shield | Heavy steps, overhead anchor smash and shock ring, heavy rubble collapse |
| Bia | Shell legionary, cowrie shield relief, helmet, spear | Infantry stride, drawn-back spear thrust, recoil and crumbling knees |
| Bia Ngai | Awakened legionary, taller crown, mantle and spirit blade | Agile stride, reversed spirit cut, spiraling magical debris |

Each piece has 19–30 named rig nodes for hips, knees, ankles, waist, neck, arms, elbows, hands and equipment; cavalry adds an articulated mount. Procedural leg IK raises the swing foot while keeping stance feet grounded. Static details are batched by material within their owning joint. Board synchronization retains surviving meshes and rebuilds only removed, restored, or promoted models.

Captures turn and approach before the attack. Melee weapons aim at the defender's body; the oracle sends a visible bolt. Defenders brace, recoil, develop glowing cracks, collapse, drop recognizable crowns/weapons/shields, and dissolve into gravity-driven fragments or ascending spirit fragments. The attacker then walks into the captured square. The game state remains authoritative and animation-independent; input is held until choreography completes, while camera controls remain usable.

With the Vite server running, `/dev/warriors.html` opens a development sculpture workshop. `npm run test:warriors` renders all seven rigs through idle, windup, strike, and fracture poses using installed Chrome. `npm run test:browser` checks gameplay, captures, undo, reset, camera controls, and mobile layout. Review screenshots are saved under `artifacts/`. The workshop is not included in the production entrypoint.

Three.js, Vite, and their direct use here are MIT-licensed. Playwright is Apache-2.0-licensed and used only for development verification. Google Fonts supplies DM Sans and Cormorant Garamond under the SIL Open Font License; local system fonts are fallbacks when offline. No paid assets or commercial-use restrictions are introduced by these direct dependencies; distributed dependencies retain their own license notices.

This prototype is local two-player: no AI opponent, online play, clocks, or persistence. Camera boundaries protect the floor, board plinth, walls, and columns; it is a free-flight controller rather than a full physics simulation. Captures have a brief camera lens pulse in orbit mode; the player's camera controls remain available. Warriors use hierarchical rigid-body rigs and authored procedural choreography, with stylized debris physics rather than a ragdoll solver. WebGL and hardware acceleration are required; pixel ratio is capped for performance.
