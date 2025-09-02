import { GameConfig } from '../config/GameConfig.js';
import { NPC } from './NPC.js';

export class WifeNPC extends NPC {
    constructor(scene, x, y, config = {}) {
        // Set default wife configuration
        const wifeConfig = {
            name: 'wife',
            color: 0xff69b4, // Hot pink
            size: GameConfig.TILE_SIZE * 1.4, // Same size as player
            speed: 15, // 2x slower than before (was 30)
            behavior: 'wander', // Custom behavior for wife
            decisionInterval: 1200, // Slower decision making
            ...config
        };
        
        super(scene, x, y, wifeConfig);
        
        // Wife-specific properties
        this.pauseTimer = 0;
        this.maxPauseTime = 180; // Occasionally stops to "look around"
        this.wanderDirection = null;
    }
    
    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Colors for Mrs. Cap Man
        const white = 0xffffff;        // White dress
        const pink = 0xff69b4;         // Pink scarf
        const skinTone = 0xfdbcb4;     // Same skin tone as Cap Man
        
        // Head (circle - skin tone)
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(centerX, centerY - 6, 8);
        
        // White dress (upper body)
        graphics.fillStyle(white, 1);
        graphics.fillRect(centerX - 6, centerY - 2, 12, 8);
        
        // White skirt (lower body - wider than shorts)
        graphics.fillRect(centerX - 7, centerY + 6, 14, 6);
        
        // Pink scarf/necktie in ^ shape (V-neck style)
        graphics.fillStyle(pink, 1);
        
        // Left side of V (angled line from neck to chest)
        graphics.fillTriangle(
            centerX - 1, centerY - 3,  // Top center point
            centerX - 4, centerY - 1,  // Left shoulder point
            centerX - 2, centerY + 2   // Left bottom point
        );
        
        // Right side of V (angled line from neck to chest)
        graphics.fillTriangle(
            centerX + 1, centerY - 3,  // Top center point
            centerX + 4, centerY - 1,  // Right shoulder point
            centerX + 2, centerY + 2   // Right bottom point
        );
        
        // Simple facial features
        graphics.fillStyle(0x000000, 1);
        // Eyes
        graphics.fillRect(centerX - 3, centerY - 8, 1, 1);
        graphics.fillRect(centerX + 2, centerY - 8, 1, 1);
        
        // Smile (friendly)
        graphics.lineStyle(1, 0x000000, 1);
        graphics.beginPath();
        graphics.arc(centerX, centerY - 4, 3, 0, Math.PI);
        graphics.strokePath();
        
        // Simple legs (extending from skirt)
        graphics.fillStyle(skinTone, 1);
        graphics.fillRect(centerX - 3, centerY + 12, 2, 4);
        graphics.fillRect(centerX + 1, centerY + 12, 2, 4);
        
        // Simple arms (extending from dress)
        graphics.fillRect(centerX - 8, centerY, 2, 6);
        graphics.fillRect(centerX + 6, centerY, 2, 6);
        
        // Hair (simple brown)
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillCircle(centerX, centerY - 6, 9); // Slightly larger than head for hair
        // Cover with head again to show hair around edges
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(centerX, centerY - 6, 8);
        
        graphics.generateTexture(`${this.name}_sprite`, size, size);
        graphics.destroy();
    }
    
    makeDecision(player, maze) {
        // Wife has unique wandering behavior
        if (this.behavior === 'wander') {
            this.wanderBehavior(maze);
        } else {
            super.makeDecision(player, maze);
        }
    }
    
    wanderBehavior(maze) {
        // Occasionally pause to "look around"
        if (this.pauseTimer > 0) {
            this.pauseTimer--;
            return; // Don't change direction while pausing
        }
        
        // Random chance to pause
        if (Math.random() < 0.05) { // 5% chance per decision
            this.pauseTimer = Math.random() * this.maxPauseTime;
            return;
        }
        
        // Continue in current direction 70% of the time if possible
        if (this.direction && Math.random() < 0.7) {
            const nextGrid = this.getNextGrid(this.direction);
            if (this.canMoveTo(nextGrid.x, nextGrid.y, maze)) {
                return; // Keep current direction
            }
        }
        
        // Choose new direction - prefer straight paths
        const availableDirections = this.getAvailableDirections(maze);
        if (availableDirections.length > 0) {
            // Prefer continuing straight or perpendicular directions
            const straightDirection = this.direction;
            const perpendicularDirections = this.getPerpendicularDirections(this.direction);
            
            let preferredDirections = [];
            
            // Add straight direction if available
            if (availableDirections.includes(straightDirection)) {
                preferredDirections.push(straightDirection);
            }
            
            // Add perpendicular directions
            perpendicularDirections.forEach(dir => {
                if (availableDirections.includes(dir)) {
                    preferredDirections.push(dir);
                }
            });
            
            // Use preferred directions if available, otherwise use any direction
            const choicePool = preferredDirections.length > 0 ? preferredDirections : availableDirections;
            this.nextDirection = choicePool[Math.floor(Math.random() * choicePool.length)];
        }
    }
    
    getPerpendicularDirections(direction) {
        switch(direction) {
            case 'up':
            case 'down':
                return ['left', 'right'];
            case 'left':
            case 'right':
                return ['up', 'down'];
            default:
                return ['up', 'down', 'left', 'right'];
        }
    }
    
    getAvailableDirections(maze) {
        if (!this.gridMovement) return [];
        return this.gridMovement.getAvailableDirections();
    }
    
    getNextGrid(direction) {
        if (!this.gridMovement) return {x: 0, y: 0};
        return this.gridMovement.getNextGrid(direction);
    }
    
    canMoveTo(gridX, gridY, maze) {
        return maze.isValidMove(gridX, gridY);
    }
    
    getMovementSpeed() {
        // Wife moves much slower than other NPCs - pixel-based speed for GridMovement
        return this.state === 'frightened' ? 0.8 : 1.5;
    }
    
    setState(newState, duration = 0) {
        super.setState(newState, duration);
        
        // Wife reacts differently to state changes
        switch(newState) {
            case 'frightened':
                // Wife gets more panicked and moves even slower
                this.pauseTimer = 0; // Stop pausing when frightened
                break;
            case 'normal':
                // Resume normal wandering behavior
                break;
        }
    }
}