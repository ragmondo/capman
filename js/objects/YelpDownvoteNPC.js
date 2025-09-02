import { GameConfig } from '../config/GameConfig.js';
import { NPC } from './NPC.js';

export class YelpDownvoteNPC extends NPC {
    constructor(scene, x, y, config = {}) {
        // Set default Yelp downvote configuration
        const yelpConfig = {
            name: 'yelp_downvote',
            color: 0xff1744, // Bright red for danger
            size: GameConfig.TILE_SIZE * 1.3, // Slightly smaller than player but menacing
            speed: 12, // Even slower - 2x slower than before
            behavior: 'relentless_chase', // Custom behavior
            decisionInterval: 800, // Slower decision making for dramatic effect
            viewDistance: 20, // Can see very far
            ...config
        };
        
        super(scene, x, y, yelpConfig);
        
        // Yelp downvote specific properties
        this.isDeadly = true;
        this.menaceLevel = 0; // Increases over time for visual effect
        this.lastPlayerPosition = null;
        this.huntingMode = true; // Always hunting
    }
    
    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Create Yelp downvote sprite - red thumbs down
        // Background circle
        graphics.fillStyle(this.color, 1);
        graphics.fillCircle(centerX, centerY, 14);
        
        // White down arrow shape (much more obvious)
        graphics.fillStyle(0xffffff, 1);
        // Arrow shaft (vertical rectangle)
        graphics.fillRect(centerX - 2, centerY - 8, 4, 10);
        // Arrow head (triangle pointing down)
        graphics.beginPath();
        graphics.moveTo(centerX - 6, centerY + 2);  // Left point
        graphics.lineTo(centerX + 6, centerY + 2);  // Right point  
        graphics.lineTo(centerX, centerY + 8);      // Bottom point
        graphics.closePath();
        graphics.fillPath();
        
        // Add angry eyes
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 6, centerY - 8, 2, 1); // Left angry eye
        graphics.fillRect(centerX + 4, centerY - 8, 2, 1); // Right angry eye
        
        // Add menacing glow effect
        graphics.lineStyle(2, 0xff5722, 0.6);
        graphics.strokeCircle(centerX, centerY, 16);
        
        graphics.generateTexture(`${this.name}_sprite`, size, size);
        graphics.destroy();
    }
    
    makeDecision(player, maze) {
        if (this.behavior === 'relentless_chase') {
            this.relentlessChase(player, maze);
        } else {
            super.makeDecision(player, maze);
        }
    }
    
    relentlessChase(player, maze) {
        if (!player || !player.sprite) return;
        
        // Store last known player position
        this.lastPlayerPosition = {
            x: player.sprite.x,
            y: player.sprite.y
        };
        
        // Occasionally choose random direction to prevent clustering (20% chance)
        if (Math.random() < 0.2) {
            this.chooseRandomDirection(maze);
            return;
        }
        
        const playerPos = player.getPosition();
        const myPos = this.getPosition();
        const gridPos = this.getGridPosition(maze);
        const playerGrid = maze.worldToGrid(playerPos.x, playerPos.y);
        
        // Relentless pathfinding - always move towards player
        const dx = playerGrid.x - gridPos.x;
        const dy = playerGrid.y - gridPos.y;
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        // Sort by priority with slight randomization for unpredictability
        directions.sort((a, b) => {
            const priorityDiff = b.priority - a.priority;
            if (Math.abs(priorityDiff) < 0.1) {
                return Math.random() - 0.5; // Random when priorities are very close
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
        
        // If completely stuck, try any available direction
        this.chooseNewDirection(maze);
    }
    
    update(deltaTime, player, maze) {
        super.update(deltaTime, player, maze);
        
        // Increase menace level over time
        this.menaceLevel = Math.min(100, this.menaceLevel + 0.2);
        
        // Update visual menace effect
        const intensity = Math.floor(this.menaceLevel + 155);
        const redIntensity = Math.min(255, intensity);
        const tint = (redIntensity << 16) | (100 << 8) | 100; // Red gets more intense
        this.sprite.setTint(tint);
        
        // Add slight pulsing effect
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.sprite.setScale(1.1);
        } else {
            this.sprite.setScale(1.0);
        }
    }
    
    getMovementSpeed() {
        // Yelp downvote moves very slowly but unstoppably - 2x slower
        return 0.4; // Much much slower than other NPCs but consistent
    }
    
    canKillPlayer(player, maze) {
        if (!player || !player.sprite) return false;
        
        const myGrid = this.getGridPosition(maze);
        const playerGrid = maze.worldToGrid(player.sprite.x, player.sprite.y);
        
        // Kill if same position or adjacent
        const dx = Math.abs(myGrid.x - playerGrid.x);
        const dy = Math.abs(myGrid.y - playerGrid.y);
        const distance = Math.max(dx, dy);
        
        return distance <= 1;
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
    
    setState(newState, duration = 0) {
        // Yelp downvote NPCs are immune to frightened state - they're always menacing
        if (newState === 'frightened') {
            return; // Ignore frightened state
        }
        
        super.setState(newState, duration);
    }
    
    chooseRandomDirection(maze) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = directions.filter(dir => this.canMove(dir, maze));
        
        if (validDirections.length > 0) {
            const randomDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
            this.nextDirection = randomDirection;
        }
    }

    reset() {
        super.reset();
        this.menaceLevel = 0;
        this.lastPlayerPosition = null;
        this.sprite.setScale(1.0);
        this.sprite.clearTint();
    }
}