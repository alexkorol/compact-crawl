# Browser Roguelike Design Document

## Project Overview

This document outlines the architecture and design for a browser-based roguelike game inspired by Dungeon Crawl Stone Soup (DCSS), but with a smaller scope to fit within a 10-file constraint. The game leverages HTML5 Canvas and JavaScript to create a turn-based dungeon crawler with procedural generation and infinite exploration capabilities.

## Current Implementation Status

- [x] Title screen with ASCII art logo
- [x] Basic project structure and files
- [x] rot.js integration
- [x] Game map generation with proper boundaries
- [x] Player movement mechanics
- [ ] Proper dungeon generation with rooms (in progress)
- [ ] Basic combat system (in progress)
- [ ] Monster AI (in progress)
- [ ] Items and inventory
- [ ] Game progression

## Recent Fixes & Improvements

### Map Boundary Fixes
- Fixed issue with missing right and bottom walls where player could move into undefined areas
- Properly calculated map bounds based on UI space constraints
- Set explicit right wall boundary at x=75 (instead of using display width)
- Added debugging logs for wall generation to verify boundaries
- Added robust movement validation to prevent out-of-bounds movement

### UI Improvements
- Fixed title screen input handling to properly transition to game
- Improved message display in the game area
- Created clear separation between game area and UI elements
- Made sure UI elements don't cover gameplay area
- Added consistent visual styling for walls, floors, and entities

### Core Game Loop Fixes
- Fixed player movement and turn handling
- Implemented proper FOV calculation
- Ensured proper display of visible vs. explored tiles
- Added better logging for debugging

### Key Technical Insights
1. **Proper Boundary Calculation**: The game needed explicit calculation of playable area boundaries that:
   - Accounted for top UI space (2 rows)
   - Accounted for bottom message area (3 rows + 1 divider)
   - Restricted right boundary to x=75 to ensure visibility
   - Used inclusive bounds (minX/maxX, minY/maxY) for clarity

2. **Multiple Validation Layers**: Player movement needed multiple checks:
   - Bounds check (x/y within valid map area)
   - Map content check (tile exists in the map)
   - Tile type check (only allow movement to floor tiles)

3. **Consistent Drawing Order**:
   - Draw UI background first
   - Draw map tiles
   - Draw items on top of map
   - Draw entities on top of items
   - Draw player last (always visible)
   - Draw UI elements and text

## Core Design Philosophy

- **Minimalist Codebase**: All game code, documentation, and design must fit within 10 files.
- **Procedural Generation**: Dynamic, replayable content through algorithmic level creation.
- **Turn-Based Gameplay**: Strategic combat without time pressure.
- **Permadeath**: True to roguelike tradition, death is permanent.
- **Branching Exploration**: Multiple dungeon paths with varied difficulty and rewards.
- **Infinite Branches**: Some dungeon branches can be explored infinitely.

## System Architecture

The game is structured across several interconnected systems:

### File Structure

1. `index.html` - Main container and game entry point
2. `game.js` - Core game engine and main loop
3. `entities.js` - Player, monster, and item definitions
4. `dungeons.js` - Dungeon generation systems
5. `ui.js` - User interface rendering and input handling
6. `assets.js` - Asset management for graphics and sounds
7. `DESIGN.md` - This design document
8. `README.md` - Installation and getting started guide
9. `utils.js` - Utility functions and algorithms
10. `data.js` - Game data and configuration

### Architecture Diagram

```mermaid
flowchart TB
    index[index.html] --> game[game.js]
    game --> entities[entities.js]
    game --> dungeons[dungeons.js]
    game --> ui[ui.js]
    
    subgraph CoreEngine["Core Engine (game.js)"]
        GameLoop[Game Loop]
        StateManager[State Manager]
    end
    
    subgraph EntitySystem["Entity System (entities.js)"]
        Player[Player]
        Monsters[Monsters]
        Items[Items]
    end
    
    subgraph DungeonSystem["Dungeon Generation (dungeons.js)"]
        Generator[Generator]
        Standard[Standard Dungeons]
        Infinite[Infinite Branches]
    end
    
    subgraph UISystem["UI System (ui.js)"]
        Renderer[Renderer]
        InputHandler[Input Handler]
        Screens[Game Screens]
    end
    
    subgraph Support["Supporting Files"]
        utils[utils.js]
        data[data.js]
        assets[assets.js]
        design[DESIGN.md]
        readme[README.md]
    end
    
    entities --> Player & Monsters & Items
    dungeons --> Generator & Standard & Infinite
    ui --> Renderer & InputHandler & Screens
    
    style CoreEngine fill:#e6ffe6,stroke:#228b22
    style EntitySystem fill:#fff0f5,stroke:#ff69b4
    style DungeonSystem fill:#e6e6ff,stroke:#4169e1
    style UISystem fill:#fff5e6,stroke:#ff8c00
    style Support fill:#f5f5dc,stroke:#8b8970
```

