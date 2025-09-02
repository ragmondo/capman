import { GameConfig } from '../config/GameConfig.js';
import { NPC } from './NPC.js';

export class SecurityGuard extends NPC {
    constructor(scene, x, y, config = {}) {
        // Set default security guard configuration
        const guardConfig = {
            name: 'security',
            color: 0x4169e1, // Royal blue uniform
            size: GameConfig.TILE_SIZE * 1.6, // Larger than player
            speed: 70, // Fast enough to be threatening
            behavior: 'chase',
            decisionInterval: 300, // Quick reactions
            viewDistance: 12, // Can see far
            ...config
        };
        
        super(scene, x, y, guardConfig);
        
        // Security guard specific properties
        this.isActive = false; // Only active when chasing
        this.target = null; // The player
        this.entryPoint = null; // Where guard entered from
        this.isLeaving = false;
        this.isEntering = false; // True when entering maze
        this.alertLevel = 0; // 0-100, increases as chase continues
        this.isInArrestMode = false; // True when chasing a hat thief
        this.flashTimer = 0; // For flashing red/blue effect
    }
    
    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 36;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 2;
        
        // Create security guard sprite - intimidating
        graphics.fillStyle(this.color, 1); // Royal blue uniform
        graphics.fillCircle(centerX, centerY, radius);
        
        // Add security badge (silver)
        graphics.fillStyle(0xc0c0c0, 1);
        graphics.fillRect(centerX - 2, centerY - 8, 4, 6);
        
        // Add hat/cap (darker blue)
        graphics.fillStyle(0x191970, 1);
        graphics.fillEllipse(centerX, centerY - 10, 12, 4);
        
