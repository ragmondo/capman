import { GameConfig } from '../config/GameConfig.js';
import { Maze } from '../objects/Maze.js';
import { Player } from '../objects/Player.js';
import { UIManager } from '../managers/UIManager.js';
import { InputController } from '../managers/InputController.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.maze = null;
        this.player = null;
        this.uiManager = null;
        this.inputController = null;
        this.gameState = 'playing';
        this.isPaused = false;
    }

    create() {
        this.setupGame();
        this.setupEventListeners();
        this.startGame();
    }

    setupGame() {
        this.uiManager = new UIManager(this).create();
        
        this.maze = new Maze(this).create(GameConfig.UI.SCORE_BAR_HEIGHT);
        
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this, startPos.x, startPos.y).create();
        
        this.inputController = new InputController(this).create();
        
        this.setupWorldBounds();
    }

    getPlayerStartPosition() {
        const gridX = 14;
        const gridY = 23;
        const worldPos = this.maze.gridToWorld(gridX, gridY);
        return worldPos;
    }

    setupWorldBounds() {
        this.physics.world.setBounds(
            0, 
            GameConfig.UI.SCORE_BAR_HEIGHT, 
            GameConfig.MAZE_WIDTH * GameConfig.TILE_SIZE,
            GameConfig.MAZE_HEIGHT * GameConfig.TILE_SIZE
        );
    }

    setupEventListeners() {
        this.events.on('dotEaten', (points) => {
            this.handleDotEaten(points);
        });
        
        this.events.on('powerPelletEaten', (points) => {
            this.handlePowerPelletEaten(points);
        });
        
        this.events.on('playerDied', () => {
            this.handlePlayerDeath();
        });
        
        this.input.keyboard.on('keydown-P', () => {
            this.togglePause();
        });
        
        this.input.keyboard.on('keydown-R', () => {
            if (this.gameState === 'gameOver') {
                this.restartGame();
            }
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.togglePause();
        });
    }

    handleDotEaten(points) {
        this.uiManager.updateScore(points);
        this.checkLevelComplete();
    }

    handlePowerPelletEaten(points) {
        this.uiManager.updateScore(points);
        this.checkLevelComplete();
    }

    checkLevelComplete() {
        if (this.maze.getRemainingDots() === 0) {
            this.levelComplete();
        }
    }

    levelComplete() {
        this.gameState = 'levelComplete';
        this.inputController.disable();
        this.player.stop();
        
        this.uiManager.showMessage('LEVEL COMPLETE!', 2000);
        
        this.time.delayedCall(2500, () => {
            this.nextLevel();
        });
    }

    nextLevel() {
        const nextLevel = this.uiManager.getLevel() + 1;
        this.uiManager.updateLevel(nextLevel);
        
        this.maze.dots.forEach(dot => dot.destroy());
        this.maze.powerPellets.forEach(pellet => pellet.destroy());
        this.maze.walls.forEach(wall => wall.destroy());
        
        this.maze = new Maze(this).create(GameConfig.UI.SCORE_BAR_HEIGHT);
        
        this.player.reset();
        this.inputController.reset();
        
        this.gameState = 'playing';
        this.startGame();
    }

    handlePlayerDeath() {
        const lives = this.uiManager.getLives() - 1;
        this.uiManager.updateLives(lives);
        
        if (lives > 0) {
            this.uiManager.showMessage('TRY AGAIN!', 1500);
            this.time.delayedCall(2000, () => {
                this.resetRound();
            });
        } else {
            this.gameOver();
        }
    }

    resetRound() {
        this.player.reset();
        this.inputController.reset();
        this.gameState = 'playing';
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.inputController.disable();
        
        const finalScore = this.uiManager.getScore();
        this.uiManager.showMessage(`GAME OVER\nSCORE: ${finalScore}\nPress R to restart`, 5000);
    }

    restartGame() {
        this.maze.dots.forEach(dot => dot.destroy());
        this.maze.powerPellets.forEach(pellet => pellet.destroy());
        this.maze.walls.forEach(wall => wall.destroy());
        
        this.uiManager.reset();
        this.setupGame();
        this.startGame();
    }

    startGame() {
        this.gameState = 'playing';
        this.isPaused = false;
        this.inputController.enable();
        
        this.uiManager.showMessage('READY!', 1500);
        
        this.time.delayedCall(1600, () => {
            if (this.gameState === 'playing') {
                this.inputController.enable();
            }
        });
    }

    togglePause() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.physics.pause();
            this.inputController.disable();
            this.uiManager.showMessage('PAUSED', 999999);
        } else {
            this.physics.resume();
            this.inputController.enable();
            this.uiManager.showMessage('', 0);
        }
    }

    update() {
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        this.inputController.update();
        this.player.update(this.inputController, this.maze);
    }
}