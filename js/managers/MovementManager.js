import { GameConfig } from '../config/GameConfig.js';

export class MovementManager {
    constructor() {
        this.moveSpeed = 2; // Pixels per frame
    }

    /**
     * Move a sprite along rails (grid-centered movement)
     * Returns true if movement occurred, false if blocked
     */
    moveOnRails(sprite, direction, maze) {
        const currentGrid = this.getGridPosition(sprite, maze);
        const currentCenter = maze.gridToWorld(currentGrid.x, currentGrid.y);
        
        // Calculate target grid position based on direction
        let targetGrid = { ...currentGrid };
        switch(direction) {
            case 'up':
                targetGrid.y -= 1;
                break;
            case 'down':
                targetGrid.y += 1;
                break;
            case 'left':
                targetGrid.x -= 1;
                break;
            case 'right':
                targetGrid.x += 1;
                break;
        }
        
        // Check if target position is valid
        if (!maze.isValidMove(targetGrid.x, targetGrid.y)) {
            return false;
        }
        
        const targetCenter = maze.gridToWorld(targetGrid.x, targetGrid.y);
        
        // Move sprite towards target center
        if (direction === 'left' || direction === 'right') {
            // Horizontal movement - keep Y centered
            sprite.y = currentCenter.y; // Stay on horizontal rail
            
            if (direction === 'left') {
                sprite.x = Math.max(sprite.x - this.moveSpeed, targetCenter.x);
            } else {
                sprite.x = Math.min(sprite.x + this.moveSpeed, targetCenter.x);
            }
        } else {
            // Vertical movement - keep X centered
            sprite.x = currentCenter.x; // Stay on vertical rail
            
            if (direction === 'up') {
                sprite.y = Math.max(sprite.y - this.moveSpeed, targetCenter.y);
            } else {
                sprite.y = Math.min(sprite.y + this.moveSpeed, targetCenter.y);
            }
        }
        
        return true;
    }

    /**
     * Check if sprite is at an intersection (can change direction)
     */
    isAtIntersection(sprite, maze) {
        const gridPos = this.getGridPosition(sprite, maze);
        const worldPos = maze.gridToWorld(gridPos.x, gridPos.y);
        
        // Check if sprite is centered on grid point (within threshold)
        const threshold = 2;
        const centered = Math.abs(sprite.x - worldPos.x) < threshold && 
                        Math.abs(sprite.y - worldPos.y) < threshold;
        
        if (!centered) return false;
        
        // Count available directions from this position
        let availableDirections = 0;
        const directions = ['up', 'down', 'left', 'right'];
        
        for (const dir of directions) {
            let checkGrid = { ...gridPos };
            switch(dir) {
                case 'up': checkGrid.y -= 1; break;
                case 'down': checkGrid.y += 1; break;
                case 'left': checkGrid.x -= 1; break;
                case 'right': checkGrid.x += 1; break;
            }
            
            if (maze.isValidMove(checkGrid.x, checkGrid.y)) {
                availableDirections++;
            }
        }
        
        // It's an intersection if there are more than 2 directions available
        // (more than just forward/backward)
        return availableDirections > 2;
    }

    /**
     * Snap sprite to nearest grid center (for initial positioning or corrections)
     */
    snapToGrid(sprite, maze) {
        const gridPos = this.getGridPosition(sprite, maze);
        const worldPos = maze.gridToWorld(gridPos.x, gridPos.y);
        sprite.x = worldPos.x;
        sprite.y = worldPos.y;
    }

    /**
     * Get current grid position of sprite
     */
    getGridPosition(sprite, maze) {
        return maze.worldToGrid(sprite.x, sprite.y);
    }

    /**
     * Check if sprite can change to a new direction at current position
     */
    canChangeDirection(sprite, newDirection, currentDirection, maze) {
        // Can always reverse direction
        if (this.isOppositeDirection(newDirection, currentDirection)) {
            return true;
        }
        
        // Otherwise, must be at intersection or grid center
        const gridPos = this.getGridPosition(sprite, maze);
        const worldPos = maze.gridToWorld(gridPos.x, gridPos.y);
        const threshold = 4;
        
        const centered = Math.abs(sprite.x - worldPos.x) < threshold && 
                        Math.abs(sprite.y - worldPos.y) < threshold;
        
        if (!centered) return false;
        
        // Check if new direction is valid from this position
        let targetGrid = { ...gridPos };
        switch(newDirection) {
            case 'up': targetGrid.y -= 1; break;
            case 'down': targetGrid.y += 1; break;
            case 'left': targetGrid.x -= 1; break;
            case 'right': targetGrid.x += 1; break;
        }
        
        return maze.isValidMove(targetGrid.x, targetGrid.y);
    }

    isOppositeDirection(dir1, dir2) {
        return (dir1 === 'up' && dir2 === 'down') ||
               (dir1 === 'down' && dir2 === 'up') ||
               (dir1 === 'left' && dir2 === 'right') ||
               (dir1 === 'right' && dir2 === 'left');
    }
}