const CELL_SIZE = 5;
const SIMULATION_FPS = 30;
const SIMULATION_INTERVAL = 1000 / SIMULATION_FPS;
const SAVE_FILE = 'sand_saves';
const MAX_SAVE_SLOTS = 5;

let GRID_WIDTH = 800 / CELL_SIZE;
let GRID_HEIGHT = 600 / CELL_SIZE;

let grid = [];
let agents = [];
let currentTool = 0;
let currentAgentType = null;
let currentTheme = 'CORE';
let brushSize = 3;
let globalTemperature = 20;
let currentWeather = 'None';
let globalGravity = 1.0;
let isBuildMode = false;

let canvas, ctx;
let isDrawing = false;
let isSimulationRunning = false;
let backgroundImage = null;

let isPaused = false;

const ELEMENTS = {
    0: { name: 'Empty', color: '#000000', type: 'gas', theme: 'CORE', density: 0.0, heat_cap: 1.0 },
    1: { name: 'Sand', color: '#f2c000', type: 'powder', theme: 'CORE', organic: false, density: 1.5, heat_cap: 0.8 },
    2: { name: 'Water', color: 'rgba(26, 128, 204, 0.8)', type: 'liquid', spread: 3, temp_freeze: 0, freeze_to: 12, temp_boil: 100, boil_to: 10, theme: 'CORE', density: 1.0, heat_cap: 4.2 },
    3: { name: 'Stone', color: '#666666', type: 'solid', theme: 'CORE', temp_melt: 1000, melt_to: 8, organic: false, density: 2.7, heat_cap: 0.7 },
    4: { name: 'Wood', color: '#8c4413', type: 'solid', flammable: true, theme: 'CORE', organic: true, density: 0.6, heat_cap: 1.7 },
    5: { name: 'Fire', color: 'rgba(255, 102, 0, 0.8)', type: 'gas', lift: 1.5, decay: 0.1, heat: 500, theme: 'CORE', density: 0.05, heat_cap: 1.0, spreads_fire: true },
    6: { name: 'Smoke', color: 'rgba(100, 100, 100, 0.4)', type: 'gas', lift: 0.5, decay: 0.05, theme: 'GASES', density: 0.2, heat_cap: 1.0 },
    7: { name: 'Wall', color: '#333333', type: 'solid', theme: 'CORE', temp_melt: 3000, organic: false, density: 5.0, is_immovable: true, heat_cap: 0.6 },
    8: { name: 'Lava', color: '#cc3300', type: 'liquid', spread: 0.5, temp_freeze: 800, freeze_to: 3, heat: 800, theme: 'FLUIDS', density: 2.5, heat_cap: 1.2 },
    9: { name: 'Acid', color: '#00ff00', type: 'liquid', spread: 2, corrosive: true, theme: 'FLUIDS', density: 1.2, heat_cap: 3.0 },
    10: { name: 'Steam', color: 'rgba(170, 170, 255, 0.5)', type: 'gas', lift: 2, temp_freeze: 100, freeze_to: 2, theme: 'GASES', density: 0.5, heat_cap: 2.0 },
    11: { name: 'Seed', color: '#00cc00', type: 'powder', theme: 'PLANTS', organic: true, density: 0.8, heat_cap: 1.5, plant_grow: true },
    12: { name: 'Ice', color: 'rgba(173, 216, 230, 0.8)', type: 'solid', temp_melt: 0, melt_to: 2, theme: 'SOLIDS', organic: false, density: 0.92, heat_cap: 2.1 },
    13: { name: 'Gunpowder', color: '#808080', type: 'powder', flammable: true, theme: 'POWDERS', organic: false, density: 1.6, heat_cap: 0.9 },
    14: { name: 'Oil', color: '#554433', type: 'liquid', spread: 1.5, flammable: true, theme: 'FLUIDS', density: 0.8, heat_cap: 1.7 },
    15: { name: 'Gas', color: 'rgba(255, 255, 0, 0.2)', type: 'gas', lift: 3, flammable: true, theme: 'GASES', density: 0.1, heat_cap: 1.0 },
    16: { name: 'Mercury', color: '#b8b8b8', type: 'liquid', spread: 1, theme: 'FLUIDS', density: 13.5, heat_cap: 0.14 },
    17: { name: 'Salt', color: '#ffffff', type: 'powder', theme: 'POWDERS', organic: false, density: 2.1, heat_cap: 0.8 },
    18: { name: 'Goo', color: '#99ff99', type: 'liquid', spread: 0.1, theme: 'FLUIDS', density: 1.1, heat_cap: 3.5 },
    19: { name: 'Blood', color: '#880000', type: 'liquid', spread: 1, theme: 'FLUIDS', organic: true, density: 1.0, heat_cap: 3.7 },
    20: { name: 'Metal', color: '#999999', type: 'solid', temp_melt: 1500, melt_to: 49, theme: 'SOLIDS', organic: false, density: 7.8, heat_cap: 0.45 },
    21: { name: 'Cement', color: '#cccccc', type: 'powder', theme: 'POWDERS', organic: false, density: 3.1, heat_cap: 0.9 },
    22: { name: 'Concrete', color: '#888888', type: 'solid', temp_melt: 2000, theme: 'SOLIDS', organic: false, density: 2.4, heat_cap: 0.88 },
    23: { name: 'Glass', color: 'rgba(200, 200, 255, 0.2)', type: 'solid', temp_melt: 1700, melt_to: 8, theme: 'SOLIDS', organic: false, density: 2.5, heat_cap: 0.84 },
    24: { name: 'Mud', color: '#664422', type: 'powder', theme: 'POWDERS', organic: true, density: 1.3, heat_cap: 2.5 },
    25: { name: 'Battery', color: '#008800', type: 'solid', theme: 'MACHINES', organic: false, density: 2.0, heat_cap: 0.5 },
    26: { name: 'Insul. Wire', color: '#ffcc00', type: 'solid', theme: 'MACHINES', organic: false, density: 3.0, heat_cap: 0.5 },
    27: { name: 'Generator', color: '#ff0000', type: 'solid', theme: 'ENERGY', organic: false, density: 4.0, heat_cap: 0.5 },
    28: { name: 'Wire', color: '#ffcc00', type: 'solid', theme: 'ENERGY', organic: false, density: 8.9, heat_cap: 0.38 },
    29: { name: 'Battery', color: '#008800', type: 'solid', theme: 'ENERGY', organic: false, density: 2.0, heat_cap: 0.5 },
    30: { name: 'Spark', color: 'rgba(255, 255, 0, 1)', type: 'powder', lift: 0.5, decay: 0.1, heat: 50, theme: 'ENERGY', organic: false, density: 0.01, heat_cap: 1.0, spreads_fire: true },
    31: { name: 'Fuel', color: '#b300b3', type: 'liquid', spread: 2.5, flammable: true, theme: 'FLUIDS', density: 0.7, heat_cap: 2.0 },
    32: { name: 'Poison', color: '#66ff66', type: 'liquid', spread: 1.5, corrosive: true, theme: 'FLUIDS', density: 1.1, heat_cap: 3.0 },
    33: { name: 'Explosion', color: 'rgba(255, 100, 0, 0.9)', type: 'gas', lift: 5, decay: 0.3, heat: 2000, theme: 'ENERGY', organic: false, density: 0.001, heat_cap: 1.0, spreads_fire: true },
    34: { name: 'Snow', color: 'rgba(255, 255, 255, 0.9)', type: 'powder', temp_melt: 0, melt_to: 2, theme: 'POWDERS', organic: false, density: 0.4, heat_cap: 2.0 },
    35: { name: 'Rust', color: '#8b4513', type: 'powder', theme: 'POWDERS', organic: false, density: 5.2, heat_cap: 0.6 },
    36: { name: 'Moss', color: '#006400', type: 'solid', theme: 'PLANTS', organic: true, density: 0.4, heat_cap: 2.5, plant_grow: true },
    37: { name: 'Fibers', color: '#f0f8ff', type: 'powder', flammable: true, theme: 'POWDERS', organic: true, density: 0.3, heat_cap: 1.3 },
    38: { name: 'Pollen', color: '#ffff00', type: 'powder', lift: 0.5, theme: 'POWDERS', organic: true, density: 0.1, heat_cap: 1.0 },
    39: { name: 'Virus', color: '#800080', type: 'liquid', spread: 0.1, theme: 'SPECIAL', organic: true, density: 1.05, heat_cap: 3.8 },
    40: { name: 'Infected Blood', color: '#4b0082', type: 'liquid', spread: 1, theme: 'FLUIDS', organic: true, density: 1.0, heat_cap: 3.7 },
    41: { name: 'Sponge', color: '#ffff99', type: 'solid', theme: 'SPECIAL', organic: true, density: 0.3, absorb: [2, 14, 19], heat_cap: 2.5 },
    42: { name: 'Rubber', color: '#222222', type: 'solid', flammable: true, theme: 'SOLIDS', organic: true, density: 1.1, heat_cap: 1.6 },
    43: { name: 'Rad. Gas', color: 'rgba(255, 255, 51, 0.4)', type: 'gas', lift: 1, decay: 0.05, corrosive: true, theme: 'GASES', density: 0.3, heat_cap: 1.0 },
    44: { name: 'Magma', color: '#ff6600', type: 'liquid', spread: 0.2, temp_freeze: 600, freeze_to: 3, heat: 1000, theme: 'FLUIDS', density: 2.8, heat_cap: 1.2 },
    45: { name: 'Clay', color: '#a0522d', type: 'powder', theme: 'POWDERS', organic: false, density: 1.8, heat_cap: 0.9 },
    46: { name: 'Liq. Nitrogen', color: 'rgba(100, 100, 255, 0.9)', type: 'liquid', lift: 0.5, temp_melt: -196, boil_to: 0, heat: -196, theme: 'FLUIDS', density: 0.8, heat_cap: 2.0, is_cryogenic: true },
    47: { name: 'Plutonium', color: '#00bfff', type: 'solid', heat: 100, theme: 'MINERALS', organic: false, density: 19.8, heat_cap: 0.13 },
    48: { name: 'Caoutchouc', color: '#222222', type: 'solid', flammable: true, theme: 'SOLIDS', organic: true, density: 0.95, heat_cap: 1.6 },
    49: { name: 'Liq. Metal', color: '#777777', type: 'liquid', spread: 1, temp_freeze: 1500, freeze_to: 20, heat: 1500, theme: 'FLUIDS', density: 9.0, heat_cap: 0.45 },
    50: { name: 'Crayon', color: '#ffa500', type: 'solid', theme: 'SPECIAL', organic: true, density: 1.0, heat_cap: 1.8 },
    51: { name: 'Wolf (Agent)', color: '#8c8c8c', type: 'solid', theme: 'CREATIVE', organic: true, health: 80, is_agent_type: 'Wolf', density: 1.0, heat_cap: 3.7 },
    52: { name: 'Ash', color: '#3c3c3c', type: 'powder', theme: 'POWDERS', organic: false, density: 0.5, heat_cap: 0.8 },
    53: { name: 'Methane', color: 'rgba(128, 255, 128, 0.2)', type: 'gas', lift: 1.5, flammable: true, decay: 0.001, theme: 'GASES', density: 0.0006, heat_cap: 2.2 },
    54: { name: 'Sulfur', color: '#ffcc00', type: 'powder', theme: 'POWDERS', flammable: true, density: 2.0, heat_cap: 0.73 },
    55: { name: 'Slime', color: '#00aa00', type: 'liquid', spread: 0.1, theme: 'SPECIAL', organic: true, density: 1.5, heat_cap: 3.5 },
    56: { name: 'Jelly', color: '#ffc0cb', type: 'solid', theme: 'SPECIAL', temp_melt: 50, melt_to: 55, organic: true, density: 1.0, heat_cap: 3.0 },
    57: { name: 'Tear', color: '#a0a0ff', type: 'liquid', spread: 2, theme: 'FLUIDS', organic: true, density: 1.0, heat_cap: 4.2 },
    58: { name: 'Plasma', color: 'rgba(255, 165, 0, 0.7)', type: 'gas', lift: 0.8, heat: 1000, decay: 0.05, theme: 'ENERGY', density: 0.001, heat_cap: 1.0, spreads_fire: true },
    59: { name: 'Lead', color: '#5e6368', type: 'solid', temp_melt: 327, melt_to: 60, theme: 'SOLIDS', density: 11.3, heat_cap: 0.13 },
    60: { name: 'Liq. Lead', color: '#44484d', type: 'liquid', density: 11.3, spread: 0.1, temp_freeze: 327, freeze_to: 59, theme: 'FLUIDS', heat: 350, heat_cap: 0.15 },
    61: { name: 'Magnet', color: '#8800ff', type: 'solid', theme: 'MACHINES', density: 5.0, heat_cap: 0.5 },
    62: { name: 'Transistor', color: '#00ffcc', type: 'solid', theme: 'MACHINES', density: 2.0, heat_cap: 0.5 },
    63: { name: 'Microchip', color: '#8888ff', type: 'solid', theme: 'MACHINES', density: 2.0, heat_cap: 0.5 },
    64: { name: 'Fuse', color: '#ff0000', type: 'solid', flammable: true, theme: 'MACHINES', density: 1.5, heat_cap: 0.5 },
    65: { name: 'Conveyor', color: '#aaaaaa', type: 'solid', theme: 'MACHINES', density: 2.5, heat_cap: 0.5 },
    66: { name: 'Piston', color: '#3333ff', type: 'solid', theme: 'MACHINES', density: 7.0, heat_cap: 0.5 },
    67: { name: 'Filter', color: '#9999ff', type: 'solid', theme: 'MACHINES', density: 2.0, heat_cap: 0.5 },
    68: { name: 'Seedling', color: '#009900', type: 'solid', theme: 'PLANTS', organic: true, density: 0.5, heat_cap: 2.5, plant_grow: true },
    69: { name: 'Sap', color: '#b36a3e', type: 'liquid', spread: 1, theme: 'PLANTS', organic: true, flammable: true, density: 1.0, heat_cap: 2.0 },
    70: { name: 'Algae', color: '#4d8055', type: 'powder', theme: 'PLANTS', organic: true, density: 0.6, heat_cap: 2.5 },
    71: { name: 'Vine', color: '#44aa44', type: 'solid', theme: 'PLANTS', organic: true, density: 0.5, heat_cap: 2.5 },
    72: { name: 'Compost', color: '#332211', type: 'powder', theme: 'POWDERS', organic: true, density: 0.7, heat_cap: 2.0 },
    73: { name: 'Diamond', color: 'rgba(255, 255, 255, 0.1)', type: 'solid', theme: 'MINERALS', temp_melt: 3500, density: 3.5, heat_cap: 0.5 },
    74: { name: 'Emerald', color: '#00cc00', type: 'solid', theme: 'MINERALS', density: 2.7, heat_cap: 0.7 },
    75: { name: 'Ruby', color: '#cc0000', type: 'solid', theme: 'MINERALS', density: 4.0, heat_cap: 0.7 },
    76: { name: 'Dirt', color: '#583e2e', type: 'powder', theme: 'POWDERS', organic: true, density: 1.4, heat_cap: 1.8 },
    77: { name: 'Gravel', color: '#7a7a7a', type: 'powder', theme: 'POWDERS', organic: false, density: 2.5, heat_cap: 0.8 },
    78: { name: 'Quicksand', color: '#998800', type: 'liquid', spread: 0.5, theme: 'SPECIAL', density: 1.5, heat_cap: 1.0 },
    79: { name: 'Bubble', color: 'rgba(255, 255, 255, 0.4)', type: 'gas', lift: 3, decay: 0.02, theme: 'GASES', density: 0.0001, heat_cap: 1.0 },
    80: { name: 'Hole', color: '#000000', type: 'solid', theme: 'SPECIAL', density: 9999, is_immovable: true, heat_cap: 0.0 },
    81: { name: 'Black Oil', color: '#111111', type: 'liquid', spread: 1, flammable: true, density: 0.7, theme: 'FLUIDS', heat: 50, heat_cap: 2.0 },
    82: { name: 'Poison Gas', color: 'rgba(102, 255, 102, 0.3)', type: 'gas', lift: 1, decay: 0.01, corrosive: true, theme: 'GASES', density: 0.4, heat_cap: 1.0 },
    83: { name: 'Mist', color: 'rgba(200, 200, 200, 0.3)', type: 'gas', lift: 0.2, decay: 0.005, theme: 'GASES', density: 0.8, heat_cap: 1.0 },
    84: { name: 'Antimatter', color: '#ff00ff', type: 'powder', theme: 'SPECIAL', heat: 500, decay: 0.5, density: 0.01, heat_cap: 0.0, is_reactive: true },
    85: { name: 'Obsidian', color: '#101010', type: 'solid', theme: 'MINERALS', temp_melt: 1100, melt_to: 44, density: 2.6, heat_cap: 1.0 },
    86: { name: 'Basalt', color: '#252525', type: 'solid', theme: 'MINERALS', density: 2.9, heat_cap: 0.8 },
    87: { name: 'Silt', color: '#443322', type: 'powder', theme: 'POWDERS', organic: true, density: 1.35, heat_cap: 1.8 },
    88: { name: 'Quicklime', color: '#e0e0e0', type: 'powder', theme: 'POWDERS', density: 3.3, heat_cap: 0.9, reacts_with_water: true },
    89: { name: 'Chalk', color: '#ffffff', type: 'powder', theme: 'POWDERS', density: 2.7, heat_cap: 0.9 },
    90: { name: 'Fungus', color: '#6a0dad', type: 'powder', theme: 'PLANTS', organic: true, density: 0.2, heat_cap: 2.5, plant_grow: true },
    91: { name: 'Spore', color: '#cc99ff', type: 'powder', lift: 0.5, theme: 'PLANTS', organic: true, density: 0.05, heat_cap: 1.5, plant_grow: true },
    92: { name: 'Lava Lamp', color: '#ff00ff', type: 'liquid', spread: 0.5, theme: 'SPECIAL', density: 0.95, heat_cap: 3.0 },
    93: { name: 'Gel', color: '#00ffff', type: 'liquid', spread: 0.1, theme: 'SPECIAL', density: 1.0, heat_cap: 3.8 },
    94: { name: 'Tungsten', color: '#4e555b', type: 'solid', temp_melt: 3422, melt_to: 95, theme: 'SOLIDS', density: 19.3, heat_cap: 0.13 },
    95: { name: 'Liq. Tungsten', color: '#3b4247', type: 'liquid', temp_freeze: 3422, freeze_to: 94, theme: 'FLUIDS', heat: 3500, density: 19.3, heat_cap: 0.15 },
    96: { name: 'Insulator', color: '#ffdead', type: 'solid', theme: 'MACHINES', density: 1.0, heat_cap: 2.0 },
    97: { name: 'Detector', color: '#0000ff', type: 'solid', theme: 'MACHINES', density: 2.0, heat_cap: 0.5 },
    98: { name: 'Dust Cloud', color: 'rgba(136, 136, 136, 0.4)', type: 'gas', lift: 0.1, decay: 0.01, theme: 'GASES', density: 0.01, heat_cap: 1.0 },
    99: { name: 'Pheromone', color: 'rgba(255, 192, 203, 0.5)', type: 'gas', lift: 0.5, decay: 0.005, theme: 'SPECIAL', density: 0.005, heat_cap: 1.0 },
    100: { name: 'Rubber Cement', color: '#d2b48c', type: 'liquid', spread: 0.5, flammable: true, theme: 'FLUIDS', density: 0.9, heat_cap: 2.0 },
    101: { name: 'Neutronium', color: '#404040', type: 'solid', theme: 'MINERALS', density: 9999, is_immovable: true, heat_cap: 0.01 },
    102: { name: 'Human (Agent)', color: '#ffcc99', type: 'solid', theme: 'CREATIVE', organic: true, health: 100, is_agent_type: 'Human', density: 1.0, heat_cap: 3.7 },
    103: { name: 'Poem', color: '#ffffff', type: 'solid', theme: 'CREATIVE', organic: true, density: 0.1, heat_cap: 1.0, is_immovable: true },
    104: { name: 'Salt Water', color: 'rgba(64, 160, 255, 0.8)', type: 'liquid', spread: 3, temp_freeze: -21, freeze_to: 12, temp_boil: 108, boil_to: 10, corrosive: true, theme: 'FLUIDS', density: 1.02, heat_cap: 4.1 },
    105: { name: 'Agent Placeholder', color: '#ff00ff', type: 'special', theme: 'CREATIVE', organic: true, is_agent: true, density: 1.0, heat_cap: 3.7 },
    106: { name: 'Meat', color: '#880000', type: 'powder', theme: 'POWDERS', organic: true, food_value: 50, density: 1.2, heat_cap: 2.0 },
    107: { name: 'Wood Log', color: '#6b3e26', type: 'solid', theme: 'SOLIDS', flammable: true, density: 0.7, heat_cap: 1.7 },
    108: { name: 'Mars Soil', color: '#c1440e', type: 'powder', theme: 'MINERALS', density: 1.6, gravity: 0.38, heat_cap: 0.8 },
    109: { name: 'Crystal Surface', color: '#00ffff', type: 'solid', theme: 'MINERALS', temp_melt: 4000, density: 2.6, heat_cap: 0.9 },
    110: { name: 'Lightning', color: 'rgba(255, 255, 0, 1.0)', type: 'gas', lift: 5, decay: 0.05, heat: 5000, theme: 'ENERGY', organic: false, density: 0.001, heat_cap: 1.0, spreads_fire: true },
    111: { name: 'Deep Water', color: 'rgba(0, 51, 102, 0.9)', type: 'liquid', spread: 2, temp_freeze: -1, freeze_to: 115, temp_boil: 100, boil_to: 10, theme: 'FLUIDS', density: 1.05, heat_cap: 4.2 },
    112: { name: 'Permafrost', color: '#a0b0d0', type: 'solid', temp_melt: -5, melt_to: 76, theme: 'COLD', organic: false, density: 1.5, heat_cap: 2.5 },
    113: { name: 'Meteorite', color: '#4d4d4d', type: 'powder', theme: 'MINERALS', heat: 500, density: 7.8, heat_cap: 0.5 },
    114: { name: 'Sun Ray', color: 'rgba(255, 255, 150, 0.5)', type: 'gas', lift: 0, decay: 0.01, heat: 1000, theme: 'ENERGY', organic: false, density: 0.0001, heat_cap: 1.0 },
    115: { name: 'Heavy Ice', color: 'rgba(200, 220, 255, 1.0)', type: 'solid', temp_melt: -10, melt_to: 111, theme: 'COLD', density: 1.2, heat_cap: 2.1 },
    116: { name: 'Rock', color: '#555555', type: 'solid', theme: 'EARTH', temp_melt: 1200, melt_to: 44, organic: false, density: 2.6, heat_cap: 0.7 },
    117: { name: 'Glacier', color: 'rgba(224, 240, 255, 1.0)', type: 'solid', temp_melt: 0, melt_to: 2, theme: 'COLD', density: 0.92, heat_cap: 2.1 },
    118: { name: 'Electric Wire', color: '#ff0000', type: 'solid', theme: 'ENERGY', organic: false, density: 8.9, heat_cap: 0.38 },
    119: { name: 'Plant', color: '#008000', type: 'solid', theme: 'PLANTS', organic: true, density: 0.5, heat_cap: 2.5, flammable: true, plant_grow: true, decay: 0.001 },
    120: { name: 'Nectar', color: '#ffcc66', type: 'liquid', spread: 1.5, theme: 'FLUIDS', organic: true, density: 0.9, heat_cap: 4.0 },
    121: { name: 'Bee (Agent)', color: '#ffeb3b', type: 'gas', theme: 'CREATIVE', organic: true, health: 50, is_agent_type: 'Bee', density: 0.01, heat_cap: 1.0 },
    999: { name: 'Eraser', color: '#444444', type: 'special', theme: 'TOOLS' } // Eraser pseudo-element ID
};

