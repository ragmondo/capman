import { GameConfig } from '../config/GameConfig.js';

/**
 * Manages grid-based movement with smooth pixel interpolation
 * Sprites move between grid cells while staying on center rails
 */
export class GridMovement {
    constructor(sprite, maze) {
        this.sprite = sprite;
        this.maze = maze;
        
        // Grid position (which tile we're on)
        this.gridX = 0;
        this.gridY = 0;
        
        // Target grid position (where we're moving to)
        this.targetGridX = 0;
        this.targetGridY = 0;
        
        // Pixel position (for smooth animation)
        this.pixelX = 0;
        this.pixelY = 0;
        
        // Movement
        this.direction = null;
        this.nextDirection = null;
        this.speed = 2; // pixels per frame
        this.isMoving = false;
        this.isFrozen = false; // For death sequences
        
        // Initialize position from sprite
        this.initializePosition();
    }
    
    initializePosition() {
        // Get current grid position from sprite's pixel position
        const gridPos = this.maze.worldToGrid(this.sprite.x, this.sprite.y);
        this.gridX = gridPos.x;
        this.gridY = gridPos.y;
        this.targetGridX = this.gridX;
        this.targetGridY = this.gridY;
        
        // Snap sprite to grid center
        const worldPos = this.maze.gridToWorld(this.gridX, this.gridY);
        this.pixelX = worldPos.x;
        this.pixelY = worldPos.y;
        this.sprite.x = this.pixelX;
        this.sprite.y = this.pixelY;
    }
    
    /**
     * Request a direction change - will be applied when possible
     */
    requestDirection(newDirection) {
        // Can always reverse direction immediately
        if (this.isOppositeDirection(newDirection, this.direction)) {
            this.reverseDirection();
            return true;
        }
        
        // Queue the direction for next intersection
        this.nextDirection = newDirection;
        
        // Try to apply it immediately if we're at grid center
        if (this.isAtGridCenter()) {
            return this.tryChangeDirection();
        }
        
        return false;
    }
    
    /**
     * Update movement each frame
     */
    update() {
        // Don't update movement if frozen (during death sequences)
        if (this.isFrozen) {
            return;
        }
        
        // Try to apply queued direction if at grid center
        if (this.nextDirection && this.isAtGridCenter()) {
            this.tryChangeDirection();
        }
        
        // Move towards target position
        if (this.isMoving) {
            this.moveTowardsTarget();
            
            // Check if we've reached target grid cell
            if (this.hasReachedTarget()) {
                this.onReachTarget();
            }
        }
        
        // Update sprite position
        this.sprite.x = this.pixelX;
        this.sprite.y = this.pixelY;
    }
    
    /**
     * Move sprite towards target position
     */
    moveTowardsTarget() {
        const targetPixelX = this.targetGridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        const targetPixelY = this.targetGridY * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2 + this.maze.offsetY;
        
        // Move horizontally
        if (this.direction === 'left' || this.direction === 'right') {
            const dx = targetPixelX - this.pixelX;
            if (Math.abs(dx) > this.speed) {
                this.pixelX += Math.sign(dx) * this.speed;
            } else {
                this.pixelX = targetPixelX;
            }
            // Keep Y centered on rail
            this.pixelY = targetPixelY;
        }
        // Move vertically
        else if (this.direction === 'up' || this.direction === 'down') {
            const dy = targetPixelY - this.pixelY;
            if (Math.abs(dy) > this.speed) {
                this.pixelY += Math.sign(dy) * this.speed;
            } else {
                this.pixelY = targetPixelY;
            }
            // Keep X centered on rail
            this.pixelX = targetPixelX;
        }
    }
    
    /**
     * Check if we've reached the target grid cell
     */
    hasReachedTarget() {
        const targetPixelX = this.targetGridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        const targetPixelY = this.targetGridY * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2 + this.maze.offsetY;
        
        return Math.abs(this.pixelX - targetPixelX) < 1 && 
               Math.abs(this.pixelY - targetPixelY) < 1;
    }
    
    /**
     * Called when we reach the target grid cell
     */
    onReachTarget() {
        // Update current grid position
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        
        // Try to continue in current direction
        if (this.direction) {
            const nextGrid = this.getNextGrid(this.direction);
            if (this.canMoveTo(nextGrid.x, nextGrid.y)) {
                // Continue moving
                this.targetGridX = nextGrid.x;
                this.targetGridY = nextGrid.y;
            } else {
                // Hit a wall - stop
                this.stop();
            }
        }
    }
    
