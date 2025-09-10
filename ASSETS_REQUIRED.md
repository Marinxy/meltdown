# Arcade Meltdown - Required Assets Documentation

This document lists all assets that need to be created and placed in the correct directories for the full Arcade Meltdown experience. The game will run with placeholder assets, but these files will enhance the visual and audio experience.

## Directory Structure

```
Arcade Meltdown/
├── assets/
│   ├── sprites/
│   │   ├── players/
│   │   ├── enemies/
│   │   ├── weapons/
│   │   ├── effects/
│   │   └── ui/
│   └── audio/
│       ├── music/
│       ├── sfx/
│       └── ui/
```

## 🎨 SPRITE ASSETS (PNG format, transparent backgrounds)

### Player Sprites (`assets/sprites/players/`)
- `player_heavy.png` - 32x32px - Heavy class character (red/orange theme)
- `player_scout.png` - 32x32px - Scout class character (green theme)
- `player_engineer.png` - 32x32px - Engineer class character (blue theme)
- `player_medic.png` - 32x32px - Medic class character (pink/white theme)

### Enemy Sprites (`assets/sprites/enemies/`)
- `enemy_grunt.png` - 24x24px - Basic melee enemy (dark red)
- `enemy_spitter.png` - 24x24px - Ranged projectile enemy (green)
- `enemy_bruiser.png` - 40x40px - Tank enemy (dark blue)
- `enemy_miniboss.png` - 48x48px - Elite enemy (purple)
- `boss.png` - 64x64px - Main boss enemy (orange/yellow)

### Weapon Effects (`assets/sprites/weapons/`)
- `bullet.png` - 8x4px - Standard bullet projectile (yellow)
- `flame.png` - 16x16px - Flamethrower particle (orange/red)
- `heal_beam.png` - 16x16px - Healing beam effect (green/white)
- `muzzle_flash.png` - 16x16px - Weapon firing effect (white/yellow)

### Visual Effects (`assets/sprites/effects/`)
- `explosion.png` - 32x32px - Explosion sprite sheet (4x4 frames)
- `particle.png` - 4x4px - Generic particle (white)
- `blood_splatter.png` - 16x16px - Blood effect (red)
- `impact_spark.png` - 8x8px - Bullet impact effect (yellow/white)
- `teleport_effect.png` - 32x32px - Teleportation visual (purple/blue)
- `shield_effect.png` - 48x48px - Shield bubble (blue/transparent)

### UI Elements (`assets/sprites/ui/`)
- `crosshair.png` - 16x16px - Aiming crosshair (white)
- `health_orb.png` - 16x16px - Health pickup (red)
- `ammo_box.png` - 16x16px - Ammo pickup (yellow)
- `chaos_indicator.png` - 24x24px - Chaos meter icon (red/orange)

## 🎵 AUDIO ASSETS

### Music (`assets/audio/music/`) - OGG Vorbis format recommended
**Menu Music:**
- `menu_theme.ogg` - Main menu background music (2-3 minutes, looping)

**Game Music (Layered Stems for Dynamic System):**
- `game_base.ogg` - Base layer (drums, bass) - Always playing
- `game_melody.ogg` - Melody layer - Fades in at 20% chaos
- `game_harmony.ogg` - Harmony layer - Fades in at 50% chaos  
- `game_percussion.ogg` - Extra percussion - Fades in at 70% chaos

**Boss Music:**
- `boss_theme.ogg` - Intense boss battle music (3-4 minutes, looping)

### Sound Effects (`assets/audio/sfx/`) - OGG Vorbis format
**Player Weapons:**
- `flamethrower_fire.ogg` - Continuous flame sound (looping)
- `smg_fire.ogg` - Rapid SMG shots (short burst)
- `shotgun_fire.ogg` - Powerful shotgun blast
- `heal_beam.ogg` - Healing beam sound (looping)

**Combat:**
- `player_shoot.ogg` - Generic player weapon fire
- `enemy_death.ogg` - Enemy destruction sound
- `player_death.ogg` - Player death sound
- `explosion_small.ogg` - Small explosion (bullets, enemies)
- `explosion_large.ogg` - Large explosion (boss, special attacks)

