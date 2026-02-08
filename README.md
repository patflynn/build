# Basement Lab

A static, mobile-first PWA to track a 12-month bodybuilding transformation.

**Live App:** https://patflynn.github.io/build/

## Features

- Dark mode cyberpunk/terminal aesthetic
- Workout programs loaded from JSON
- Tracks current day (1-365) with localStorage
- Weight logging per exercise with history
- YouTube video embeds for form checks
- Works offline (PWA)

## Stack

- Vanilla HTML/JS/CSS
- No build step required
- Designed for static hosting (NixOS, GitHub Pages)

## Development

```bash
# Enter dev shell
nix develop

# Start local server
serve .

# Run validation
node tests/validate.js

# Run E2E tests
nix develop .#test
npm ci
npx playwright test
```

## Project Structure

```
├── index.html      # App shell
├── style.css       # Dark theme styles
├── app.js          # Core logic
├── data/
│   └── program.json   # Workout program data
├── tests/
│   ├── validate.js    # Schema validation
│   └── e2e.spec.js    # Playwright tests
└── PLAN.md         # Project roadmap
```
