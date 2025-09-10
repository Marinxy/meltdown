# 🎮 Arcade Meltdown - Project Documentation

## Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Game Design](#2-game-design)
  - [2.1 Core Concept](#21-core-concept)
  - [2.2 Gameplay Overview](#22-gameplay-overview)
  - [2.3 Player Classes](#23-player-classes)
  - [2.4 Weapons](#24-weapons)
  - [2.5 Power-ups](#25-power-ups)
  - [2.6 Enemies](#26-enemies)
  - [2.7 Visual FX](#27-visual-fx)
  - [2.8 Scoreboard](#28-scoreboard)
- [3. Audio Design: Retro TrashBit](#3-audio-design-retro-trashbit)
  - [3.1 Core Requirements](#31-core-requirements)
  - [3.2 Dynamic Layering (Stems)](#32-dynamic-layering-stems)
  - [3.3 Track List](#33-track-list)
  - [3.4 SFX Notes](#34-sfx-notes)
  - [3.5 Export Specs](#35-export-specs)
  - [3.6 Style References](#36-style-references)
- [4. Technical Implementation](#4-technical-implementation)
  - [4.1 Technical Deliverables](#41-technical-deliverables)
  - [4.2 File Structure](#42-file-structure)
- [5. Development Roadmap](#5-development-roadmap)
  - [5.1 Phase 1: Prototype (Weeks 1–4)](#51-phase-1-prototype-weeks-1-4)
  - [5.2 Phase 2: Alpha (Weeks 5–8)](#52-phase-2-alpha-weeks-5-8)
  - [5.3 Phase 3: Beta (Weeks 9–12)](#53-phase-3-beta-weeks-9-12)
  - [5.4 Phase 4: Release Candidate (Weeks 13–16)](#54-phase-4-release-candidate-weeks-13-16)
  - [5.5 Phase 5: Post-Launch](#55-phase-5-post-launch)
- [6. Appendices](#6-appendices)

---

## 1. Project Overview

**Game Title:** Arcade Meltdown  
**Genre:** Modern Retro LAN Arcade Shooter  
**Players:** 2–8 (LAN Co-op / Competitive-Coop)  
**Match Length:** 10–15 minutes  
**Core Vibe:** Chaos, explosions, Retro TrashBit soundtrack  

**Vision Statement:** Doom speed + Space Invaders hordes + Helldivers chaos + Retro TrashBit soundtrack  

Arcade Meltdown is designed to be the ultimate LAN party meltdown game, with fast rounds, neon explosions, chaotic friendly fire, and a dynamic soundtrack that escalates into thrash metal madness. The game combines a top-down twin-stick shooter perspective with a special retro-FPS overdrive mode, focusing on instant fun and quick-in/out gameplay perfect for LAN parties.

---

## 2. Game Design

### 2.1 Core Concept

Arcade Meltdown is a modern retro LAN co-op/competitive shooter for 2–8 players. It combines top-down twin-stick controls with a retro-FPS overdrive mode, focusing on speed, explosions, chaos, and a Retro TrashBit soundtrack.

**Key Design Principles:**
- Instant fun, quick-in/out gameplay
- LAN party first design philosophy
- Fast-paced chaotic action
- Emphasis on visual and audio spectacle

### 2.2 Gameplay Overview

- **Default camera:** Top-down twin-stick shooter
- **Special mode:** Overdrive (10s retro-FPS perspective)
- **Arena:** Modular sci-fi base, procedurally generated hallways
- **Waves:** Infinite escalating hordes, boss every 5 waves
- **Respawn:** Players respawn at the start of each wave in drop pods
- **Chaos Meter:** Triggers visual/audio escalation based on game state

### 2.3 Player Classes

| Class       | Weapon/Ability       | Strengths             | Weaknesses        | Special |
|-------------|----------------------|-----------------------|-------------------|---------|
| Heavy       | Flamethrower         | High HP, AoE          | Slow, short range | Berserk mode |
| Scout       | SMG + Dash           | Fast, high DPS        | Fragile           | Cloak (short invisibility) |
| Engineer    | Shotgun + Turret     | Area control, support | Ammo hungry       | Energy shield |
| Medic       | Healing beam + buff  | Sustain, team play    | Low DPS           | Buff grenade |

### 2.4 Weapons

| Weapon           | Type       | Effect                    | Chaos Potential |
|------------------|-----------|---------------------------|-----------------|
| Shotgun          | Projectile| Wide spread, short range  | Medium |
| SMG              | Projectile| Fast DPS, high ammo use   | Medium |
| Plasma Rifle     | Energy    | Piercing long-range beam  | High |
| Flamethrower     | AoE       | Continuous burn cone      | Very High |
| Rocket Launcher  | Explosive | AoE explosion, knockback  | Extreme |
| Ricochet Laser   | Energy    | Bounces around arena      | Extreme |

### 2.5 Power-ups

| Power-up         | Effect                       | Visual FX          | Audio FX |
|------------------|-----------------------------|-------------------|----------|
| Orbital Strike   | Calls in airstrike           | Blinding light    | Guitar dive |
| Plasma Drill     | Burns through walls/enemies | Neon spinning drill | Distorted arpeggio |
| Time-Slow Bubble | Slows enemies in radius     | Blue field        | Echo FX |
| Chaos Grenade    | Random glitch effect        | Glitch storm      | Metal scream |

### 2.6 Enemies

| Enemy      | Behavior           | Strengths          | Weaknesses | Chaos Role |
|------------|-------------------|--------------------|------------|------------|
| Grunts     | Swarm in numbers  | Overwhelm          | Fragile    | Cannon fodder |
| Spitters   | Acid ranged       | Zone denial        | Fragile    | Split focus |
| Bruisers   | Charge             | Heavy HP           | Slow       | Chaos tanks |
| Mini-Boss  | AoE stomp/shield   | Crowd control      | Vulnerable rear | Mid-wave climax |
| Boss       | Glitch monster     | Map-wide attacks   | Requires team | Final meltdown |

### 2.7 Visual FX

| Event         | Effect                        | Notes |
|---------------|------------------------------|-------|
| Shooting      | Neon bullets + pixel trails   | CRT bloom |
| Explosions    | Neon particle storms          | Screen shake |
| Power-ups     | Halo + exaggerated glow       | Cartoonish |
| Chaos Meter   | Color inversion, glitch FX    | Sync to music |
| Boss Wave     | VHS distortion, arena pulses  | Max chaos |

### 2.8 Scoreboard

Titles awarded at end of round:
- Most Friendly Fire 🔥
- Chaos King/Queen 👑
- Most Explosive Death 💥
- Last Survivor 🧟
- Glitch Master ⚡

---

## 3. Audio Design: Retro TrashBit

### 3.1 Core Requirements

**Music Style:** Retro TrashBit  
**Definition:** Fusion of 8-bit chiptune arpeggios with thrash metal riffs, double-kick drums, and glitchy FX  
**Mood:** Fast, chaotic, arcade adrenaline — like Mega Man meets Slayer  
**Purpose:** Provide dynamic, stem-based soundtrack for LAN party chaos  

**Technical Specifications:**
- BPM: 160–200
- Minor scales, aggressive riffs
- Instruments: square/saw wave synths, distorted guitars, double-kick drums, chip percussion, gritty bass

### 3.2 Dynamic Layering (Stems)

- Layer 1: Chiptune baseline
- Layer 2: Rhythm guitar
- Layer 3: Drums (chip + metal)
- Layer 4: Lead guitar / solos

**Escalation logic:**
- Normal → Layer 1+2
- Chaos 50% → +Drums
- Chaos 75% → +Lead guitar
- Boss → All layers + distortion
- Wipe → Game Over jingle

### 3.3 Track List

#### Menu Theme
```
Retro 8-bit chiptune arpeggio intro, layered with thrash metal guitars and heavy drums. Style: NES soundtrack meets Metallica. Uplifting but chaotic arcade vibe.
```

#### Normal Wave Loop
```
Driving 8-bit melody with square wave arpeggios, fast thrash metal rhythm guitar, chip drums with steady kick. BPM 170. Feels like Mega Man stage theme on steroids.
```

#### Chaos Overload Loop
```
Full thrash metal meltdown fused with chiptune leads, double kick drums, distorted guitars, chaotic glitch FX. BPM 190. Intense, wild, overwhelming arcade chaos.
```

#### Last Survivor Theme
```
Minimal 8-bit pulse wave baseline, slow build tension, gradually layering distorted guitar harmonics. Dark, suspenseful, last stand energy.
```

#### Boss Wave Theme
```
Epic 8-bit chiptune meets brutal thrash metal. Glitchy synth sweeps, double pedal drums, crushing riffs, retro arpeggios screaming. BPM 200. Feels like final level meltdown.
```

#### Game Over Jingle
```
Happy NES-style 8-bit melody (5 seconds) that abruptly distorts into a screaming metal guitar drop.
```

#### Victory Theme
```
Triumphant retro arpeggio in major key layered with epic thrash metal guitar solo. Energetic and celebratory, arcade high-score vibe.
```

### 3.4 SFX Notes

- Shooting: NES pew + crunch distortion
- Explosions: Chip blast + crash cymbal
- Power-up: Arpeggio sparkle
- Chaos Grenade: Glitch burst + scream

### 3.5 Export Specs

- Format: WAV + OGG
- Deliver as stems
- Loopable (2–3 min per gameplay track, 5–10 sec jingles)

### 3.6 Style References

- Machinae Supremacy (SID metal)
- Bit Brigade (NES + metal)
- Carpenter Brut (dark synth + metal)
- Mega Man 2 OST (chiptune base)
- Slayer / Pantera (thrash energy)

---

## 4. Technical Implementation

### 4.1 Technical Deliverables

- Prototype core loop: LAN sync, arena, wave spawning, 4 classes
- Explosion FX system: neon + pixel particle storms
- Chaos Meter: dynamic escalation, visual + audio hooks
- Audio integration: Retro TrashBit stems linked to Chaos Meter
- Scoreboard UI: arcade-style, humorous

### 4.2 File Structure

```
/ArcadeMeltdown
│── README.md                
│── PROJECT_DOCUMENTATION.md (this file)
│── /src                     
│   ├── /core                
│   ├── /classes             
│   ├── /weapons             
│   ├── /enemies             
│   ├── /fx                  
│   └── /ui                  
│── /assets
│   ├── /sprites             
│   ├── /tiles               
│   ├── /audio               
│   └── /shaders             
│── /docs
│   ├── CONCEPT_ART.md       
│   ├── MULTIPLAYER.md       
│   └── ROADMAP.md           
```

---

## 5. Development Roadmap

### 5.1 Phase 1: Prototype (Weeks 1–4)

- Core top-down shooter loop
- LAN sync (2–4 players)
- One arena tileset
- Classes: Heavy + Scout
- Placeholder music/SFX

### 5.2 Phase 2: Alpha (Weeks 5–8)

- Add Engineer + Medic
- 3 more weapons, 2 power-ups
- Enemy waves + mini-boss logic
- Chaos Meter visual FX
- Scoreboard basic UI

### 5.3 Phase 3: Beta (Weeks 9–12)

- Boss mechanics
- Glitch/CRT shaders
- Dynamic audio (Retro TrashBit stems)
- Polish scoreboard humor titles
- LAN stability 6–8 players

### 5.4 Phase 4: Release Candidate (Weeks 13–16)

- Class/weapon balance
- Additional arenas (2 tilesets)
- Final music integration
- Package builds Win/Linux/Mac
- Prepare installer / distribution

### 5.5 Phase 5: Post-Launch

- Cosmetic unlocks (skins, CRT filters)
- Community map support
- Expansion soundtrack pack (Retro TrashBit II)

---

## 6. Appendices

### 6.1 Concept Art References

To be added in future documentation updates.

### 6.2 Multiplayer Technical Details

To be added in future documentation updates.

### 6.3 Glossary of Terms

To be added in future documentation updates.