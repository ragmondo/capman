import { GameConfig } from '../config/GameConfig.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = this.loadHighScore();
        this.elements = {};
    }

    create() {
        const width = this.scene.cameras.main.width;
        const barHeight = GameConfig.UI.SCORE_BAR_HEIGHT;
        const padding = GameConfig.UI.PADDING;
        const fontSize = GameConfig.UI.FONT_SIZE;
        
        this.createBackground(width, barHeight);
        this.createScoreText(padding, barHeight, fontSize);
        this.createHighScoreText(width, barHeight, padding, fontSize);
        this.createLevelText(width, barHeight, fontSize);
        this.createLivesDisplay(width, barHeight, padding);
        
        return this;
    }

    createBackground(width, height) {
        this.elements.background = this.scene.add.rectangle(
            width / 2, 
            height / 2, 
            width, 
            height, 
            0x000033
        );
        this.elements.background.setDepth(100);
        
        this.elements.border = this.scene.add.rectangle(
            width / 2,
            height,
            width,
            2,
            0x0000ff
        );
        this.elements.border.setDepth(101);
    }

    createScoreText(x, barHeight, fontSize) {
        this.elements.scoreLabel = this.scene.add.text(
            x, 
            10, 
            'SCORE', 
            {
                fontSize: `${fontSize - 4}px`,
                fontFamily: 'monospace',
                color: GameConfig.COLORS.UI_TEXT
            }
        );
        this.elements.scoreLabel.setDepth(102);
        
        this.elements.scoreText = this.scene.add.text(
            x,
            barHeight / 2,
            this.formatScore(this.score),
            {
                fontSize: `${fontSize}px`,
                fontFamily: 'monospace',
                color: GameConfig.COLORS.UI_SCORE
            }
        );
        this.elements.scoreText.setDepth(102);
    }

    createHighScoreText(width, barHeight, padding, fontSize) {
        this.elements.highScoreLabel = this.scene.add.text(
            width - padding - 100,
            10,
            'HIGH',
            {
                fontSize: `${fontSize - 4}px`,
                fontFamily: 'monospace',
                color: GameConfig.COLORS.UI_TEXT
            }
        );
        this.elements.highScoreLabel.setDepth(102);
        
        this.elements.highScoreText = this.scene.add.text(
            width - padding - 100,
            barHeight / 2,
            this.formatScore(this.highScore),
            {
                fontSize: `${fontSize}px`,
                fontFamily: 'monospace',
                color: GameConfig.COLORS.UI_SCORE
            }
        );
        this.elements.highScoreText.setDepth(102);
    }

    createLevelText(width, barHeight, fontSize) {
        this.elements.levelText = this.scene.add.text(
            width / 2,
            barHeight / 3, // Move up to give space for lives
            `LEVEL ${this.level}`,
            {
                fontSize: `${fontSize}px`,
                fontFamily: 'monospace',
                color: GameConfig.COLORS.UI_TEXT
            }
        );
        this.elements.levelText.setOrigin(0.5, 0.5);
        this.elements.levelText.setDepth(102);
    }

    createLivesDisplay(width, barHeight, padding) {
        this.elements.livesContainer = this.scene.add.container(
            width / 2, // Center horizontally like level text
            (barHeight / 3) * 2 + 5 // Position below level text
        );
        this.elements.livesContainer.setDepth(102);
        
        this.updateLivesDisplay();
    }

    updateScore(points) {
        this.score += points;
        this.elements.scoreText.setText(this.formatScore(this.score));
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.elements.highScoreText.setText(this.formatScore(this.highScore));
            this.saveHighScore();
        }
        
        this.animateScorePopup(points);
    }

    updateLives(lives) {
        this.lives = lives;
        this.updateLivesDisplay();
    }

    updateLevel(level) {
        this.level = level;
        this.elements.levelText.setText(`LEVEL ${this.level}`);
        this.animateLevelChange();
    }

    updateLivesDisplay() {
        this.elements.livesContainer.removeAll(true);
        
        // Center the lives display
        const totalWidth = (this.lives - 1) * 20;
        const startX = -totalWidth / 2;
        
        for (let i = 0; i < this.lives; i++) {
            const life = this.scene.add.image(startX + i * 20, 0, 'pacman');
            life.setDisplaySize(16, 16);
            this.elements.livesContainer.add(life);
        }
    }

    animateScorePopup(points) {
        const popup = this.scene.add.text(
            this.elements.scoreText.x + 100,
            this.elements.scoreText.y,
            `+${points}`,
            {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#00ff00'
            }
        );
        popup.setDepth(103);
        
        this.scene.tweens.add({
            targets: popup,
            y: popup.y - 20,
            alpha: 0,
            duration: 1000,
            onComplete: () => popup.destroy()
        });
    }

    animateLevelChange() {
        this.scene.tweens.add({
            targets: this.elements.levelText,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 300,
            yoyo: true,
            ease: 'Power2'
        });
    }

    showMessage(text, duration = 2000) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const message = this.scene.add.text(
            width / 2,
            height / 2,
            text,
            {
                fontSize: '32px',
                fontFamily: 'monospace',
                color: '#ffff00',
                backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black
                padding: { x: 20, y: 10 }
            }
        );
        message.setOrigin(0.5, 0.5);
        message.setDepth(200);
        
        this.scene.tweens.add({
            targets: message,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.scene.time.delayedCall(duration, () => {
                    message.destroy();
                });
            }
        });
    }

    formatScore(score) {
        return score.toString().padStart(6, '0');
    }

    loadHighScore() {
        const saved = localStorage.getItem('pacman_highscore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('pacman_highscore', this.highScore.toString());
    }

    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.elements.scoreText.setText(this.formatScore(this.score));
        this.elements.levelText.setText(`LEVEL ${this.level}`);
        this.updateLivesDisplay();
    }

    getScore() {
        return this.score;
    }

    getLives() {
        return this.lives;
    }

    getLevel() {
        return this.level;
    }
}