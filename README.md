# Ultimate Eleven ⚽

A Captain Tsubasa-inspired anime football strategy game — browser-based, no install required.

## File Structure

```
ultimate-eleven/
├── index.html   # Screens, layout, HTML structure
├── style.css    # All styling, themes, animations
├── game.js      # Match engine, player data, game logic
└── assets/      # (future) sprites, sounds, images
```

## How to publish on GitHub Pages

### 1. Create a GitHub account
Go to [github.com](https://github.com) and sign up (free).

### 2. Create a new repository
- Click **New repository**
- Name it `ultimate-eleven` (or anything you want)
- Set it to **Public**
- Click **Create repository**

### 3. Upload the files
Option A — drag & drop in the browser:
- Open your new repo
- Click **Add file → Upload files**
- Drag `index.html`, `style.css`, `game.js` into the box
- Click **Commit changes**

Option B — GitHub Desktop app (easier if you use it often):
- Download [GitHub Desktop](https://desktop.github.com)
- Clone your repo locally
- Copy the 3 files into the folder
- Commit and push

### 4. Enable GitHub Pages
- Go to your repo → **Settings** → **Pages**
- Under **Source**, select **Deploy from a branch**
- Branch: `main`, folder: `/ (root)`
- Click **Save**

### 5. Your game is live
After ~1 minute, your game will be at:
```
https://YOUR-USERNAME.github.io/ultimate-eleven/
```

Share that link with anyone — works on mobile, no install needed.

## Adding assets (sprites, sounds)

Create an `assets/` folder in your repo:
```
assets/
├── sprites/    # Player face images, team logos
├── sounds/     # Goal sound, whistle, crowd
└── fonts/      # Any custom fonts
```

Reference them in `style.css` or `game.js`:
```css
/* In style.css */
background-image: url('assets/sprites/tsubasa.png');
```
```js
// In game.js
const goalSound = new Audio('assets/sounds/goal.mp3');
```

## Development tips

- Edit `style.css` for all visual changes — colors, layouts, animations
- Edit `game.js` for gameplay — player stats, formations, match logic
- Edit `index.html` only for adding new screens or changing structure
- Test locally by opening `index.html` directly in Chrome/Safari