    /**
     * Try to change to the queued direction
     */
    tryChangeDirection() {
        if (!this.nextDirection) return false;
        
        const nextGrid = this.getNextGrid(this.nextDirection);
        if (this.canMoveTo(nextGrid.x, nextGrid.y)) {
            // Change direction
            this.direction = this.nextDirection;
            this.nextDirection = null;
            this.targetGridX = nextGrid.x;
            this.targetGridY = nextGrid.y;
            this.isMoving = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Reverse direction immediately
     */
    reverseDirection() {
        // Swap current and target positions
        const temp = this.gridX;
        this.gridX = this.targetGridX;
        this.targetGridX = temp;
        
        const tempY = this.gridY;
        this.gridY = this.targetGridY;
        this.targetGridY = tempY;
        
        // Reverse direction
        this.direction = this.getOppositeDirection(this.direction);
        this.nextDirection = null;
        this.isMoving = true;
    }
    
    /**
     * Stop movement
     */
    stop() {
        this.isMoving = false;
        this.targetGridX = this.gridX;
        this.targetGridY = this.gridY;
    }
    
    /**
     * Start moving in a direction (for NPCs)
     */
    startMoving(direction) {
        if (!direction) return false;
        
        const nextGrid = this.getNextGrid(direction);
        if (this.canMoveTo(nextGrid.x, nextGrid.y)) {
            this.direction = direction;
            this.targetGridX = nextGrid.x;
            this.targetGridY = nextGrid.y;
            this.isMoving = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if sprite is at grid center (can change direction)
     */
    isAtGridCenter() {
        const centerX = this.gridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        const centerY = this.gridY * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2 + this.maze.offsetY;
        
        return Math.abs(this.pixelX - centerX) < 2 && 
               Math.abs(this.pixelY - centerY) < 2;
    }
    
    /**
     * Check if at an intersection (3+ directions available)
     */
    isAtIntersection() {
        if (!this.isAtGridCenter()) return false;
        
        let availableDirections = 0;
        const directions = ['up', 'down', 'left', 'right'];
        
        for (const dir of directions) {
            const nextGrid = this.getNextGrid(dir);
            if (this.canMoveTo(nextGrid.x, nextGrid.y)) {
                availableDirections++;
            }
        }
        
        return availableDirections > 2;
    }
    
    /**
     * Get available directions from current position
     */
    getAvailableDirections() {
        const available = [];
        const directions = ['up', 'down', 'left', 'right'];
        
        for (const dir of directions) {
            const nextGrid = this.getNextGrid(dir);
            if (this.canMoveTo(nextGrid.x, nextGrid.y)) {
                available.push(dir);
            }
        }
        
        return available;
    }
    
    /**
     * Get next grid position for a direction
     */
    getNextGrid(direction) {
        let x = this.gridX;
        let y = this.gridY;
        
        switch(direction) {
            case 'up': y -= 1; break;
            case 'down': y += 1; break;
            case 'left': x -= 1; break;
            case 'right': x += 1; break;
        }
        
        return { x, y };
    }
    
    /**
     * Check if can move to a grid position
     */
    canMoveTo(gridX, gridY) {
        return this.maze.isValidMove(gridX, gridY);
    }
    
    /**
     * Check if two directions are opposite
     */
    isOppositeDirection(dir1, dir2) {
        return (dir1 === 'up' && dir2 === 'down') ||
               (dir1 === 'down' && dir2 === 'up') ||
               (dir1 === 'left' && dir2 === 'right') ||
               (dir1 === 'right' && dir2 === 'left');
    }
    
    /**
     * Get opposite direction
     */
    getOppositeDirection(direction) {
        switch(direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return null;
        }
    }
    
    /**
     * Handle tunnel wrapping
     */
    handleTunnels() {
        const width = this.maze.width;
        
        // Check for horizontal tunnel
        if (this.gridX < 0) {
            this.gridX = width - 1;
            this.targetGridX = width - 2;
            this.pixelX = this.gridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        } else if (this.gridX >= width) {
            this.gridX = 0;
            this.targetGridX = 1;
            this.pixelX = this.gridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        }
    }
    
    /**
     * Freeze movement for death sequences
     */
    freeze() {
        this.isFrozen = true;
    }
    
    /**
     * Unfreeze movement after death sequences
     */
    unfreeze() {
        this.isFrozen = false;
    }
    
    // Getters for external use
    getDirection() { return this.direction; }
    getGridPosition() { return { x: this.gridX, y: this.gridY }; }
    getPixelPosition() { return { x: this.pixelX, y: this.pixelY }; }
    isCurrentlyMoving() { return this.isMoving; }
}