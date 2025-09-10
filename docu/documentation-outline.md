# 📚 Arcade Meltdown - Project Documentation Outline

## 1. Project Overview
- Game Title: Arcade Meltdown
- Genre: Modern Retro LAN Arcade Shooter
- Players: 2-8 (LAN Co-op / Competitive-Coop)
- Match Length: 10-15 minutes
- Core Vibe: Chaos, explosions, Retro TrashBit soundtrack
- Vision Statement: "Doom speed + Space Invaders hordes + Helldivers chaos + Retro TrashBit soundtrack"

## 2. Game Design
### 2.1 Core Concept
- Top-down twin-stick shooter with retro-FPS overdrive mode
- Focus on speed, explosions, chaos and Retro TrashBit soundtrack
- LAN party first design philosophy
- Instant fun, quick-in/out gameplay

### 2.2 Gameplay Overview
- Default camera: Top-down twin-stick shooter
- Special mode: Overdrive (10s retro-FPS perspective)
- Arena: Modular sci-fi base, procedurally generated hallways
- Waves: Infinite escalating hordes, boss every 5 waves
- Respawn: Players respawn at the start of each wave in drop pods
- Chaos Meter: Triggers visual/audio escalation

### 2.3 Player Classes
- Heavy: Flamethrower, High HP, AoE, Berserk mode
- Scout: SMG + Dash, Fast, high DPS, Cloak
- Engineer: Shotgun + Turret, Area control, Energy shield
- Medic: Healing beam + buff, Sustain, Buff grenade

### 2.4 Weapons
- Shotgun: Projectile, Wide spread, short range
- SMG: Projectile, Fast DPS, high ammo use
- Plasma Rifle: Energy, Piercing long-range beam
- Flamethrower: AoE, Continuous burn cone
- Rocket Launcher: Explosive, AoE explosion, knockback
- Ricochet Laser: Energy, Bounces around arena

### 2.5 Power-ups
- Orbital Strike: Calls in airstrike
- Plasma Drill: Burns through walls/enemies
- Time-Slow Bubble: Slows enemies in radius
- Chaos Grenade: Random glitch effect

### 2.6 Enemies
- Grunts: Swarm in numbers, Cannon fodder
- Spitters: Acid ranged, Zone denial
- Bruisers: Charge, Heavy HP, Chaos tanks
- Mini-Boss: AoE stomp/shield, Crowd control
- Boss: Glitch monster, Map-wide attacks

### 2.7 Visual FX
- Shooting: Neon bullets + pixel trails
- Explosions: Neon particle storms
- Power-ups: Halo + exaggerated glow
- Chaos Meter: Color inversion, glitch FX
- Boss Wave: VHS distortion, arena pulses

### 2.8 Scoreboard
- Titles awarded at end of round:
  - Most Friendly Fire 🔥
  - Chaos King/Queen 👑
  - Most Explosive Death 💥
  - Last Survivor 🧟
  - Glitch Master ⚡

## 3. Audio Design: Retro TrashBit
### 3.1 Core Requirements
- Music Style: Retro TrashBit
- Definition: Fusion of 8-bit chiptune arpeggios with thrash metal riffs
- BPM: 160–200
- Mood: Fast, chaotic, arcade adrenaline
- Instruments: square/saw wave synths, distorted guitars, double-kick drums

### 3.2 Dynamic Layering (Stems)
- Layer 1: Chiptune baseline
- Layer 2: Rhythm guitar
- Layer 3: Drums (chip + metal)
- Layer 4: Lead guitar / solos
- Escalation logic based on Chaos Meter

### 3.3 Track List
- Menu Theme
- Normal Wave Loop
- Chaos Overload Loop
- Last Survivor Theme
- Boss Wave Theme
- Game Over Jingle
- Victory Theme

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

## 4. Technical Implementation
### 4.1 Technical Deliverables
- Prototype core loop: LAN sync, arena, wave spawning, 4 classes
- Explosion FX system: neon + pixel particle storms
- Chaos Meter: dynamic escalation, visual + audio hooks
- Audio integration: Retro TrashBit stems linked to Chaos Meter
- Scoreboard UI: arcade-style, humorous

### 4.2 File Structure
- Source code organization
- Asset management
- Documentation structure

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

## 6. Appendices
- 6.1 Concept Art References
- 6.2 Multiplayer Technical Details
- 6.3 Glossary of Terms