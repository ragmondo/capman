# 🎮 Hat Snatch - A Cap Man Adventure

A modern Pac-Man style game built with Phaser.js featuring unique hat collection and delivery mechanics.

**🕹️ [Play the Game](https://ragmondo.github.io/capman/)**

## 🎯 Game Objective

Collect hats and deliver them to your wife while avoiding security guards and angry downvoters!

## 🎾 Core Gameplay

### Hat Collection System
- **Watch the Pong Game**: An exciting tennis match plays in the center court
- **Catch Flying Hats**: When a player scores, they throw a hat into the crowd - be the first to catch it!
- **Steal from Children**: You can snatch hats directly from children (but beware the consequences!)
- **Deliver to Wife**: Take collected hats to your wife for bonus points

### Characters & NPCs
- **👨‍🎓 Cap Man (You)**: The player character who collects and delivers hats
- **👰 Wife**: Accepts hat deliveries for bonus points
- **👦 Children**: Energetic NPCs who also collect hats - you can steal from them!
- **👮 Security Guards**: Spawn when you steal hats - avoid getting caught!
- **👎 Downvote NPCs**: Deadly enemies that appear when you deliver stolen hats
  - **Yelp Downvotes**: Relentless red chasers with menacing behavior
  - **Google Reviews Downvotes**: Strategic orange hunters with predictive AI

## 🎮 Controls

### Desktop
- **Arrow Keys** or **WASD**: Move in any direction
- **P**: Pause/unpause the game
- **Z**: Toggle debug panel (for developers)
- **H**: Spawn debug hat (for testing)
- **V**: View sprite gallery (debug)

### Mobile
- **Swipe**: Move in any direction (swipe to change direction)
- **Tap**: Interact with UI elements

## ⚠️ Consequences System

**Stealing hats triggers escalating consequences:**

1. **🚨 Security Guards Spawn**: Police-like NPCs that chase you with flashing red/blue lights
2. **🚔 Police Siren**: Continuous siren sound plays while you have stolen goods
3. **👎 Downvote Punishment**: Delivering stolen hats spawns angry downvote NPCs
4. **💀 Death on Contact**: Security guards and downvotes will kill you on contact

**Note**: Collecting hats from the ground (thrown by Pong players) has no consequences!

## 🏆 Scoring System

- **🧢 Hat Collection**: 200 points (from ground)
- **🎯 Hat Stealing**: 400 points (double points for risk!)
- **💍 Hat Delivery**: 500 bonus points
- **🏓 Pong Integration**: Additional excitement from the tennis match
- **📈 Progressive Levels**: Speed increases 15% each level for growing challenge

## 🎵 Audio Features

- **🎾 Pong Sounds**: Different notes for different paddle bounces
- **🚨 Police Siren**: Plays when you have stolen hats
- **🎼 Death Riff**: Classic Pac-Man style descending melody on death
- **🔊 Procedural Audio**: All sounds generated using Web Audio API

## 🎪 Special Features

### Tennis Court Mini-Game
- **Live Pong Match**: AI vs AI tennis game in the center
- **Hat Throwing**: Players throw hats to crowd when they score
- **Dynamic Gameplay**: Adds unpredictability and strategy

### Mobile Optimization
- **Responsive Design**: Scales perfectly on any screen size
- **Touch Controls**: Intuitive swipe-based movement
- **Performance Optimized**: Smooth gameplay on mobile devices

### Progressive Difficulty
- **Level System**: Complete levels by collecting all dots
- **Speed Scaling**: NPCs get 15% faster each level
- **Persistent Threats**: Downvote NPCs carry over between levels
- **Escalating Challenge**: More security guards and downvotes spawn over time

## 🕹️ Game Tips

1. **👀 Watch the Pong Game**: Time your positioning to catch thrown hats first
2. **⚖️ Risk vs Reward**: Stealing gives double points but triggers consequences  
3. **🏃‍♂️ Plan Your Escape**: Have an escape route before stealing from children
4. **👰 Quick Delivery**: Get stolen hats to your wife quickly to stop the siren
5. **🎯 Strategic Positioning**: Use the maze layout to evade security guards
6. **⏰ Timing**: Wait for guards to pass before making your move

## 🛠️ Technical Details

- **Engine**: Phaser.js 3.70.0
- **Architecture**: ES6 modules with modern JavaScript
- **Movement**: Rail-based grid system for precise control
- **AI**: Different behavior patterns for each NPC type
- **Audio**: Web Audio API for procedural sound generation
- **Responsive**: Automatic scaling for all screen sizes

## 🎨 Game Features

### Visual Design
- **Retro Aesthetic**: Classic arcade-style pixel art
- **Dynamic Sprites**: Procedurally generated character graphics
- **Smooth Animations**: Rail-based movement with fluid interpolation
- **Visual Feedback**: Flashing effects, color changes, and scaling

### Advanced AI
- **Predictive Movement**: Google downvotes predict where you'll be
- **Behavioral Patterns**: Each NPC type has unique movement and decision making
- **Dynamic Spawning**: Enemies spawn based on player actions
- **Pathfinding**: NPCs navigate the maze intelligently

## 🎭 Game Modes

### Normal Play
- Collect dots while managing hat collection/delivery mechanics
- Progressive difficulty with level advancement
- High score tracking and persistence

### Debug Mode
- Developer tools for testing and balancing
- Sprite viewer for asset inspection
- Performance monitoring and statistics

---

**🎮 Ready to play? [Start your hat-snatching adventure now!](https://ragmondo.github.io/capman/)**

---

*Built with ❤️ and Phaser.js | [View Source Code](https://github.com/ragmondo/capman)*