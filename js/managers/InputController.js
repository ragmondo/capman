export class InputController {
    constructor(scene) {
        this.scene = scene;
        this.cursors = null;
        this.wasd = null;
        this.currentDirection = null;
        this.nextDirection = null;
        this.mobileControls = null;
        this.enabled = false;
        this.isMobile = this.checkMobile();
    }

    create() {
        this.setupKeyboardControls();
        this.setupMobileControls();
        this.setupSwipeControls();
        this.enabled = true;
        return this;
    }

    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    }

    setupKeyboardControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
        
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.enabled) return;
            
            switch(event.keyCode) {
                case Phaser.Input.Keyboard.KeyCodes.UP:
                case Phaser.Input.Keyboard.KeyCodes.W:
                    this.setDirection('up');
                    break;
                case Phaser.Input.Keyboard.KeyCodes.DOWN:
                case Phaser.Input.Keyboard.KeyCodes.S:
                    this.setDirection('down');
                    break;
                case Phaser.Input.Keyboard.KeyCodes.LEFT:
                case Phaser.Input.Keyboard.KeyCodes.A:
                    this.setDirection('left');
                    break;
                case Phaser.Input.Keyboard.KeyCodes.RIGHT:
                case Phaser.Input.Keyboard.KeyCodes.D:
                    this.setDirection('right');
                    break;
            }
        });
    }

    setupMobileControls() {
        const buttons = document.querySelectorAll('.control-btn');
        
        buttons.forEach(button => {
            const direction = button.dataset.direction;
            if (!direction) return;
            
            ['touchstart', 'mousedown'].forEach(eventType => {
                button.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    if (this.enabled) {
                        this.setDirection(direction);
                        button.style.transform = 'scale(0.9)';
                    }
                });
            });
            
            ['touchend', 'mouseup', 'touchcancel', 'mouseleave'].forEach(eventType => {
                button.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    button.style.transform = 'scale(1)';
                });
            });
        });
    }

    setupSwipeControls() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        const threshold = 30;
        const timeThreshold = 300;
        
        const gameCanvas = this.scene.game.canvas;
        
        gameCanvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });
        
        gameCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        gameCanvas.addEventListener('touchend', (e) => {
            if (!this.enabled) return;
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const deltaTime = Date.now() - startTime;
            
            if (deltaTime > timeThreshold) return;
            
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            
            if (absX > threshold || absY > threshold) {
                if (absX > absY) {
                    this.setDirection(deltaX > 0 ? 'right' : 'left');
                } else {
                    this.setDirection(deltaY > 0 ? 'down' : 'up');
                }
            }
        }, { passive: true });
    }

    setDirection(direction) {
        this.nextDirection = direction;
    }

    isOppositeDirection(dir1, dir2) {
        return (dir1 === 'up' && dir2 === 'down') ||
               (dir1 === 'down' && dir2 === 'up') ||
               (dir1 === 'left' && dir2 === 'right') ||
               (dir1 === 'right' && dir2 === 'left');
    }

    getDirection() {
        return this.nextDirection || this.currentDirection;
    }

    getCurrentDirection() {
        return this.currentDirection;
    }

    getNextDirection() {
        return this.nextDirection;
    }

    confirmDirection() {
        if (this.nextDirection) {
            this.currentDirection = this.nextDirection;
            this.nextDirection = null;
        }
    }

    clearDirection() {
        this.currentDirection = null;
        this.nextDirection = null;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        this.clearDirection();
    }

    reset() {
        this.clearDirection();
        this.enabled = true;
    }

    getVelocityFromDirection(direction, speed) {
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

    update() {
        if (!this.enabled) return;
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.setDirection('up');
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.setDirection('down');
        } else if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.setDirection('left');
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.setDirection('right');
        }
    }
}