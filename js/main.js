import { GameConfig } from './config/GameConfig.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { SplashScene } from './scenes/SplashScene.js';
import { GameScene } from './scenes/GameScene.js';
import { SpriteViewerScene } from './scenes/SpriteViewerScene.js';

class Game {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            parent: 'phaser-game',
            backgroundColor: '#000000',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GameConfig.MAZE_COLS * GameConfig.TILE_SIZE,
                height: (GameConfig.MAZE_ROWS * GameConfig.TILE_SIZE) + GameConfig.UI.SCORE_BAR_HEIGHT // Debug panel space removed
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            pixelArt: true,
            scene: [PreloadScene, SplashScene, GameScene, SpriteViewerScene]
        };

        this.game = new Phaser.Game(this.config);
    }
}

window.addEventListener('load', () => {
    document.getElementById('loading').style.display = 'none';
    new Game();
});