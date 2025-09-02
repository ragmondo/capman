import { GameConfig } from '../config/GameConfig.js';
import { GridMovement } from '../managers/GridMovement.js';

export class NPC {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.sprite = null;
        
        // Configurable properties
        this.name = config.name || 'npc';
        this.color = config.color || 0xff0000;
        this.size = config.size || GameConfig.TILE_SIZE * 1.4;  // Same size as player
        this.speed = config.speed || GameConfig.SPEEDS.GHOST;
        this.behavior = config.behavior || 'random'; // random, chase, patrol, guard, flee
        this.patrolPath = config.patrolPath || [];
        this.currentPatrolIndex = 0;
        
        // State management
        this.direction = null;
        this.nextDirection = null;
        this.isMoving = false;
        this.state = 'normal'; // normal, frightened, returning, special
        this.stateTimer = 0;
        
        // AI properties
        this.target = null;
        this.lastDecisionTime = 0;
        this.decisionInterval = config.decisionInterval || 500; // ms between AI decisions
        this.viewDistance = config.viewDistance || 5; // tiles
        this.canCollectHats = config.canCollectHats || false; // Can this NPC collect hats from the ground
        
        // Grid movement for rail-based movement
        this.gridMovement = null; // Will be initialized after sprite creation
    }

    create() {
        this.createSprite();
        
        this.sprite = this.scene.physics.add.sprite(this.startX, this.startY, `${this.name}_sprite`);
        this.sprite.setDisplaySize(this.size, this.size);
        this.sprite.setCollideWorldBounds(false);
        this.sprite.body.setSize(this.size * 0.8, this.size * 0.8);
        this.sprite.body.setOffset(this.size * 0.1, this.size * 0.1);
        
        this.sprite.npc = this; // Reference for collision detection
        
        return this;
    }

    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 2;
        
        // Create basic circular NPC sprite
        graphics.fillStyle(this.color, 1);
        graphics.fillCircle(centerX, centerY, radius);
        
        // Add eyes
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(centerX - 6, centerY - 4, 3);
        graphics.fillCircle(centerX + 6, centerY - 4, 3);
        
        // Add pupils
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(centerX - 6, centerY - 4, 1.5);
        graphics.fillCircle(centerX + 6, centerY - 4, 1.5);
        
        graphics.generateTexture(`${this.name}_sprite`, size, size);
        graphics.destroy();
    }

    update(deltaTime, player, maze) {
        // Initialize grid movement on first update
        if (!this.gridMovement) {
            this.gridMovement = new GridMovement(this.sprite, maze);
            this.gridMovement.speed = this.getMovementSpeed();
        }
        
        if (this.state === 'returning') {
            this.returnToStart(maze);
            return;
        }
        
        // Make AI decisions at intervals or when at intersection
        const atIntersection = this.gridMovement.isAtIntersection();
        if (atIntersection || Date.now() - this.lastDecisionTime > this.decisionInterval) {
            this.makeDecision(player, maze);
            this.lastDecisionTime = Date.now();
        }
        
        // Try to change direction if we have a new one
        if (this.nextDirection) {
            const changed = this.gridMovement.requestDirection(this.nextDirection);
            if (changed) {
                this.nextDirection = null;
            }
        }
        
        // Update grid movement
        this.gridMovement.update();
        
        // Update current direction for AI
        this.direction = this.gridMovement.getDirection();
        this.isMoving = this.gridMovement.isCurrentlyMoving();
        
        // If not moving and no direction queued, choose a new direction
        if (!this.isMoving && !this.nextDirection) {
            this.chooseNewDirection(maze);
        }
        
        // Handle tunnel wrapping
        this.gridMovement.handleTunnels();
        
        // Update state timers
        if (this.stateTimer > 0) {
            this.stateTimer -= deltaTime;
            if (this.stateTimer <= 0) {
                this.setState('normal');
            }
        }
    }

    makeDecision(player, maze) {
        switch(this.behavior) {
            case 'random':
                this.randomBehavior(maze);
                break;
            case 'chase':
                this.chaseBehavior(player, maze);
                break;
            case 'patrol':
                this.patrolBehavior(maze);
                break;
            case 'guard':
                this.guardBehavior(player, maze);
                break;
            case 'flee':
                this.fleeBehavior(player, maze);
                break;
            default:
                this.randomBehavior(maze);
        }
    }

    randomBehavior(maze) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = directions.filter(dir => 
            dir !== this.getOppositeDirection(this.direction) && 
            this.canMove(dir, maze)
        );
        
        if (validDirections.length > 0) {
            this.nextDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
        }
    }

    chaseBehavior(player, maze) {
        if (!player || !player.sprite) return this.randomBehavior(maze);
        
        const playerPos = player.getPosition();
        const myPos = this.getPosition();
        const gridPos = this.getGridPosition(maze);
        const playerGrid = maze.worldToGrid(playerPos.x, playerPos.y);
        
        // Simple pathfinding - move towards player
        const dx = playerGrid.x - gridPos.x;
        const dy = playerGrid.y - gridPos.y;
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        // Sort by priority
        directions.sort((a, b) => b.priority - a.priority);
        
        // Try directions in order of priority
        for (const {dir} of directions) {
            if (dir !== this.getOppositeDirection(this.direction) && this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
        
        // Fallback to random if stuck
        this.randomBehavior(maze);
    }

    patrolBehavior(maze) {
        if (this.patrolPath.length === 0) {
            return this.randomBehavior(maze);
        }
        
        const currentTarget = this.patrolPath[this.currentPatrolIndex];
        const myGrid = this.getGridPosition(maze);
        
        // Check if reached patrol point
        if (myGrid.x === currentTarget.x && myGrid.y === currentTarget.y) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.length;
        }
        
        // Move towards current patrol point
        const target = this.patrolPath[this.currentPatrolIndex];
        this.moveTowardsTarget(target, maze);
    }

    guardBehavior(player, maze) {
        if (!player) return this.randomBehavior(maze);
        
        const playerPos = player.getPosition();
        const myPos = this.getPosition();
        const distance = this.getDistanceToPlayer(player);
        
        // Only chase if player is within view distance
        if (distance <= this.viewDistance * GameConfig.TILE_SIZE) {
            this.chaseBehavior(player, maze);
        } else {
            // Return to guard post or patrol
            if (this.patrolPath.length > 0) {
                this.patrolBehavior(maze);
            } else {
                this.returnToStart(maze);
            }
        }
    }

    fleeBehavior(player, maze) {
        if (!player || !player.sprite) return this.randomBehavior(maze);
        
        const playerPos = player.getPosition();
        const myPos = this.getPosition();
        const gridPos = this.getGridPosition(maze);
        const playerGrid = maze.worldToGrid(playerPos.x, playerPos.y);
        
        // Move away from player
        const dx = gridPos.x - playerGrid.x;
        const dy = gridPos.y - playerGrid.y;
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        // Sort by priority (prefer directions away from player)
        directions.sort((a, b) => b.priority - a.priority);
        
        for (const {dir} of directions) {
            if (dir !== this.getOppositeDirection(this.direction) && this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
        
        this.randomBehavior(maze);
    }

    moveTowardsTarget(target, maze) {
        const myGrid = this.getGridPosition(maze);
        const dx = target.x - myGrid.x;
        const dy = target.y - myGrid.y;
        
        const directions = [];
        if (dx > 0) directions.push({ dir: 'right', priority: Math.abs(dx) });
        if (dx < 0) directions.push({ dir: 'left', priority: Math.abs(dx) });
        if (dy > 0) directions.push({ dir: 'down', priority: Math.abs(dy) });
        if (dy < 0) directions.push({ dir: 'up', priority: Math.abs(dy) });
        
        directions.sort((a, b) => b.priority - a.priority);
        
        for (const {dir} of directions) {
            if (dir !== this.getOppositeDirection(this.direction) && this.canMove(dir, maze)) {
                this.nextDirection = dir;
                return;
            }
        }
    }

    returnToStart(maze) {
        const startGrid = maze.worldToGrid(this.startX, this.startY);
        this.moveTowardsTarget(startGrid, maze);
        
        const myPos = this.getPosition();
        if (Math.abs(myPos.x - this.startX) < 5 && Math.abs(myPos.y - this.startY) < 5) {
            this.setState('normal');
        }
    }

    chooseNewDirection(maze) {
        if (!this.gridMovement) return;
        
        const availableDirections = this.gridMovement.getAvailableDirections();
        
        // Filter out the opposite direction unless it's the only option
        const opposite = this.getOppositeDirection(this.direction);
        let filteredDirections = availableDirections.filter(dir => dir !== opposite);
        
        if (filteredDirections.length === 0) {
            filteredDirections = availableDirections; // Use all directions if no other choice
        }
        
        if (filteredDirections.length > 0) {
            this.nextDirection = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
        }
    }
    
    getMovementSpeed() {
        // Override this in subclasses for different speeds
        return this.state === 'frightened' ? this.speed * 0.5 : this.speed * 0.7; // Slightly slower than player
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
        this.isMoving = false;
    }

    getVelocityFromDirection(direction) {
        const speed = this.state === 'frightened' ? this.speed * 0.5 : this.speed;
        const velocity = { x: 0, y: 0 };
        
        switch(direction) {
            case 'up':
                velocity.y = -speed;
                break;
            case 'down':
                velocity.y = speed;
                break;
            case 'left':
                velocity.x = -speed;
                break;
            case 'right':
                velocity.x = speed;
                break;
        }
        
        return velocity;
    }

    getOppositeDirection(direction) {
        switch(direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return null;
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

    getGridPosition(maze) {
        return maze.worldToGrid(this.sprite.x, this.sprite.y);
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    getDistanceToPlayer(player) {
        const playerPos = player.getPosition();
        const myPos = this.getPosition();
        return Math.sqrt(
            Math.pow(playerPos.x - myPos.x, 2) + 
            Math.pow(playerPos.y - myPos.y, 2)
        );
    }

    setState(newState, duration = 0) {
        this.state = newState;
        this.stateTimer = duration;
        
        // Visual feedback for state changes
        switch(newState) {
            case 'frightened':
                this.sprite.setTint(0x0000ff);
                break;
            case 'returning':
                this.sprite.setAlpha(0.5);
                break;
            case 'normal':
                this.sprite.clearTint();
                this.sprite.setAlpha(1);
                break;
        }
    }

    reset() {
        this.sprite.setPosition(this.startX, this.startY);
        // Only set velocity if physics body exists
        if (this.sprite.body) {
            this.sprite.body.setVelocity(0, 0);
        }
        this.direction = null;
        this.nextDirection = null;
        this.isMoving = false;
        this.setState('normal');
        this.currentPatrolIndex = 0;
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}