class Agent {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = (type === 'Human') ? 100 : (type === 'Wolf' ? 80 : 50);
        this.hunger = 0;
        this.maxHealth = this.health;
        this.maxHunger = (type === 'Human') ? 1000 : (type === 'Wolf' ? 500 : 300);
        this.color = (type === 'Human') ? '#ffcc99' : (type === 'Wolf' ? '#8c8c8c' : '#ffeb3b');
        this.age = 0;
        this.is_flying = type === 'Bee';
    }

    update(newGrid, agents) {
        this.age++;
        if (this.health <= 0) {
            this.die(newGrid);
            return;
        }

        this.hunger += 1;
        if (this.hunger >= this.maxHunger) {
            this.health -= 5;
        }

        this.applyEnvironmentalDamage(newGrid);
        this.move(newGrid);
        this.interact(newGrid, agents);

        if (this.health > 0) {
            newGrid[this.y][this.x] = 105;
        }
    }

    applyEnvironmentalDamage(newGrid) {
        const elementId = newGrid[this.y][this.x];
        const elementDef = ELEMENTS[elementId];

        if (elementDef.heat && globalTemperature > elementDef.heat_cap * 200 || elementId === 5 || elementId === 8 || elementId === 44 || elementId === 110) {
            this.health -= 15;
        } else if (elementId === 9 || elementId === 32 || elementId === 43) {
            this.health -= 5;
        } else if (elementDef.is_cryogenic && globalTemperature < elementDef.temp_melt) {
            this.health -= 10;
        }
    }

    move(newGrid) {
        if (newGrid[this.y] && newGrid[this.y][this.x] === 105) {
            newGrid[this.y][this.x] = 0;
        }

        let newX = this.x;
        let newY = this.y;

        if (!this.is_flying) {
            if (this.y < GRID_HEIGHT - 2 && (newGrid[this.y + 1][this.x] === 0 || ELEMENTS[newGrid[this.y + 1][this.x]].type === 'liquid')) {
                newY = Math.min(GRID_HEIGHT - 2, this.y + 1);
            }
        }

        let dx = Math.floor(Math.random() * 3) - 1;
        let dy = (this.is_flying || this.type === 'Human') ? (Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 3) - 1) : Math.floor(Math.random() * 3) - 1;

        newX = this.x + dx;
        newY = newY + dy;

        if (newX > 0 && newX < GRID_WIDTH - 1 && newY > 0 && newY < GRID_HEIGHT - 1) {
            const targetElement = newGrid[newY][newX];
            if (targetElement !== 7 && targetElement !== 105 && !ELEMENTS[targetElement].is_immovable) {
                this.x = newX;
                this.y = newY;
            }
        }
    }

    interact(newGrid, agents) {
        if (this.hunger < this.maxHunger * 0.2) return;

        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const ny = this.y + dy;
                const nx = this.x + dx;
                if (nx < 1 || nx >= GRID_WIDTH - 1 || ny < 1 || ny >= GRID_HEIGHT - 1) continue;

                const neighbor = newGrid[ny][nx];

                if (this.type === 'Human') {
                    if (neighbor === 106) {
                        newGrid[ny][nx] = 0;
                        this.hunger = Math.max(0, this.hunger - ELEMENTS[106].food_value);
                        return;
                    }
                    if (neighbor === 4) {
                        newGrid[ny][nx] = 107;
                        this.hunger = Math.max(0, this.hunger - 10);
                        return;
                    }

                    const targetAgent = agents.find(a => a.x === nx && a.y === ny && a.type === 'Wolf');
                    if (targetAgent) {
                        targetAgent.health -= 10;
                        this.health -= 1;
                        return;
                    }
                }

                if (this.type === 'Wolf') {
                    if (neighbor === 106) {
                         newGrid[ny][nx] = 0;
                         this.hunger = Math.max(0, this.hunger - ELEMENTS[106].food_value);
                         return;
                    }
                    const targetAgent = agents.find(a => a.x === nx && a.y === ny && a.type === 'Human');
                    if (targetAgent) {
                        targetAgent.health -= 20;
                        this.health -= 2;
                        return;
                    }
                }

                if (this.type === 'Bee') {
                    if (neighbor === 120) {
                        newGrid[ny][nx] = 0;
                        this.hunger = Math.max(0, this.hunger - 100);
                        return;
                    }
                    if (neighbor === 119) {
                        if (Math.random() < 0.01) {
                             newGrid[ny][nx] = 120;
                        }
                        this.health -= 0.1;
                    }
                }
            }
        }
    }

    die(newGrid) {
        if (newGrid[this.y] && newGrid[this.y][this.x] === 105) {
            if (this.type === 'Wolf') {
                newGrid[this.y][this.x] = 106;
            } else if (this.type === 'Human') {
                newGrid[this.y][this.x] = 19;
            } else if (this.type === 'Bee') {
                newGrid[this.y][this.x] = 0;
            } else {
                newGrid[this.y][this.x] = 0;
            }
        }
    }
}