### Class Relationships

```mermaid
classDiagram
    Entity <|-- Player
    Entity <|-- Monster
    Entity <|-- Item
    
    Game --> Player
    Game --> Dungeon
    Game --> UI
    
    Dungeon --> Level
    Dungeon --> InfiniteBranch
    
    Level --> Entity
    Player --> Item
    
    class Game {
        +update()
        +render()
    }
    
    class Entity {
        +position
        +update()
    }
    
    class Player {
        +inventory
        +move()
    }
    
    class Monster {
        +ai
        +attack()
    }
    
    class Item {
        +effect
        +use()
    }
    
    class Dungeon {
        +levels
        +generate()
    }
    
    class Level {
        +grid
        +entities
    }
    
    class InfiniteBranch {
        +seed
        +generate()
    }
    
    class UI {
        +render()
        +input()
    }
```

### Data Flow

```mermaid
flowchart TB
    %% Define styles
    classDef user fill:#f9f9f9,stroke:#333,stroke-width:2px
    classDef browser fill:#d4f1f9,stroke:#5bc0de,stroke-width:2px
    classDef gameLoop fill:#e6ffe6,stroke:#228b22,stroke-width:2px
    classDef gameState fill:#fff0f5,stroke:#ff69b4,stroke-width:2px
    classDef dungeon fill:#e6e6ff,stroke:#4169e1,stroke-width:2px
    
    User([User]) <--> |Input/Output| Browser
    
    %% Arrange in vertical layout
    Browser --> Input
    GameJS --> GameLoop
    Update --> GameState
    GameState --> Render
    GameJS --> DungeonGeneration
    DungeonGeneration --> GameState
    Render --> UI
    UI --> HTML

    subgraph Browser["Browser Environment"]
        HTML[index.html]
        GameJS[game.js]
        UI[ui.js]
    end
    
    Input[Input Processing] --> GameJS
    
    subgraph GameLoop["Game Loop"]
        Input --> Update[Update Game State]
        Update --> Render[Render Game]
        Render --> |Next Frame| Input
    end
    
    subgraph GameState["Game State"]
        Player[Player State]
        Entities[Entities State]
        CurrentDungeon[Current Dungeon]
        
        Player --> |Interacts with| Entities
        Player --> |Explores| CurrentDungeon
        CurrentDungeon --> |Contains| Entities
    end
    
    subgraph DungeonGeneration["Dungeon Generation"]
        Generator[Dungeon Generator]
        BranchManager[Branch Manager]
        InfiniteGen[Infinite Dungeon Generator]
        
        Generator --> BranchManager
        BranchManager --> InfiniteGen
    end
    
    %% Apply styles
    class User user
    class Browser,HTML,GameJS,UI browser
    class GameLoop,Input,Update,Render gameLoop
    class GameState,Player,Entities,CurrentDungeon gameState
    class DungeonGeneration,Generator,BranchManager,InfiniteGen dungeon
```

### Infinite Dungeon Generation

```mermaid
flowchart TB
    Enter[Player Enters Branch] --> CheckType{Branch Type?}
    CheckType -->|Standard| FixedGen[Generate Fixed Levels]
    CheckType -->|Infinite| InfiniteGen[Initialize Infinite Branch]
    
    InfiniteGen --> SetSeed[Set Deterministic Seed]
    SetSeed --> SetRules[Apply Branch-Specific Rules]
    
    SetRules --> Abyss[Abyss-like Branch]
    SetRules --> Pandemonium[Pandemonium-like Branch]
    
    Abyss --- AbyssFeatures[Shifting walls<br>Unpredictable exits<br>Visual distortion]
    Pandemonium --- PandemoniumFeatures[Themed chambers<br>Mini-bosses<br>Unique rewards]
    
    PlayerMove[Player Moves] --> CheckBoundary{Near boundary?}
    CheckBoundary -->|No| NoAction[No Generation Action]
    CheckBoundary -->|Yes| GenerateNew[Generate New Region]
    
    GenerateNew --> MaintainContext[Maintain Gameplay Context]
    GenerateNew --> PruneOld[Prune Distant Regions]
    
    MaintainContext --> GenerationRules[Apply Generation Rules]
    GenerationRules --> BiomeRules[Biome/Theme Rules]
    GenerationRules --> DifficultyScaling[Difficulty Scaling]
    GenerationRules --> ItemGeneration[Item Generation]
    GenerationRules --> MonsterGeneration[Monster Population]
    
    DifficultyScaling --- DifficultyFeatures[Scales with depth<br>Adapts to player stats]
    
    PruneOld --> StoreState[Store Entity States]
    PruneOld --> RemoveGeometry[Remove Geometry]
    PlayerReturn[Player Returns] --> RestoreState[Restore from Seed + Position]
    
    %% Style definitions
    classDef start fill:#d4edda,stroke:#28a745,stroke-width:2px
    classDef process fill:#cce5ff,stroke:#0d6efd,stroke-width:2px
    classDef decision fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    classDef special fill:#f8d7da,stroke:#dc3545,stroke-width:2px
    classDef feature fill:white,stroke:#6c757d,stroke-width:1px
    
    %% Apply styles
    class Enter,PlayerMove,PlayerReturn start
    class CheckType,CheckBoundary decision
    class FixedGen,InfiniteGen,SetSeed,SetRules,NoAction,GenerateNew,MaintainContext,PruneOld process
    class StoreState,RemoveGeometry,RestoreState,GenerationRules,BiomeRules,ItemGeneration,MonsterGeneration process
    class Abyss,Pandemonium,DifficultyScaling special
    class AbyssFeatures,PandemoniumFeatures,DifficultyFeatures feature
```

