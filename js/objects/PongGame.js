import { GameConfig } from '../config/GameConfig.js';

export class PongGame {
    constructor(scene, courtBounds) {
        this.scene = scene;
        this.courtBounds = courtBounds; // {x, y, width, height}
        
        // Game objects
        this.leftPaddle = null;
        this.rightPaddle = null;
        this.ball = null;
        
        // Ball properties
        this.ballSpeed = 1.5;
        this.ballVelocityX = this.ballSpeed;
        this.ballVelocityY = this.ballSpeed * 0.5;
        
        // Paddle properties
        this.paddleWidth = 4;
        this.paddleHeight = 24;
        this.paddleSpeed = 1.2;
        
        // AI behavior
        this.leftPaddleTarget = 0;
        this.rightPaddleTarget = 0;
        this.reactionDelay = 0;
        this.maxReactionDelay = 30; // frames of delay for realism
        
        // Sound cooldown to prevent continuous beeping
        this.lastWallBounceTime = 0;
        this.lastPaddleBounceTime = 0;
        this.soundCooldown = 100; // Minimum ms between same type of sound
        
        this.isActive = true;
    }
    
    create() {
        const { x, y, width, height } = this.courtBounds;
        const centerY = y + height / 2;
        
        // Create paddles
        this.leftPaddle = this.scene.add.rectangle(
            x + 12, 
            centerY, 
            this.paddleWidth, 
            this.paddleHeight, 
            GameConfig.COLORS.TENNIS_LINES
        );
        this.leftPaddle.setDepth(10);
        
        this.rightPaddle = this.scene.add.rectangle(
            x + width - 12, 
            centerY, 
            this.paddleWidth, 
            this.paddleHeight, 
            GameConfig.COLORS.TENNIS_LINES
        );
        this.rightPaddle.setDepth(10);
        
        // Create ball
        this.ball = this.scene.add.circle(
            x + width / 2,
            centerY,
            3,
            GameConfig.COLORS.TENNIS_LINES
        );
        this.ball.setDepth(10);
        
        // Initialize ball direction (random)
        this.ballVelocityX = Math.random() > 0.5 ? this.ballSpeed : -this.ballSpeed;
        this.ballVelocityY = (Math.random() - 0.5) * this.ballSpeed;
        
        return this;
    }
    
    update() {
        if (!this.isActive) return;
        
        this.updateBall();
        this.updatePaddles();
        this.checkCollisions();
    }
    
    updateBall() {
        // Move ball
        this.ball.x += this.ballVelocityX;
        this.ball.y += this.ballVelocityY;
        
        // Prevent ball from getting stuck with too low velocity
        if (Math.abs(this.ballVelocityX) < 0.5) {
            this.ballVelocityX = this.ballVelocityX > 0 ? 1 : -1;
        }
        if (Math.abs(this.ballVelocityY) < 0.1) {
            this.ballVelocityY = (Math.random() - 0.5) * 0.5;
        }
        
        // Bounce off top and bottom walls
        if (this.ball.y <= this.courtBounds.y + 8 || 
            this.ball.y >= this.courtBounds.y + this.courtBounds.height - 8) {
            this.ballVelocityY = -this.ballVelocityY;
            // Add slight random variation
            this.ballVelocityY += (Math.random() - 0.5) * 0.2;
            
            // Audio hook for wall bounce with cooldown
            const currentTime = Date.now();
            if (this.scene.audioManager && 
                currentTime - this.lastWallBounceTime > this.soundCooldown) {
                this.scene.audioManager.playPongBounce('wall');
                this.lastWallBounceTime = currentTime;
            }
        }
        
        // Check for scoring
        if (this.ball.x < this.courtBounds.x - 10) {
            // Right paddle scored
            this.handleScore('right');
        } else if (this.ball.x > this.courtBounds.x + this.courtBounds.width + 10) {
            // Left paddle scored
            this.handleScore('left');
        }
    }
    
    updatePaddles() {
        // Update AI targets with reaction delay
        if (this.reactionDelay <= 0) {
            // Predict where ball will be
            const prediction = this.predictBallY();
            
            // Left paddle AI - slightly imperfect
            this.leftPaddleTarget = prediction + (Math.random() - 0.5) * 10;
            
            // Right paddle AI - slightly different skill level
            this.rightPaddleTarget = prediction + (Math.random() - 0.5) * 8;
            
            this.reactionDelay = Math.random() * this.maxReactionDelay;
        } else {
            this.reactionDelay--;
        }
        
        // Move paddles toward targets
        this.movePaddleToTarget(this.leftPaddle, this.leftPaddleTarget);
        this.movePaddleToTarget(this.rightPaddle, this.rightPaddleTarget);
        
        // Keep paddles within court bounds
        this.constrainPaddleToCourt(this.leftPaddle);
        this.constrainPaddleToCourt(this.rightPaddle);
    }
    
    predictBallY() {
        // Simple prediction based on current ball trajectory
        let futureY = this.ball.y;
        let futureVelY = this.ballVelocityY;
        const steps = 30; // Look ahead 30 frames
        
        for (let i = 0; i < steps; i++) {
            futureY += futureVelY;
            
            // Account for bouncing off walls
            if (futureY <= this.courtBounds.y + 8 || 
                futureY >= this.courtBounds.y + this.courtBounds.height - 8) {
                futureVelY = -futureVelY;
            }
        }
        
        return futureY;
    }
    
