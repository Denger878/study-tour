# Study Tour

A study timer that motivates you to finish your sessions by progressively revealing stunning landscape photographs.

**[Live Demo](https://study-tour-rho.vercel.app)**

## About

Study Tour gamifies focus sessions by displaying a heavily pixelated landscape image that gradually becomes clearer as your timer counts down. The visual progression creates an incentive to complete your study session and reveal the full image — a beautiful location from around the world.

## Features

- **Progressive reveal** — Image starts pixelated and sharpens over time
- **Customizable duration** — Set any study length or use +30 minute increments
- **Fullscreen mode** — Press `F` for distraction-free studying
- **Location reveal** — Discover where each landscape was photographed
- **Minimal UI** — Clean interface that stays out of your way

## Tech Stack

- Vanilla JavaScript
- HTML5 Canvas for pixel manipulation
- CSS with glassmorphism effects
- [Landscape Data Pipeline API](https://github.com/Denger878/landscape-data-pipeline) for image data

## How It Works

1. Enter your study duration
2. Start the timer — a pixelated landscape appears
3. As time passes, the image progressively sharpens
4. Complete your session to reveal the full image and its location
5. Press `SPACE` to start a new session with a fresh image

## Local Development

```bash
# Clone the repo
git clone https://github.com/Denger878/study-tour.git
cd study-tour

# Open in browser
open index.html
```

For full functionality, run the [Landscape Data Pipeline API](https://github.com/Denger878/landscape-data-pipeline) locally or update `script.js` to point to the deployed API.

## Screenshots

![Study Tour Timer](https://study-tour-rho.vercel.app)

## License

MIT
