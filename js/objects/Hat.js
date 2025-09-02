import { GameConfig } from '../config/GameConfig.js';

export class Hat {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = null;
        this.gridX = 0;
        this.gridY = 0;
        this.isBeingWorn = false;
        this.wearer = null; // Reference to who is wearing it
        
        // Hat properties
        this.points = 100; // Base points for collecting
        this.isCollected = false;
        this.wasStolen = false; // Track if hat was stolen vs collected
    }
    
    create(x, y) {
        this.createSprite();
        
        this.sprite = this.scene.add.image(x, y, 'hat_sprite');
        this.sprite.setDisplaySize(40, 40); // 2x size
        this.sprite.setDepth(5); // Above maze but below characters
        
        // Convert world position to grid
        const gridPos = this.scene.maze.worldToGrid(x, y);
        this.gridX = gridPos.x;
        this.gridY = gridPos.y;
        
        // Add subtle floating animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add spinning animation
        this.scene.tweens.add({
            targets: this.sprite,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
        
        return this;
    }
    
    createSprite() {
        const graphics = this.scene.add.graphics();
        const size = 32; // Increased from 24 to 32 for better quality at 2x size
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Draw a baseball cap
        const capBlue = 0x1e3a8a; // Navy blue to match Cap Man's shirt
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
        graphics.destroy();
    }
    
    throwToPosition(targetX, targetY, delay = 0) {
        // Animate hat being thrown from paddle to target position
        const startX = this.sprite.x;
        const startY = this.sprite.y;
        
        // Create arc trajectory
        const midX = (startX + targetX) / 2;
        const midY = Math.min(startY, targetY) - 50; // Arc height
        
        this.scene.time.delayedCall(delay, () => {
            // Stop current animations
            this.scene.tweens.killTweensOf(this.sprite);
            
            // Throwing animation with arc
            this.scene.tweens.add({
                targets: this.sprite,
                x: targetX,
                y: targetY,
                duration: 1000,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // Resume floating animation at new position
                    this.scene.tweens.add({
                        targets: this.sprite,
                        y: this.sprite.y - 3,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    // Update grid position
                    const gridPos = this.scene.maze.worldToGrid(targetX, targetY);
                    this.gridX = gridPos.x;
                    this.gridY = gridPos.y;
                    
                    // Emit event that hat has landed
                    this.scene.events.emit('hatLanded', this);
                }
            });
            
            // Add spinning during throw
            this.scene.tweens.add({
                targets: this.sprite,
                rotation: this.sprite.rotation + Math.PI * 4,
                duration: 1000,
                ease: 'Quad.easeOut'
            });
        });
    }
    
    collectBy(character) {
        if (this.isCollected) return false;
        
        this.isCollected = true;
        this.wearer = character;
        this.isBeingWorn = true;
        
        // Hide the ground sprite
        this.sprite.setVisible(false);
        
        // Stop all animations
        this.scene.tweens.killTweensOf(this.sprite);
        
        // Create hat on character's head
        this.attachToCharacter(character);
        
        // Emit collection event
        this.scene.events.emit('hatCollected', {
            hat: this,
            collector: character,
            points: this.points
        });
        
        return true;
    }
    
    attachToCharacter(character) {
        // Create a smaller hat sprite on character's head
        const hatOnHead = this.scene.add.image(0, 0, 'hat_sprite');
        hatOnHead.setDisplaySize(20, 20); // 2x the original 12x12
        hatOnHead.setDepth(15); // Above character
        
        // Position it on character's head
        this.updateHatPosition(hatOnHead, character);
        
        // Store reference
        character.hat = hatOnHead;
        character.hasHat = true;
        
        // Update hat position each frame
        const updateHat = () => {
            if (character.hasHat && character.sprite && hatOnHead.active) {
                this.updateHatPosition(hatOnHead, character);
            }
        };
        
        this.scene.events.on('postupdate', updateHat);
        
        // Clean up when hat is removed
        hatOnHead.removeListener = () => {
            this.scene.events.off('postupdate', updateHat);
        };
    }
    
    updateHatPosition(hatSprite, character) {
        hatSprite.x = character.sprite.x;
        hatSprite.y = character.sprite.y - character.sprite.displayHeight / 2 - 6;
    }
    
    stealFrom(currentWearer, newWearer) {
        if (!this.isBeingWorn || this.wearer !== currentWearer) return false;
        
        // Remove hat from current wearer
        if (currentWearer.hat) {
            currentWearer.hat.removeListener();
            currentWearer.hat.destroy();
            currentWearer.hat = null;
            currentWearer.hasHat = false;
        }
        
        // Give to new wearer
        this.wearer = newWearer;
        this.attachToCharacter(newWearer);
        
        // Mark as stolen
        this.wasStolen = true;
        
        // Emit stealing event
        this.scene.events.emit('hatStolen', {
            hat: this,
            previousOwner: currentWearer,
            newOwner: newWearer,
            points: this.points * 2 // Double points for stealing!
        });
        
        return true;
    }
    
    getPosition() {
        // If hat is being worn, return the wearer's position
        if (this.isBeingWorn && this.wearer && this.wearer.sprite) {
            const wearerGrid = this.scene.maze.worldToGrid(this.wearer.sprite.x, this.wearer.sprite.y);
            return {
                x: this.wearer.sprite.x,
                y: this.wearer.sprite.y,
                gridX: wearerGrid.x,
                gridY: wearerGrid.y
            };
        }
        
        // Otherwise return the sprite's position
        return {
            x: this.sprite.x,
            y: this.sprite.y,
            gridX: this.gridX,
            gridY: this.gridY
        };
    }
    
    isAtPosition(gridX, gridY) {
        // If hat is being worn, it's not available for collection from the ground
        if (this.isBeingWorn) return false;
        
        return this.gridX === gridX && this.gridY === gridY && !this.isCollected;
    }
    
    destroy() {
        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);
            this.sprite.destroy();
        }
        
        // Clean up hat on character if wearing
        if (this.wearer && this.wearer.hat) {
            this.wearer.hat.removeListener();
            this.wearer.hat.destroy();
            this.wearer.hat = null;
            this.wearer.hasHat = false;
        }
    }
}