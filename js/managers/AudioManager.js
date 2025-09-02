export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.music = {};
        this.isEnabled = true;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.currentMusic = null;
        
        // Don't create audio context immediately on mobile Safari
        // It must be created on user interaction
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (!isMobile) {
            // Desktop: create audio context immediately
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("[AUDIO] Audio context created for desktop, state:", this.audioContext.state);
            } catch (e) {
                console.warn("Web Audio API not supported:", e);
                this.audioContext = null;
            }
        } else {
            // Mobile: defer audio context creation until user interaction
            console.log("[AUDIO] Mobile detected, deferring audio context creation");
            this.audioContext = null;
        }
    }

    create() {
        // This will be populated when actual audio files are added
        
        // Mobile Safari requires audio context to be created and resumed on user interaction
        this.setupMobileAudioSupport();
        
        return this;
    }
    
    setupMobileAudioSupport() {
        const resumeAudio = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log("[AUDIO] Audio context created on user interaction for mobile");
                } catch (e) {
                    console.warn("Failed to create audio context on mobile:", e);
                    return;
                }
            }
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log("[AUDIO] Audio context resumed for mobile");
                    // Play a silent sound to unlock audio on iOS
                    this.unlockiOSAudio();
                }).catch(err => {
                    console.warn("Failed to resume audio context on mobile:", err);
                });
            } else if (this.audioContext.state === 'running') {
                // Still play silent sound to ensure iOS audio is unlocked
                this.unlockiOSAudio();
            }
        };
        
        // Add multiple event listeners for better mobile support
        ['touchstart', 'touchend', 'click', 'keydown', 'pointerdown'].forEach(event => {
            document.addEventListener(event, resumeAudio, { once: true });
        });
        
        // Also add to the canvas/game area specifically
        this.scene.input.on('pointerdown', resumeAudio, { once: true });
    }
    
    unlockiOSAudio() {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        
        try {
            // Create a silent sound to unlock iOS audio
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 440;
            oscillator.type = 'sine';
            
            // Set volume to 0 for silent unlock
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
            
            console.log("[AUDIO] iOS audio unlocked with silent sound");
        } catch (e) {
            console.warn("Failed to unlock iOS audio:", e);
        }
    }

    // Music methods
    playMusic(key, loop = true, volume = null) {
        if (!this.isEnabled) return;
        
        const vol = volume !== null ? volume : this.musicVolume;
        console.log(`[AUDIO] Playing music: ${key} (volume: ${vol}, loop: ${loop})`);
        
        // Stop current music if playing
        if (this.currentMusic) {
            this.stopMusic();
        }
        
        // TODO: Implement actual music playing when files are added
        // this.currentMusic = this.scene.sound.add(key, { volume: vol, loop: loop });
        // this.currentMusic.play();
    }

    stopMusic() {
        if (!this.currentMusic) return;
        
        console.log("[AUDIO] Stopping music");
        // TODO: Implement actual music stopping
        // this.currentMusic.stop();
        this.currentMusic = null;
    }

    fadeOutMusic(duration = 1000) {
        if (!this.currentMusic) return;
        
        console.log(`[AUDIO] Fading out music over ${duration}ms`);
        // TODO: Implement music fade out
        // this.scene.tweens.add({
        //     targets: this.currentMusic,
        //     volume: 0,
        //     duration: duration,
        //     onComplete: () => this.stopMusic()
        // });
    }

    // Simple beep sound generator using Web Audio API
    playBeep(frequency = 440, duration = 200, volume = 0.3, type = 'sine') {
        if (!this.isEnabled) {
            console.log("[AUDIO] Audio disabled, skipping beep");
            return;
        }
        
        if (!this.audioContext) {
            console.warn("[AUDIO] No audio context, skipping beep");
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            console.warn("[AUDIO] Audio context suspended, attempting to resume");
            this.audioContext.resume().then(() => {
                this.playBeep(frequency, duration, volume, type);
            }).catch(err => {
                console.warn("Failed to resume audio context for beep:", err);
            });
            return;
        }
        
        try {
            console.log(`[AUDIO] Playing beep: ${frequency}Hz, ${duration}ms, vol:${volume}, type:${type}`);
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.error("Error playing beep sound:", e);
        }
    }

    // Sound effect methods
    playSound(key, volume = null, rate = 1.0) {
        if (!this.isEnabled) return;
        
        const vol = volume !== null ? volume : this.sfxVolume;
        console.log(`[AUDIO] Playing sound: ${key} (volume: ${vol}, rate: ${rate})`);
        
        // TODO: Implement actual sound playing when files are added
        // const sound = this.scene.sound.add(key, { volume: vol, rate: rate });
        // sound.play();
        // return sound;
    }

    // Specific game sound effects
    playDotEaten() {
        this.playSound('dot_eaten', 0.6);
        // Play simple beep for immediate feedback
        this.playBeep(800, 100, 0.2, 'sine');
    }

    playPowerPelletEaten() {
        this.playSound('power_pellet', 0.8);
        // Play lower, longer beep for power pellet
        this.playBeep(400, 300, 0.3, 'triangle');
    }

    playHatThrown() {
        this.playSound('hat_thrown', 0.7);
    }

    playHatCollected() {
        this.playSound('hat_collected', 0.8);
    }

    playHatStolen() {
        this.playSound('hat_stolen', 0.9);
    }

    playHatDelivered() {
        this.playSound('hat_delivered', 1.0);
    }

    playPlayerDeath() {
        this.playSound('player_death', 0.9);
        // Play classic Pac-Man style death riff
        this.playDeathRiff();
    }
    
    playDeathRiff() {
        if (!this.isEnabled || !this.audioContext) return;
        
        // Classic Pac-Man death melody - descending chromatic notes
        const deathMelody = [
            { freq: 659.26, duration: 150 },  // E5
            { freq: 622.25, duration: 150 },  // Eb5
            { freq: 587.33, duration: 150 },  // D5
            { freq: 554.37, duration: 150 },  // Db5
            { freq: 523.25, duration: 150 },  // C5
            { freq: 493.88, duration: 150 },  // B4
            { freq: 466.16, duration: 150 },  // Bb4
            { freq: 440.00, duration: 150 },  // A4
            { freq: 415.30, duration: 150 },  // Ab4
            { freq: 392.00, duration: 150 },  // G4
            { freq: 369.99, duration: 150 },  // Gb4
            { freq: 349.23, duration: 300 },  // F4 - longer final note
        ];
        
        let currentTime = this.audioContext.currentTime;
        
        deathMelody.forEach((note, index) => {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = note.freq;
                oscillator.type = 'square'; // Classic arcade square wave
                
                // Volume envelope for classic arcade sound
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration / 1000);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration / 1000);
                
                currentTime += note.duration / 1000;
            } catch (e) {
                console.warn("Error playing death riff note:", e);
            }
        });
        
        console.log("[AUDIO] Playing Pac-Man style death riff");
    }

    playSecurityGuardSpawn() {
        this.playSound('security_spawn', 0.8);
    }

    playSecurityGuardLeft() {
        this.playSound('security_left', 0.6);
    }
    
    playSiren() {
        if (!this.isEnabled) {
            console.log("[AUDIO] Audio disabled, skipping siren");
            return;
        }
        
        if (!this.audioContext) {
            console.warn("[AUDIO] No audio context, skipping siren");
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            console.warn("[AUDIO] Audio context suspended, attempting to resume for siren");
            this.audioContext.resume().then(() => {
                this.playSiren();
            }).catch(err => {
                console.warn("Failed to resume audio context for siren:", err);
            });
            return;
        }
        
        // Stop any existing siren
        if (this.sirenInterval) {
            this.stopSiren();
        }
        
        console.log("[AUDIO] Starting police siren");
        
        // Create a police siren sound effect
        this.sirenInterval = setInterval(() => {
            if (!this.isEnabled || !this.audioContext || this.audioContext.state === 'suspended') {
                this.stopSiren();
                return;
            }
            
            try {
                // Alternate between two frequencies for siren effect
                const frequency1 = 800;
                const frequency2 = 600;
                const duration = 250;
                
                // First tone
                const oscillator1 = this.audioContext.createOscillator();
                const gainNode1 = this.audioContext.createGain();
                
                oscillator1.connect(gainNode1);
                gainNode1.connect(this.audioContext.destination);
                
                oscillator1.frequency.value = frequency1;
                oscillator1.type = 'sawtooth'; // Sawtooth wave for more siren-like sound
                
                gainNode1.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
                
                oscillator1.start(this.audioContext.currentTime);
                oscillator1.stop(this.audioContext.currentTime + duration / 1000);
                
                // Second tone after a short delay
                setTimeout(() => {
                    if (!this.isEnabled || !this.audioContext || this.audioContext.state === 'suspended') return;
                    
                    try {
                        const oscillator2 = this.audioContext.createOscillator();
                        const gainNode2 = this.audioContext.createGain();
                        
                        oscillator2.connect(gainNode2);
                        gainNode2.connect(this.audioContext.destination);
                        
                        oscillator2.frequency.value = frequency2;
                        oscillator2.type = 'sawtooth';
                        
                        gainNode2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                        gainNode2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
                        
                        oscillator2.start(this.audioContext.currentTime);
                        oscillator2.stop(this.audioContext.currentTime + duration / 1000);
                    } catch (e) {
                        console.warn("Error playing siren second tone:", e);
                    }
                }, duration);
                
            } catch (e) {
                console.warn("Error playing siren sound:", e);
            }
        }, 500); // Repeat every 500ms
    }
    
    stopSiren() {
        if (this.sirenInterval) {
            clearInterval(this.sirenInterval);
            this.sirenInterval = null;
            console.log("[AUDIO] Police siren stopped");
        }
    }

    playDownvoteSpawn() {
        this.playSound('downvote_spawn', 0.9);
    }

    playYelpKill() {
        this.playSound('yelp_kill', 1.0);
    }

    playGoogleKill() {
        this.playSound('google_kill', 1.0);
    }

    playPongScore() {
        this.playSound('pong_score', 0.7);
        // Play ascending notes for scoring
        this.playBeep(523, 150, 0.3, 'square'); // C5
        setTimeout(() => this.playBeep(659, 150, 0.3, 'square'), 100); // E5  
        setTimeout(() => this.playBeep(784, 300, 0.3, 'square'), 200); // G5
    }

    playPongBounce(paddleType = 'wall') {
        this.playSound('pong_bounce', 0.4);
        
        // Different sounds for different paddles/surfaces
        switch(paddleType) {
            case 'left':
                // Left paddle - lower note (E4)
                this.playBeep(330, 80, 0.25, 'square');
                break;
            case 'right':
                // Right paddle - higher note (A4) 
                this.playBeep(440, 80, 0.25, 'square');
                break;
            case 'wall':
            default:
                // Wall bounce - sharp click
                this.playBeep(1000, 50, 0.2, 'square');
                break;
        }
    }

    playLevelComplete() {
        this.playSound('level_complete', 1.0);
    }

    playGameOver() {
        this.playSound('game_over', 1.0);
    }

    playPause() {
        this.playSound('pause', 0.5);
    }

    playUnpause() {
        this.playSound('unpause', 0.5);
    }

    playMenuSelect() {
        this.playSound('menu_select', 0.6);
    }

    playPlayerMove() {
        this.playSound('player_move', 0.3, 1.2);
    }

    playNPCFrightened() {
        this.playSound('npc_frightened', 0.7);
    }

    playNPCExcited() {
        this.playSound('npc_excited', 0.6);
    }

    playWarning() {
        this.playSound('warning', 0.8);
    }

    playSuccess() {
        this.playSound('success', 0.9);
    }

    playError() {
        this.playSound('error', 0.7);
    }

    // Environment sounds
    playAmbientCrowd() {
        this.playSound('ambient_crowd', 0.3);
    }

    playStadiumCheer() {
        this.playSound('stadium_cheer', 0.6);
    }

    // Settings methods
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        console.log(`[AUDIO] Music volume set to ${this.musicVolume}`);
        
        if (this.currentMusic) {
            // TODO: Update current music volume
            // this.currentMusic.setVolume(this.musicVolume);
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`[AUDIO] SFX volume set to ${this.sfxVolume}`);
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`[AUDIO] Audio ${enabled ? 'enabled' : 'disabled'}`);
        
        if (!enabled && this.currentMusic) {
            this.stopMusic();
        }
    }

    // Debug methods
    listAvailableSounds() {
        console.log("[AUDIO] Available sounds:", Object.keys(this.sounds));
        console.log("[AUDIO] Available music:", Object.keys(this.music));
    }

    testSound(key) {
        console.log(`[AUDIO] Testing sound: ${key}`);
        this.playSound(key);
    }
    
    // Mobile debugging methods
    debugAudioState() {
        console.log("=== AUDIO DEBUG INFO ===");
        console.log("Audio enabled:", this.isEnabled);
        console.log("Audio context exists:", !!this.audioContext);
        if (this.audioContext) {
            console.log("Audio context state:", this.audioContext.state);
            console.log("Audio context sample rate:", this.audioContext.sampleRate);
        }
        console.log("User agent:", navigator.userAgent);
        console.log("Touch support:", 'ontouchstart' in window);
        console.log("========================");
    }
    
    testBeepManual() {
        console.log("[AUDIO TEST] Manual beep test starting...");
        this.debugAudioState();
        
        if (!this.audioContext) {
            console.log("[AUDIO TEST] Creating new audio context...");
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("[AUDIO TEST] Audio context created, state:", this.audioContext.state);
            } catch (e) {
                console.error("[AUDIO TEST] Failed to create audio context:", e);
                return;
            }
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log("[AUDIO TEST] Resuming suspended context...");
            this.audioContext.resume().then(() => {
                console.log("[AUDIO TEST] Context resumed, now playing beep");
                this._playTestBeep();
            }).catch(err => {
                console.error("[AUDIO TEST] Failed to resume context:", err);
            });
        } else {
            this._playTestBeep();
        }
    }
    
    _playTestBeep() {
        try {
            console.log("[AUDIO TEST] Playing test beep...");
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
            
            console.log("[AUDIO TEST] Test beep should be playing now!");
        } catch (e) {
            console.error("[AUDIO TEST] Error playing test beep:", e);
        }
    }
    
    testSirenManual() {
        console.log("[AUDIO TEST] Manual siren test...");
        this.playSiren();
        setTimeout(() => {
            console.log("[AUDIO TEST] Stopping siren...");
            this.stopSiren();
        }, 3000);
    }
}