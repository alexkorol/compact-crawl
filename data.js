// compact-crawl/data.js - Game state data and save/load functionality
class GameData {
    constructor(game) {
        this.game = game;
        this.saveData = null;
        this.storageKey = 'compactCrawlSaves';
        this.activeSlot = 'slot1';
        this.slotsCache = null;
    }

    useSlot(slot) {
        if (typeof slot === 'string' && slot.trim()) {
            this.activeSlot = slot.trim();
        }
    }

    getSlotId(slot = null) {
        const id = typeof slot === 'string' && slot.trim() ? slot.trim() : this.activeSlot;
        return id || 'slot1';
    }

    loadAllSlots() {
        if (this.slotsCache) {
            return this.slotsCache;
        }

        const slotsRaw = localStorage.getItem(this.storageKey);
        if (slotsRaw) {
            try {
                this.slotsCache = JSON.parse(slotsRaw) || {};
            } catch (err) {
                console.error('Error parsing save slots data:', err);
                this.slotsCache = {};
            }
            return this.slotsCache;
        }

        // Handle legacy single-save data by migrating it into the slot structure
        const legacyRaw = localStorage.getItem('compactCrawlSave');
        if (legacyRaw) {
            try {
                const legacyData = JSON.parse(legacyRaw);
                this.slotsCache = { slot1: { game: legacyData } };
                localStorage.setItem(this.storageKey, JSON.stringify(this.slotsCache));
                localStorage.removeItem('compactCrawlSave');
                return this.slotsCache;
            } catch (err) {
                console.error('Error migrating legacy save data:', err);
            }
        }

        this.slotsCache = {};
        return this.slotsCache;
    }

    persistSlots(slots) {
        this.slotsCache = slots;
        localStorage.setItem(this.storageKey, JSON.stringify(slots));
    }

    getSlotData(slot = null) {
        const slots = this.loadAllSlots();
        const slotId = this.getSlotId(slot);
        return slots[slotId] || null;
    }

    ensureSlot(slot = null) {
        const slots = { ...this.loadAllSlots() };
        const slotId = this.getSlotId(slot);
        if (!slots[slotId]) {
            slots[slotId] = { metadata: {} };
        } else if (!slots[slotId].metadata) {
            slots[slotId].metadata = {};
        }
        return { slots, slotId };
    }

    getArenaHighScore(slot = null) {
        const data = this.getSlotData(slot);
        if (!data || !data.metadata) {
            return 0;
        }
        return data.metadata.arenaHighScore || 0;
    }

    recordArenaScore(score, slot = null) {
        if (!Number.isFinite(score) || score <= 0) {
            return this.getArenaHighScore(slot);
        }

        const { slots, slotId } = this.ensureSlot(slot);
        const slotData = { ...slots[slotId] };
        const metadata = { ...(slotData.metadata || {}) };
        const currentBest = metadata.arenaHighScore || 0;

        if (score > currentBest) {
            metadata.arenaHighScore = score;
            slotData.metadata = metadata;
            slots[slotId] = slotData;
            this.persistSlots(slots);
            return score;
        }

        return currentBest;
    }

    saveGame(options = {}) {
        if (!this.game) return false;

        const slotId = this.getSlotId(options.slot);

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
                const best = this.getArenaHighScore(slotId);
                if (best > 0) {
                    saveData.highScores = { arena: best };
                }
            }

            const { slots } = this.ensureSlot(slotId);
            const slotData = { ...slots[slotId] };
            slotData.game = saveData;

            // Preserve existing metadata (including high scores)
            if (!slotData.metadata) {
                slotData.metadata = {};
            }
            if (saveData.highScores && saveData.highScores.arena) {
                const currentBest = slotData.metadata.arenaHighScore || 0;
                slotData.metadata.arenaHighScore = Math.max(currentBest, saveData.highScores.arena);
            }

            slots[slotId] = slotData;
            this.persistSlots(slots);

            console.log("Game saved successfully");
            return true;
        } catch (err) {
            console.error("Error saving game:", err);
            return false;
        }
    }

    loadGame(options = {}) {
        try {
            const slotId = this.getSlotId(options.slot);
            const slotData = this.getSlotData(slotId);
            let saveData = null;

            if (slotData && slotData.game) {
                saveData = slotData.game;
            } else if (slotData && !slotData.game) {
                // Handle legacy structure where game data was stored at root of slot
                saveData = slotData;
            }

            if (!saveData) {
                console.log("No save data found");
                return false;
            }

            if (!saveData.player || !saveData.gameMode) {
                console.error("Save data is incomplete");
                return false;
            }

            this.useSlot(slotId);
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

            const bestScore = this.getArenaHighScore(slotId);
            if (bestScore > 0) {
                this.game.arenaHighScore = bestScore;
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

    hasSaveData(slot = null) {
        const slotData = this.getSlotData(slot);
        return !!(slotData && slotData.game);
    }

    deleteSaveData(slot = null) {
        const slots = { ...this.loadAllSlots() };
        const slotId = this.getSlotId(slot);
        if (slots[slotId]) {
            delete slots[slotId];
            this.persistSlots(slots);
        }
        this.saveData = null;
        console.log("Save data deleted");
    }
}