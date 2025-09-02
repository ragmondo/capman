import { GameConfig } from '../config/GameConfig.js';

export class DebugPanel {
    constructor(scene) {
        this.scene = scene;
        this.elements = {};
        this.updateInterval = 100; // Update every 100ms
        this.lastUpdate = 0;
        this.visible = false; // Debug disabled by default
    }

    create() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const panelY = height - GameConfig.UI.DEBUG_PANEL_HEIGHT;
        
        // Create debug panel background
        this.elements.background = this.scene.add.rectangle(
            width / 2,
            panelY + GameConfig.UI.DEBUG_PANEL_HEIGHT / 2,
            width,
            GameConfig.UI.DEBUG_PANEL_HEIGHT,
            0x111111,
            0.8
        );
        this.elements.background.setDepth(150);
        
        // Create border
        this.elements.border = this.scene.add.rectangle(
            width / 2,
            panelY,
            width,
            2,
            0x00ff00
        );
        this.elements.border.setDepth(151);
        
        // Create debug text elements
        const padding = 10;
        const lineHeight = 18;
        const fontSize = '12px';
        const fontFamily = 'monospace';
        const color = '#00ff00';
        
        // Column 1 - Player info
        this.elements.playerPos = this.scene.add.text(
            padding,
            panelY + padding,
            'Player: X:0 Y:0',
            { fontSize, fontFamily, color }
        );
        this.elements.playerPos.setDepth(152);
        
        this.elements.playerGrid = this.scene.add.text(
            padding,
            panelY + padding + lineHeight,
            'Grid: [0,0]',
            { fontSize, fontFamily, color }
        );
        this.elements.playerGrid.setDepth(152);
        
        this.elements.playerState = this.scene.add.text(
            padding,
            panelY + padding + lineHeight * 2,
            'State: Normal',
            { fontSize, fontFamily, color }
        );
        this.elements.playerState.setDepth(152);
        
        // Column 2 - NPC info
        const col2X = width / 3;
        this.elements.npcCount = this.scene.add.text(
            col2X,
            panelY + padding,
            'NPCs: 0',
            { fontSize, fontFamily, color }
        );
        this.elements.npcCount.setDepth(152);
        
        this.elements.npcStates = this.scene.add.text(
            col2X,
            panelY + padding + lineHeight,
            'States: ',
            { fontSize, fontFamily, color }
        );
        this.elements.npcStates.setDepth(152);
        
        this.elements.npcBehaviors = this.scene.add.text(
            col2X,
            panelY + padding + lineHeight * 2,
            'Behaviors: ',
            { fontSize, fontFamily, color }
        );
        this.elements.npcBehaviors.setDepth(152);
        
        // Column 3 - Game info
        const col3X = (width / 3) * 2;
        this.elements.fps = this.scene.add.text(
            col3X,
            panelY + padding,
            'FPS: 0',
            { fontSize, fontFamily, color }
        );
        this.elements.fps.setDepth(152);
        
        this.elements.gameState = this.scene.add.text(
            col3X,
            panelY + padding + lineHeight,
            'Game: Playing',
            { fontSize, fontFamily, color }
        );
        this.elements.gameState.setDepth(152);
        
        this.elements.dotsRemaining = this.scene.add.text(
            col3X,
            panelY + padding + lineHeight * 2,
            'Dots: 0',
            { fontSize, fontFamily, color }
        );
        this.elements.dotsRemaining.setDepth(152);
        
        // Toggle visibility text
        this.elements.toggleHint = this.scene.add.text(
            width - padding - 100,
            panelY + padding,
            'Press D to toggle',
            { fontSize: '10px', fontFamily, color: '#888888' }
        );
        this.elements.toggleHint.setDepth(152);
        
        // Set up keyboard listener for toggle
        this.scene.input.keyboard.on('keydown-D', () => {
            this.toggleVisibility();
        });
        
        // Initialize visibility state
        this.setVisibility(this.visible);
        
        return this;
    }

    update(player, npcs, maze, gameState, inputController) {
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = now;
        
        if (!this.visible) return;
        
        // Update player info
        if (player && player.sprite) {
            const pos = player.getPosition();
            const gridPos = player.getGridPosition(maze);
            const nextDir = inputController ? inputController.getNextDirection() : null;
            
            this.elements.playerPos.setText(
                `Player: X:${Math.round(pos.x)} Y:${Math.round(pos.y)}`
            );
            this.elements.playerGrid.setText(
                `Grid: [${gridPos.x},${gridPos.y}] Dir:${player.direction || 'none'} Next:${nextDir || 'none'}`
            );
            this.elements.playerState.setText(
                `State: ${player.isDead ? 'Dead' : 'Alive'} Speed:${player.speed}`
            );
        }
        
        // Update NPC info
        if (npcs && npcs.length > 0) {
            this.elements.npcCount.setText(`NPCs: ${npcs.length}`);
            
            const states = {};
            const behaviors = {};
            
            npcs.forEach(npc => {
                states[npc.state] = (states[npc.state] || 0) + 1;
                behaviors[npc.behavior] = (behaviors[npc.behavior] || 0) + 1;
            });
            
            const stateText = Object.entries(states)
                .map(([state, count]) => `${state}:${count}`)
                .join(' ');
            this.elements.npcStates.setText(`States: ${stateText}`);
            
            const behaviorText = Object.entries(behaviors)
                .map(([behavior, count]) => `${behavior}:${count}`)
                .join(' ');
            this.elements.npcBehaviors.setText(`Behaviors: ${behaviorText}`);
        } else {
            this.elements.npcCount.setText('NPCs: 0');
            this.elements.npcStates.setText('States: none');
            this.elements.npcBehaviors.setText('Behaviors: none');
        }
        
        // Update game info
        this.elements.fps.setText(`FPS: ${Math.round(this.scene.game.loop.actualFps)}`);
        this.elements.gameState.setText(`Game: ${gameState}`);
        
        if (maze) {
            this.elements.dotsRemaining.setText(`Dots: ${maze.getRemainingDots()}`);
        }
    }

    setVisibility(visible) {
        this.visible = visible;
        const alpha = this.visible ? 1 : 0;
        
        Object.values(this.elements).forEach(element => {
            if (element && element.setAlpha) {
                element.setAlpha(alpha);
            }
        });
        
        // Keep toggle hint visible at reduced opacity when debug is hidden
        if (this.elements.toggleHint) {
            this.elements.toggleHint.setAlpha(this.visible ? 1 : 0.3);
        }
    }

    toggleVisibility() {
        this.setVisibility(!this.visible);
        this.elements.toggleHint.setAlpha(1);
    }

    destroy() {
        Object.values(this.elements).forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
    }
}