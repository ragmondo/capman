export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                color: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        this.createAssets();
    }

    createAssets() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        graphics.fillStyle(0x0000ff);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('wall', 16, 16);
        
        graphics.clear();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(8, 8, 2);
        graphics.generateTexture('dot', 16, 16);
        
        graphics.clear();
        graphics.fillStyle(0xffff00);
        graphics.fillCircle(8, 8, 4);
        graphics.generateTexture('powerPellet', 16, 16);
        
        graphics.clear();
        graphics.fillStyle(0xffff00);
        graphics.fillCircle(8, 8, 7);
        graphics.generateTexture('pacman', 16, 16);
        
        graphics.clear();
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(8, 8, 7);
        graphics.generateTexture('ghost', 16, 16);
        
        graphics.destroy();
    }

    create() {
        this.scene.start('GameScene');
    }
}