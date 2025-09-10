# 🎮 Arcade Meltdown - Game Design Document

**Version:** 1.0  
**Date:** 2025  
**Status:** Living Document  

---

## 📋 Table of Contents

1. [Game Overview](#1-game-overview)
2. [Core Gameplay](#2-core-gameplay)
3. [Player Classes](#3-player-classes)
4. [Weapon Systems](#4-weapon-systems)
5. [Enemy Design](#5-enemy-design)
6. [Power-ups & Pickups](#6-power-ups--pickups)
7. [Progression System](#7-progression-system)
8. [Multiplayer Design](#8-multiplayer-design)
9. [Visual Design](#9-visual-design)
10. [Audio Design](#10-audio-design)
11. [User Interface](#11-user-interface)
12. [Technical Requirements](#12-technical-requirements)

---

## 1. Game Overview

### 1.1 Vision Statement
Arcade Meltdown is the ultimate retro LAN arcade shooter that combines the speed of classic Doom, the cooperative chaos of Helldivers, and the visual spectacle of modern indie games. Every match is designed to end in laughter, screaming, and the inevitable "one more round!"

### 1.2 Core Pillars
- **Chaos:** Escalating intensity through visual, audio, and gameplay systems
- **Cooperation:** Team-based mechanics with friendly fire consequences
- **Nostalgia:** Authentic retro aesthetic with modern polish
- **Accessibility:** Easy to learn, impossible to master

### 1.3 Target Audience
- **Primary:** 18-35 year old PC gamers who attend LAN parties
- **Secondary:** Retro gaming enthusiasts and indie game collectors
- **Tertiary:** Casual gamers looking for party games

### 1.4 Platform Strategy
- **Launch Platform:** Web (HTML5/Canvas)
- **Future Platforms:** Steam (Electron), Mobile (Cordova), Console (Unity port)

---

## 2. Core Gameplay

### 2.1 Game Flow
```
Class Selection → Arena Spawn → Wave Combat → Boss Fight → Next Wave
     ↓              ↓             ↓           ↓          ↓
  Strategy    →  Positioning  →  Chaos   →  Teamwork → Escalation
```

### 2.2 Core Loop (90 seconds)
1. **Preparation Phase** (10s) - Players position, check ammo, plan strategy
2. **Wave Combat** (60s) - Enemies spawn, chaos meter builds, combat intensifies
3. **Aftermath** (20s) - Collect pickups, revive teammates, prepare for next wave

### 2.3 Session Structure (10-15 minutes)
- **Waves 1-4:** Learning and warming up
- **Wave 5:** First boss encounter
- **Waves 6-9:** Escalating difficulty
- **Wave 10:** Major boss fight
- **Wave 11+:** Infinite scaling with periodic bosses

### 2.4 Victory Conditions
- **Survival Mode:** Last as long as possible
- **Score Attack:** Achieve target score
- **Boss Rush:** Defeat specific boss sequence
- **Chaos Master:** Maintain maximum chaos meter for duration

---

## 3. Player Classes

### 3.1 Design Philosophy
Each class fills a specific role while maintaining individual viability. Classes encourage different playstyles and promote team composition strategy.

### 3.2 Class Specifications

#### 3.2.1 Heavy - "The Destroyer"
```yaml
Role: Tank/AoE Damage
Health: 150 HP
Speed: 120 units/second
Primary Weapon: Flamethrower
Special Ability: Berserk Mode (5s damage boost)
Strengths: High survivability, area denial, crowd control
Weaknesses: Slow movement, short range, ammo hungry
Playstyle: Front-line fighter, holds chokepoints
```

#### 3.2.2 Scout - "The Ghost"
```yaml
Role: Mobility/High DPS
Health: 80 HP
Speed: 300 units/second
Primary Weapon: SMG
Special Ability: Dash/Cloak (3s invisibility)
Strengths: High mobility, burst damage, flanking
Weaknesses: Low health, requires skill, ammo management
Playstyle: Hit-and-run, rescue missions, harassment
```

#### 3.2.3 Engineer - "The Builder"
```yaml
Role: Support/Area Control
Health: 120 HP
Speed: 160 units/second
Primary Weapon: Shotgun
Special Ability: Energy Shield (3s invulnerability)
Strengths: Versatile, good damage, defensive options
Weaknesses: Reload dependent, medium range
Playstyle: Defensive positions, team support, adaptable
```

#### 3.2.4 Medic - "The Lifeline"
```yaml
Role: Support/Sustain
Health: 80 HP
Speed: 180 units/second
Primary Weapon: Heal Beam
Special Ability: Team Buff (damage/speed boost)
Strengths: Team sustainability, utility, buff support
Weaknesses: Low personal DPS, target priority
Playstyle: Stay alive, support team, strategic positioning
```

### 3.3 Class Balance Philosophy
- No class should be mandatory
- Each class has clear strengths and weaknesses
- Team composition matters but isn't rigid
- Solo play remains viable for all classes

---

## 4. Weapon Systems

### 4.1 Weapon Categories

#### 4.1.1 Projectile Weapons
```yaml
Shotgun:
  Damage: 40 per pellet (5 pellets)
  Range: Short (200 units)
  Fire Rate: 800ms
  Spread: 45 degrees
  Chaos Factor: Medium

SMG:
  Damage: 20 per bullet
  Range: Medium (400 units)
  Fire Rate: 150ms
  Spread: 15 degrees
  Chaos Factor: Medium
```

#### 4.1.2 Energy Weapons
```yaml
Plasma Rifle:
  Damage: 35 per shot
  Range: Long (600 units)
  Fire Rate: 300ms
  Penetration: 3 enemies
  Chaos Factor: High

Heal Beam:
  Healing: 25 HP/second
  Range: Medium (300 units)
  Continuous: Yes
  Team Only: Yes
  Chaos Factor: Low
```

#### 4.1.3 Area Effect Weapons
```yaml
Flamethrower:
  Damage: 15 per tick
  Range: Short (250 units)
  Fire Rate: 100ms (continuous)
  Area: 30 degree cone
  Chaos Factor: Very High

Rocket Launcher:
  Damage: 80 (direct) / 40 (splash)
  Range: Long (500 units)
  Fire Rate: 1500ms
  Splash Radius: 100 units
  Chaos Factor: Extreme
```

### 4.2 Weapon Upgrade System
- **Damage Boost:** +25% damage per level
- **Fire Rate:** -15% cooldown per level
- **Range Extension:** +20% range per level
- **Special Effects:** Unique per weapon type

### 4.3 Ammo System
- **Infinite Ammo:** Core weapons never run out
- **Cooldown Based:** Prevents spam, encourages positioning
- **Reload Mechanics:** Future feature for tactical depth

---

## 5. Enemy Design

### 5.1 Enemy Philosophy
Enemies are designed to create specific gameplay scenarios and force player adaptation. Each type has clear visual language and behavioral patterns.

### 5.2 Enemy Types

#### 5.2.1 Grunt - "Cannon Fodder"
```yaml
Health: 30 HP
Speed: 80 units/second
Behavior: Swarm toward nearest player
Damage: 10 (melee)
Points: 10
Spawn Rate: High
Special: None
```

#### 5.2.2 Spitter - "Zone Denial"
```yaml
Health: 25 HP
Speed: 100 units/second
Behavior: Maintain distance, shoot acid
Damage: 15 (ranged)
Points: 15
Spawn Rate: Medium
Special: Acid pools on death
```

#### 5.2.3 Bruiser - "Tank"
```yaml
Health: 80 HP
Speed: 60 units/second
Behavior: Charge at players
Damage: 25 (charge)
Points: 30
Spawn Rate: Low
Special: Knockback on hit
```

#### 5.2.4 Mini-Boss - "Wave Climax"
```yaml
Health: 200 HP
Speed: 40 units/second
Behavior: AoE stomp, shield phases
Damage: 35 (stomp)
Points: 100
Spawn Rate: Every 5 waves
Special: Damage immunity phases
```

#### 5.2.5 Boss - "Chaos Incarnate"
```yaml
Health: 500+ HP (scales with wave)
Speed: Variable
Behavior: Multi-phase, map-wide attacks
Damage: Variable (30-50)
Points: 500+
Spawn Rate: Every 10 waves
Special: Arena manipulation, glitch effects
```

### 5.3 Spawn Patterns
- **Wave Start:** Gradual spawn from edges
- **Mid Wave:** Intensity peaks with mixed types
- **Wave End:** Final push with remaining enemies
- **Boss Waves:** Clear arena, dramatic entrance

---

## 6. Power-ups & Pickups

### 6.1 Temporary Power-ups (30-60 seconds)

#### 6.1.1 Combat Enhancers
```yaml
Damage Boost:
  Effect: +50% weapon damage
  Duration: 45 seconds
  Visual: Red aura around player
  Rarity: Common

Fire Rate Boost:
  Effect: -40% weapon cooldowns
  Duration: 30 seconds
  Visual: Yellow sparks from weapons
  Rarity: Common

Penetration Rounds:
  Effect: Bullets pierce all enemies
  Duration: 60 seconds
  Visual: Blue bullet trails
  Rarity: Uncommon
```

#### 6.1.2 Defensive Buffs
```yaml
Shield Generator:
  Effect: Absorbs 100 damage
  Duration: Until depleted
  Visual: Cyan energy shield
  Rarity: Uncommon

Speed Boost:
  Effect: +100% movement speed
  Duration: 30 seconds
  Visual: Motion blur trails
  Rarity: Common

Regeneration:
  Effect: +5 HP per second
  Duration: 60 seconds
  Visual: Green healing particles
  Rarity: Rare
```

### 6.2 Instant Effects

#### 6.2.1 Utility Items
```yaml
Health Pack:
  Effect: Restore 50 HP instantly
  Visual: Red cross pickup
  Rarity: Common

Chaos Bomb:
  Effect: +25 chaos meter instantly
  Visual: Glitch effect explosion
  Rarity: Uncommon

Team Revive:
  Effect: Revive all downed teammates
  Visual: Golden resurrection beam
  Rarity: Rare
```

### 6.3 Special Abilities

#### 6.3.1 Environmental
```yaml
Orbital Strike:
  Effect: Massive damage in target area
  Cooldown: 120 seconds
  Visual: Laser beam from sky
  Audio: Guitar dive bomb

Time Slow Bubble:
  Effect: Slow enemies in radius
  Duration: 15 seconds
  Visual: Blue distortion field
  Audio: Echo effects

Plasma Drill:
  Effect: Piercing beam through walls
  Duration: 10 seconds
  Visual: Spinning energy drill
  Audio: Distorted arpeggio
```

---

## 7. Progression System

### 7.1 Session Progression
- **Score Multiplier:** Increases with wave survival
- **Chaos Meter:** Unlocks visual/audio intensity
- **Weapon Upgrades:** Temporary improvements during session
- **Class Mastery:** Unlock new abilities per class

### 7.2 Persistent Progression
- **Player Level:** Overall experience and unlocks
- **Class Ranks:** Individual class progression
- **Achievement System:** Specific challenge completion
- **Cosmetic Unlocks:** Visual customization options

### 7.3 Scoring Formula
```
Base Score = Enemy Points × Wave Multiplier × Chaos Bonus
Team Bonus = Base Score × (Team Size × 0.1)
Survival Bonus = Time Alive × 10
Final Score = (Base Score + Team Bonus + Survival Bonus) × Difficulty Modifier
```

---

## 8. Multiplayer Design

### 8.1 Network Architecture
- **Peer-to-Peer:** Direct connection for LAN play
- **Host Authority:** One player manages game state
- **Lag Compensation:** Prediction and rollback for smooth play
- **Drop-in/Drop-out:** Players can join mid-session

### 8.2 Cooperative Mechanics
- **Shared Health Pool:** Optional team health system
- **Revive System:** Downed players can be rescued
- **Friendly Fire:** Configurable damage to teammates
- **Team Objectives:** Bonus points for cooperation

### 8.3 Competitive Elements
- **Individual Scoring:** Personal leaderboards
- **Class Competition:** Best performance per class
- **Friendly Rivalry:** Humorous achievement categories
- **Team vs Team:** Future competitive modes

---

## 9. Visual Design

### 9.1 Art Direction
- **Style:** Retro-futuristic pixel art with modern effects
- **Color Palette:** Neon colors on dark backgrounds
- **Typography:** Orbitron font family for sci-fi aesthetic
- **Animation:** Smooth 60fps with pixel-perfect rendering

### 9.2 Visual Effects
- **Particle Systems:** Explosions, weapon trails, environmental
- **Lighting:** Dynamic colored lighting with bloom
- **Post-Processing:** CRT scanlines, chromatic aberration
- **Chaos Effects:** Screen distortion, color inversion, glitch

### 9.3 User Interface
- **HUD Elements:** Health, ammo, score, chaos meter
- **Menu Design:** Retro arcade styling with smooth transitions
- **Accessibility:** High contrast, colorblind-friendly options
- **Responsive:** Scales to different screen sizes

---

## 10. Audio Design

### 10.1 Music System
- **Dynamic Layering:** Stems that respond to gameplay
- **Retro TrashBit:** Chiptune + thrash metal fusion
- **Chaos Scaling:** Intensity matches visual chaos
- **Boss Themes:** Unique tracks for major encounters

### 10.2 Sound Effects
- **Weapon Audio:** Distinct sounds per weapon type
- **Spatial Audio:** 3D positioning for immersion
- **UI Sounds:** Retro arcade bleeps and bloops
- **Environmental:** Ambient facility sounds

### 10.3 Audio Implementation
- **Web Audio API:** Real-time mixing and effects
- **Compression:** Optimized file sizes for web delivery
- **Fallbacks:** Graceful degradation for older browsers
- **Volume Controls:** Separate sliders for music/SFX

---

## 11. User Interface

### 11.1 Menu System
- **Main Menu:** Class selection, options, credits
- **In-Game HUD:** Essential information only
- **Pause Menu:** Settings, controls, quit options
- **End Game:** Scores, achievements, play again

### 11.2 Control Scheme
- **Primary:** WASD + Mouse (twin-stick style)
- **Secondary:** Gamepad support (future)
- **Accessibility:** Remappable keys, alternative inputs
- **Mobile:** Touch controls with virtual joysticks

### 11.3 Information Design
- **Visual Hierarchy:** Important info most prominent
- **Color Coding:** Consistent meaning across UI
- **Animation:** Smooth transitions, no jarring changes
- **Feedback:** Clear response to all player actions

---

## 12. Technical Requirements

### 12.1 Performance Targets
- **Frame Rate:** Stable 60 FPS with 8 players
- **Load Time:** Under 5 seconds for initial load
- **Memory Usage:** Under 512MB RAM
- **Network Latency:** Under 50ms for LAN play

### 12.2 Browser Compatibility
- **Chrome:** Version 90+
- **Firefox:** Version 88+
- **Safari:** Version 14+
- **Edge:** Version 90+

### 12.3 System Requirements
- **Minimum:** Dual-core CPU, 4GB RAM, integrated graphics
- **Recommended:** Quad-core CPU, 8GB RAM, dedicated graphics
- **Network:** 100Mbps LAN for 8-player sessions
- **Storage:** 100MB available space

---

## Appendices

### A. Balancing Philosophy
All balance decisions prioritize fun over competitive fairness. The game should feel chaotic but fair, with clear cause-and-effect relationships.

### B. Accessibility Features
- Colorblind-friendly palette options
- High contrast mode
- Subtitle support for audio cues
- Simplified control schemes

### C. Localization Plan
- Initial: English only
- Phase 2: Spanish, French, German
- Phase 3: Japanese, Korean, Chinese

### D. Post-Launch Content
- New player classes
- Additional weapon types
- Environmental hazards
- Seasonal events

---

**Document Version History:**
- v1.0 - Initial complete design document
- v0.9 - Beta design with core systems
- v0.5 - Alpha concept and prototyping

*This document is a living specification that evolves with development and player feedback.*