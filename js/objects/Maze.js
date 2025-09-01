import { GameConfig, MazeLayouts } from '../config/GameConfig.js';

export class Maze {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = GameConfig.TILE_SIZE;
        this.width = GameConfig.MAZE_WIDTH;
        this.height = GameConfig.MAZE_HEIGHT;
        this.tiles = [];
        this.dots = [];
        this.powerPellets = [];
        this.walls = [];
        this.ghostHouse = null;
        this.totalDots = 0;
    }

    create(offsetY = 0) {
        this.offsetY = offsetY;
        const layout = MazeLayouts.CLASSIC;
        
        for (let y = 0; y < layout.length; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < layout[y].length; x++) {
                const char = layout[y][x];
                const worldX = x * this.tileSize + this.tileSize / 2;
                const worldY = y * this.tileSize + this.tileSize / 2 + offsetY;
                
                this.tiles[y][x] = char;
                
                switch(char) {
                    case '#':
                        this.createWall(worldX, worldY);
                        break;
                    case '.':
                        this.createDot(worldX, worldY, x, y);
                        break;
                    case 'o':
                        this.createPowerPellet(worldX, worldY, x, y);
                        break;
                    case '-':
                        this.createGhostHouseDoor(worldX, worldY);
                        break;
                }
            }
        }
        
        this.findGhostHouse();
        return this;
    }

    createWall(x, y) {
        const wall = this.scene.add.image(x, y, 'wall');
        wall.setDisplaySize(this.tileSize, this.tileSize);
        this.walls.push(wall);
    }

    createDot(x, y, gridX, gridY) {
        const dot = this.scene.add.image(x, y, 'dot');
        dot.setDisplaySize(this.tileSize, this.tileSize);
        dot.gridX = gridX;
        dot.gridY = gridY;
        this.dots.push(dot);
        this.totalDots++;
    }

    createPowerPellet(x, y, gridX, gridY) {
        const pellet = this.scene.add.image(x, y, 'powerPellet');
        pellet.setDisplaySize(this.tileSize, this.tileSize);
        pellet.gridX = gridX;
        pellet.gridY = gridY;
        
        this.scene.tweens.add({
            targets: pellet,
            alpha: 0.5,
            duration: 400,
            yoyo: true,
            repeat: -1
        });
        
        this.powerPellets.push(pellet);
        this.totalDots++;
    }

    createGhostHouseDoor(x, y) {
        const door = this.scene.add.rectangle(x, y, this.tileSize, 2, 0xffffff);
        door.alpha = 0.5;
    }

    findGhostHouse() {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (this.tiles[y][x] === '-') {
                    this.ghostHouse = {
                        x: x * this.tileSize + this.tileSize / 2,
                        y: y * this.tileSize + this.tileSize / 2 + this.offsetY,
                        centerX: 14 * this.tileSize,
                        centerY: (y + 1) * this.tileSize + this.offsetY
                    };
                    return;
                }
            }
        }
    }

    isWall(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return true;
        }
        const tile = this.tiles[gridY][gridX];
        return tile === '#';
    }

    isValidMove(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }
        const tile = this.tiles[gridY][gridX];
        return tile !== '#';
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
            return true;
        }
        return false;
    }

    removePowerPellet(gridX, gridY) {
        const pelletIndex = this.powerPellets.findIndex(p => p.gridX === gridX && p.gridY === gridY);
        if (pelletIndex !== -1) {
            this.powerPellets[pelletIndex].destroy();
            this.powerPellets.splice(pelletIndex, 1);
            return true;
        }
        return false;
    }

    getRemainingDots() {
        return this.dots.length + this.powerPellets.length;
    }
}