const THEMES = {
    'CORE': [1, 2, 3, 4, 5, 8, 9, 7],
    'FIRE': [5, 8, 33, 58, 110],
    'WATER': [2, 9, 14, 16, 18, 19, 31, 32, 40, 44, 46, 49, 57, 60, 69, 78, 81, 92, 93, 95, 100, 104, 111, 120],
    'EARTH': [1, 3, 45, 76, 77, 85, 86, 116, 108],
    'COLD': [12, 34, 46, 112, 115, 117],
    'POWDERS': [1, 13, 17, 21, 24, 34, 35, 37, 38, 45, 52, 54, 70, 72, 76, 77, 87, 88, 89, 90, 91, 106, 113],
    'SOLIDS': [3, 4, 7, 12, 20, 22, 23, 42, 48, 56, 59, 71, 94, 107, 112, 115, 116, 117, 119],
    'GASES': [6, 10, 15, 33, 43, 53, 58, 79, 82, 83, 98, 99],
    'ENERGY': [5, 13, 27, 28, 29, 30, 31, 33, 58, 110, 114, 118],
    'PLANTS': [11, 36, 38, 68, 69, 70, 71, 90, 91, 119, 120],
    'SPECIAL': [39, 41, 50, 55, 56, 78, 80, 84, 92, 93, 99],
    'MACHINES': [25, 26, 61, 62, 63, 64, 65, 66, 67, 96, 97, 118],
    'MINERALS': [47, 73, 74, 75, 85, 86, 101, 108, 109, 113],
    'CREATIVE': [51, 102, 103, 105, 121],
    'TOOLS': [999, 0] // Added for eraser/empty selection
};

