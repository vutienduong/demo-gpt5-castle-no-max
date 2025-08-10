## Epic Castle (Three.js + TypeScript)

An explorable, stylized 3D castle perched on a mountain peak. It includes patrol cannons, crowds moving in the courtyard, clouds and light fog, a balloon-popping minigame with projectiles and audio, and a simple character dialogue system.

### Features
- Cinematic intro camera pan; orbit/zoom exploration
- Round towers with colorful conical roofs, crenellated walls, central keep, and gatehouse
- Patrol cannons that periodically fire
- Ambient bustle: moving people and horses
- Light fog and billboard clouds
- Minigame: click to shoot projectiles and pop balloons; score HUD and pop sound
- Dialogue: click characters to open a dialogue box with speaker name and lines

### Quickstart
```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run preview
```

### Controls
- Orbit: left mouse drag
- Zoom: mouse wheel / trackpad pinch
- Shoot: click empty space to fire a projectile along the view ray
- Pop balloons: click balloons directly or hit them with a projectile
- Talk: click a character (cone-shaped figures with distinct colors)

### Tech stack
- three.js (WebGL)
- TypeScript
- Vite

### Project structure
```text
castle-game/
  public/
    pop.mp3               # balloon pop SFX (placeholder)
  src/
    main.ts               # app entry
    style.css             # HUD and layout styles
    modules/
      game.ts             # renderer, camera, controls, main loop
      scene.ts            # castle geometry, environment, crowds, balloons, cannons
      minigame.ts         # balloon minigame + score handling
      talk.ts             # dialogue system (UI wiring + state)
  index.html              # root DOM + HUD + dialogue markup
  tsconfig.json
  package.json
```

### Implementation notes
- The scene is stylized/low-poly for performance. Geometry is generated procedurally instead of using external models.
- The dialogue overlay lives in `index.html` and is controlled from `modules/talk.ts`.
- Balloons are simple spheres; popping removes the mesh and spawns a short-lived confetti `THREE.Points` effect.
- Patrol cannons spawn slow projectiles periodically for ambience.

### Customization
- Colors/materials: tweak palette in `modules/scene.ts` under `COLORS`.
- Density/scale: adjust `segments`, `wallRadius`, and `wallHeight` in `modules/scene.ts`.
- Fog/sky: change `scene.background` and `scene.fog` in `modules/game.ts`.
- HUD text: edit `index.html` and styles in `src/style.css`.

### Audio attribution
The included `public/pop.mp3` is a tiny placeholder sample fetched from `naptha/tinysound` (via jsDelivr) for demo purposes. Replace with your own licensed audio as needed (or update the path in `modules/game.ts`).

### License
This project is provided as-is for demo purposes.

## Demo
<img width="1344" height="750" alt="Screenshot 2025-08-10 at 22 17 29" src="https://github.com/user-attachments/assets/d70c7452-8cd1-4b05-88b0-cec85b7c0c38" />

