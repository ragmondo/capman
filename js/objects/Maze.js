import { GameConfig, MazeData } from '../config/GameConfig.js';
import { WallRenderer } from './WallRenderer.js';
import { PongGame } from './PongGame.js';

export class Maze {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = GameConfig.TILE_SIZE;
        this.mazeData = MazeData.SIMPLE;
        this.width = this.mazeData.cols;
        this.height = this.mazeData.rows;
        this.tiles = this.mazeData.tiles;
        this.dots = [];
        this.powerPellets = [];
        this.wallRenderer = new WallRenderer(scene);
        this.ghostHouse = null;
        this.totalDots = 0;
        this.pongGame = null;
    }

    create(offsetY = 0) {
        this.offsetY = offsetY;
        
        // Render tennis court first (behind everything)
        this.renderTennisCourt(offsetY);
        
        // Render walls using the new system
        this.wallRenderer.renderWalls(this.mazeData, offsetY);
        
        // Create dots and power pellets
        for (let row = 0; row < this.tiles.length; row++) {
            for (let col = 0; col < this.tiles[row].length; col++) {
                const tileType = this.tiles[row][col];
                const worldX = col * this.tileSize + this.tileSize / 2;
                const worldY = row * this.tileSize + this.tileSize / 2 + offsetY;
                
                switch(tileType) {
                    case 2: // Dot
                        this.createDot(worldX, worldY, col, row);
                        break;
                    case 3: // Power pellet
                        this.createPowerPellet(worldX, worldY, col, row);
                        break;
                    case 4: // Ghost house
                        this.markGhostHouse(col, row);
                        break;
                    case 5: // Tennis court - already rendered as background
                        break;
                }
            }
        }
        
        this.findGhostHouseCenter();
        return this;
    }

    createDot(x, y, gridX, gridY) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(GameConfig.COLORS.DOT, 1);
        graphics.fillCircle(0, 0, 2);
        graphics.generateTexture('dot_texture', 8, 8);
        graphics.destroy();
        
        const dot = this.scene.add.image(x, y, 'dot_texture');
        dot.gridX = gridX;
        dot.gridY = gridY;
        this.dots.push(dot);
        this.totalDots++;
    }

    createPowerPellet(x, y, gridX, gridY) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(GameConfig.COLORS.POWER_PELLET, 1);
        graphics.fillCircle(0, 0, 6);
        graphics.generateTexture('power_texture', 16, 16);
        graphics.destroy();
        
        const pellet = this.scene.add.image(x, y, 'power_texture');
        pellet.gridX = gridX;
        pellet.gridY = gridY;
        
        // Pulsing animation
        this.scene.tweens.add({
            targets: pellet,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.powerPellets.push(pellet);
        this.totalDots++;
    }

    markGhostHouse(col, row) {
        if (!this.ghostHouse) {
            this.ghostHouse = { 
                tiles: [],
                centerX: 0,
                centerY: 0
            };
        }
        this.ghostHouse.tiles.push({ col, row });
    }

    renderTennisCourt(offsetY) {
        // Find the tennis court bounds
        let minCol = 999, maxCol = -1;
        let minRow = 999, maxRow = -1;
        
        for (let row = 0; row < this.tiles.length; row++) {
            for (let col = 0; col < this.tiles[row].length; col++) {
                if (this.tiles[row][col] === 5) {
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                }
            }
        }
        
        if (minCol === 999) return; // No tennis court found
        
        // Draw the green court background
        const courtX = minCol * this.tileSize;
        const courtY = minRow * this.tileSize + offsetY;
        const courtWidth = (maxCol - minCol + 1) * this.tileSize;
        const courtHeight = (maxRow - minRow + 1) * this.tileSize;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(GameConfig.COLORS.TENNIS_COURT, 1);
        graphics.fillRect(courtX, courtY, courtWidth, courtHeight);
        
        // Draw tennis court lines
        graphics.lineStyle(2, GameConfig.COLORS.TENNIS_LINES, 1);
        
        // Outer boundary
        graphics.strokeRect(courtX + 4, courtY + 4, courtWidth - 8, courtHeight - 8);
        
        // Vertical center line
        const centerX = courtX + courtWidth / 2;
        graphics.lineBetween(centerX, courtY + 4, centerX, courtY + courtHeight - 4);
        
        graphics.setDepth(-1); // Behind everything else
        
        // Create and start the Pong game
        const courtBounds = {
            x: courtX,
            y: courtY,
            width: courtWidth,
            height: courtHeight
        };
        
        this.pongGame = new PongGame(this.scene, courtBounds).create();
    }

    findGhostHouseCenter() {
        if (this.ghostHouse && this.ghostHouse.tiles.length > 0) {
            let sumX = 0, sumY = 0;
            for (const tile of this.ghostHouse.tiles) {
                sumX += tile.col;
                sumY += tile.row;
            }
            const centerCol = sumX / this.ghostHouse.tiles.length;
            const centerRow = sumY / this.ghostHouse.tiles.length;
            
            this.ghostHouse.centerX = centerCol * this.tileSize + this.tileSize / 2;
            this.ghostHouse.centerY = centerRow * this.tileSize + this.tileSize / 2 + this.offsetY;
            
            // Draw ghost house door
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(2, 0xffffff, 0.5);
            graphics.lineBetween(
                (centerCol - 1) * this.tileSize,
                (centerRow - 1.5) * this.tileSize + this.offsetY,
                (centerCol + 1) * this.tileSize,
                (centerRow - 1.5) * this.tileSize + this.offsetY
            );
        }
    }

    isWall(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return true;
        }
        const tile = this.tiles[gridY][gridX];
        return tile === 1;
    }

    isValidMove(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width) {
            // Allow wrapping on horizontal edges
            return true;
        }
        if (gridY < 0 || gridY >= this.height) {
            return false;
        }
        const tile = this.tiles[gridY][gridX];
        // Can move through empty space, dots, power pellets, tennis court, but not walls
        return tile !== 1;
    }

    getTileAt(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return null;
        }
        return this.tiles[gridY][gridX];
    }

    worldToGrid(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor((worldY - this.offsetY) / this.tileSize)
        };
    }

    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2 + this.offsetY
        };
    }

    removeDot(gridX, gridY) {
        const dotIndex = this.dots.findIndex(dot => dot.gridX === gridX && dot.gridY === gridY);
        if (dotIndex !== -1) {
            this.dots[dotIndex].destroy();
            this.dots.splice(dotIndex, 1);
            // Clear the tile
            if (gridY >= 0 && gridY < this.tiles.length && 
                gridX >= 0 && gridX < this.tiles[gridY].length) {
                this.tiles[gridY][gridX] = 0;
            }
            return true;
        }
        return false;
    }

    removePowerPellet(gridX, gridY) {
        const pelletIndex = this.powerPellets.findIndex(p => p.gridX === gridX && p.gridY === gridY);
        if (pelletIndex !== -1) {
            this.powerPellets[pelletIndex].destroy();
            this.powerPellets.splice(pelletIndex, 1);
            // Clear the tile
            if (gridY >= 0 && gridY < this.tiles.length && 
                gridX >= 0 && gridX < this.tiles[gridY].length) {
                this.tiles[gridY][gridX] = 0;
            }
            return true;
        }
        return false;
    }

    getRemainingDots() {
        return this.dots.length + this.powerPellets.length;
    }

    update() {
        // Update the Pong game
        if (this.pongGame) {
            this.pongGame.update();
        }
    }

    destroy() {
        this.dots.forEach(dot => dot.destroy());
        this.powerPellets.forEach(pellet => pellet.destroy());
        this.wallRenderer.destroy();
        if (this.pongGame) {
            this.pongGame.destroy();
        }
    }
}