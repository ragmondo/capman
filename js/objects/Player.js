import { GameConfig } from '../config/GameConfig.js';
import { GridMovement } from '../managers/GridMovement.js';

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
        this.size = GameConfig.TILE_SIZE * 1.4;
        this.gridMovement = null; // Will be initialized after sprite is created
        this.canCollectHats = true; // Player can collect hats
    }

    create() {
        // Create Cap Man sprite dynamically
        this.createCapManSprite();
        
        this.sprite = this.scene.physics.add.sprite(this.startX, this.startY, 'capman_closed');
        this.sprite.setDisplaySize(this.size, this.size);
        this.sprite.setCollideWorldBounds(false);
        this.sprite.body.setSize(this.size * 0.8, this.size * 0.8);
        this.sprite.body.setOffset(this.size * 0.1, this.size * 0.1);
        
        this.createAnimations();
        this.sprite.play('capman_walk');
        
        // Initialize grid movement after sprite is created
        // Note: maze needs to be passed in update, so we'll initialize there
        
        return this;
    }

    createCapManSprite() {
        const graphics = this.scene.add.graphics();
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Navy blue for shirt (0x1e3a8a - dark navy)
        const navyBlue = 0x1e3a8a;
        // Khaki for shorts (0xf0e68c - khaki color)
        const khaki = 0xf0e68c;
        // Skin tone (0xfdbcb4 - light peach)
        const skinTone = 0xfdbcb4;
        
        // Closed pose (standing straight)
        this.createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, 'closed');
        graphics.generateTexture('capman_closed', size, size);
        
        // Half open pose (slight lean forward)
        graphics.clear();
        this.createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, 'half');
        graphics.generateTexture('capman_half', size, size);
        
        // Open pose (more forward lean)
        graphics.clear();
        this.createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, 'open');
        graphics.generateTexture('capman_open', size, size);
        
        graphics.destroy();
    }
    
    createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, pose) {
        // Determine lean based on pose
        let leanOffset = 0;
        if (pose === 'half') leanOffset = 1;
        if (pose === 'open') leanOffset = 2;
        
        // Head (circle - skin tone)
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(centerX + leanOffset, centerY - 6, 8);
        
        // Navy blue shirt (upper body rectangle)
        graphics.fillStyle(navyBlue, 1);
        graphics.fillRect(centerX - 6 + leanOffset, centerY - 2, 12, 8);
        
        // Khaki shorts (lower body rectangle)
        graphics.fillStyle(khaki, 1);
        graphics.fillRect(centerX - 5 + leanOffset, centerY + 6, 10, 6);
        
        // Simple facial features
        graphics.fillStyle(0x000000, 1);
        // Eyes
        graphics.fillRect(centerX - 3 + leanOffset, centerY - 8, 1, 1);
        graphics.fillRect(centerX + 2 + leanOffset, centerY - 8, 1, 1);
        
        // Mouth (varies by pose)
        if (pose === 'closed') {
            graphics.fillRect(centerX - 1 + leanOffset, centerY - 5, 2, 1);
        } else {
            // Open mouth for movement poses
            graphics.fillCircle(centerX + leanOffset, centerY - 4, 1);
        }
        
        // Simple legs (extending from shorts)
        graphics.fillStyle(skinTone, 1);
        graphics.fillRect(centerX - 3 + leanOffset, centerY + 12, 2, 4);
        graphics.fillRect(centerX + 1 + leanOffset, centerY + 12, 2, 4);
        
        // Simple arms (extending from shirt)
        graphics.fillRect(centerX - 8 + leanOffset, centerY, 2, 6);
        graphics.fillRect(centerX + 6 + leanOffset, centerY, 2, 6);
    }

    createAnimations() {
        this.scene.anims.create({
            key: 'capman_walk',
            frames: [
                { key: 'capman_closed' },
                { key: 'capman_half' },
                { key: 'capman_open' },
                { key: 'capman_half' }
            ],
            frameRate: 10,
            repeat: -1
        });
        
        this.scene.anims.create({
            key: 'capman_death',
            frames: [
                { key: 'capman_open' },
                { key: 'capman_half' },
                { key: 'capman_closed' }
            ],
            frameRate: 3,
            repeat: 0
        });
    }

    update(inputController, maze) {
        if (this.isDead) return;
        
        // Initialize grid movement on first update
        if (!this.gridMovement) {
            this.gridMovement = new GridMovement(this.sprite, maze);
            this.gridMovement.speed = 2.5; // Slightly faster for player
        }
        
        // Get desired direction from input
        const desiredDirection = inputController.getNextDirection();
        
        // Request direction change
        if (desiredDirection) {
            const changed = this.gridMovement.requestDirection(desiredDirection);
            if (changed) {
                inputController.confirmDirection();
            }
        }
        
        // Update grid movement
        this.gridMovement.update();
        
        // Update animation and rotation based on movement
        const currentDirection = this.gridMovement.getDirection();
        if (currentDirection) {
            // Audio hook for player movement (only play occasionally to avoid spam)
            if (this.scene.audioManager && Math.random() < 0.1) {
                this.scene.audioManager.playPlayerMove();
            }
            
            this.direction = currentDirection;
            // Keep Cap Man upright - no rotation needed
            if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'capman_walk') {
                this.sprite.play('capman_walk');
            }
        } else {
            this.stop();
        }
        
        // Handle tunnels
        this.gridMovement.handleTunnels();
        
        // Check collisions at current grid position
        this.checkCollisions(maze);
    }

    alignToGrid(maze) {
        // Smooth grid alignment for better collision detection and direction changes
        const gridPos = this.getGridPosition(maze);
        const targetPos = maze.gridToWorld(gridPos.x, gridPos.y);
        const threshold = 6;
        
        // Always try to align to the grid center when close enough
        if (Math.abs(this.sprite.x - targetPos.x) < threshold) {
            this.sprite.x = targetPos.x;
        }
        if (Math.abs(this.sprite.y - targetPos.y) < threshold) {
            this.sprite.y = targetPos.y;
        }
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

    // Move method removed - now using MovementManager.moveOnRails()

    stop() {
        this.sprite.body.setVelocity(0, 0);
        if (this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'capman_walk') {
            this.sprite.anims.pause();
        }
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
        // Cap Man stays upright - no rotation needed
        // Keep sprite at 0 rotation and no flipping
        this.sprite.setRotation(0);
        this.sprite.setFlipY(false);
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
        if (!this.gridMovement) return;
        
        const gridPos = this.gridMovement.getGridPosition();
        
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
        this.sprite.play('capman_walk');
        
        // Reinitialize GridMovement to match new position
        if (this.gridMovement) {
            this.gridMovement.initializePosition();
        }
    }

    die() {
        this.isDead = true;
        this.stop();
        
        this.sprite.play('capman_death');
        
        this.scene.tweens.add({
            targets: this.sprite,
            rotation: Math.PI * 2,
            alpha: 0,
            duration: 1000,
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