# Compact Crawl

A browser-based roguelike game inspired by Dungeon Crawl Stone Soup (DCSS), designed with a minimalist architecture of less than 10 files total.

Play now: [https://alexkorol.github.io/compact-crawl/](https://alexkorol.github.io/compact-crawl/)

## Features

- Turn-based dungeon exploration
- Procedurally generated levels
- Infinite dungeon branches for endless exploration
- Classic roguelike permadeath mechanics
- Simple browser-based gameplay (no installation required)

## Getting Started

1. Clone this repository.
2. Serve the `docs/` directory locally, for example:
   ```bash
   npx serve docs
   ```
3. Open the printed local URL (typically `http://localhost:3000`) in your browser.
4. Use the arrow keys to move and the space bar to interact.

> Tip: You can also open `docs/index.html` directly in your browser, but using a static server more closely matches the GitHub Pages environment.

## GitHub Pages Deployment

To publish the game via GitHub Pages:

1. Push the `main` branch to GitHub.
2. Navigate to **Settings → Pages** in your repository.
3. Under **Build and deployment**, choose the `main` branch and set the folder to `/docs`.
4. Save the settings and wait for the deployment to complete. GitHub Pages will serve the game from `https://<your-username>.github.io/compact-crawl/`.

## File Structure

- `docs/`
  - `index.html` – Main container and entry point
  - `game.js` – Core game engine and main loop
  - `entities.js` – Player, monster, and item definitions
  - `dungeons.js` – Dungeon generation algorithms
  - `ui.js` – User interface and rendering
  - `assets.js` – Game assets and resources
  - `utils.js` – Utility functions
  - `data.js` – Game data and configuration
  - `monsters.js` – Monster behaviors
- `DESIGN.md` – Complete design documentation
- `README.md` – This file

## Development

See `DESIGN.md` for detailed architecture information and diagrams.

## License

MIT
