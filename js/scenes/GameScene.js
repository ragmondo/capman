import { GameConfig } from '../config/GameConfig.js';
import { Maze } from '../objects/Maze.js';
import { Player } from '../objects/Player.js';
import { NPC } from '../objects/NPC.js';
import { WifeNPC } from '../objects/WifeNPC.js';
import { ChildNPC } from '../objects/ChildNPC.js';
import { SecurityGuard } from '../objects/SecurityGuard.js';
import { YelpDownvoteNPC } from '../objects/YelpDownvoteNPC.js';
import { GoogleReviewsDownvoteNPC } from '../objects/GoogleReviewsDownvoteNPC.js';
import { Hat } from '../objects/Hat.js';
import { UIManager } from '../managers/UIManager.js';
import { InputController } from '../managers/InputController.js';
import { DebugPanel } from '../managers/DebugPanel.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GridMovement } from '../managers/GridMovement.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.maze = null;
        this.player = null;
        this.npcs = [];
        this.uiManager = null;
        this.inputController = null;
        this.debugPanel = null;
        this.audioManager = null;
        this.gameState = 'playing';
        this.isPaused = false;
        this.activeHat = null;
        this.securityGuards = []; // Array of security guards
        this.wife = null; // Reference to wife NPC
        this.downvoteNPCs = []; // Track active downvote NPCs
        this.maxSecurityGuards = 3; // Maximum number of security guards
        this.maxDownvoteNPCs = 4; // Maximum number of downvote NPCs
        
        // Level progression system
        this.currentLevel = 1;
        this.speedMultiplier = 1.0; // Increases each level
        
        // Death state management
        this.isPlayerDying = false; // Prevent multiple deaths during death sequence
    }

    create() {
        this.setupGame();
        this.setupEventListeners();
        this.startGame();
    }

    setupGame() {
        this.audioManager = new AudioManager(this).create();
        this.uiManager = new UIManager(this).create();
        
        this.maze = new Maze(this).create(GameConfig.UI.SCORE_BAR_HEIGHT);
        
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this, startPos.x, startPos.y).create();
        
        this.inputController = new InputController(this).create();
        this.debugPanel = new DebugPanel(this).create();
        
        this.createNPCs();
        this.setupWorldBounds();
    }

    getPlayerStartPosition() {
        const gridX = 9;
        const gridY = 15;
        const worldPos = this.maze.gridToWorld(gridX, gridY);
        return worldPos;
    }

    setupWorldBounds() {
        this.physics.world.setBounds(
            0, 
            GameConfig.UI.SCORE_BAR_HEIGHT, 
            GameConfig.MAZE_COLS * GameConfig.TILE_SIZE,
            GameConfig.MAZE_ROWS * GameConfig.TILE_SIZE
        );
    }

    createNPCs() {
        this.npcs = [];
        
        // The Wife - slow wandering NPC (Hot Pink)
        const wifePos = this.maze.gridToWorld(1, 1);
        this.wife = new WifeNPC(this, wifePos.x, wifePos.y, {
            name: 'wife'
        }).create();
        this.npcs.push(this.wife);
        
        // Child 1 - energetic random movement (Sky Blue)
        const child1Pos = this.maze.gridToWorld(17, 1);
        const child1 = new ChildNPC(this, child1Pos.x, child1Pos.y, {
            name: 'child1',
            color: 0x87ceeb
        }).create();
        this.npcs.push(child1);
        
        // Child 2 - energetic random movement (Light Green)
        const child2Pos = this.maze.gridToWorld(1, 19);
        const child2 = new ChildNPC(this, child2Pos.x, child2Pos.y, {
            name: 'child2',
            color: 0x98fb98
        }).create();
        this.npcs.push(child2);
        
        // Child 3 - energetic random movement (Light Coral)
        const child3Pos = this.maze.gridToWorld(17, 19);
        const child3 = new ChildNPC(this, child3Pos.x, child3Pos.y, {
            name: 'child3',
            color: 0xf08080
        }).create();
        this.npcs.push(child3);
        
        // Create multiple Security Guards - inactive by default, spawn when player steals hats
        for (let i = 0; i < this.maxSecurityGuards; i++) {
            const guardPos = this.maze.gridToWorld(-2 - i, 10); // Off-screen initially, spread out
            const guard = new SecurityGuard(this, guardPos.x, guardPos.y, {
                name: `security_${i}`
            }).create();
            guard.sprite.setVisible(false); // Hidden initially
            this.securityGuards.push(guard);
        }
        
        // Pre-create downvote NPCs pool (mix of Yelp and Google)
        const downvoteTypes = [
            { class: YelpDownvoteNPC, name: 'yelp_downvote' },
            { class: GoogleReviewsDownvoteNPC, name: 'google_downvote' },
            { class: YelpDownvoteNPC, name: 'yelp_downvote_2' },
            { class: GoogleReviewsDownvoteNPC, name: 'google_downvote_2' }
        ];
        
        for (let i = 0; i < this.maxDownvoteNPCs; i++) {
            const type = downvoteTypes[i % downvoteTypes.length];
            const startY = 5 + i * 3; // Spread them out vertically
            const startX = i % 2 === 0 ? -3 - Math.floor(i/2) : 21 + Math.floor(i/2); // Alternate sides
            
            const downvotePos = this.maze.gridToWorld(startX, startY);
            const downvote = new type.class(this, downvotePos.x, downvotePos.y, {
                name: `${type.name}_${i}`
            }).create();
            downvote.sprite.setVisible(false); // Hidden initially
            downvote.isActive = false;
            this.downvoteNPCs.push(downvote);
        }
    }

    setupEventListeners() {
        this.events.on('dotEaten', (points) => {
            this.handleDotEaten(points);
        });
        
        this.events.on('powerPelletEaten', (points) => {
            this.handlePowerPelletEaten(points);
        });
        
        this.events.on('playerDied', () => {
            this.handlePlayerDeath();
        });
        
        this.input.keyboard.on('keydown-P', () => {
            this.audioManager.playMenuSelect();
            this.togglePause();
        });
        
        this.input.keyboard.on('keydown-R', () => {
            if (this.gameState === 'gameOver') {
                this.audioManager.playMenuSelect();
                this.restartGame();
            }
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.audioManager.playMenuSelect();
            this.togglePause();
        });
        
        // Debug key for throwing hats
        this.input.keyboard.on('keydown-H', () => {
            this.debugThrowHat();
        });
        
        // Debug key for logging positions
        this.input.keyboard.on('keydown-D', () => {
            this.audioManager.playMenuSelect();
            this.debugLogPositions();
        });
        
        // Debug key for testing death animation
        this.input.keyboard.on('keydown-K', () => {
            this.audioManager.playMenuSelect();
            this.debugTriggerDeath();
        });
        
        // Debug key for sprite viewer
        this.input.keyboard.on('keydown-I', () => {
            this.audioManager.playMenuSelect();
            this.openSpriteViewer();
        });
        
        // Hat-related events
        this.events.on('pongScore', (data) => {
            this.handlePongScore(data);
        });
        
        this.events.on('hatLanded', (hat) => {
            this.handleHatLanded(hat);
        });
        
        this.events.on('hatCollected', (data) => {
            this.handleHatCollected(data);
        });
        
        this.events.on('hatStolen', (data) => {
            this.handleHatStolen(data);
        });
        
        this.events.on('securityGuardLeft', (guard) => {
            this.handleSecurityGuardLeft(guard);
        });
    }

    handleDotEaten(points) {
        this.audioManager.playDotEaten();
        this.uiManager.updateScore(points);
        this.checkLevelComplete();
    }

    handlePowerPelletEaten(points) {
        this.audioManager.playPowerPelletEaten();
        this.uiManager.updateScore(points);
        
        // Make all NPCs frightened for 10 seconds
        this.npcs.forEach(npc => {
            npc.setState('frightened', 10000);
        });
        this.audioManager.playNPCFrightened();
        
        this.checkLevelComplete();
    }

    checkLevelComplete() {
        if (this.maze.getRemainingDots() === 0) {
            this.levelComplete();
        }
    }

    levelComplete() {
        this.audioManager.playLevelComplete();
        this.audioManager.fadeOutMusic(1500);
        
        this.gameState = 'levelComplete';
        this.inputController.disable();
        this.player.stop();
        
        this.uiManager.showMessage('LEVEL COMPLETE!', 2000);
        
        this.time.delayedCall(2500, () => {
            this.nextLevel();
        });
    }

    nextLevel() {
        // Advance to next level
        this.currentLevel++;
        this.uiManager.updateLevel(this.currentLevel);
        this.audioManager.playSuccess();
        
        // Increase speed multiplier for progressive difficulty
        this.speedMultiplier += 0.15; // 15% speed increase each level
        console.log(`Level ${this.currentLevel} - Speed multiplier: ${this.speedMultiplier.toFixed(2)}`);
        
        // Show level transition message
        this.uiManager.showMessage(`LEVEL ${this.currentLevel}!\nSpeed increased!`, 2500);
        
        // Reset maze and respawn all dots/pellets
        this.maze.destroy();
        this.maze = new Maze(this).create(GameConfig.UI.SCORE_BAR_HEIGHT);
        
        // Reset player and regular NPCs to starting positions
        this.player.reset();
        this.npcs.forEach(npc => {
            // Only reset non-downvote NPCs
            if (!this.downvoteNPCs.includes(npc)) {
                npc.reset();
            }
        });
        
        // Reset security guards (they don't carry over)
        this.securityGuards.forEach(guard => {
            guard.reset();
            guard.deactivate();
            guard.sprite.setVisible(false);
        });
        
        // Update speeds for downvotes and security guards with multiplier
        this.updateNPCSpeeds();
        
        // Clear any active hat
        if (this.activeHat) {
            this.activeHat.destroy();
            this.activeHat = null;
        }
        
        this.inputController.reset();
        this.gameState = 'playing';
        this.startGame();
    }

    freezeAllNPCs() {
        // Freeze all NPCs during death sequence (except pong game)
        this.npcs.forEach(npc => {
            if (npc.gridMovement) {
                npc.gridMovement.freeze();
            }
            // Stop any animations
            if (npc.sprite && npc.sprite.anims) {
                npc.sprite.anims.pause();
            }
        });
        
        console.log("All NPCs frozen for death sequence");
    }
    
    unfreezeAllNPCs() {
        // Unfreeze all NPCs after death sequence
        this.npcs.forEach(npc => {
            if (npc.gridMovement) {
                npc.gridMovement.unfreeze();
            }
            // Resume animations
            if (npc.sprite && npc.sprite.anims && npc.sprite.anims.isPaused) {
                npc.sprite.anims.resume();
            }
        });
        
        console.log("All NPCs unfrozen after death sequence");
    }

    updateNPCSpeeds() {
        // Update downvote NPC speeds with multiplier
        this.downvoteNPCs.forEach(downvote => {
            if (downvote.baseSpeed === undefined) {
                // Store original speed on first time
                downvote.baseSpeed = downvote.speed;
            }
            downvote.speed = Math.floor(downvote.baseSpeed * this.speedMultiplier);
            
            // Also update their grid movement speed if they have it
            if (downvote.gridMovement) {
                if (downvote.gridMovement.baseSpeed === undefined) {
                    downvote.gridMovement.baseSpeed = downvote.gridMovement.speed;
                }
                downvote.gridMovement.speed = downvote.gridMovement.baseSpeed * this.speedMultiplier;
            }
        });
        
        // Update security guard speeds with multiplier
        this.securityGuards.forEach(guard => {
            if (guard.baseSpeed === undefined) {
                // Store original speed on first time
                guard.baseSpeed = guard.speed;
            }
            guard.speed = Math.floor(guard.baseSpeed * this.speedMultiplier);
            
            // Also update their grid movement speed if they have it
            if (guard.gridMovement) {
                if (guard.gridMovement.baseSpeed === undefined) {
                    guard.gridMovement.baseSpeed = guard.gridMovement.speed;
                }
                guard.gridMovement.speed = guard.gridMovement.baseSpeed * this.speedMultiplier;
            }
        });
        
        console.log(`Updated NPC speeds with ${this.speedMultiplier.toFixed(2)}x multiplier`);
    }

    handlePlayerDeath() {
        // Set dying flag to prevent multiple deaths
        this.isPlayerDying = true;
        
        this.audioManager.playPlayerDeath();
        
        // Freeze all NPCs for dramatic death sequence
        this.freezeAllNPCs();
        
        const lives = this.uiManager.getLives() - 1;
        this.uiManager.updateLives(lives);
        
        if (lives > 0) {
            this.uiManager.showMessage('TRY AGAIN!', 1500);
            this.time.delayedCall(2000, () => {
                this.resetRound();
            });
        } else {
            this.gameOver();
        }
    }

    resetRound() {
        // Reset player to starting position
        this.player.reset();
        
        // Reset all regular NPCs (wife and children) to their starting positions
        this.npcs.forEach(npc => {
            // Skip special NPCs that should be removed instead of reset
            if (npc === this.securityGuard || npc === this.yelpDownvote || npc === this.googleDownvote) {
                return;
            }
            npc.reset();
        });
        
        // Remove and deactivate all security guards
        this.securityGuards.forEach(guard => {
            if (guard.isActive) {
                guard.deactivate();
                guard.sprite.setVisible(false);
                // Remove from active NPCs
                const guardIndex = this.npcs.indexOf(guard);
                if (guardIndex > -1) {
                    this.npcs.splice(guardIndex, 1);
                }
            }
        });
        
        // Remove and deactivate all downvote NPCs
        this.downvoteNPCs.forEach(downvoteNPC => {
            downvoteNPC.isActive = false;
            downvoteNPC.sprite.setVisible(false);
            downvoteNPC.reset();
            
            // Remove from active NPCs
            const npcIndex = this.npcs.indexOf(downvoteNPC);
            if (npcIndex > -1) {
                this.npcs.splice(npcIndex, 1);
            }
        });
        
        // Remove any active hat
        if (this.activeHat) {
            this.activeHat.destroy();
            this.activeHat = null;
        }
        
        // Remove hat from player if they have one
        if (this.player.hat) {
            this.player.hat.removeListener();
            this.player.hat.destroy();
            this.player.hat = null;
            this.player.hasHat = false;
        }
        
        this.inputController.reset();
        this.gameState = 'playing';
        
        // Reset dying flag to allow future collision detection
        this.isPlayerDying = false;
        
        // Stop any playing siren
        this.audioManager.stopSiren();
        
        // Unfreeze all NPCs after reset
        this.unfreezeAllNPCs();
        
        console.log("Round reset - all characters returned to starting positions, special NPCs removed");
    }

    gameOver() {
        this.audioManager.playGameOver();
        this.audioManager.stopMusic();
        
        this.gameState = 'gameOver';
        this.inputController.disable();
        
        const finalScore = this.uiManager.getScore();
        this.uiManager.showMessage(`GAME OVER\nSCORE: ${finalScore}\nPress R to restart`, 5000);
    }

    restartGame() {
        this.audioManager.playMenuSelect();
        
        this.maze.destroy();
        this.npcs.forEach(npc => npc.destroy());
        
        this.uiManager.reset();
        this.setupGame();
        this.startGame();
    }

    startGame() {
        this.audioManager.playMusic('background_music');
        
        this.gameState = 'playing';
        this.isPaused = false;
        this.inputController.enable();
        
        this.uiManager.showMessage('READY!', 1500);
        
        this.time.delayedCall(1600, () => {
            if (this.gameState === 'playing') {
                this.inputController.enable();
                this.audioManager.playAmbientCrowd();
            }
        });
    }

    togglePause() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.audioManager.playPause();
            this.physics.pause();
            this.inputController.disable();
            this.uiManager.showMessage('PAUSED', 999999);
        } else {
            this.audioManager.playUnpause();
            this.physics.resume();
            this.inputController.enable();
            this.uiManager.showMessage('', 0);
        }
    }
    
    handlePongScore(data) {
        // Don't spawn new hat if one is already active
        if (this.activeHat) return;
        
        this.audioManager.playPongScore();
        this.audioManager.playStadiumCheer();
        
        // Find a random empty position on the maze (avoid walls and tennis court)
        const throwPosition = this.findRandomHatPosition();
        if (!throwPosition) return;
        
        // Create hat at winning paddle position first
        const paddleX = data.winner === 'left' ? 
            data.courtBounds.x + 12 : 
            data.courtBounds.x + data.courtBounds.width - 12;
        const paddleY = data.courtBounds.y + data.courtBounds.height / 2;
        
        // Create and throw hat
        this.activeHat = new Hat(this, paddleX, paddleY).create(paddleX, paddleY);
        this.activeHat.throwToPosition(throwPosition.x, throwPosition.y, 500); // 500ms delay
        
        this.audioManager.playHatThrown();
        
        // Show message
        this.uiManager.showMessage('HAT THROWN! GET IT!', 2000);
    }
    
    findRandomHatPosition() {
        const attempts = 50; // Prevent infinite loop
        
        for (let i = 0; i < attempts; i++) {
            const gridX = Math.floor(Math.random() * this.maze.width);
            const gridY = Math.floor(Math.random() * this.maze.height);
            
            // Check if position is valid (not wall, not tennis court)
            const tileType = this.maze.getTileAt(gridX, gridY);
            if (tileType === 0 || tileType === 2 || tileType === 3) { // Empty, dot, or power pellet
                const worldPos = this.maze.gridToWorld(gridX, gridY);
                return worldPos;
            }
        }
        
        // Fallback to center if no position found
        return this.maze.gridToWorld(9, 10);
    }
    
    handleHatLanded(hat) {
        this.audioManager.playWarning();
        
        // All children NPCs should now try to get the hat
        this.npcs.forEach(npc => {
            if (npc instanceof ChildNPC) {
                npc.setTarget(hat.gridX, hat.gridY);
                npc.setState('excited', 5000); // Excited state for 5 seconds
            }
        });
        
        this.audioManager.playNPCExcited();
    }
    
    handleHatCollected(data) {
        const { collector, points } = data;
        
        this.audioManager.playHatCollected();
        this.uiManager.updateScore(points);
        
        if (collector === this.player) {
            this.audioManager.playSuccess();
            this.uiManager.showMessage(`HAT COLLECTED! +${points}`, 1500);
        } else {
            this.audioManager.playWarning();
            this.uiManager.showMessage(`${collector.name.toUpperCase()} GOT THE HAT!`, 1500);
        }
    }
    
    handleHatStolen(data) {
        const { newOwner, previousOwner, points } = data;
        
        this.audioManager.playHatStolen();
        this.uiManager.updateScore(points);
        this.uiManager.showMessage(`HAT STOLEN! +${points}`, 1500);
        
        // If player stole from child, spawn security guard and start siren
        if (newOwner === this.player && previousOwner instanceof ChildNPC) {
            this.audioManager.playWarning();
            this.spawnSecurityGuard();
            // Start the police siren
            this.audioManager.playSiren();
        }
        
        // If a child steals from player, stop the siren (player no longer has stolen goods)
        if (previousOwner === this.player && newOwner instanceof ChildNPC) {
            this.audioManager.stopSiren();
            // Also deactivate security guards since player no longer has stolen hat
            this.securityGuards.forEach(guard => {
                if (guard.isActive) {
                    guard.deactivate();
                }
            });
        }
    }
    
    debugThrowHat() {
        // Don't spawn new hat if one is already active
        if (this.activeHat) {
            console.log("Hat already active - clearing first");
            this.activeHat.destroy();
            this.activeHat = null;
        }
        
        this.audioManager.playMenuSelect();
        
        // Find a random empty position on the maze
        const throwPosition = this.findRandomHatPosition();
        if (!throwPosition) return;
        
        // Start hat from tennis court like a real pong score
        // Get court bounds from maze
        const courtBounds = this.maze.pongGame ? this.maze.pongGame.getCourtBounds() : null;
        
        let paddleX, paddleY;
        if (courtBounds) {
            // Random paddle position (left or right)
            const isLeft = Math.random() > 0.5;
            paddleX = isLeft ? 
                courtBounds.x + 12 : 
                courtBounds.x + courtBounds.width - 12;
            paddleY = courtBounds.y + courtBounds.height / 2;
        } else {
            // Fallback to center of maze if no court
            const centerPos = this.maze.gridToWorld(9, 10);
            paddleX = centerPos.x;
            paddleY = centerPos.y;
        }
        
        // Create and throw hat
        this.activeHat = new Hat(this, paddleX, paddleY).create(paddleX, paddleY);
        this.activeHat.throwToPosition(throwPosition.x, throwPosition.y, 200); // Quick throw
        
        this.audioManager.playHatThrown();
        
        // Show debug message
        this.uiManager.showMessage('DEBUG: HAT THROWN!', 1500);
        
        console.log(`Debug hat thrown from tennis court (${paddleX}, ${paddleY}) to (${throwPosition.x}, ${throwPosition.y})`);
    }
    
    debugLogPositions() {
        console.log("=== DEBUG POSITIONS ===");
        
        // Player position
        const playerGrid = this.maze.worldToGrid(this.player.sprite.x, this.player.sprite.y);
        console.log(`Player: World(${Math.round(this.player.sprite.x)}, ${Math.round(this.player.sprite.y)}) Grid(${playerGrid.x}, ${playerGrid.y})`);
        
        // Hat info
        if (this.activeHat) {
            const hatPos = this.activeHat.getPosition();
            console.log(`Hat: World(${Math.round(hatPos.x)}, ${Math.round(hatPos.y)}) Grid(${hatPos.gridX}, ${hatPos.gridY}) Collected: ${this.activeHat.isCollected} Worn: ${this.activeHat.isBeingWorn}`);
            if (this.activeHat.wearer) {
                console.log(`Hat wearer: ${this.activeHat.wearer.name} at grid (${this.maze.worldToGrid(this.activeHat.wearer.sprite.x, this.activeHat.wearer.sprite.y).x}, ${this.maze.worldToGrid(this.activeHat.wearer.sprite.x, this.activeHat.wearer.sprite.y).y})`);
            } else {
                console.log("Hat has no wearer assigned");
            }
        } else {
            console.log("No active hat");
        }
        
        // NPC positions
        this.npcs.forEach(npc => {
            if (npc.sprite) {
                const npcGrid = this.maze.worldToGrid(npc.sprite.x, npc.sprite.y);
                console.log(`${npc.name}: World(${Math.round(npc.sprite.x)}, ${Math.round(npc.sprite.y)}) Grid(${npcGrid.x}, ${npcGrid.y}) HasHat: ${npc.hasHat || false}`);
            }
        });
        
        console.log("=======================");
    }
    
    debugTriggerDeath() {
        console.log("=== DEBUG DEATH TRIGGERED ===");
        this.audioManager.playMenuSelect();
        this.audioManager.playPlayerDeath();
        
        this.inputController.disable();
        this.uiManager.showMessage('DEBUG: DEATH ANIMATION', 2000);
        
        // Trigger death animation
        this.player.die();
        
        // Re-enable after animation
        this.time.delayedCall(1200, () => {
            this.player.reset();
            this.inputController.enable();
            console.log("Death animation complete - player reset");
        });
    }
    
    openSpriteViewer() {
        console.log("=== OPENING SPRITE VIEWER ===");
        
        // Pause current game
        this.scene.pause();
        
        // Launch sprite viewer scene
        this.scene.launch('SpriteViewerScene');
        
        console.log("Sprite viewer opened - press I in viewer to return");
    }
    
    spawnSecurityGuard() {
        // Find an inactive security guard to spawn
        const inactiveGuard = this.securityGuards.find(guard => !guard.isActive);
        
        if (!inactiveGuard) {
            console.log("All security guards are already active");
            return; // All guards are active
        }
        
        this.audioManager.playSecurityGuardSpawn();
        this.audioManager.playWarning();
        
        // Choose random entry point from accessible maze edges
        const entryPoints = [
            // Left side entries (accessible corridors)
            { x: 0, y: 1, worldX: this.maze.gridToWorld(0, 1).x, worldY: this.maze.gridToWorld(0, 1).y },
            { x: 0, y: 5, worldX: this.maze.gridToWorld(0, 5).x, worldY: this.maze.gridToWorld(0, 5).y },
            { x: 0, y: 9, worldX: this.maze.gridToWorld(0, 9).x, worldY: this.maze.gridToWorld(0, 9).y },
            { x: 0, y: 13, worldX: this.maze.gridToWorld(0, 13).x, worldY: this.maze.gridToWorld(0, 13).y },
            { x: 0, y: 17, worldX: this.maze.gridToWorld(0, 17).x, worldY: this.maze.gridToWorld(0, 17).y },
            
            // Right side entries (accessible corridors)
            { x: 18, y: 1, worldX: this.maze.gridToWorld(18, 1).x, worldY: this.maze.gridToWorld(18, 1).y },
            { x: 18, y: 5, worldX: this.maze.gridToWorld(18, 5).x, worldY: this.maze.gridToWorld(18, 5).y },
            { x: 18, y: 9, worldX: this.maze.gridToWorld(18, 9).x, worldY: this.maze.gridToWorld(18, 9).y },
            { x: 18, y: 13, worldX: this.maze.gridToWorld(18, 13).x, worldY: this.maze.gridToWorld(18, 13).y },
            { x: 18, y: 17, worldX: this.maze.gridToWorld(18, 17).x, worldY: this.maze.gridToWorld(18, 17).y }
        ];
        
        // Filter to only include valid (non-wall) entry points
        const validEntryPoints = entryPoints.filter(point => {
            return this.maze.isValidMove(point.x, point.y);
        });
        
        // Use valid entry points, fallback to original if none found
        const finalEntryPoints = validEntryPoints.length > 0 ? validEntryPoints : entryPoints;
        const entryPoint = finalEntryPoints[Math.floor(Math.random() * finalEntryPoints.length)];
        
        // Position security guard at entry point
        inactiveGuard.sprite.setPosition(entryPoint.worldX, entryPoint.worldY);
        inactiveGuard.setEntryPoint(entryPoint.x, entryPoint.y);
        
        // Activate the guard
        inactiveGuard.activate(this.player);
        
        // Apply current level speed multiplier to newly spawned guard
        if (inactiveGuard.baseSpeed === undefined) {
            inactiveGuard.baseSpeed = inactiveGuard.speed;
        }
        inactiveGuard.speed = Math.floor(inactiveGuard.baseSpeed * this.speedMultiplier);
        
        // Add to active NPCs for updates
        if (!this.npcs.includes(inactiveGuard)) {
            this.npcs.push(inactiveGuard);
        }
        
        // Count active guards for escalating warnings
        const activeGuardCount = this.securityGuards.filter(g => g.isActive).length;
        let warningMessage = 'SECURITY ALERT! DELIVER HAT TO WIFE!';
        
        if (activeGuardCount === 2) {
            warningMessage = 'MULTIPLE SECURITY GUARDS! DANGER!';
        } else if (activeGuardCount >= 3) {
            warningMessage = 'MAXIMUM SECURITY! EXTREME DANGER!';
        }
        
        this.uiManager.showMessage(warningMessage, 3000);
        
        console.log(`Security guard ${inactiveGuard.name} spawned at ${entryPoint.x === -1 ? 'left' : 'right'} entrance (${activeGuardCount} active)`);
    }
    
    handleSecurityGuardLeft(guard) {
        this.audioManager.playSecurityGuardLeft();
        
        // Remove from active NPCs
        const index = this.npcs.indexOf(guard);
        if (index > -1) {
            this.npcs.splice(index, 1);
        }
        
        // Hide the guard
        guard.sprite.setVisible(false);
        guard.reset();
        
        this.uiManager.showMessage('Security guard left', 1000);
        console.log("Security guard has left the maze");
    }
    
    checkHatDelivery() {
        // Check if player with hat is near wife for delivery
        if (this.activeHat && this.activeHat.isBeingWorn && this.activeHat.wearer === this.player) {
            const playerGrid = this.maze.worldToGrid(this.player.sprite.x, this.player.sprite.y);
            const wifeGrid = this.maze.worldToGrid(this.wife.sprite.x, this.wife.sprite.y);
            
            // Check if player is adjacent to wife
            const distance = Math.abs(playerGrid.x - wifeGrid.x) + Math.abs(playerGrid.y - wifeGrid.y);
            if (distance <= 1) {
                this.deliverHatToWife();
            }
        }
    }
    
    deliverHatToWife() {
        if (!this.activeHat || this.activeHat.wearer !== this.player) return;
        
        this.audioManager.playHatDelivered();
        this.audioManager.playSuccess();
        
        // Award bonus points for delivery
        const deliveryBonus = 500;
        this.uiManager.updateScore(deliveryBonus);
        
        // Check if hat was stolen before removing it
        const wasHatStolen = this.activeHat.wasStolen;
        
        // Remove hat from player
        if (this.player.hat) {
            this.player.hat.removeListener();
            this.player.hat.destroy();
            this.player.hat = null;
            this.player.hasHat = false;
        }
        
        // Clean up hat
        this.activeHat.destroy();
        this.activeHat = null;
        
        // Deactivate all security guards if active and stop siren
        this.securityGuards.forEach(guard => {
            if (guard.isActive) {
                guard.deactivate();
            }
        });
        
        // Stop the siren since hat is delivered
        this.audioManager.stopSiren();
        
        // Show success message
        this.uiManager.showMessage(`HAT DELIVERED! +${deliveryBonus}`, 2000);
        
        console.log(`Hat delivered to wife - was stolen: ${wasHatStolen}`);
        
        // Only spawn downvotes if the hat was stolen
        if (wasHatStolen) {
            this.spawnDownvoteNPCs();
        } else {
            console.log("No downvotes spawned - hat was collected, not stolen");
        }
    }
    
    spawnDownvoteNPCs() {
        this.audioManager.playDownvoteSpawn();
        this.audioManager.playWarning();
        
        // Count how many hat deliveries have been made to determine how many downvotes to spawn
        const currentActiveDownvotes = this.downvoteNPCs.filter(npc => npc.isActive).length;
        const inactiveDownvotes = this.downvoteNPCs.filter(npc => !npc.isActive);
        
        if (inactiveDownvotes.length === 0) {
            console.log("All downvote NPCs are already active");
            return;
        }
        
        // Spawn 1-2 downvotes each time, increasing difficulty
        const spawnCount = Math.min(2, inactiveDownvotes.length);
        const toSpawn = inactiveDownvotes.slice(0, spawnCount);
        
        toSpawn.forEach((downvote, index) => {
            const delay = index * 1500; // Stagger spawning
            
            this.time.delayedCall(delay, () => {
                this.audioManager.playDownvoteSpawn();
                
                // Choose valid spawn position on maze edges
                const spawnPositions = [
                    { x: 1, y: 10 },   // Left side, horizontal corridor
                    { x: 18, y: 10 },  // Right side, horizontal corridor
                    { x: 9, y: 1 },    // Top center
                    { x: 9, y: 18 },   // Bottom center
                    { x: 1, y: 5 },    // Left side, upper
                    { x: 18, y: 15 },  // Right side, lower
                ];
                
                // Filter to only valid, accessible positions
                const validPositions = spawnPositions.filter(pos => 
                    this.maze.isValidMove(pos.x, pos.y)
                );
                
                if (validPositions.length === 0) {
                    console.warn("No valid spawn positions for downvote NPC");
                    return;
                }
                
                // Use index to cycle through positions, with fallback
                const posIndex = (currentActiveDownvotes + index) % validPositions.length;
                const spawnPos = this.maze.gridToWorld(validPositions[posIndex].x, validPositions[posIndex].y);
                
                downvote.sprite.setPosition(spawnPos.x, spawnPos.y);
                downvote.sprite.setVisible(true);
                downvote.isActive = true;
                
                // Initialize grid movement immediately for newly spawned downvote
                if (!downvote.gridMovement) {
                    downvote.gridMovement = new GridMovement(downvote.sprite, this.maze);
                }
                
                // Apply current level speed multiplier to newly spawned downvote
                if (downvote.baseSpeed === undefined) {
                    downvote.baseSpeed = downvote.speed;
                }
                downvote.speed = Math.floor(downvote.baseSpeed * this.speedMultiplier);
                
                // Set grid movement speed and give initial direction towards player
                downvote.gridMovement.speed = downvote.getMovementSpeed();
                
                // Give them an initial direction towards the player to start moving
                const playerGrid = this.maze.worldToGrid(this.player.sprite.x, this.player.sprite.y);
                const downvoteGrid = this.maze.worldToGrid(spawnPos.x, spawnPos.y);
                
                const dx = playerGrid.x - downvoteGrid.x;
                const dy = playerGrid.y - downvoteGrid.y;
                
                // Choose initial direction based on player position
                let initialDirection = 'right'; // default
                if (Math.abs(dx) > Math.abs(dy)) {
                    initialDirection = dx > 0 ? 'right' : 'left';
                } else {
                    initialDirection = dy > 0 ? 'down' : 'up';
                }
                
                // Set the initial direction
                downvote.gridMovement.requestDirection(initialDirection);
                downvote.nextDirection = null; // Clear any conflicting directions
                
                // Add to active NPCs for updates
                if (!this.npcs.includes(downvote)) {
                    this.npcs.push(downvote);
                }
                
                // Escalating warning messages
                const totalActive = this.downvoteNPCs.filter(npc => npc.isActive).length;
                let warningMessage = 'DOWNVOTE APPEARED!';
                
                if (totalActive === 2) {
                    warningMessage = 'MULTIPLE DOWNVOTES! DANGER INCREASING!';
                } else if (totalActive === 3) {
                    warningMessage = 'TRIPLE DOWNVOTES! HIGH DANGER!';
                } else if (totalActive >= 4) {
                    warningMessage = 'MAXIMUM DOWNVOTES! EXTREME DANGER!';
                }
                
                this.uiManager.showMessage(warningMessage, 2500);
                
                console.log(`${downvote.name} spawned at position ${posIndex} (${totalActive} active)`);
            });
        });
        
        console.log(`Spawning ${spawnCount} downvote NPCs - consequences for hat delivery!`);
    }
    
    checkHatInteractions() {
        if (!this.activeHat) {
            return;
        }
        
        // Debug: Check if we're skipping due to isCollected flag
        if (this.activeHat.isCollected && !this.activeHat.isBeingWorn) {
            console.log("Skipping hat interactions - hat collected but not being worn");
            return;
        }
        
        // FIRST: Check for hat stealing (player can steal from NPCs)
        if (this.activeHat.isBeingWorn && this.activeHat.wearer !== this.player) {
            const wearerGrid = this.maze.worldToGrid(this.activeHat.wearer.sprite.x, this.activeHat.wearer.sprite.y);
            const playerGrid = this.maze.worldToGrid(this.player.sprite.x, this.player.sprite.y);
            
            // Check if player is adjacent to hat wearer (including diagonal)
            const dx = Math.abs(playerGrid.x - wearerGrid.x);
            const dy = Math.abs(playerGrid.y - wearerGrid.y);
            const distance = Math.max(dx, dy); // Use Chebyshev distance (allows diagonal)
            
            // Debug logging for close encounters (every frame when close)
            if (distance <= 3) {
                console.log(`Hat stealing check: Player(${playerGrid.x},${playerGrid.y}) vs ${this.activeHat.wearer.name}(${wearerGrid.x},${wearerGrid.y}) - distance: ${distance}`);
            }
            
            if (distance <= 1) { // Adjacent (including diagonal) or same position
                console.log(`*** STEALING HAT from ${this.activeHat.wearer.name} at distance ${distance} ***`);
                this.activeHat.stealFrom(this.activeHat.wearer, this.player);
                return; // Exit after stealing
            }
        }
        
        // SECOND: Only check ground collection if hat is NOT being worn
        if (!this.activeHat.isBeingWorn) {
            const hatPos = this.activeHat.getPosition();
            
            // Check if player can collect the hat (allow some tolerance)
            const playerGrid = this.maze.worldToGrid(this.player.sprite.x, this.player.sprite.y);
            
            // Check if player is close enough to hat (same tile or adjacent)
            const dx = Math.abs(playerGrid.x - hatPos.gridX);
            const dy = Math.abs(playerGrid.y - hatPos.gridY);
            const playerDistance = Math.max(dx, dy);
            
            if (playerDistance <= 1) {
                console.log(`Player collecting hat at distance ${playerDistance}`);
                this.activeHat.collectBy(this.player);
                return;
            }
            
            // Check if any NPC with canCollectHats can collect the hat
            for (const npc of this.npcs) {
                if (!npc.sprite || !npc.canCollectHats) continue; // Skip if no sprite or can't collect hats
                
                const npcGrid = this.maze.worldToGrid(npc.sprite.x, npc.sprite.y);
                const npcDx = Math.abs(npcGrid.x - hatPos.gridX);
                const npcDy = Math.abs(npcGrid.y - hatPos.gridY);
                const npcDistance = Math.max(npcDx, npcDy);
                
                if (npcDistance <= 1) {
                    console.log(`${npc.name} collecting hat at distance ${npcDistance}`);
                    this.activeHat.collectBy(npc);
                    return;
                }
            }
        }
    }
    
    checkSecurityGuardCapture() {
        // Skip collision detection if player is already dying
        if (this.isPlayerDying) return;
        
        // Only check if player has hat
        if (!this.activeHat || this.activeHat.wearer !== this.player) {
            return;
        }
        
        // Check all active security guards
        for (const guard of this.securityGuards) {
            if (guard.isActive && guard.canCatch(this.player, this.maze)) {
                this.playerCaughtWithHat();
                return; // Only need one capture
            }
        }
    }
    
    playerCaughtWithHat() {
        // Set dying flag to prevent multiple deaths
        this.isPlayerDying = true;
        
        // Stop the siren when caught
        this.audioManager.stopSiren();
        
        this.audioManager.playError();
        // Death riff will play automatically with playPlayerDeath()
        this.audioManager.playPlayerDeath();
        
        // Disable input immediately
        this.inputController.disable();
        
        // Freeze all NPCs for dramatic death sequence
        this.freezeAllNPCs();
        
        // Player loses a life for being caught stealing
        const lives = this.uiManager.getLives() - 1;
        this.uiManager.updateLives(lives);
        
        // Remove hat from player
        if (this.player.hat) {
            this.player.hat.removeListener();
            this.player.hat.destroy();
            this.player.hat = null;
            this.player.hasHat = false;
        }
        
        // Clean up hat
        if (this.activeHat) {
            this.activeHat.destroy();
            this.activeHat = null;
        }
        
        // Deactivate all security guards
        this.securityGuards.forEach(guard => {
            if (guard.isActive) {
                guard.deactivate();
            }
        });
        
        // Show caught message
        this.uiManager.showMessage('CAUGHT STEALING!', 2000);
        
        // Trigger death animation
        this.player.die();
        
        // Wait for death animation to complete before continuing
        this.time.delayedCall(1200, () => {
            if (lives > 0) {
                // Reset round after death animation
                this.resetRound();
            } else {
                // Game over
                this.gameOver();
            }
        });
        
        console.log("Player caught stealing hat by security guard - death animation triggered");
    }
    
    checkDownvoteNPCKills() {
        // Skip collision detection if player is already dying
        if (this.isPlayerDying) return;
        
        // Check if any active downvote NPCs can kill the player
        for (const downvoteNPC of this.downvoteNPCs) {
            if (downvoteNPC.isActive && downvoteNPC.canKillPlayer(this.player, this.maze)) {
                this.playerKilledByDownvote(downvoteNPC);
                return; // Only one death at a time
            }
        }
    }
    
    playerKilledByDownvote(downvoteNPC) {
        // Set dying flag to prevent multiple deaths
        this.isPlayerDying = true;
        
        // Stop the siren if playing
        this.audioManager.stopSiren();
        
        // Play specific audio based on which downvote NPC killed player
        if (downvoteNPC.name === 'yelp_downvote') {
            this.audioManager.playYelpKill();
        } else if (downvoteNPC.name === 'google_downvote') {
            this.audioManager.playGoogleKill();
        }
        // Death riff will play automatically with playPlayerDeath()
        this.audioManager.playPlayerDeath();
        
        // Disable input immediately
        this.inputController.disable();
        
        // Freeze all NPCs for dramatic death sequence
        this.freezeAllNPCs();
        
        // Player loses a life for being killed by downvote
        const lives = this.uiManager.getLives() - 1;
        this.uiManager.updateLives(lives);
        
        // Remove any hat from player
        if (this.player.hat) {
            this.player.hat.removeListener();
            this.player.hat.destroy();
            this.player.hat = null;
            this.player.hasHat = false;
        }
        
        // Clean up active hat
        if (this.activeHat) {
            this.activeHat.destroy();
            this.activeHat = null;
        }
        
        // Show death message based on which downvote NPC killed player
        let deathMessage = 'KILLED BY DOWNVOTE!';
        if (downvoteNPC.name === 'yelp_downvote') {
            deathMessage = 'YELP DOWNVOTED YOU TO DEATH!';
        } else if (downvoteNPC.name === 'google_downvote') {
            deathMessage = 'GOOGLE REVIEWS DESTROYED YOU!';
        }
        
        this.uiManager.showMessage(deathMessage, 2500);
        
        // Trigger death animation
        this.player.die();
        
        // Wait for death animation to complete before continuing
        this.time.delayedCall(1200, () => {
            if (lives > 0) {
                // Reset round after death animation
                this.resetRound();
            } else {
                // Game over
                this.gameOver();
            }
        });
        
        console.log(`Player killed by ${downvoteNPC.name} - death animation triggered`);
    }

    update(time, deltaTime) {
        if (this.gameState !== 'playing' || this.isPaused) {
            if (this.debugPanel) {
                this.debugPanel.update(this.player, this.npcs, this.maze, this.gameState, this.inputController);
            }
            return;
        }
        
        this.inputController.update();
        this.player.update(this.inputController, this.maze);
        
        // Update NPCs
        this.npcs.forEach(npc => {
            npc.update(deltaTime, this.player, this.maze);
        });
        
        // Update maze (includes Pong game)
        this.maze.update();
        
        // Check for hat collection and stealing
        this.checkHatInteractions();
        
        // Check for hat delivery to wife
        this.checkHatDelivery();
        
        // Check if security guard caught player
        this.checkSecurityGuardCapture();
        
        // Check if downvote NPCs caught player (deadly!)
        this.checkDownvoteNPCKills();
        
        // Update debug panel
        if (this.debugPanel) {
            this.debugPanel.update(this.player, this.npcs, this.maze, this.gameState, this.inputController);
        }
    }
}