const POEMS = [
    "Sand runs, like time through fingers.",
    "Water flows, lava burns - the world is never silent.",
    "Stone is silent, but remembers all storms.",
    "Metal shines in the reflection of fire.",
    "Snow melts, leaving only the tears of water.",
    "Beneath the sky of simulation, ideas are born.",
    "The poet left a verse, like a trace in the sand."
];

function togglePause() {
    isPaused = !isPaused;
    const button = document.getElementById('pause-button');
    if (isPaused) {
        button.textContent = '▶️ Resume';
    } else {
        button.textContent = '⏸️ Pause';
    }
}

function startGame() {
    initGrid();
    setupCanvas();
    setupControls();

    document.getElementById('controls-container').style.display = 'flex';
    setWeather('None');

    document.getElementById('build-mode-button').onclick = toggleBuildMode;
    document.getElementById('pause-button').onclick = togglePause;

    if (!isSimulationRunning) {
        isSimulationRunning = true;
        function runSimulationLoop() {
            if (!isPaused) {
                updateSimulation();
            }
            draw();
            if (isSimulationRunning) {
                setTimeout(() => requestAnimationFrame(runSimulationLoop), SIMULATION_INTERVAL);
            }
        }
        requestAnimationFrame(runSimulationLoop);
    }
}