## Game Mechanics

### Player Character

- **Stats**: Health, Attack, Defense, Magic
- **Inventory**: Limited inventory slots with weight/size restrictions
- **Progression**: Experience levels with skill improvements
- **Actions**: Move, Attack, Use Item, Rest, Interact

### Dungeon Structure

The dungeon consists of several key areas:

1. **Main Dungeon**: Linear progression through increasingly difficult floors
2. **Standard Branches**: Optional paths with unique themes and challenges
3. **Infinite Branches**: Special areas that can be explored without limit:
   - **Abyss-like**: Constantly shifting random topology
   - **Pandemonium-like**: Themed chambers with specific challenges

### Combat System

- **Turn-based**: Player and monsters take alternating turns
- **Tactical positioning**: Movement and positioning matter
- **Damage calculation**: Based on attack, defense, and random factors
- **Special abilities**: Both player and monsters have unique attacks

### Item System

- **Weapons**: Melee and ranged options with varying damage profiles
- **Armor**: Protection against damage
- **Consumables**: One-time use items for various effects
- **Scrolls and Potions**: Magical items with powerful effects

## To-Do List & Features Roadmap

### Critical Fixes
- [x] Fix dungeon rendering after title screen
- [x] Fix player movement and input handling
- [x] Fix FOV calculation and exploration mechanics
- [x] Fix map boundaries to prevent off-screen movement

### Core Gameplay (Phase 1)
- [x] Working dungeon exploration with basic rectangular room
- [x] Turn-based movement
- [ ] Implement proper dungeon generation with multiple rooms
- [ ] Combat mechanics
- [ ] Basic monster AI
- [ ] Death and game over state

### Extended Features (Phase 2)
- [ ] Multiple dungeon branches
- [ ] Inventory system
- [ ] Items and equipment
- [ ] Character progression
- [ ] Monster variety
- [ ] Special abilities

### Polish & UI (Phase 3)
- [ ] Message logging improvements
- [ ] Sound effects
- [ ] UI polish
- [ ] Help screens and tutorials
- [ ] Save/load system

## Technical Implementation

### Rendering Approach

The game uses HTML5 Canvas for rendering, with a tile-based approach:

- Each game element is represented by an ASCII character
- Fixed-width display grid (80x30)
- Top 2 rows reserved for stats and UI
- Bottom 4 rows reserved for messages and divider
- Field of view calculations determine what the player can see
- Right boundary limited to column 75 for optimal display

### Map Generation

The current implementation uses a simple rectangular room with walls as a placeholder. The next step will implement:

1. **Room-based Generation**: Using rot.js's Digger algorithm to create multiple connected rooms
2. **Proper Door Placement**: Connecting rooms with corridors and doors
3. **Monster Placement**: Strategic monster placement in rooms (avoiding the starting room)
4. **Item Placement**: Distributing items throughout the dungeon

## Comparison to DCSS

Compact Crawl aims to maintain the spirit of DCSS while dramatically reducing scope:

| Feature | DCSS | Compact Crawl |
|---------|------|---------------|
| Races | 27+ | None (human only) |
| Classes | 26+ | None (fighter only) |
| Dungeon Branches | 18+ | 3-5 |
| Items | Hundreds | Dozens |
| Gods | 24+ | None |
| Magic System | Complex, 8 schools | None |
| File Count | Thousands | 10 |

## Development Process

### Current Development Phase
**Early Development - Core Gameplay**

Our current milestone is getting the basic dungeon exploration working:
1. Title screen (✓ Completed)
2. Basic map with proper boundaries (✓ Completed)
3. Player movement and FOV (✓ Completed)
4. Turn-based game loop (✓ Completed)
5. Basic monster placement and AI (In Progress)
6. Basic combat mechanics (In Progress)

### Testing and Debugging

Current focus areas:
1. Implement proper dungeon generation with multiple rooms
2. Add monster AI for combat and movement
3. Implement basic item system

## Future Considerations

- Performance optimization for larger dungeons
- Mobile/touch support
- Highscore system
- Daily challenges

---

Document updated: July 2023