**Enemy Sounds:**
- `enemy_grunt_attack.ogg` - Grunt melee attack
- `enemy_spitter_shoot.ogg` - Spitter projectile fire
- `enemy_bruiser_slam.ogg` - Bruiser slam attack
- `miniboss_teleport.ogg` - MiniBoss teleportation
- `boss_laser.ogg` - Boss laser beam attack
- `boss_meteor.ogg` - Boss meteor strike

**Pickups & Items:**
- `pickup_health.ogg` - Health item collected
- `pickup_ammo.ogg` - Ammo item collected
- `powerup_activate.ogg` - Special ability activation

### UI Sounds (`assets/audio/ui/`)
- `wave_start.ogg` - New wave beginning
- `wave_complete.ogg` - Wave completion
- `boss_spawn.ogg` - Boss appearance warning
- `boss_death.ogg` - Boss defeated
- `chaos_intense.ogg` - High chaos level reached
- `menu_select.ogg` - Menu button selection
- `menu_confirm.ogg` - Menu confirmation
- `game_over.ogg` - Game over sound

## 🎨 Asset Style Guidelines

### Visual Style
- **Retro pixel art** aesthetic (16-bit inspired)
- **Neon color palette** - bright, saturated colors
- **High contrast** for visibility
- **Clean pixel art** - avoid anti-aliasing
- **Consistent lighting** - top-down perspective

### Color Themes
- **Heavy (Red/Orange):** #ff4400, #ff8800, #ffaa00
- **Scout (Green):** #00ff44, #44ff88, #88ffaa  
- **Engineer (Blue):** #4400ff, #8844ff, #aa88ff
- **Medic (Pink/White):** #ff0044, #ff4488, #ff88aa
- **Enemies:** Dark, muted versions of above colors
- **Effects:** Bright whites, yellows for impacts/explosions

### Audio Style - "Retro TrashBit"
- **8-bit chiptune** foundation with **thrash metal** energy
- **Heavy distortion** and **compression**
- **Fast, aggressive** rhythms
- **Retro synthesizers** mixed with **distorted guitars**
- **Punchy, compressed** sound effects
- **Dynamic range** that responds to chaos level

## 📁 File Placement Instructions

1. **Create the directory structure** as shown above
2. **Place assets** in their respective folders
3. **Use exact filenames** as listed (case-sensitive)
4. **Recommended formats:**
   - Images: PNG with transparency
   - Audio: OGG Vorbis (better compression than MP3)
   - Fallback: MP3 for broader browser support

## 🔧 Technical Specifications

### Image Assets
- **Format:** PNG with alpha channel
- **Color depth:** 32-bit RGBA
- **Compression:** Optimize for web (use tools like TinyPNG)
- **Naming:** lowercase, underscores for spaces

### Audio Assets
- **Sample rate:** 44.1kHz or 48kHz
- **Bit depth:** 16-bit minimum
- **Format:** OGG Vorbis preferred, MP3 fallback
- **Volume:** Normalize to -6dB to prevent clipping
- **Looping:** Seamless loops for music and continuous effects

## 🎮 Current Status

✅ **Game is fully playable** with placeholder assets
✅ **All systems functional** - weapons, enemies, chaos, particles, audio
✅ **Placeholder graphics** - colored rectangles with labels
✅ **Silent audio** - all sound calls work but produce no audio

The game will automatically use real assets when they're placed in the correct locations, with no code changes required.

## 🚀 Priority Order for Asset Creation

### High Priority (Core Gameplay)
1. Player sprites (4 classes)
2. Enemy sprites (5 types)
3. Basic weapon sounds
4. Explosion effects

### Medium Priority (Polish)
1. Particle effects
2. UI elements  
3. Background music
4. Advanced sound effects

### Low Priority (Enhancement)
1. Animation frames
2. Advanced visual effects
3. Ambient sounds
4. Voice clips

---

*This document will be updated as new assets are added or requirements change.*
