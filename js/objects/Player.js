import { GameConfig } from '../config/GameConfig.js';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.sprite = null;
        this.speed = GameConfig.SPEEDS.PACMAN;
        this.direction = null;
        this.nextDirection = null;
        this.isMoving = false;
        this.isDead = false;
    }

    create() {
        this.sprite = this.scene.physics.add.sprite(this.startX, this.startY, 'pacman');
        this.sprite.setDisplaySize(GameConfig.TILE_SIZE * 0.9, GameConfig.TILE_SIZE * 0.9);
        this.sprite.setCollideWorldBounds(false);
        this.sprite.body.setSize(12, 12);
        
        this.createAnimations();
        return this;
    }

    createAnimations() {
        this.scene.anims.create({
            key: 'pacman-move',
            frames: [
                { key: 'pacman' }
            ],
            frameRate: 10,
            repeat: -1
        });
        
        this.sprite.play('pacman-move');
    }

    update(inputController, maze) {
        if (this.isDead) return;
        
        const desiredDirection = inputController.getNextDirection();
        
        if (desiredDirection && this.canMove(desiredDirection, maze)) {
            this.direction = desiredDirection;
            inputController.confirmDirection();
        }
        
        if (this.direction && this.canMove(this.direction, maze)) {
            this.move(this.direction);
            this.isMoving = true;
        } else {
            this.stop();
            this.isMoving = false;
        }
        
        this.handleTunnels();
        this.checkCollisions(maze);
    }

    canMove(direction, maze) {
        const currentGrid = this.getGridPosition(maze);
        let nextGrid = { ...currentGrid };
        
        switch(direction) {
            case 'up':
                nextGrid.y -= 1;
                break;
            case 'down':
                nextGrid.y += 1;
                break;
            case 'left':
                nextGrid.x -= 1;
                break;
            case 'right':
                nextGrid.x += 1;
                break;
        }
        
        return maze.isValidMove(nextGrid.x, nextGrid.y);
    }

    move(direction) {
        const velocity = this.getVelocityFromDirection(direction);
        this.sprite.body.setVelocity(velocity.x, velocity.y);
        
        this.updateRotation(direction);
    }

    stop() {
        this.sprite.body.setVelocity(0, 0);
    }

    getVelocityFromDirection(direction) {
        const velocity = { x: 0, y: 0 };
        
        switch(direction) {
            case 'up':
                velocity.y = -this.speed;
                break;
            case 'down':
                velocity.y = this.speed;
                break;
            case 'left':
                velocity.x = -this.speed;
                break;
            case 'right':
                velocity.x = this.speed;
                break;
        }
        
        return velocity;
    }

    updateRotation(direction) {
        switch(direction) {
            case 'up':
                this.sprite.setRotation(-Math.PI / 2);
                break;
            case 'down':
                this.sprite.setRotation(Math.PI / 2);
                break;
            case 'left':
                this.sprite.setRotation(Math.PI);
                this.sprite.setFlipY(true);
                break;
            case 'right':
                this.sprite.setRotation(0);
                this.sprite.setFlipY(false);
                break;
        }
    }

    handleTunnels() {
        const width = this.scene.cameras.main.width;
        
        if (this.sprite.x < -GameConfig.TILE_SIZE) {
            this.sprite.x = width + GameConfig.TILE_SIZE;
        } else if (this.sprite.x > width + GameConfig.TILE_SIZE) {
            this.sprite.x = -GameConfig.TILE_SIZE;
        }
    }

    checkCollisions(maze) {
        const gridPos = this.getGridPosition(maze);
        
        if (maze.removeDot(gridPos.x, gridPos.y)) {
            this.scene.events.emit('dotEaten', GameConfig.SCORING.DOT);
        }
        
        if (maze.removePowerPellet(gridPos.x, gridPos.y)) {
            this.scene.events.emit('powerPelletEaten', GameConfig.SCORING.POWER_PELLET);
        }
    }

    getGridPosition(maze) {
        return maze.worldToGrid(this.sprite.x, this.sprite.y);
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    reset() {
        this.sprite.setPosition(this.startX, this.startY);
        this.sprite.body.setVelocity(0, 0);
        this.direction = null;
        this.nextDirection = null;
        this.isMoving = false;
        this.isDead = false;
        this.sprite.setAlpha(1);
        this.sprite.setRotation(0);
        this.sprite.setFlipY(false);
    }

    die() {
        this.isDead = true;
        this.stop();
        
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.events.emit('playerDied');
            }
        });
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    getSpeed() {
        return this.speed;
    }

    isAlive() {
        return !this.isDead;
    }
}