import { GameConfig } from '../config/GameConfig.js';

export class WallRenderer {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.wallThickness = GameConfig.WALL_THICKNESS;
    }

    renderWalls(mazeData, offsetY = 0) {
        this.graphics.clear();
        const tileSize = GameConfig.TILE_SIZE;
        const tiles = mazeData.tiles;
        
        // Set wall style
        this.graphics.lineStyle(this.wallThickness, GameConfig.COLORS.WALL, 1);
        this.graphics.fillStyle(GameConfig.COLORS.WALL, 0.1);
        
        // Process each tile to determine wall connections
        for (let row = 0; row < tiles.length; row++) {
            for (let col = 0; col < tiles[row].length; col++) {
                if (tiles[row][col] === 1) {
                    this.drawWallSegment(tiles, row, col, tileSize, offsetY);
                }
            }
        }
        
        // Draw the outer boundary with rounded corners
        this.drawOuterBoundary(mazeData, offsetY);
    }

    drawWallSegment(tiles, row, col, tileSize, offsetY) {
        const x = col * tileSize;
        const y = row * tileSize + offsetY;
        const halfSize = tileSize / 2;
        
        // Check adjacent tiles
        const connections = {
            top: this.isWall(tiles, row - 1, col),
            right: this.isWall(tiles, row, col + 1),
            bottom: this.isWall(tiles, row + 1, col),
            left: this.isWall(tiles, row, col - 1)
        };
        
        // Draw lines from center to connected walls
        const centerX = x + halfSize;
        const centerY = y + halfSize;
        
        if (connections.top) {
            this.graphics.lineBetween(centerX, centerY, centerX, y);
        }
        if (connections.right) {
            this.graphics.lineBetween(centerX, centerY, x + tileSize, centerY);
        }
        if (connections.bottom) {
            this.graphics.lineBetween(centerX, centerY, centerX, y + tileSize);
        }
        if (connections.left) {
            this.graphics.lineBetween(centerX, centerY, x, centerY);
        }
        
        // Corner drawing removed - was causing unwanted circles
        // this.drawCorners(tiles, row, col, x, y, tileSize, connections);
    }

    drawCorners(tiles, row, col, x, y, tileSize, connections) {
        const cornerRadius = 6;
        const centerX = x + tileSize / 2;
        const centerY = y + tileSize / 2;
        
        // Check diagonal connections for corner smoothing
        if (connections.top && connections.right && !this.isWall(tiles, row - 1, col + 1)) {
            this.graphics.strokeCircle(x + tileSize, y, cornerRadius);
        }
        if (connections.right && connections.bottom && !this.isWall(tiles, row + 1, col + 1)) {
            this.graphics.strokeCircle(x + tileSize, y + tileSize, cornerRadius);
        }
        if (connections.bottom && connections.left && !this.isWall(tiles, row + 1, col - 1)) {
            this.graphics.strokeCircle(x, y + tileSize, cornerRadius);
        }
        if (connections.left && connections.top && !this.isWall(tiles, row - 1, col - 1)) {
            this.graphics.strokeCircle(x, y, cornerRadius);
        }
    }

    drawOuterBoundary(mazeData, offsetY) {
        const width = mazeData.cols * GameConfig.TILE_SIZE;
        const height = mazeData.rows * GameConfig.TILE_SIZE;
        const cornerRadius = 8;
        
        this.graphics.lineStyle(this.wallThickness + 1, GameConfig.COLORS.WALL_STROKE, 1);
        
        // Draw rounded rectangle for outer boundary
        this.graphics.strokeRoundedRect(
            this.wallThickness,
            offsetY + this.wallThickness,
            width - this.wallThickness * 2,
            height - this.wallThickness * 2,
            cornerRadius
        );
    }

    isWall(tiles, row, col) {
        if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) {
            return false;
        }
        return tiles[row][col] === 1;
    }

    destroy() {
        this.graphics.destroy();
    }
}