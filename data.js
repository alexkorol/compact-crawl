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
                    gold: this.game.player.gold || 0,
                    baseStats: { ...(this.game.player.baseStats || {}) },
                    statusEffects: (this.game.player.statusEffects || []).map(effect => ({
                        type: effect.type,
                        duration: effect.duration === Infinity ? null : effect.duration,
                        potency: effect.potency ?? 0,
                        modifiers: { ...(effect.appliedModifiers || effect.modifiers || {}) },
                        stackable: effect.stackable ?? false,
                        source: effect.source || null
                    })),
                    inventory: (this.game.player.inventory || []).map(item => ({
                        id: item.id,
                        quantity: item.quantity || 1,
                        equipped: !!item.equipped
                    })),
                    equipment: (() => {
                        const result = {};
                        if (this.game.player.equipment) {
                            for (const [slot, equippedItem] of Object.entries(this.game.player.equipment)) {
                                result[slot] = equippedItem ? equippedItem.id : null;
                            }
                        }
                        return result;
                    })()
                },
                gameMode: this.game.gameMode,
                level: this.game.level,
                depth: this.game.depth,
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

            const savedPlayer = saveData.player;
            const baseStats = savedPlayer.baseStats
                ? { ...savedPlayer.baseStats }
                : { ...(this.game.player.baseStats || {}) };

            this.game.player.baseStats = baseStats;
            this.game.player.equipmentBonuses = { attack: 0, defense: 0, maxHp: 0 };
            this.game.player.statusBonuses = { attack: 0, defense: 0, maxHp: 0 };
            this.game.player.statusEffects = [];

            Object.assign(this.game.player, savedPlayer);
            this.game.player.baseStats = baseStats;

            if (typeof this.game.rebuildInventoryFromSave === 'function') {
                const inventoryData = Array.isArray(savedPlayer.inventory)
                    ? savedPlayer.inventory
                    : [];
                const equipmentData = savedPlayer.equipment || {};
                this.game.rebuildInventoryFromSave(inventoryData, equipmentData);
            }

            this.game.player.statusEffects = [];
            this.game.player.statusBonuses = { attack: 0, defense: 0, maxHp: 0 };
            if (Array.isArray(savedPlayer.statusEffects)) {
                savedPlayer.statusEffects.forEach(effectData => {
                    const payload = {
                        type: effectData.type,
                        duration: effectData.duration === null ? Infinity : effectData.duration,
                        potency: effectData.potency ?? 0,
                        modifiers: { ...(effectData.modifiers || {}) },
                        stackable: effectData.stackable ?? false,
                        source: effectData.source || null,
                        silent: true
                    };
                    this.game.applyStatusEffect(this.game.player, payload);
                });
            }

            this.game.player.hp = Math.max(0, Math.min(savedPlayer.hp, this.game.player.maxHp));

            const depth = saveData.depth || saveData.level || 1;
            this.game.depth = depth;
            this.game.level = depth;
            this.game.turns = saveData.turns || 0;
            
            if (this.game.gameMode === 'arena' && saveData.arena) {
                this.game.arenaWave = saveData.arena.wave || 1;
                this.game.arenaScore = saveData.arena.score || 0;
            }
            
            this.game.player.computeFOV();
            this.game.drawGame();
            if (typeof this.game.updateStats === 'function') {
                this.game.updateStats();
            }
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }

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