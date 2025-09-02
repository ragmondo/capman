import { AnalyticsManager } from '../managers/AnalyticsManager.js';

export class SplashScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SplashScene' });
        this.hasInteracted = false;
        this.analyticsManager = new AnalyticsManager();
    }

    create() {
        // Reset interaction flag when scene is created/recreated
        this.hasInteracted = false;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Black background
        this.add.rectangle(centerX, centerY, width, height, 0x000000);

        // Calculate scaling based on screen width
        const baseWidth = 800;
        const scaleFactor = Math.min(1, width / baseWidth) * 2.0; // Double size for better readability
        
        // Title
        const titleSize = Math.floor(64 * scaleFactor);
        const titleText = this.add.text(centerX, 80, 'HAT SNATCH', {
            fontSize: `${titleSize}px`,
            fontFamily: 'Courier New',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        
        // Check if title fits and scale down if needed
        if (titleText.width > width - 40) {
            const adjustedScale = (width - 40) / titleText.width;
            titleText.setScale(adjustedScale);
        }

        // Subtitle
        const subtitleSize = Math.floor(24 * scaleFactor);
        const subtitleText = this.add.text(centerX, 140, 'A CAP MAN ADVENTURE', {
            fontSize: `${subtitleSize}px`,
            fontFamily: 'Courier New',
            color: '#00ff00'
        });
        subtitleText.setOrigin(0.5);
        
        // Check if subtitle fits and scale down if needed
        if (subtitleText.width > width - 40) {
            const adjustedScale = (width - 40) / subtitleText.width;
            subtitleText.setScale(adjustedScale);
        }

        // Game objective
        const objectiveSize = Math.floor(28 * scaleFactor);
        const objectiveTitle = this.add.text(centerX, 200, 'OBJECTIVE:', {
            fontSize: `${objectiveSize}px`,
            fontFamily: 'Courier New',
            color: '#ff00ff'
        });
        objectiveTitle.setOrigin(0.5);

        const objectiveTextSize = Math.floor(20 * scaleFactor);
        const objectiveText1 = this.add.text(centerX, 240, 'Get hats by any means', {
            fontSize: `${objectiveTextSize}px`,
            fontFamily: 'Courier New',
            color: '#ffffff'
        });
        objectiveText1.setOrigin(0.5);
        
        const objectiveText2 = this.add.text(centerX, 270, 'Deliver to wife', {
            fontSize: `${objectiveTextSize}px`,
            fontFamily: 'Courier New',
            color: '#ffffff'
        });
        objectiveText2.setOrigin(0.5);

        // Instructions
        const instructionsY = 300;
        const instructions = [
            { icon: '🎾', text: 'Watch the exciting Pong game!' },
            { icon: '🧢', text: 'Catch hats thrown by pong players' },
            { icon: '👦', text: 'Or just snatch them from children!' },
            { icon: '👰', text: 'Deliver hats to your wife' },
            { icon: '👮', text: 'Avoid security guards!' },
            { icon: '👎', text: 'Watch out for downvotes!' }
        ];

        instructions.forEach((inst, index) => {
            const y = instructionsY + (index * 32);
            
            const iconSize = Math.floor(24 * scaleFactor);
            const icon = this.add.text(centerX - 200, y, inst.icon, {
                fontSize: `${iconSize}px`
            });
            icon.setOrigin(0, 0.5);

            const textSize = Math.floor(18 * scaleFactor);
            const text = this.add.text(centerX - 160, y, inst.text, {
                fontSize: `${textSize}px`,
                fontFamily: 'Courier New',
                color: '#ffffff'
            });
            text.setOrigin(0, 0.5);
        });

        // Controls section
        const controlsY = 510;
        const controlsSize = Math.floor(28 * scaleFactor);
        const controlsTitle = this.add.text(centerX, controlsY, 'CONTROLS:', {
            fontSize: `${controlsSize}px`,
            fontFamily: 'Courier New',
            color: '#00ffff'
        });
        controlsTitle.setOrigin(0.5);

        // Detect if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

        const controlTextSize = Math.floor(20 * scaleFactor);
        const smallTextSize = Math.floor(18 * scaleFactor);
        
        if (isMobile) {
            // Mobile controls
            const swipeText = this.add.text(centerX, controlsY + 40, 'SWIPE to move in any direction', {
                fontSize: `${controlTextSize}px`,
                fontFamily: 'Courier New',
                color: '#ffffff'
            });
            swipeText.setOrigin(0.5);
        } else {
            // Desktop controls
            const keysText = this.add.text(centerX, controlsY + 40, 'Arrow Keys or WASD to move', {
                fontSize: `${controlTextSize}px`,
                fontFamily: 'Courier New',
                color: '#ffffff'
            });
            keysText.setOrigin(0.5);

            const pauseText = this.add.text(centerX, controlsY + 70, 'P to pause', {
                fontSize: `${smallTextSize}px`,
                fontFamily: 'Courier New',
                color: '#888888'
            });
            pauseText.setOrigin(0.5);
        }

        // Warning about stealing
        const warningText = this.add.text(centerX, 640, '⚠️ WARNING: Stealing hats has consequences! ⚠️', {
            fontSize: `${smallTextSize}px`,
            fontFamily: 'Courier New',
            color: '#ff5555'
        });
        warningText.setOrigin(0.5);

        // Start prompt
        const startY = 710;
        const startPrompt = isMobile ? 'TAP TO START' : 'PRESS ANY KEY TO START';
        const startSize = Math.floor(32 * scaleFactor);
        const startText = this.add.text(centerX, startY, startPrompt, {
            fontSize: `${startSize}px`,
            fontFamily: 'Courier New',
            color: '#ffff00'
        });
        startText.setOrigin(0.5);

        // Blinking animation for start text
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Credits and GitHub link
        const creditsSize = Math.floor(14 * scaleFactor);
        const creditsText = this.add.text(centerX, height - 50, 'Built with Phaser.js', {
            fontSize: `${creditsSize}px`,
            fontFamily: 'Courier New',
            color: '#666666'
        });
        creditsText.setOrigin(0.5);
        

        // Setup input handlers
        this.setupInputHandlers();

        // Add animated hat sprites
        this.createFloatingHats();
    }

    createFloatingHats() {
        const width = this.cameras.main.width;
        
        // Create a few decorative floating hats
        for (let i = 0; i < 3; i++) {
            const x = 100 + (i * 250);
            const y = 750;
            
            // Create simple hat graphic
            const graphics = this.add.graphics();
            const size = 32;
            
            // Baseball cap shape
            graphics.fillStyle(0xff0000, 1);
            graphics.fillRoundedRect(0, 8, 24, 16, 4);
            
            // Cap visor
            graphics.fillStyle(0xcc0000, 1);
            graphics.fillRect(24, 12, 8, 8);
            
            // Cap button
            graphics.fillStyle(0xffff00, 1);
            graphics.fillCircle(12, 16, 2);
            
            graphics.generateTexture(`splash_hat_${i}`, size, size);
            graphics.destroy();
            
            const hat = this.add.image(x, y, `splash_hat_${i}`);
            hat.setScale(1.5);
            
            // Floating animation
            this.tweens.add({
                targets: hat,
                y: y - 20,
                duration: 2000 + (i * 200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Rotation animation
            this.tweens.add({
                targets: hat,
                rotation: Math.PI * 2,
                duration: 3000 + (i * 500),
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    setupInputHandlers() {
        // Keyboard input
        this.input.keyboard.on('keydown', () => {
            if (!this.hasInteracted) {
                this.hasInteracted = true;
                this.startGame();
            }
        });

        // Touch/click input
        this.input.on('pointerdown', () => {
            if (!this.hasInteracted) {
                this.hasInteracted = true;
                this.startGame();
            }
        });
    }

    startGame() {
        // Try to unlock audio on mobile before starting game
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            try {
                // Create a temporary audio context to unlock iOS audio
                const tempAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = tempAudioContext.createOscillator();
                const gainNode = tempAudioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(tempAudioContext.destination);
                
                oscillator.frequency.value = 440;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0, tempAudioContext.currentTime);
                
                oscillator.start(tempAudioContext.currentTime);
                oscillator.stop(tempAudioContext.currentTime + 0.1);
                
                console.log("[SPLASH] iOS audio unlocked on game start");
                
                // Clean up temp context
                setTimeout(() => {
                    tempAudioContext.close();
                }, 200);
            } catch (e) {
                console.warn("Failed to unlock iOS audio on splash:", e);
            }
        }
        
        // Track game start from splash screen
        this.analyticsManager.gameStartedFromSplash();
        
        // Fade out and start game
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene');
        });
    }
}