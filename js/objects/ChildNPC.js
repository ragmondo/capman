import { GameConfig } from '../config/GameConfig.js';
import { NPC } from './NPC.js';

export class ChildNPC extends NPC {
    constructor(scene, x, y, config = {}) {
        // Set default child configuration
        const childConfig = {
            name: 'child',
            color: 0x87ceeb, // Sky blue for children
            size: GameConfig.TILE_SIZE * 1.0, // Smaller than player (1.4)
            speed: 45, // Faster than wife but slower than player
            behavior: 'random',
            decisionInterval: 400, // Quick decision making
            canCollectHats: true, // Children can collect hats
            ...config
        };
        
        super(scene, x, y, childConfig);
        
        // Child-specific properties
        this.energyLevel = Math.random(); // 0-1, affects movement patterns
        this.curiosityTimer = 0;
        this.maxCuriosityTime = 120; // Sometimes stops to "look around"
        this.target = null; // For chasing hats
        this.targetX = null;
        this.targetY = null;
    }
    
    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 28; // Smaller sprite size
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 2;
        
        // Create child sprite - smaller and more colorful
        graphics.fillStyle(this.color, 1);
        graphics.fillCircle(centerX, centerY, radius);
        
        // Add a small hat/cap
        graphics.fillStyle(0xff6b6b, 1); // Red cap
        graphics.fillEllipse(centerX, centerY - 4, 8, 4);
        
        // Add eyes - larger and more expressive
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(centerX - 3, centerY - 2, 2);
        graphics.fillCircle(centerX + 3, centerY - 2, 2);
        
        // Add pupils
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(centerX - 3, centerY - 2, 1);
        graphics.fillCircle(centerX + 3, centerY - 2, 1);
        
        // Add smile
        graphics.lineStyle(1, 0x000000, 1);
        graphics.beginPath();
        graphics.arc(centerX, centerY + 1, 2, 0, Math.PI);
        graphics.strokePath();
        
        graphics.generateTexture(`${this.name}_sprite`, size, size);
        graphics.destroy();
    }
    
    makeDecision(player, maze) {
        // If we have a target (hat), chase it
        if (this.targetX !== null && this.targetY !== null) {
            this.chaseTarget(maze);
        } else {
            // Children have energetic random behavior
            if (this.behavior === 'random') {
                this.energeticRandomBehavior(maze);
            } else {
                super.makeDecision(player, maze);
            }
        }
    }
    
    setTarget(gridX, gridY) {
        this.targetX = gridX;
        this.targetY = gridY;
        this.behavior = 'chase_hat'; // Temporary behavior change
    }
    
    clearTarget() {
        this.targetX = null;
        this.targetY = null;
        this.behavior = 'random'; // Back to normal
    }
    
    chaseTarget(maze) {
        const myGrid = this.getGridPosition(maze);
        const dx = this.targetX - myGrid.x;
        const dy = this.targetY - myGrid.y;
        
        // If we reached the target, clear it
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            this.clearTarget();
            return;
        }
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        // Sort by priority
        directions.sort((a, b) => b.priority - a.priority);
        
        // Try directions in order of priority
        for (const {dir} of directions) {
            if (dir !== this.getOppositeDirection(this.direction) && this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
        
        // If stuck, clear target and go back to random
        this.clearTarget();
        this.energeticRandomBehavior(maze);
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
    
    getGridPosition(maze) {
        return maze.worldToGrid(this.sprite.x, this.sprite.y);
    }
    
    energeticRandomBehavior(maze) {
        // Occasionally pause out of curiosity
        if (this.curiosityTimer > 0) {
            this.curiosityTimer--;
            return;
        }
        
        // Random chance to pause and "look around"
        if (Math.random() < 0.03) { // 3% chance per decision
            this.curiosityTimer = Math.random() * this.maxCuriosityTime;
            return;
        }
        
        // High energy children change direction more frequently
        const shouldChangeDirection = Math.random() < (this.energyLevel * 0.4 + 0.2); // 20-60% chance
        
        if (shouldChangeDirection || !this.direction) {
            const availableDirections = this.getAvailableDirections(maze);
            if (availableDirections.length > 0) {
                // Filter out opposite direction unless it's the only option
                let filteredDirections = availableDirections.filter(dir => 
                    dir !== this.getOppositeDirection(this.direction)
                );
                
                if (filteredDirections.length === 0) {
                    filteredDirections = availableDirections;
                }
                
                this.nextDirection = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
            }
        }
    }
    
    getAvailableDirections(maze) {
        if (!this.gridMovement) return [];
        return this.gridMovement.getAvailableDirections();
    }
    
    getOppositeDirection(direction) {
        switch(direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return null;
        }
    }
    
    getMovementSpeed() {
        // Children move at variable speeds based on energy level - pixel-based speed for GridMovement
        const baseSpeed = this.state === 'frightened' ? 1.0 : 2.0;
        return baseSpeed * (0.8 + this.energyLevel * 0.4); // 80-120% of base speed
    }
    
    setState(newState, duration = 0) {
        super.setState(newState, duration);
        
        // Children react more dramatically to state changes
        switch(newState) {
            case 'frightened':
                // Children get very scared and move erratically
                this.curiosityTimer = 0; // Stop being curious when frightened
                this.energyLevel = Math.min(1.0, this.energyLevel + 0.3); // Burst of energy from fear
                this.clearTarget(); // Forget about hat when scared
                break;
            case 'excited':
                // Children get very excited about hats
                this.energyLevel = 1.0; // Maximum energy
                this.curiosityTimer = 0; // No pausing when excited
                this.sprite.setTint(0xffff99); // Slight yellow tint for excitement
                break;
            case 'normal':
                // Gradually calm down
                this.energyLevel = Math.max(0.3, this.energyLevel - 0.1);
                this.sprite.clearTint(); // Remove tint
                break;
        }
    }
    
    // Override update to handle energy decay
    update(deltaTime, player, maze) {
        super.update(deltaTime, player, maze);
        
        // Energy slowly decays over time
        if (Math.random() < 0.001) { // Very occasional energy change
            this.energyLevel = Math.max(0.2, Math.min(1.0, this.energyLevel + (Math.random() - 0.5) * 0.1));
        }
    }
}