    movePaddleToTarget(paddle, target) {
        const diff = target - paddle.y;
        const maxMove = this.paddleSpeed;
        
        if (Math.abs(diff) > 2) {
            paddle.y += Math.sign(diff) * Math.min(maxMove, Math.abs(diff));
        }
    }
    
    constrainPaddleToCourt(paddle) {
        const minY = this.courtBounds.y + this.paddleHeight / 2 + 8;
        const maxY = this.courtBounds.y + this.courtBounds.height - this.paddleHeight / 2 - 8;
        
        paddle.y = Math.max(minY, Math.min(maxY, paddle.y));
    }
    
    checkCollisions() {
        // Check ball collision with paddles (check each separately for different sounds)
        let paddleHit = false;
        const currentTime = Date.now();
        
        if (this.checkBallPaddleCollision(this.ball, this.leftPaddle)) {
            paddleHit = true;
            // Audio hook for left paddle bounce with cooldown
            if (this.scene.audioManager && 
                currentTime - this.lastPaddleBounceTime > this.soundCooldown) {
                this.scene.audioManager.playPongBounce('left');
                this.lastPaddleBounceTime = currentTime;
            }
        } else if (this.checkBallPaddleCollision(this.ball, this.rightPaddle)) {
            paddleHit = true;
            // Audio hook for right paddle bounce with cooldown
            if (this.scene.audioManager && 
                currentTime - this.lastPaddleBounceTime > this.soundCooldown) {
                this.scene.audioManager.playPongBounce('right');
                this.lastPaddleBounceTime = currentTime;
            }
        }
        
        if (paddleHit) {
            // Reverse ball direction
            this.ballVelocityX = -this.ballVelocityX;
            
            // Add some randomness and spin
            this.ballVelocityY += (Math.random() - 0.5) * 0.5;
            
            // Slightly increase speed over time (subtle)
            const speedIncrease = 1.01;
            this.ballVelocityX *= speedIncrease;
            this.ballVelocityY *= speedIncrease;
            
            // Cap maximum speed
            const maxSpeed = 3;
            if (Math.abs(this.ballVelocityX) > maxSpeed) {
                this.ballVelocityX = Math.sign(this.ballVelocityX) * maxSpeed;
            }
            if (Math.abs(this.ballVelocityY) > maxSpeed) {
                this.ballVelocityY = Math.sign(this.ballVelocityY) * maxSpeed;
            }
        }
    }
    
    checkBallPaddleCollision(ball, paddle) {
        const ballBounds = {
            left: ball.x - 3,
            right: ball.x + 3,
            top: ball.y - 3,
            bottom: ball.y + 3
        };
        
        const paddleBounds = {
            left: paddle.x - this.paddleWidth / 2,
            right: paddle.x + this.paddleWidth / 2,
            top: paddle.y - this.paddleHeight / 2,
            bottom: paddle.y + this.paddleHeight / 2
        };
        
        return ballBounds.right >= paddleBounds.left &&
               ballBounds.left <= paddleBounds.right &&
               ballBounds.bottom >= paddleBounds.top &&
               ballBounds.top <= paddleBounds.bottom;
    }
    
    handleScore(winner) {
        // Animate the winning paddle
        const winningPaddle = winner === 'left' ? this.leftPaddle : this.rightPaddle;
        this.celebratePaddle(winningPaddle);
        
        // Emit event to game scene for hat throwing
        this.scene.events.emit('pongScore', {
            winner: winner,
            courtBounds: this.courtBounds
        });
        
        this.resetBall();
    }
    
    celebratePaddle(paddle) {
        // Quick celebration animation - paddle grows and flashes
        this.scene.tweens.add({
            targets: paddle,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 150,
            yoyo: true,
            repeat: 1,
            ease: 'Back.easeOut'
        });
        
        // Flash effect
        this.scene.tweens.add({
            targets: paddle,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
    }
    
    resetBall() {
        // Reset ball to center
        this.ball.x = this.courtBounds.x + this.courtBounds.width / 2;
        this.ball.y = this.courtBounds.y + this.courtBounds.height / 2 + (Math.random() - 0.5) * 30;
        
        // Random direction
        this.ballVelocityX = Math.random() > 0.5 ? this.ballSpeed : -this.ballSpeed;
        this.ballVelocityY = (Math.random() - 0.5) * this.ballSpeed;
        
        // Add a brief pause
        this.reactionDelay = 60; // 1 second delay
    }
    
    setActive(active) {
        this.isActive = active;
        if (this.leftPaddle) this.leftPaddle.setVisible(active);
        if (this.rightPaddle) this.rightPaddle.setVisible(active);
        if (this.ball) this.ball.setVisible(active);
    }
    
    destroy() {
        if (this.leftPaddle) this.leftPaddle.destroy();
        if (this.rightPaddle) this.rightPaddle.destroy();
        if (this.ball) this.ball.destroy();
    }
    
    // Get court bounds for external use
    getCourtBounds() {
        return this.courtBounds;
    }
}