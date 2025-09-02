import { GameConfig } from '../config/GameConfig.js';
import { NPC } from './NPC.js';

export class GoogleReviewsDownvoteNPC extends NPC {
    constructor(scene, x, y, config = {}) {
        // Set default Google Reviews downvote configuration
        const googleConfig = {
            name: 'google_downvote',
            color: 0xff5722, // Google-ish red-orange for danger
            size: GameConfig.TILE_SIZE * 1.3, // Slightly smaller than player but menacing
            speed: 10, // Even slower - 2x slower than before
            behavior: 'methodical_hunt', // Custom behavior - more calculated
            decisionInterval: 1000, // Even slower decision making - methodical
            viewDistance: 25, // Can see even farther than Yelp
            ...config
        };
        
        super(scene, x, y, googleConfig);
        
        // Google Reviews downvote specific properties
        this.isDeadly = true;
        this.calculationLevel = 0; // Increases over time for strategic behavior
        this.targetPrediction = null; // Predicts where player will be
        this.huntingMode = true; // Always hunting
        this.patience = 100; // Very patient hunter
    }
    
    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Create Google Reviews downvote sprite - orange/red star with thumbs down
        // Background circle
        graphics.fillStyle(this.color, 1);
        graphics.fillCircle(centerX, centerY, 14);
        
        // White down arrow shape (much more obvious) with Google styling
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
        
        // Add Google "G" in small text above arrow
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 3, centerY - 10, 6, 1); // Top of G
        graphics.fillRect(centerX - 3, centerY - 10, 1, 3); // Left side of G
        graphics.fillRect(centerX - 3, centerY - 8, 4, 1);  // Middle of G
        graphics.fillRect(centerX + 1, centerY - 7, 1, 2);  // Right side of G
        
        // Add calculated/cold eyes
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 6, centerY - 6, 1, 1); // Left cold eye
        graphics.fillRect(centerX + 5, centerY - 6, 1, 1); // Right cold eye
        
        // Add strategic glow effect
        graphics.lineStyle(2, 0xffc107, 0.5);
        graphics.strokeCircle(centerX, centerY, 16);
        
        graphics.generateTexture(`${this.name}_sprite`, size, size);
        graphics.destroy();
    }
    
    makeDecision(player, maze) {
        if (this.behavior === 'methodical_hunt') {
            this.methodicalHunt(player, maze);
        } else {
            super.makeDecision(player, maze);
        }
    }
    
    methodicalHunt(player, maze) {
        if (!player || !player.sprite) return;
        
        // Occasionally choose random direction to prevent clustering (15% chance - less than Yelp)
        if (Math.random() < 0.15) {
            this.chooseRandomDirection(maze);
            return;
        }
        
        const playerPos = player.getPosition();
        const myPos = this.getPosition();
        const gridPos = this.getGridPosition(maze);
        const playerGrid = maze.worldToGrid(playerPos.x, playerPos.y);
        
        // Predict where player will be based on their movement
        let targetGrid = playerGrid;
        if (player.direction && player.isMoving) {
            // Predict 2-3 steps ahead based on current direction
            const steps = 2 + Math.floor(this.calculationLevel / 50);
            targetGrid = { ...playerGrid };
            
            for (let i = 0; i < steps; i++) {
                switch(player.direction) {
                    case 'up': targetGrid.y -= 1; break;
                    case 'down': targetGrid.y += 1; break;
                    case 'left': targetGrid.x -= 1; break;
                    case 'right': targetGrid.x += 1; break;
                }
                
                // Stop prediction if would hit wall
                if (!maze.isValidMove(targetGrid.x, targetGrid.y)) {
                    break;
                }
            }
        }
        
        // Methodical pathfinding towards predicted position
        const dx = targetGrid.x - gridPos.x;
        const dy = targetGrid.y - gridPos.y;
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        // Sort by priority - more methodical, less randomization
        directions.sort((a, b) => b.priority - a.priority);
        
        // Try directions in strict order of priority
        for (const {dir} of directions) {
            if (this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
        
        // If can't reach predicted position, go for current position
        const currentDx = playerGrid.x - gridPos.x;
        const currentDy = playerGrid.y - gridPos.y;
        
        const currentDirections = [];
        if (currentDx > 0) currentDirections.push({ dir: 'right', priority: Math.abs(currentDx) });
        if (currentDx < 0) currentDirections.push({ dir: 'left', priority: Math.abs(currentDx) });
        if (currentDy > 0) currentDirections.push({ dir: 'down', priority: Math.abs(currentDy) });
        if (currentDy < 0) currentDirections.push({ dir: 'up', priority: Math.abs(currentDy) });
        
        currentDirections.sort((a, b) => b.priority - a.priority);
        
        for (const {dir} of currentDirections) {
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
        
        // Increase calculation level over time (becomes smarter)
        this.calculationLevel = Math.min(100, this.calculationLevel + 0.15);
        
        // Update visual calculation effect (more orange/yellow as it gets smarter)
        const intensity = Math.floor(this.calculationLevel + 155);
        const redIntensity = Math.min(255, intensity);
        const greenIntensity = Math.floor(this.calculationLevel * 1.5); // Yellow component
        const tint = (redIntensity << 16) | (greenIntensity << 8) | 50;
        this.sprite.setTint(tint);
        
        // Add slower, more methodical pulsing effect
        if (Math.floor(Date.now() / 800) % 2 === 0) {
            this.sprite.setScale(1.05);
        } else {
            this.sprite.setScale(1.0);
        }
    }
    
    getMovementSpeed() {
        // Google Reviews downvote moves even slower but is more strategic
        return 0.6; // Slower than Yelp but more calculated
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
        // Google Reviews downvote NPCs are immune to frightened state - they're always methodical
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
        this.calculationLevel = 0;
        this.targetPrediction = null;
        this.sprite.setScale(1.0);
        this.sprite.clearTint();
    }
}