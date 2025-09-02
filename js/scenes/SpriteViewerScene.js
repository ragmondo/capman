export class SpriteViewerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpriteViewerScene' });
        this.spriteContainer = null;
        this.cursors = null;
        this.scrollSpeed = 5;
    }

    create() {
        // Set background to dark gray for better sprite visibility
        this.cameras.main.setBackgroundColor('#333333');
        
        // Create a container for all sprites so we can scroll them
        this.spriteContainer = this.add.container(0, 0);
        
        // Fixed UI elements (don't scroll)
        this.add.text(20, 20, 'SPRITE VIEWER - Use ARROW KEYS to scroll, Press I to return', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        this.add.text(20, 40, 'All sprites shown at 4x scale for detailed inspection', {
            fontSize: '12px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        // Create all game sprites first by instantiating the objects
        this.createGameSprites();
        
        // Display sprites at 4x size in the scrollable container
        this.displaySprites();
        
        // Set up camera controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Set camera bounds to allow scrolling
        this.cameras.main.setBounds(0, 0, 1200, 1000);
        
        // Instructions at bottom (fixed position)
        this.add.text(20, this.cameras.main.height - 60, 'Controls:', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        this.add.text(20, this.cameras.main.height - 45, '• Arrow Keys: Scroll around', {
            fontSize: '10px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        this.add.text(20, this.cameras.main.height - 30, '• I Key: Return to game', {
            fontSize: '10px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
    }
    
    createGameSprites() {
        // We need to create instances of game objects to generate their sprites
        // This is a bit hacky but necessary since sprites are generated dynamically
        
        // Import classes dynamically to avoid circular dependencies
        const createTempObjects = () => {
            // Create temporary graphics for generating textures
            const tempGraphics = this.add.graphics();
            
            // Generate Cap Man sprites
            this.createCapManSprites(tempGraphics);
            
            // Generate Wife sprites  
            this.createWifeSprites(tempGraphics);
            
            // Generate Child sprites
            this.createChildSprites(tempGraphics);
            
            // Generate Security Guard sprites
            this.createSecurityGuardSprites(tempGraphics);
            
            // Generate Downvote NPC sprites
            this.createDownvoteSprites(tempGraphics);
            
            // Generate Hat sprites
            this.createHatSprites(tempGraphics);
            
            // Generate UI elements
            this.createUISprites(tempGraphics);
            
            tempGraphics.destroy();
        };
        
        createTempObjects();
    }
    
    createCapManSprites(graphics) {
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        const navyBlue = 0x1e3a8a;
        const khaki = 0xf0e68c;
        const skinTone = 0xfdbcb4;
        
        // Cap Man Closed
        this.createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, 'closed');
        graphics.generateTexture('capman_closed', size, size);
        graphics.clear();
        
        // Cap Man Half
        this.createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, 'half');
        graphics.generateTexture('capman_half', size, size);
        graphics.clear();
        
        // Cap Man Open
        this.createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, 'open');
        graphics.generateTexture('capman_open', size, size);
        graphics.clear();
    }
    
    createCapManPose(graphics, size, centerX, centerY, navyBlue, khaki, skinTone, pose) {
        let leanOffset = 0;
        if (pose === 'half') leanOffset = 1;
        if (pose === 'open') leanOffset = 2;
        
        // Head
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(centerX + leanOffset, centerY - 6, 8);
        
        // Navy blue shirt
        graphics.fillStyle(navyBlue, 1);
        graphics.fillRect(centerX - 6 + leanOffset, centerY - 2, 12, 8);
        
        // Khaki shorts
        graphics.fillStyle(khaki, 1);
        graphics.fillRect(centerX - 5 + leanOffset, centerY + 6, 10, 6);
        
        // Facial features
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 3 + leanOffset, centerY - 8, 1, 1);
        graphics.fillRect(centerX + 2 + leanOffset, centerY - 8, 1, 1);
        
        if (pose === 'closed') {
            graphics.fillRect(centerX - 1 + leanOffset, centerY - 5, 2, 1);
        } else {
            graphics.fillCircle(centerX + leanOffset, centerY - 4, 1);
        }
        
        // Legs
        graphics.fillStyle(skinTone, 1);
        graphics.fillRect(centerX - 3 + leanOffset, centerY + 12, 2, 4);
        graphics.fillRect(centerX + 1 + leanOffset, centerY + 12, 2, 4);
        
        // Arms
        graphics.fillRect(centerX - 8 + leanOffset, centerY, 2, 6);
        graphics.fillRect(centerX + 6 + leanOffset, centerY, 2, 6);
    }
    
    createWifeSprites(graphics) {
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        const white = 0xffffff;
        const pink = 0xff69b4;
        const skinTone = 0xfdbcb4;
        
        // Head
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(centerX, centerY - 6, 8);
        
        // White dress
        graphics.fillStyle(white, 1);
        graphics.fillRect(centerX - 6, centerY - 2, 12, 8);
        graphics.fillRect(centerX - 7, centerY + 6, 14, 6);
        
        // Pink scarf/necktie in ^ shape (V-neck style)
        graphics.fillStyle(pink, 1);
        
        // Left side of V (angled line from neck to chest)
        graphics.fillTriangle(
            centerX - 1, centerY - 3,  // Top center point
            centerX - 4, centerY - 1,  // Left shoulder point
            centerX - 2, centerY + 2   // Left bottom point
        );
        
        // Right side of V (angled line from neck to chest)
        graphics.fillTriangle(
            centerX + 1, centerY - 3,  // Top center point
            centerX + 4, centerY - 1,  // Right shoulder point
            centerX + 2, centerY + 2   // Right bottom point
        );
        
        // Features
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 3, centerY - 8, 1, 1);
        graphics.fillRect(centerX + 2, centerY - 8, 1, 1);
        
        // Legs
        graphics.fillStyle(skinTone, 1);
        graphics.fillRect(centerX - 3, centerY + 12, 2, 4);
        graphics.fillRect(centerX + 1, centerY + 12, 2, 4);
        
        // Arms
        graphics.fillRect(centerX - 8, centerY, 2, 6);
        graphics.fillRect(centerX + 6, centerY, 2, 6);
        
        // Hair
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillCircle(centerX, centerY - 6, 9);
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(centerX, centerY - 6, 8);
        
        graphics.generateTexture('wife_sprite', size, size);
        graphics.clear();
    }
    
    createChildSprites(graphics) {
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 4; // Smaller than other NPCs
        
        // Child 1 - Sky Blue
        graphics.fillStyle(0x87ceeb, 1);
        graphics.fillCircle(centerX, centerY, radius);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(centerX - 3, centerY - 2, 1);
        graphics.fillCircle(centerX + 3, centerY - 2, 1);
        graphics.generateTexture('child1_sprite', size, size);
        graphics.clear();
        
        // Child 2 - Light Green
        graphics.fillStyle(0x98fb98, 1);
        graphics.fillCircle(centerX, centerY, radius);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(centerX - 3, centerY - 2, 1);
        graphics.fillCircle(centerX + 3, centerY - 2, 1);
        graphics.generateTexture('child2_sprite', size, size);
        graphics.clear();
        
        // Child 3 - Light Coral
        graphics.fillStyle(0xf08080, 1);
        graphics.fillCircle(centerX, centerY, radius);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(centerX - 3, centerY - 2, 1);
        graphics.fillCircle(centerX + 3, centerY - 2, 1);
        graphics.generateTexture('child3_sprite', size, size);
        graphics.clear();
    }
    
    createSecurityGuardSprites(graphics) {
        const size = 36;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 2;
        
        // Security guard - Royal blue uniform
        graphics.fillStyle(0x4169e1, 1);
        graphics.fillCircle(centerX, centerY, radius);
        
        // Badge
        graphics.fillStyle(0xc0c0c0, 1);
        graphics.fillRect(centerX - 2, centerY - 8, 4, 6);
        
        // Hat
        graphics.fillStyle(0x191970, 1);
        graphics.fillEllipse(centerX, centerY - 10, 12, 4);
        
        // Sunglasses
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 6, centerY - 4, 4, 2);
        graphics.fillRect(centerX + 2, centerY - 4, 4, 2);
        
        graphics.generateTexture('security_sprite', size, size);
        graphics.clear();
    }
    
    createDownvoteSprites(graphics) {
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Yelp Downvote - Red
        graphics.fillStyle(0xff1744, 1);
        graphics.fillCircle(centerX, centerY, 14);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(centerX - 2, centerY - 8, 4, 10);
        graphics.beginPath();
        graphics.moveTo(centerX - 6, centerY + 2);
        graphics.lineTo(centerX + 6, centerY + 2);
        graphics.lineTo(centerX, centerY + 8);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('yelp_downvote_sprite', size, size);
        graphics.clear();
        
        // Google Reviews Downvote - Orange
        graphics.fillStyle(0xff5722, 1);
        graphics.fillCircle(centerX, centerY, 14);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(centerX - 2, centerY - 8, 4, 10);
        graphics.beginPath();
        graphics.moveTo(centerX - 6, centerY + 2);
        graphics.lineTo(centerX + 6, centerY + 2);
        graphics.lineTo(centerX, centerY + 8);
        graphics.closePath();
        graphics.fillPath();
        
        // Google G
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 3, centerY - 10, 6, 1);
        graphics.fillRect(centerX - 3, centerY - 10, 1, 3);
        graphics.fillRect(centerX - 3, centerY - 8, 4, 1);
        graphics.fillRect(centerX + 1, centerY - 7, 1, 2);
        
        graphics.generateTexture('google_downvote_sprite', size, size);
        graphics.clear();
    }
    
    createHatSprites(graphics) {
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Baseball cap
        const capBlue = 0x1e3a8a; // Navy blue
        const white = 0xffffff;   // White outline
        
        // Cap crown (main dome part) - blue
        graphics.fillStyle(capBlue, 1);
        graphics.fillEllipse(centerX, centerY - 2, 18, 12);
        
        // Cap brim (visor) - blue
        graphics.fillStyle(capBlue, 1);
        graphics.fillEllipse(centerX, centerY + 3, 24, 8);
        
        // White outline for visibility
        graphics.lineStyle(2, white, 1);
        graphics.strokeEllipse(centerX, centerY - 2, 18, 12); // Crown outline
        graphics.strokeEllipse(centerX, centerY + 3, 24, 8);   // Brim outline
        
        // Cap button on top (small white circle)
        graphics.fillStyle(white, 1);
        graphics.fillCircle(centerX, centerY - 6, 2);
        
        // Reset line style
        graphics.lineStyle(0);
        
        graphics.generateTexture('hat_sprite', size, size);
        graphics.clear();
    }
    
    createUISprites(graphics) {
        const size = 16;
        
        // Dot
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(8, 8, 2);
        graphics.generateTexture('dot_sprite', size, size);
        graphics.clear();
        
        // Power Pellet
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(8, 8, 6);
        graphics.generateTexture('power_pellet_sprite', size, size);
        graphics.clear();
        
        // Wall tile
        graphics.fillStyle(0x0000ff, 1);
        graphics.fillRect(0, 0, size, size);
        graphics.generateTexture('wall_sprite', size, size);
        graphics.clear();
    }
    
    displaySprites() {
        let x = 120;
        let y = 120;
        const spacingX = 180;
        const spacingY = 200;
        const scale = 4;
        const spritesPerRow = 6; // Show 6 sprites per row
        let spriteCount = 0;
        
        // Helper function to add sprite with label to scrollable container
        const addSpriteDisplay = (textureKey, label, category = '') => {
            if (this.textures.exists(textureKey)) {
                const sprite = this.add.image(x, y, textureKey);
                sprite.setScale(scale);
                this.spriteContainer.add(sprite);
                
                // Category label (smaller, above sprite)
                if (category) {
                    const categoryText = this.add.text(x, y - 100, category, {
                        fontSize: '10px',
                        fill: '#888888',
                        fontFamily: 'Arial',
                        align: 'center'
                    }).setOrigin(0.5);
                    this.spriteContainer.add(categoryText);
                }
                
                // Main label (below sprite)
                const labelText = this.add.text(x, y + 90, label, {
                    fontSize: '11px',
                    fill: '#ffffff',
                    fontFamily: 'Arial',
                    align: 'center'
                }).setOrigin(0.5);
                this.spriteContainer.add(labelText);
                
                // Move to next position
                x += spacingX;
                spriteCount++;
                
                if (spriteCount % spritesPerRow === 0) {
                    x = 120;
                    y += spacingY;
                }
            }
        };
        
        // Display all sprites organized by category
        addSpriteDisplay('capman_closed', 'Closed\nPose', 'CAP MAN');
        addSpriteDisplay('capman_half', 'Half\nPose', '');
        addSpriteDisplay('capman_open', 'Open\nPose', '');
        
        // Add spacing for new row
        if (spriteCount % spritesPerRow !== 0) {
            x = 120;
            y += spacingY;
            spriteCount = 0;
        }
        
        addSpriteDisplay('wife_sprite', 'Mrs. Cap Man\n(Wife)', 'FAMILY');
        
        addSpriteDisplay('child1_sprite', 'Child 1\n(Sky Blue)', 'CHILDREN');
        addSpriteDisplay('child2_sprite', 'Child 2\n(Light Green)', '');
        addSpriteDisplay('child3_sprite', 'Child 3\n(Light Coral)', '');
        
        // Add spacing for new row
        if (spriteCount % spritesPerRow !== 0) {
            x = 120;
            y += spacingY;
            spriteCount = 0;
        }
        
        addSpriteDisplay('security_sprite', 'Security\nGuard', 'ENEMIES');
        addSpriteDisplay('yelp_downvote_sprite', 'Yelp\nDownvote', '');
        addSpriteDisplay('google_downvote_sprite', 'Google Reviews\nDownvote', '');
        
        // Add spacing for new row
        if (spriteCount % spritesPerRow !== 0) {
            x = 120;
            y += spacingY;
            spriteCount = 0;
        }
        
        addSpriteDisplay('hat_sprite', 'Hat', 'COLLECTIBLES');
        addSpriteDisplay('dot_sprite', 'Dot', '');
        addSpriteDisplay('power_pellet_sprite', 'Power\nPellet', '');
        addSpriteDisplay('wall_sprite', 'Wall\nTile', 'MAZE');
        
        // Update camera bounds based on actual content size
        this.cameras.main.setBounds(0, 0, Math.max(1200, x + 200), Math.max(1000, y + 200));
    }
    
    update() {
        // Handle camera scrolling with arrow keys
        if (this.cursors.left.isDown) {
            this.cameras.main.scrollX -= this.scrollSpeed;
        } else if (this.cursors.right.isDown) {
            this.cameras.main.scrollX += this.scrollSpeed;
        }
        
        if (this.cursors.up.isDown) {
            this.cameras.main.scrollY -= this.scrollSpeed;
        } else if (this.cursors.down.isDown) {
            this.cameras.main.scrollY += this.scrollSpeed;
        }
        
        // Handle return to game
        if (this.input.keyboard.addKey('I').isDown) {
            this.scene.stop();
            this.scene.resume('GameScene');
        }
    }
}