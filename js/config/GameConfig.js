export const GameConfig = {
    TILE_SIZE: 24,
    MAZE_COLS: 19,
    MAZE_ROWS: 21,
    WALL_THICKNESS: 2,
    
    COLORS: {
        WALL: 0x2121ff,
        WALL_STROKE: 0x0000aa,
        DOT: 0xffb8ae,
        POWER_PELLET: 0xffb8ae,
        PACMAN: 0xffff00,
        GHOST_HOUSE: 0xff00ff,
        TENNIS_COURT: 0x40a040,
        TENNIS_LINES: 0xffffff,
        EMPTY: 0x000000,
        UI_TEXT: '#ffffff',
        UI_SCORE: '#ffff00',
        BLINKY: 0xff0000,
        PINKY: 0xffb8ff,
        INKY: 0x00ffff,
        CLYDE: 0xffb851
    },
    
    SPEEDS: {
        PACMAN: 150,
        GHOST: 140,
        FRIGHTENED_GHOST: 75
    },
    
    SCORING: {
        DOT: 10,
        POWER_PELLET: 50,
        GHOST: [200, 400, 800, 1600],
        FRUIT: {
            CHERRY: 100,
            STRAWBERRY: 300,
            ORANGE: 500,
            APPLE: 700,
            MELON: 1000
        }
    },
    
    UI: {
        SCORE_BAR_HEIGHT: 60,
        DEBUG_PANEL_HEIGHT: 80,
        FONT_SIZE: 20,
        PADDING: 10
    },
    
    MOBILE: {
        CONTROL_SIZE: 60,
        CONTROL_OPACITY: 0.3
    }
};

export const MazeData = {
    SIMPLE: {
        cols: 19,
        rows: 21,
        tiles: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
            [0,0,0,1,2,1,5,5,5,5,5,5,5,1,2,1,0,0,0],
            [1,1,1,1,2,1,5,5,5,5,5,5,5,1,2,1,1,1,1],
            [0,0,0,0,2,0,5,5,5,5,5,5,5,0,2,0,0,0,0],
            [1,1,1,1,2,1,5,5,5,5,5,5,5,1,2,1,1,1,1],
            [0,0,0,1,2,1,5,5,5,5,5,5,5,1,2,1,0,0,0],
            [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1],
            [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
            [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    }
};

// Tile types:
// 0 = empty space
// 1 = wall
// 2 = dot
// 3 = power pellet
// 4 = ghost house
// 5 = tennis court