// compact-crawl/data.js - Game state data and save/load functionality
class GameData {
    constructor(game) {
        this.game = game;
        this.saveData = null;
    }
    
    saveGame() {
        if (!this.game) return false;
        
        try {
            const saveData = {
                player: {
                    x: this.game.player.x,
                    y: this.game.player.y,
                    hp: this.game.player.hp,
                    maxHp: this.game.player.maxHp,
                    attack: this.game.player.attack,
                    defense: this.game.player.defense,
                    level: this.game.player.level,
                    exp: this.game.player.exp,
                    gold: this.game.player.gold || 0
                },
                gameMode: this.game.gameMode,
                level: this.game.level,
                turns: this.game.turns,
                mapBounds: this.game.mapBounds,
                timestamp: Date.now()
            };
            
            if (this.game.gameMode === 'arena') {
                saveData.arena = {
                    wave: this.game.arenaWave,
                    score: this.game.arenaScore
                };
            }
            
            localStorage.setItem('compactCrawlSave', JSON.stringify(saveData));
            
            console.log("Game saved successfully");
            return true;
        } catch (err) {
            console.error("Error saving game:", err);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveString = localStorage.getItem('compactCrawlSave');
            if (!saveString) {
                console.log("No save data found");
                return false;
            }
            
            const saveData = JSON.parse(saveString);
            
            if (!saveData.player || !saveData.gameMode) {
                console.error("Save data is incomplete");
                return false;
            }
            
            this.game.startGame(saveData.gameMode);
            
            Object.assign(this.game.player, saveData.player);
            
            this.game.level = saveData.level || 1;
            this.game.turns = saveData.turns || 0;
            
            if (this.game.gameMode === 'arena' && saveData.arena) {
                this.game.arenaWave = saveData.arena.wave || 1;
                this.game.arenaScore = saveData.arena.score || 0;
            }
            
            this.game.player.computeFOV();
            this.game.drawGame();
            
            this.game.addMessage("Game loaded successfully", CONFIG.colors.ui.highlight);
            return true;
        } catch (err) {
            console.error("Error loading game:", err);
            return false;
        }
    }
    
    hasSaveData() {
        return localStorage.getItem('compactCrawlSave') !== null;
    }
    
    deleteSaveData() {
        localStorage.removeItem('compactCrawlSave');
        this.saveData = null;
        console.log("Save data deleted");
    }
}