# 📁 ELEMON Asset Placement Guide

## Quick Reference: Where to Put Your Files

Place ALL your asset files in this directory:

```
c:\Users\sergio\Documents\Frutero\VibecodeBootcamp\delivery1\public\assets\
```

## File Checklist

### 🎬 Video
- [ ] `intro.mp4` - Intro screen video

### 🎵 Audio
- [ ] `music.mp3` - Background music (loops)

### 🎨 Sprites - Fire Type (Fosforito 🔥)
- [ ] `fire-egg-happy.png`
- [ ] `fire-egg-sad.png`
- [ ] `fire-baby-happy.png`
- [ ] `fire-baby-sad.png`
- [ ] `fire-adult-happy.png` ⭐ (shown in character selection)
- [ ] `fire-adult-sad.png`
- [ ] `fire-dead.png`

### 💧 Sprites - Water Type (Charquito 💧)
- [ ] `water-egg-happy.png`
- [ ] `water-egg-sad.png`
- [ ] `water-baby-happy.png`
- [ ] `water-baby-sad.png`
- [ ] `water-adult-happy.png` ⭐ (shown in character selection)
- [ ] `water-adult-sad.png`
- [ ] `water-dead.png`

### 🥔 Sprites - Earth Type (Mugresito 🥔)
- [ ] `earth-egg-happy.png`
- [ ] `earth-egg-sad.png`
- [ ] `earth-baby-happy.png`
- [ ] `earth-baby-sad.png`
- [ ] `earth-adult-happy.png` ⭐ (shown in character selection)
- [ ] `earth-adult-sad.png`
- [ ] `earth-dead.png`

### 💨 Sprites - Air Type (Suspiro 💨)
- [ ] `air-egg-happy.png`
- [ ] `air-egg-sad.png`
- [ ] `air-baby-happy.png`
- [ ] `air-baby-sad.png`
- [ ] `air-adult-happy.png` ⭐ (shown in character selection)
- [ ] `air-adult-sad.png`
- [ ] `air-dead.png`

---

## Total: 30 files
- 1 video
- 1 audio
- 28 sprite images

## Image Specs
- **Format**: PNG with transparency
- **Size**: 128x128 to 256x256 pixels recommended
- **Style**: Retro 16-bit pixel art
- **Important**: Filenames must match EXACTLY (case-sensitive)

## Testing After Adding Assets

1. Make sure dev server is running: `npm run dev`
2. Open: http://localhost:5173
3. You should see the intro video play
4. Select a character - you should see the adult sprite
5. In the game, sprites will change based on stage and emotion

## Fallback Behavior

If assets are missing:
- Intro video: Auto-skips after 10 seconds
- Character sprites: Shows emoji fallbacks (🔥💧🥔💨)
- Game sprites: Shows "?" placeholder
- Music: No audio plays (toggle still works)