function initGrid() {
    grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            grid[y][x] = 0;
            if (y === 0 || y === GRID_HEIGHT - 1 || x === 0 || x === GRID_WIDTH - 1) {
                grid[y][x] = 7;
            }
        }
    }

    agents = [];
    spawnInitialAgents();
}

function spawnInitialAgents() {
    for (let i = 0; i < 3; i++) {
        let x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (GRID_HEIGHT * 0.5)) + GRID_HEIGHT * 0.25;
        agents.push(new Agent(x, y, 'Human'));
        grid[y][x] = 105;
    }
    for (let i = 0; i < 2; i++) {
        let x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (GRID_HEIGHT * 0.5)) + GRID_HEIGHT * 0.25;
        agents.push(new Agent(x, y, 'Wolf'));
        grid[y][x] = 105;
    }
    for (let i = 0; i < 5; i++) {
        let x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (GRID_HEIGHT * 0.25)) + 1;
        agents.push(new Agent(x, y, 'Bee'));
        grid[y][x] = 105;
    }
}

function setupCanvas() {
    canvas = document.getElementById('sandCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = GRID_WIDTH * CELL_SIZE;
    canvas.height = GRID_HEIGHT * CELL_SIZE;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', drawOnCanvas);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('click', checkPoemClick);

    canvas.addEventListener('touchstart', startDrawingTouch);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchmove', drawOnCanvasTouch);

    document.getElementById('background-image-upload').addEventListener('change', handleImageUpload);
    document.getElementById('gravity-slider').addEventListener('input', updateGravity);
}

function checkPoemClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    if (gridX > 0 && gridX < GRID_WIDTH - 1 && gridY > 0 && gridY < GRID_HEIGHT - 1) {
        if (grid[gridY][gridX] === 103) {
            const poem = POEMS[Math.floor(Math.random() * POEMS.length)];
            openPoemModal(poem);
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            backgroundImage = new Image();
            backgroundImage.onload = function() {
                draw();
            };
            backgroundImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function setupControls() {
    const themeControlsDiv = document.getElementById('element-theme-controls');
    themeControlsDiv.innerHTML = '';

    const themeNames = Object.keys(THEMES);
    themeNames.forEach(themeName => {
        const button = document.createElement('button');
        button.className = 'tool-button theme-button';
        button.textContent = themeName;
        button.onclick = () => {
            currentTheme = themeName;
            setupElementButtons(themeName);
        };
        themeControlsDiv.appendChild(button);
    });

    setupElementButtons(currentTheme);
    setupEraserButton(); // Setup the dedicated Eraser button
}

function setupEraserButton() {
    const controlsDiv = document.getElementById('global-controls');
    const eraserButton = document.createElement('button');
    eraserButton.className = 'tool-button eraser-button';
    eraserButton.textContent = '🧼 Eraser';
    eraserButton.onclick = () => {
        currentTool = 999; // Special ID for Eraser
        currentAgentType = null;
        document.querySelectorAll('.element-button').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.eraser-button').forEach(btn => btn.classList.add('selected'));
    };
    controlsDiv.insertBefore(eraserButton, controlsDiv.querySelector('#build-mode-button').nextSibling); // Insert next to Build Mode

    // Check if the current tool is already the eraser to select it on load
    if (currentTool === 999) {
        eraserButton.classList.add('selected');
    }
}


function setupElementButtons(themeName) {
    const controlsDiv = document.getElementById('controls');
    controlsDiv.innerHTML = '';
    currentAgentType = null;

    const elementIds = THEMES[themeName] || [];

    elementIds.forEach(id => {
        const element = ELEMENTS[id];
        // Skip the special Eraser ID here
        if (id === 999) return;

        const button = document.createElement('button');
        button.className = 'tool-button element-button';
        button.style.backgroundColor = element.color.replace(/, [\d\.]+?\)/, ', 1)');
        button.textContent = element.name;

        button.onclick = () => {
            currentTool = id;
            currentAgentType = element.is_agent_type || null;
            document.querySelectorAll('.element-button').forEach(btn => btn.classList.remove('selected'));
            document.querySelectorAll('.eraser-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        };
        controlsDiv.appendChild(button);
    });

    if (elementIds.length > 0 && currentTool !== 999) {
        currentTool = elementIds[0];
        const firstButton = controlsDiv.querySelector('.element-button');
        if (firstButton) {
            firstButton.classList.add('selected');
        }
    }
}

function toggleBuildMode() {
    isBuildMode = !isBuildMode;
    const button = document.getElementById('build-mode-button');
    if (isBuildMode) {
        button.classList.add('selected-build');
        button.textContent = '🧱 Build Mode: ON';
    } else {
        button.classList.remove('selected-build');
        button.textContent = '📐 Build Mode: OFF';
    }
}


function startDrawing(e) {
    isDrawing = true;
    drawOnCanvas(e);
}

function drawOnCanvas(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    placeElement(gridX, gridY, currentTool, brushSize);
}

function startDrawingTouch(e) {
    e.preventDefault();
    isDrawing = true;
    drawOnCanvasTouch(e);
}

function drawOnCanvasTouch(e) {
    e.preventDefault();
    if (!isDrawing || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    placeElement(gridX, gridY, currentTool, brushSize);
}

function stopDrawing() {
    isDrawing = false;
}

function placeElement(gridX, gridY, elementId, size) {
    const radius = Math.floor(size / 2);

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = gridX + dx;
            const y = gridY + dy;

            if (x > 0 && x < GRID_WIDTH - 1 && y > 0 && y < GRID_HEIGHT - 1) {
                // ERASER LOGIC (ID 999)
                if (elementId === 999) {
                    if (grid[y][x] !== 7) { // Cannot erase the border wall
                        if (grid[y][x] === 105) {
                            agents = agents.filter(a => a.x !== x || a.y !== y);
                        }
                        grid[y][x] = 0; // Set to Empty
                    }
                    continue;
                }

                // Normal Element/Agent placement logic
                const elementDef = ELEMENTS[elementId];

                if (ELEMENTS[grid[y][x]].is_immovable && elementId !== grid[y][x]) continue;

                if (currentAgentType) {
                    if (grid[y][x] === 0 || ELEMENTS[grid[y][x]].type === 'gas') {
                        agents.push(new Agent(x, y, currentAgentType));
                        grid[y][x] = 105;
                    }
                } else if (isBuildMode && elementDef.type === 'solid') {
                    if (grid[y][x] === 0 || ELEMENTS[grid[y][x]].type === 'gas' || grid[y][x] === 105) {
                        if (grid[y][x] === 105) {
                            agents = agents.filter(a => a.x !== x || a.y !== y);
                        }
                        grid[y][x] = elementId;
                    }
                } else if (grid[y][x] === 0 || ELEMENTS[grid[y][x]].type === 'gas' || grid[y][x] === 105) {
                    if (grid[y][x] === 105) {
                        agents = agents.filter(a => a.x !== x || a.y !== y);
                    }
                    grid[y][x] = elementId;
                }
            }
        }
    }
}

function draw() {
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const element = grid[y][x];
            if (element !== 0) {
                const elementDef = ELEMENTS[element];
                let color = elementDef.color;

                if (element === 105) {
                    const agent = agents.find(a => a.x === x && a.y === y);
                    if (agent) {
                        color = agent.color;
                    }
                }

                ctx.fillStyle = color;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function applyWeather(newGrid) {
    if (currentWeather === 'Rain' || currentWeather === 'Thunderstorm') {
        if (Math.random() < 0.1) {
            let x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
            if (grid[1][x] === 0) {
                newGrid[1][x] = 2;
            }
        }
    }

    if (currentWeather === 'Snow') {
        if (Math.random() < 0.1) {
            let x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
            if (grid[1][x] === 0) {
                newGrid[1][x] = 34;
            }
        }
    }

    if (currentWeather === 'Thunderstorm') {
        if (Math.random() < 0.0005) {
            let x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
            let y = Math.floor(Math.random() * GRID_HEIGHT * 0.2) + 1;
            if (grid[y][x] !== 7) {
                newGrid[y][x] = 110;
            }
        }
    }
}

function updateSimulation() {
    let newGrid = JSON.parse(JSON.stringify(grid));

    const agentsToKeep = [];
    for (const agent of agents) {
        if (agent.health > 0) {
            agent.update(newGrid, agents);
            if (agent.health > 0) {
                agentsToKeep.push(agent);
            }
        }
    }
    agents = agentsToKeep;

    applyWeather(newGrid);

    function swap(gy, gx, ny, nx) {
        const temp = newGrid[gy][gx];
        newGrid[gy][gx] = newGrid[ny][nx];
        newGrid[ny][nx] = temp;
    }

    for (let y = GRID_HEIGHT - 2; y > 0; y--) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            let element = grid[y][x];
            let elementDef = ELEMENTS[element];

            if (element === 0 || elementDef.type === 'solid' || element === 105 || elementDef.is_immovable) continue;

            let effectiveDensity = elementDef.density || 1.0;
            let effectiveGravity = (grid[y+1][x] === 108 && ELEMENTS[108].gravity) ? ELEMENTS[108].gravity : globalGravity;

            if (grid[y+1][x] === 0 || (ELEMENTS[grid[y+1][x]].type !== 'solid' && !ELEMENTS[grid[y+1][x]].is_immovable && ELEMENTS[grid[y+1][x]].density * effectiveGravity < effectiveDensity)) {
                 swap(y, x, y+1, x);
            } else {
                 let moved = false;
                 let dir = (Math.random() < 0.5) ? -1 : 1;

                 for (let i = 0; i < 2; i++) {
                     let nextX = x + dir;
                     if (nextX >= 1 && nextX < GRID_WIDTH - 1) {
                         if (grid[y+1][nextX] === 0 || (ELEMENTS[grid[y+1][nextX]].type !== 'solid' && !ELEMENTS[grid[y+1][nextX]].is_immovable && ELEMENTS[grid[y+1][nextX]].density * effectiveGravity < effectiveDensity)) {
                             swap(y, x, y+1, nextX);
                             moved = true;
                             break;
                         }
                     }
                     dir *= -1;
                 }

                 if (!moved && elementDef.type === 'liquid') {
                     let spread = elementDef.spread || 1;
                     dir = (Math.random() < 0.5) ? -1 : 1;

                     for (let i = 1; i <= spread; i++) {
                         let nextX = x + dir * i;
                         if (nextX >= 1 && nextX < GRID_WIDTH - 1 && grid[y][nextX] === 0) {
                             swap(y, x, y, nextX);
                             break;
                         }
                     }
                 }
            }
        }
    }

    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            let element = newGrid[y][x];
            let elementDef = ELEMENTS[element];

            if (element === 0 || element === 105 || elementDef.is_immovable) continue;

            if (elementDef.temp_melt && globalTemperature >= elementDef.temp_melt) {
                newGrid[y][x] = elementDef.melt_to;
                continue;
            }
            if (elementDef.temp_freeze && globalTemperature <= elementDef.temp_freeze) {
                newGrid[y][x] = elementDef.freeze_to;
                continue;
            }
            if (elementDef.temp_boil && globalTemperature >= elementDef.temp_boil) {
                newGrid[y][x] = elementDef.boil_to;
                continue;
            }

            if (elementDef.type === 'gas') {
                let effectiveDensity = elementDef.density || 0.1;
                let moved = false;

                if (y > 1 && (grid[y-1][x] === 0 || ELEMENTS[grid[y-1][x]].type === 'gas' && ELEMENTS[grid[y-1][x]].density > effectiveDensity)) {
                    swap(y, x, y-1, x);
                    moved = true;
                }

                if (!moved) {
                    let spread = elementDef.spread || 1;
                    let direction = (Math.random() < 0.5) ? -1 : 1;

                    for (let i = 1; i <= spread; i++) {
                        let nextX = x + direction * i;
                        if (nextX >= 1 && nextX < GRID_WIDTH - 1) {
                            if (grid[y][nextX] === 0 || ELEMENTS[grid[y][nextX]].type === 'gas' && ELEMENTS[grid[y][nextX]].density > effectiveDensity) {
                                swap(y, x, y, nextX);
                                break;
                            }
                        }
                    }
                }
            }

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const ny = y + dy;
                    const nx = x + dx;
                    if (nx < 1 || nx >= GRID_WIDTH - 1 || ny < 1 || ny >= GRID_HEIGHT - 1) continue;

                    const neighbor = grid[ny][nx];
                    const neighborDef = ELEMENTS[neighbor];

                    if (element === 119 && (neighbor === 2 || neighbor === 76)) {
                         if (Math.random() < 0.001 && neighbor === 76) { newGrid[ny][nx] = 119; }
                         if (Math.random() < 0.0001) { newGrid[y][x] = 4; }
                         continue;
                    }
                    if (elementDef.plant_grow) {
                        if (element === 11) {
                             if ((grid[y+1][x] === 2 || grid[y+1][x] === 76) && Math.random() < 0.05) {
                                 newGrid[y][x] = 68;
                             }
                             continue;
                        }
                        if (element === 68) {
                             if ((grid[y+1][x] === 2 || grid[y+1][x] === 76) && Math.random() < 0.005) {
                                 newGrid[y][x] = 4;
                             }
                             continue;
                        }
                    }

                    if (elementDef.spreads_fire || element === 110) {
                        if (neighborDef?.flammable && Math.random() < 0.2) {
                             newGrid[ny][nx] = 5;
                             if (neighbor === 4 || neighbor === 48) newGrid[y][x] = 52;
                             if (neighborDef.type === 'liquid' || neighborDef.type === 'gas') newGrid[y][x] = 6;
                        }
                        if (neighbor === 2) { newGrid[ny][nx] = 10; }
                        if (element === 110 && neighbor === 20) { newGrid[ny][nx] = 49; }
                    }
                    if (element === 114) {
                        if ((neighbor === 12 || neighbor === 34 || neighbor === 115 || neighbor === 117) && Math.random() < 0.05) {
                            newGrid[ny][nx] = ELEMENTS[neighbor].melt_to || 2;
                        }
                    }

                    if (element === 84 && neighbor !== 0 && neighbor !== 3 && neighbor !== 101 && neighbor !== 7) {
                         newGrid[y][x] = 33;
                         newGrid[ny][nx] = 33;
                         continue;
                    }

                    if ((element === 2 && neighbor === 17) || (element === 17 && neighbor === 2)) {
                        newGrid[y][x] = 104; newGrid[ny][nx] = 104; continue;
                    }
                    if ((element === 2 && neighbor === 52 && Math.random() < 0.2) || (element === 52 && neighbor === 2 && Math.random() < 0.2)) {
                        newGrid[y][x] = 24; newGrid[ny][nx] = 24; continue;
                    }
                    if (elementDef.reacts_with_water && neighbor === 2) {
                        newGrid[y][x] = 10; newGrid[ny][nx] = 3; continue;
                    }
                    if (neighborDef?.reacts_with_water && element === 2) {
                         newGrid[y][x] = 10; newGrid[ny][nx] = 3; continue;
                    }
                    if ((element === 2 && neighbor === 21) || (element === 21 && neighbor === 2)) {
                        newGrid[y][x] = 22; newGrid[ny][nx] = 22; continue;
                    }
                    if (((element === 2 || element === 76) && neighbor === 1) || ((element === 1 || element === 76) && neighbor === 2)) {
                         newGrid[y][x] = 24; newGrid[ny][nx] = 24; continue;
                    }
                    if ((element === 113 && neighbor === 2) || (element === 2 && neighbor === 113)) {
                        newGrid[y][x] = 52; newGrid[ny][nx] = 10; continue;
                    }

                    if (element === 80 && neighbor !== 3 && neighbor !== 7 && neighbor !== 101) {
                        newGrid[ny][nx] = 0; continue;
                    }
                    if (elementDef.corrosive) {
                        if (neighborDef?.corrosive === false && neighborDef?.type !== 'gas' && neighbor !== 7 && neighbor !== 101 && Math.random() < 0.005) {
                            newGrid[ny][nx] = 0;
                        }
                    }

                    if (element === 41 && neighborDef?.absorb?.includes(neighbor)) {
                        newGrid[ny][nx] = 0; continue;
                    }
                    if (neighbor === 41 && elementDef?.absorb?.includes(element)) {
                        newGrid[y][x] = 0; continue;
                    }

                    if ((element === 8 || element === 44) && (neighbor === 2 || neighbor === 12 || neighbor === 111)) {
                         newGrid[y][x] = 3; newGrid[ny][nx] = 10;
                         continue;
                    }
                }
            }

            if (elementDef.decay && Math.random() < elementDef.decay) {
                if (element === 5) { newGrid[y][x] = 6; }
                else if (element === 33) { newGrid[y][x] = 58; }
                else if (element === 110) { newGrid[y][x] = 30; }
                else if (element === 119) { newGrid[y][x] = 72; }
                else { newGrid[y][x] = 0; }
            }
        }
    }

    grid = newGrid;
}