        // Add serious eyes (no pupils visible - sunglasses effect)
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 6, centerY - 4, 4, 2);
        graphics.fillRect(centerX + 2, centerY - 4, 4, 2);
        
        // Add frown
        graphics.lineStyle(2, 0x000000, 1);
        graphics.beginPath();
        graphics.arc(centerX, centerY + 4, 4, 0, Math.PI, true); // Upside down for frown
        graphics.strokePath();
        
        graphics.generateTexture(`${this.name}_sprite`, size, size);
        graphics.destroy();
    }
    
    activate(target) {
        this.isActive = true;
        this.target = target;
        this.isLeaving = false;
        this.alertLevel = 50; // Start moderately alert
        this.behavior = 'chase';
        this.isEntering = true; // New flag for entrance behavior
        this.isInArrestMode = true; // Player has stolen a hat - arrest mode
        this.flashTimer = 0;
        
        // Make sprite visible - tinting will be handled in update for flashing
        this.sprite.setVisible(true);
        
        console.log("Security guard activated in ARREST MODE - pursuing hat thief!");
    }
    
    deactivate() {
        this.isActive = false;
        this.target = null;
        this.isLeaving = true;
        this.alertLevel = 0;
        this.isInArrestMode = false;
        this.flashTimer = 0;
        
        // Clear tint when deactivating
        this.sprite.clearTint();
        
        console.log("Security guard deactivated - returning to patrol");
    }
    
    makeDecision(player, maze) {
        if (!this.isActive) return;
        
        if (this.isLeaving) {
            this.returnToEntry(maze);
        } else if (this.isEntering) {
            this.enterMaze(maze);
        } else if (this.target) {
            this.chaseTarget(this.target, maze);
            this.updateAlertLevel();
        }
    }
    
    enterMaze(maze) {
        const myGrid = this.getGridPosition(maze);
        
        // Move into the maze from the wrap corridor
        if (myGrid.x < 0) {
            // Entering from left, move right
            this.nextDirection = 'right';
        } else if (myGrid.x >= maze.width) {
            // Entering from right, move left
            this.nextDirection = 'left';
        } else {
            // We're inside the maze now, switch to chase mode
            this.isEntering = false;
            console.log("Security guard has entered the maze - now chasing!");
        }
    }
    
    chaseTarget(target, maze) {
        if (!target || !target.sprite) return;
        
        const targetPos = target.getPosition();
        const myPos = this.getPosition();
        const gridPos = this.getGridPosition(maze);
        const targetGrid = maze.worldToGrid(targetPos.x, targetPos.y);
        
        // Aggressive pathfinding - move towards player
        const dx = targetGrid.x - gridPos.x;
        const dy = targetGrid.y - gridPos.y;
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        // Sort by priority and add some randomness for unpredictability
        directions.sort((a, b) => {
            const priorityDiff = b.priority - a.priority;
            if (Math.abs(priorityDiff) < 0.5) {
                return Math.random() - 0.5; // Random when priorities are close
            }
            return priorityDiff;
        });
        
        // Try directions in order of priority
        for (const {dir} of directions) {
            if (this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
        
        // If stuck, try any available direction
        this.chooseNewDirection(maze);
    }
    
    returnToEntry(maze) {
        const myGrid = this.getGridPosition(maze);
        
        // Determine which wrap corridor to exit through (row 10 is the horizontal corridor)
        const wrapRow = 10;
        const leftExit = { x: -1, y: wrapRow };   // Left wrap corridor exit
        const rightExit = { x: 19, y: wrapRow };  // Right wrap corridor exit
        
        // Choose the closest exit based on current position
        let targetExit;
        if (myGrid.x < maze.width / 2) {
            targetExit = leftExit;  // Exit left
        } else {
            targetExit = rightExit; // Exit right
        }
        
        // First, get to the wrap corridor row (y = 10)
        if (myGrid.y !== wrapRow) {
            // Move towards the horizontal wrap corridor
            if (myGrid.y < wrapRow) {
                if (this.canMove('down', maze)) {
                    this.nextDirection = 'down';
                    return;
                }
            } else if (myGrid.y > wrapRow) {
                if (this.canMove('up', maze)) {
                    this.nextDirection = 'up';
                    return;
                }
            }
            
            // If can't move vertically, try to find a path horizontally first
            const directions = ['left', 'right', 'up', 'down'];
            for (const dir of directions) {
                if (this.canMove(dir, maze)) {
                    this.nextDirection = dir;
                    return;
                }
            }
            return;
        }
        
        // Now we're on the wrap corridor row, move towards the exit
        if (targetExit.x === -1) {
            // Moving towards left exit
            if (myGrid.x <= 0) {
                // We've reached the left edge, exit the maze
                this.scene.events.emit('securityGuardLeft', this);
                return;
            }
            if (this.canMove('left', maze)) {
                this.nextDirection = 'left';
                return;
            }
        } else {
            // Moving towards right exit
            if (myGrid.x >= maze.width - 1) {
                // We've reached the right edge, exit the maze
                this.scene.events.emit('securityGuardLeft', this);
                return;
            }
            if (this.canMove('right', maze)) {
                this.nextDirection = 'right';
                return;
            }
        }
        
        // Fallback: try any direction
        const directions = ['left', 'right', 'up', 'down'];
        for (const dir of directions) {
            if (this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
    }
    
    moveTowardsEdge(maze) {
        const myGrid = this.getGridPosition(maze);
        const centerX = Math.floor(maze.width / 2);
        const centerY = Math.floor(maze.height / 2);
        
        // Move towards the closest edge
        const distToLeft = myGrid.x;
        const distToRight = maze.width - myGrid.x;
        const distToTop = myGrid.y;
        const distToBottom = maze.height - myGrid.y;
        
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        if (minDist === distToLeft && this.canMove('left', maze)) {
            this.nextDirection = 'left';
        } else if (minDist === distToRight && this.canMove('right', maze)) {
            this.nextDirection = 'right';
        } else if (minDist === distToTop && this.canMove('up', maze)) {
            this.nextDirection = 'up';
        } else if (minDist === distToBottom && this.canMove('down', maze)) {
            this.nextDirection = 'down';
        } else {
            this.chooseNewDirection(maze);
        }
    }
    
    updateAlertLevel() {
        // Alert level increases over time when chasing
        this.alertLevel = Math.min(100, this.alertLevel + 0.5);
        
        // Update flash timer
        this.flashTimer += 16; // Assuming ~60fps
        
        if (this.isInArrestMode) {
            // Flashing red and blue effect when in arrest mode
            const flashCycle = Math.floor(this.flashTimer / 75); // Change every 75ms (4x faster)
            
            if (flashCycle % 2 === 0) {
                // Red phase (emergency red)
                this.sprite.setTint(0xff3333);
            } else {
                // Blue phase (police blue)
                this.sprite.setTint(0x3333ff);
            }
        } else {
            // Normal mode - just blue uniform with slight alert tint
            const redIntensity = Math.floor(this.alertLevel * 0.3 + 100);
            const tint = (redIntensity << 16) | (150 << 8) | 255; // Blue with slight red
            this.sprite.setTint(tint);
        }
    }
    
    canCatch(target, maze) {
        if (!this.isActive || !target) return false;
        
        const myGrid = this.getGridPosition(maze);
        const targetGrid = maze.worldToGrid(target.sprite.x, target.sprite.y);
        
        // Can catch if adjacent or same position
        const distance = Math.abs(myGrid.x - targetGrid.x) + Math.abs(myGrid.y - targetGrid.y);
        return distance <= 1;
    }
    
    getMovementSpeed() {
        // Security guard moves faster when more alert
        const baseSpeed = this.state === 'frightened' ? 1.0 : 2.2;
        const alertBonus = (this.alertLevel / 100) * 0.5; // Up to 0.5 bonus speed
        return baseSpeed + alertBonus;
    }
    
    setEntryPoint(gridX, gridY) {
        this.entryPoint = { x: gridX, y: gridY };
    }
    
    getGridPosition(maze) {
        return maze.worldToGrid(this.sprite.x, this.sprite.y);
    }
    
    canMove(direction, maze) {
        const currentGrid = this.getGridPosition(maze);
        let nextGrid = { ...currentGrid };
        
        switch(direction) {
            case 'up': nextGrid.y -= 1; break;
            case 'down': nextGrid.y += 1; break;
            case 'left': nextGrid.x -= 1; break;
            case 'right': nextGrid.x += 1; break;
        }
        
        return maze.isValidMove(nextGrid.x, nextGrid.y);
    }
    
    reset() {
        super.reset();
        this.isActive = false;
        this.target = null;
        this.isLeaving = false;
        this.isEntering = false;
        this.alertLevel = 0;
        this.isInArrestMode = false;
        this.flashTimer = 0;
        this.sprite.setVisible(false); // Hide when not active
        this.sprite.clearTint();
    }
}