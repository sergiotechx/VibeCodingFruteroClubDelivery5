# ELEMON Assets Directory

This directory contains all required assets for the ELEMON game.

## Required Files

### Video
- **intro.mp4** - Intro screen video (auto-plays on game start)

### Audio
- **music.mp3** - Background music for game screen (loops)

### Sprite Images

All sprites follow the naming pattern: `{type}-{stage}-{emotion}.png`

#### Types (4 total)
- `fire` - Fosforito 🔥
- `water` - Charquito 💧
- `earth` - Mugresito 🥔
- `air` - Suspiro 💨

#### Stages (3 normal + 1 dead)
- `egg` - Initial stage (0-24 hours)
- `baby` - Second stage (24-48 hours)
- `adult` - Final stage (48+ hours)
- `dead` - Death state

#### Emotions (2 total)
- `happy` - All stats > 50
- `sad` - Any stat ≤ 50

### Complete Sprite List (28 files)

**Fire Type:**
- fire-egg-happy.png
- fire-egg-sad.png
- fire-baby-happy.png
- fire-baby-sad.png
- fire-adult-happy.png
- fire-adult-sad.png
- fire-dead.png

**Water Type:**
- water-egg-happy.png
- water-egg-sad.png
- water-baby-happy.png
- water-baby-sad.png
- water-adult-happy.png
- water-adult-sad.png
- water-dead.png

**Earth Type:**
- earth-egg-happy.png
- earth-egg-sad.png
- earth-baby-happy.png
- earth-baby-sad.png
- earth-adult-happy.png
- earth-adult-sad.png
- earth-dead.png

**Air Type:**
- air-egg-happy.png
- air-egg-sad.png
- air-baby-happy.png
- air-baby-sad.png
- air-adult-happy.png
- air-adult-sad.png
- air-dead.png

## Image Specifications

- **Format:** PNG with transparency
- **Rendering:** Use pixelated/crisp edges (image-rendering: pixelated)
- **Recommended Size:** 128x128 to 256x256 pixels
- **Style:** Retro 16-bit pixel art aesthetic

## Fallback Behavior

If sprites fail to load:
- Start screen shows emoji fallbacks (🔥💧🥔💨)
- Game screen shows a placeholder "?" icon
