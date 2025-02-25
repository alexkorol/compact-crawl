// compact-crawl/data.js - Game state data and save/load functionality
class GameData {
    constructor(game) {
        this.game = game;
        this.saveData = null;
    }
    
    saveGame() {
        // Simple save functionality
        const saveData = {
            player: {
                x: this.game.player.x,
                y: this.game.player.y,
                hp: this.game.player.hp,
                maxHp: this.game.player.maxHp,
                attack: this.game.player.attack,
                defense: this.game.player.defense,
                level: this.game.player.level,
                exp: this.game.player.exp
            },
            level: this.game.level,
            // We could add more data here like discovered items, dungeon state, etc.
        };
        
        localStorage.setItem('compactCrawlSave', JSON.stringify(saveData));
        return true;
    }
    
    loadGame() {
        const saveJson = localStorage.getItem('compactCrawlSave');
        if (!saveJson) return false;
        
        try {
            this.saveData = JSON.parse(saveJson);
            return true;
        } catch (e) {
            console.error("Failed to load save data:", e);
            return false;
        }
    }
    
    hasSaveData() {
        return localStorage.getItem('compactCrawlSave') !== null;
    }
    
    applySaveData() {
        if (!this.saveData) return false;
        
        // Apply save data to game state
        // For now just handle basic player stats
        const p = this.saveData.player;
        this.game.player.x = p.x;
        this.game.player.y = p.y;
        this.game.player.hp = p.hp;
        this.game.player.maxHp = p.maxHp;
        this.game.player.attack = p.attack;
        this.game.player.defense = p.defense;
        this.game.player.level = p.level;
        this.game.player.exp = p.exp;
        
        this.game.level = this.saveData.level;
        
        return true;
    }
    
    deleteSaveData() {
        localStorage.removeItem('compactCrawlSave');
        this.saveData = null;
    }
}