function updateBrushSize(value) {
    brushSize = parseInt(value);
    document.getElementById('brushValue').textContent = brushSize;
}

function updateTemperature(value) {
    globalTemperature = parseInt(value);
    document.getElementById('tempValue').textContent = globalTemperature;
}

function updateGravity() {
    globalGravity = parseFloat(document.getElementById('gravity-slider').value);
    document.getElementById('gravityValue').textContent = globalGravity.toFixed(2);
}

function setWeather(type) {
    currentWeather = type;
    document.querySelectorAll('.weather-button').forEach(btn => btn.classList.remove('selected-weather'));
    document.querySelector(`[onclick="setWeather('${type}')"]`).classList.add('selected-weather');
}

function openPoemModal(text) {
    const modal = document.getElementById('poemModal');
    document.getElementById('poemText').textContent = text;
    modal.style.display = 'flex';
}

function closePoemModal() {
    document.getElementById('poemModal').style.display = 'none';
}

function saveGrid(slot) {
    if (typeof(Storage) !== "undefined") {
        const data = {
            grid: grid,
            agents: agents,
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            gravity: globalGravity
        };
        localStorage.setItem(`${SAVE_FILE}_${slot}`, JSON.stringify(data));
        alert(`Simulation saved to slot ${slot}.`);
        closeSaveModal();
    } else {
        alert("Sorry, your browser does not support Web Storage.");
    }
}

