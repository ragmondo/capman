# Pac-Man Clone Development Notes

## Project Status (Current Session)

### ✅ **Completed Features**

#### **Core Architecture**
- **Modular ES6 Structure**: Clean imports/exports with organized folders
- **Mobile-First Design**: Responsive HTML with touch controls and swipe gestures
- **Phaser.js Integration**: Game engine configured with physics and scaling

#### **Graphics System**
- **Enhanced Maze Rendering**: 
  - Moved from ASCII art to numerical tile-based system (19x21 grid)
  - Custom `WallRenderer` class for smooth, connected walls (2px thickness)
  - Tile size: 24px (increased from 16px for larger corridors)
  - Blue walls with darker stroke for depth

- **Player Character**:
  - Dynamic Pac-Man sprite generation with proper chomping animation
  - Size: 1.4x tile size (33.6px) - much larger and more visible
  - 3-frame animation: closed mouth → half open → fully open
  - Rotation based on movement direction
  - Death animation with spinning effect

- **UI System**:
  - Score bar at top with lives, level, score, high score
  - Debug panel at bottom (toggle with 'D' key)
  - Real-time display of player position, NPC states, FPS, game stats

#### **NPC System** 
- **Generic NPC Class**: Flexible base class for all non-player characters
- **Multiple AI Behaviors**:
  - **Random Wanderer** (Red): Unpredictable movement
  - **Chaser** (Pink): Actively pursues player
  - **Guard** (Cyan): Patrols set path, chases when player nearby
  - **Fleer** (Orange): Runs away from player
- **State Management**: Normal, frightened (blue tint), returning
- **Power-Up Integration**: All NPCs become frightened for 10s when power pellet eaten

#### **Game Features**
- **Power Pellets**: Make NPCs vulnerable and change their behavior
- **Tunnel Wrapping**: Player can wrap around horizontal edges
- **Level Progression**: Maze resets, NPCs reset, level counter increases
- **Lives System**: Player respawns with lives remaining
- **High Score**: Persistent localStorage saving
- **Pause/Resume**: P or ESC key functionality

### 🔴 **Current Issues**

#### **Critical Bug - Player Movement Stuck**
- **Problem**: Player sprite appears but won't move from starting position
- **Symptoms**: 
  - Player faces correct direction when keys pressed
  - No actual movement/translation occurs
  - Debug console shows movement logic is being called
- **Debug Added**: Console logging in `Player.update()` and `canMove()`
- **Location**: Player starts at grid [9,15], maze position calculated by `gridToWorld()`

### 📁 **File Structure**

```
/Users/richard/code/hat-snatch/
├── index.html                     # Main HTML with mobile controls
├── package.json                   # Project config
├── js/
│   ├── main.js                    # Game initialization
│   ├── config/
│   │   └── GameConfig.js          # All game constants and maze data
│   ├── scenes/
│   │   ├── PreloadScene.js        # Asset loading
│   │   └── GameScene.js           # Main game logic
│   ├── objects/
│   │   ├── Maze.js                # Maze rendering and collision
│   │   ├── Player.js              # Player character (BUGGY)
│   │   ├── NPC.js                 # Generic NPC base class
│   │   └── WallRenderer.js        # Wall graphics system
│   └── managers/
│       ├── UIManager.js           # Score/status display
│       ├── InputController.js     # Keyboard/touch input
│       └── DebugPanel.js          # Debug information display
```

### 🎮 **Controls**

#### **Desktop**
- Arrow Keys or WASD for movement
- P/ESC for pause
- R to restart (on game over)
- D to toggle debug panel

#### **Mobile**
- On-screen directional buttons
- Swipe gestures (30px threshold, 300ms timeout)
- Touch-friendly UI scaling

### 🔧 **Technical Details**

#### **Game Configuration** (`GameConfig.js`)
```javascript
TILE_SIZE: 24,           // Increased from 16px
MAZE_COLS: 19,          // Simplified from 28x31
MAZE_ROWS: 21,
WALL_THICKNESS: 2,      // Thin walls like original
```

#### **Maze Format** 
- Numerical tiles instead of ASCII:
  - `0` = empty space
  - `1` = wall
  - `2` = dot
  - `3` = power pellet  
  - `4` = ghost house

#### **Physics Setup**
- Arcade physics with no gravity
- World bounds exclude UI areas
- Sprite collision boxes smaller than display size for smooth movement

### 🐛 **Debug Process**

The player movement issue needs investigation of:

1. **Input Registration**: Are key presses reaching `InputController`?
2. **Direction Setting**: Is `inputController.getNextDirection()` returning values?
3. **Movement Validation**: Is `canMove()` returning false for all directions?
4. **Starting Position**: Is player spawning inside a wall?
5. **Physics Body**: Is the physics body configured correctly?

**Console Debug Added**: Check browser F12 console for:
- "Player: Desired direction: [direction] Current: [direction]"
- "canMove [direction]: from [x,y] to [x,y] = [boolean]"

### 📝 **Next Steps**

1. **IMMEDIATE**: Fix player movement bug - likely issue with starting position or collision detection
2. **Test console output**: Run game and check what debug messages appear
3. **Verify starting position**: Ensure player spawns in valid maze location
4. **Continue development**: Once movement fixed, implement fruit bonuses

### 🔄 **Git Status**
- Initial working template committed (645b95a)
- All improvements since then need to be committed once movement bug is fixed

### 💡 **Architecture Notes**

The codebase is well-structured and modular. The NPC system is particularly flexible and can easily be extended for different character types. The graphics system produces clean, scalable visuals that work well on both desktop and mobile. The debug panel is invaluable for development and should be kept for future features.

Main strength: Modular, object-oriented design makes it easy to add new features without breaking existing code.