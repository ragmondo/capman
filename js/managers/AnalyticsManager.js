export class AnalyticsManager {
    constructor() {
        this.isEnabled = typeof gtag === 'function';
        console.log(`[ANALYTICS] Google Analytics ${this.isEnabled ? 'enabled' : 'disabled'}`);
    }
    
    // Game flow events
    gameStarted(level = 1) {
        this.trackEvent('game_start', {
            level: level,
            timestamp: Date.now()
        });
    }
    
    gameOver(score, level, timePlayedSeconds) {
        this.trackEvent('game_over', {
            score: score,
            level: level,
            time_played: timePlayedSeconds,
            timestamp: Date.now()
        });
    }
    
    levelCompleted(level, score, timeForLevel) {
        this.trackEvent('level_complete', {
            level: level,
            score: score,
            time_for_level: timeForLevel,
            timestamp: Date.now()
        });
    }
    
    lifeLost(level, score, causeOfDeath) {
        this.trackEvent('life_lost', {
            level: level,
            score: score,
            cause_of_death: causeOfDeath, // 'security_guard', 'downvote', etc.
            timestamp: Date.now()
        });
    }
    
    // Hat-related events
    hatSnatched(level, score, fromWho = 'child') {
        this.trackEvent('hat_snatched', {
            level: level,
            score: score,
            stolen_from: fromWho,
            timestamp: Date.now()
        });
    }
    
    hatCollected(level, score, method = 'ground') {
        this.trackEvent('hat_collected', {
            level: level,
            score: score,
            collection_method: method, // 'ground', 'thrown'
            timestamp: Date.now()
        });
    }
    
    hatDelivered(level, score, points) {
        this.trackEvent('hat_delivered', {
            level: level,
            score: score,
            points_gained: points,
            timestamp: Date.now()
        });
    }
    
    hatThrown(level, score, trigger = 'pong_score') {
        this.trackEvent('hat_thrown', {
            level: level,
            score: score,
            trigger: trigger, // 'pong_score', 'forced_5_hits'
            timestamp: Date.now()
        });
    }
    
    // NPC interactions
    securityGuardSpawned(level, score, reason = 'hat_stolen') {
        this.trackEvent('security_guard_spawned', {
            level: level,
            score: score,
            spawn_reason: reason,
            timestamp: Date.now()
        });
    }
    
    downvoteSpawned(level, score, type = 'yelp') {
        this.trackEvent('downvote_spawned', {
            level: level,
            score: score,
            downvote_type: type, // 'yelp', 'google'
            timestamp: Date.now()
        });
    }
    
    // Pong game events
    pongScore(level, winner = 'unknown') {
        this.trackEvent('pong_score', {
            level: level,
            winner: winner, // 'left', 'right'
            timestamp: Date.now()
        });
    }
    
    // UI events
    gameStartedFromSplash() {
        this.trackEvent('game_started_from_splash', {
            timestamp: Date.now()
        });
    }
    
    gamePaused(level, score) {
        this.trackEvent('game_paused', {
            level: level,
            score: score,
            timestamp: Date.now()
        });
    }
    
    gameUnpaused(level, score) {
        this.trackEvent('game_unpaused', {
            level: level,
            score: score,
            timestamp: Date.now()
        });
    }
    
    debugPanelToggled(visible) {
        this.trackEvent('debug_panel_toggled', {
            visible: visible,
            timestamp: Date.now()
        });
    }
    
    // Performance events
    performanceIssue(fps, level) {
        this.trackEvent('performance_issue', {
            fps: Math.round(fps),
            level: level,
            user_agent: navigator.userAgent.substring(0, 100), // Truncate for privacy
            timestamp: Date.now()
        });
    }
    
    // Audio events
    audioContextResumed(platform = 'unknown') {
        this.trackEvent('audio_context_resumed', {
            platform: platform, // 'desktop', 'mobile', 'ios'
            timestamp: Date.now()
        });
    }
    
    // Error events
    gameError(errorType, errorMessage) {
        this.trackEvent('game_error', {
            error_type: errorType,
            error_message: errorMessage.substring(0, 200), // Truncate for privacy
            timestamp: Date.now()
        });
    }
    
    // Helper method to track events
    trackEvent(eventName, parameters = {}) {
        if (!this.isEnabled) {
            console.log(`[ANALYTICS] Would track: ${eventName}`, parameters);
            return;
        }
        
        try {
            gtag('event', eventName, parameters);
            console.log(`[ANALYTICS] Tracked: ${eventName}`, parameters);
        } catch (error) {
            console.warn(`[ANALYTICS] Failed to track ${eventName}:`, error);
        }
    }
    
    // Track custom metrics
    setCustomMetric(metricName, value) {
        if (!this.isEnabled) return;
        
        try {
            gtag('config', 'G-971P6GT2WP', {
                'custom_map': {
                    [`custom_metric_${metricName}`]: value
                }
            });
        } catch (error) {
            console.warn(`[ANALYTICS] Failed to set custom metric ${metricName}:`, error);
        }
    }
}