function loadGrid(slot) {
    if (typeof(Storage) !== "undefined") {
        const savedData = localStorage.getItem(`${SAVE_FILE}_${slot}`);
        if (savedData) {
            const data = JSON.parse(savedData);

            GRID_WIDTH = data.width;
            GRID_HEIGHT = data.height;
            grid = data.grid;
            agents = data.agents.map(a => Object.assign(new Agent(0, 0, ''), a));
            globalGravity = data.gravity || 1.0;
            document.getElementById('gravity-slider').value = globalGravity;
            document.getElementById('gravityValue').textContent = globalGravity.toFixed(2);

            setupCanvas();
            draw();
            alert(`Simulation loaded from slot ${slot}.`);
        } else {
            alert(`No save data found in slot ${slot}.`);
        }
        closeSaveModal();
    } else {
        alert("Sorry, your browser does not support Web Storage.");
    }
}

function openSaveModal(mode) {
    const modal = document.getElementById('saveModal');
    const saveSlotsDiv = document.getElementById('saveSlots');
    saveSlotsDiv.innerHTML = '';

    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const button = document.createElement('button');
        button.className = 'tool-button save-load-slot';

        const savedData = localStorage.getItem(`${SAVE_FILE}_${i}`);
        const slotContent = savedData ? 'Occupied' : 'Empty';

        button.textContent = `Slot ${i}: (${slotContent})`;

        if (mode === 'save') {
            button.onclick = () => saveGrid(i);
        } else {
            button.onclick = () => loadGrid(i);
        }
        saveSlotsDiv.appendChild(button);
    }

    modal.style.display = 'flex';
}

function closeSaveModal() {
    document.getElementById('saveModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    startGame();
});
