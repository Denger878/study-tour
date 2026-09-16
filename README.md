# Study Tour

A study timer that motivates you to finish your sessions by progressively revealing stunning landscape photographs.

**[Live Demo](https://studytours.vercel.app)**

## About

Study Tour gamifies focus sessions by displaying a heavily pixelated landscape image that gradually becomes clearer as your timer counts down. The visual progression creates an incentive to complete your study session and reveal the full image — a beautiful location from around the world.

## Features

- **Progressive reveal** — Image starts pixelated and sharpens over time
- **Customizable duration** — Set any study length or use +30 minute increments
- **Fullscreen mode** — Press `F` for distraction-free studying
- **Location reveal** — Discover where each landscape was photographed
- **Offline fallback** — Bundled backup landscapes load if the API is unreachable
- **Minimal UI** — Clean interface that stays out of your way

## Tech Stack

- Vanilla JavaScript
- HTML5 Canvas for pixel manipulation
- CSS with glassmorphism effects
- [Landscape Data Pipeline API](https://github.com/Denger878/landscape-data-pipeline) (`https://landscape-data-pipeline.vercel.app/api/random`) for image data
- Deployed on Vercel

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

# Serve locally (the canvas needs an http:// origin to read the backup images)
python3 -m http.server 8000
open http://localhost:8000
```

The app fetches images from the deployed API by default. To use a local copy of the [Landscape Data Pipeline API](https://github.com/Denger878/landscape-data-pipeline), change `CONFIG.API_URL` in `script.js`. If the API is unreachable or takes longer than 5 seconds, the app falls back to the images in `backup-landscapes/`.

## Screenshots

![Study Tour Timer](images/title.png)
![Study Tour Timer](images/clock.png)

## Credits

Landscape photos come from [Unsplash](https://unsplash.com/?utm_source=study_tour&utm_medium=referral). The photographer is credited on screen when each photo is revealed.

## License

MIT
