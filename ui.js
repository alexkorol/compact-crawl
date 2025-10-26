// compact-crawl/ui.js - User interface and UI-related functions
function updatePlayerStats() {
    if (!window.game || !window.game.player) return;
    
    const player = window.game.player;
    const statsElement = document.getElementById('player-stats');
    if (!statsElement) return;

    const attack = player.getStatBreakdown ? player.getStatBreakdown('attack') : {
        base: player.attack,
        equipment: 0,
        status: 0,
        total: player.attack
    };
    const defense = player.getStatBreakdown ? player.getStatBreakdown('defense') : {
        base: player.defense,
        equipment: 0,
        status: 0,
        total: player.defense
    };
    const statusSummary = window.game.getStatusSummary
        ? window.game.getStatusSummary(player)
        : (player.statusEffects && player.statusEffects.length > 0
            ? player.statusEffects.map(effect => effect.type).join(', ')
            : 'None');

    statsElement.innerHTML = `
        <div>HP: ${player.hp}/${player.maxHp}</div>
        <div>Attack: ${attack.total} (Base ${attack.base} | Gear ${attack.equipment} | Status ${attack.status})</div>
        <div>Defense: ${defense.total} (Base ${defense.base} | Gear ${defense.equipment} | Status ${defense.status})</div>
        <div>Status: ${statusSummary}</div>
        <div>Level: ${player.level}</div>
        <div>Exp: ${player.exp}</div>
        <div>Depth: ${window.game.depth || window.game.level || 1}</div>
    `;
}

function showInventoryScreen() {
    const screen = document.getElementById('inventory-screen');
    if (!screen) return;

    screen.style.display = 'block';
    updateInventoryDisplay();
}

function hideInventoryScreen() {
    const screen = document.getElementById('inventory-screen');
    if (!screen) return;

    screen.style.display = 'none';
}

function toggleInventoryScreen(forceState = null) {
    const screen = document.getElementById('inventory-screen');
    if (!screen) return;

    if (forceState === true) {
        showInventoryScreen();
        return;
    }

    if (forceState === false) {
        hideInventoryScreen();
        return;
    }

    if (screen.style.display === 'none' || !screen.style.display) {
        showInventoryScreen();
    } else {
        hideInventoryScreen();
    }
}

function updateInventoryDisplay() {
    const content = document.getElementById('inventory-content');
    const player = window.game.player;
    
    if (!player || !player.inventory || player.inventory.length === 0) {
        content.innerHTML = '<p>Your inventory is empty.</p>';
        return;
    }

    let html = '<ul class="inventory-list">';
    player.inventory.forEach((item, index) => {
        const quantityText = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : '';
        const equippedText = item.equipped ? ' <span class="equipped">(equipped)</span>' : '';
        const actionLabel = item.type === 'weapon' || item.type === 'armor'
            ? (item.equipped ? 'Unequip' : 'Equip')
            : 'Use';

        html += `
            <li class="inventory-item">
                <span class="item-label">[${index + 1}] ${item.name}${quantityText}${equippedText}</span>
                <div class="item-actions">
                    <button data-action="use" data-index="${index}">${actionLabel}</button>
                    <button data-action="drop" data-index="${index}">Drop</button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    html += '<p class="inventory-hint">Press number keys to use items, or D then a number to drop. Press [I] or [Esc] to close.</p>';

    content.innerHTML = html;

    content.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', (event) => {
            const action = event.currentTarget.getAttribute('data-action');
            const index = parseInt(event.currentTarget.getAttribute('data-index'), 10);

            if (!window.game) return;

            if (action === 'use') {
                window.game.useInventoryItem(index);
            } else if (action === 'drop') {
                window.game.dropInventoryItem(index);
            }
        });
    });
}

function updateMessageLog(message, color = CONFIG.colors.ui.text) {
    const log = document.getElementById('message-overlay');
    const messageElement = document.createElement('div');
    messageElement.style.color = color;
    messageElement.textContent = message;
    log.appendChild(messageElement);
    log.scrollTop = log.scrollHeight;
}

const SANDBOX_ACTIONS = {
    'apply-font': (game) => game.changeFont(),
    'toggle-font-preview': (game) => game.toggleFontPreview(),
    'apply-font-size': (game) => game.changeFontSize(),
    'spawn-monsters': (game) => game.spawnTestMonsterPack(),
    'clear-monsters': (game) => game.clearMonsters(),
    'generate-map': (game) => game.generateNewMap(),
    'heal-player': (game) => game.healPlayer(),
    'buff-player': (game) => game.increasePlayerStats(),
    'teleport-player': (game) => {
        if (typeof game.teleportPlayer === 'function') {
            game.teleportPlayer();
        }
    },
    'toggle-fov': (game, value) => game.toggleFOV(value),
    'toggle-grid': (game, value) => game.toggleGrid(value),
    'hide-panel': (game) => toggleSandboxControls(game, false)
};

function initializeSandboxControls(game) {
    if (!game) {
        return;
    }

    let panel = document.getElementById('sandbox-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'sandbox-panel';
        panel.style.cssText = 'position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.85); border: 1px solid #555; padding: 12px; z-index: 1000; color: #fff; font-family: monospace; width: 320px; max-width: 90vw;';
        document.body.appendChild(panel);
    }

    let fontPreview = document.getElementById('font-preview');
    if (!fontPreview) {
        fontPreview = document.createElement('div');
        fontPreview.id = 'font-preview';
        fontPreview.style.cssText = 'position: fixed; bottom: 10px; left: 10px; width: 320px; background: rgba(0,0,0,0.85); border: 1px solid #555; padding: 10px; z-index: 1000; color: #fff; display: none; font-family: monospace;';
        document.body.appendChild(fontPreview);
    }

    const fontOptions = Array.isArray(game.availableFonts) ? game.availableFonts : ['monospace'];
    const sizeOptions = Array.isArray(game.availableFontSizes) ? game.availableFontSizes : [12, 14, 16, 18];
    const fontIndex = Number.isInteger(game.currentFontIndex) ? game.currentFontIndex : 0;
    const sizeIndex = Number.isInteger(game.currentFontSizeIndex) ? game.currentFontSizeIndex : 0;

    panel.innerHTML = `
        <h3>Sandbox Controls</h3>
        <div class="sandbox-section">
            <h4>Font Options</h4>
            <div class="sandbox-row">
                <label for="font-family-select">Font Family:</label>
                <select id="font-family-select">
                    ${fontOptions.map((font, index) => `<option value="${index}" ${index === fontIndex ? 'selected' : ''}>${font}</option>`).join('')}
                </select>
            </div>
            <div class="sandbox-buttons">
                <button type="button" data-action="apply-font">Apply Font</button>
                <button type="button" data-action="toggle-font-preview">Toggle Preview</button>
            </div>
            <div class="sandbox-row" style="margin-top: 10px;">
                <label for="font-size-select">Font Size:</label>
                <select id="font-size-select">
                    ${sizeOptions.map((size, index) => `<option value="${index}" ${index === sizeIndex ? 'selected' : ''}>${size}px</option>`).join('')}
                </select>
                <button type="button" data-action="apply-font-size" style="margin-left: 8px;">Apply Size</button>
            </div>
            <div id="current-font-info" class="sandbox-hint"></div>
        </div>
        <div class="sandbox-section" style="margin-top: 12px;">
            <h4>Monster & Environment</h4>
            <div class="sandbox-buttons">
                <button type="button" data-action="spawn-monsters">Spawn Monsters</button>
                <button type="button" data-action="clear-monsters">Clear Monsters</button>
                <button type="button" data-action="generate-map">Generate Map</button>
            </div>
        </div>
        <div class="sandbox-section" style="margin-top: 12px;">
            <h4>Player Options</h4>
            <div class="sandbox-buttons">
                <button type="button" data-action="heal-player">Heal Player</button>
                <button type="button" data-action="buff-player">Buff Stats</button>
                <button type="button" data-action="teleport-player">Random Teleport</button>
            </div>
        </div>
        <div class="sandbox-section" style="margin-top: 12px;">
            <h4>Display Options</h4>
            <label class="sandbox-toggle">
                <input type="checkbox" id="sandbox-show-fov" data-action="toggle-fov" ${game.showFOV === false ? '' : 'checked'}>
                Show FOV
            </label>
            <label class="sandbox-toggle">
                <input type="checkbox" id="sandbox-show-grid" data-action="toggle-grid" ${game.showGrid ? 'checked' : ''}>
                Show Grid
            </label>
        </div>
        <div class="sandbox-section sandbox-footer" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" data-action="hide-panel">Hide Panel</button>
            <small>Press F1 to show panel again</small>
        </div>
    `;

    bindSandboxControlHandlers(panel, game);
    updateSandboxFontInfo(game);
    panel.style.display = 'block';
}

function bindSandboxControlHandlers(panel, game) {
    const fontSelect = panel.querySelector('#font-family-select');
    if (fontSelect) {
        fontSelect.addEventListener('change', (event) => {
            const nextIndex = parseInt(event.target.value, 10);
            if (!Number.isNaN(nextIndex)) {
                game.currentFontIndex = nextIndex;
                updateSandboxFontInfo(game);
            }
        });
    }

    const sizeSelect = panel.querySelector('#font-size-select');
    if (sizeSelect) {
        sizeSelect.addEventListener('change', (event) => {
            const nextIndex = parseInt(event.target.value, 10);
            if (!Number.isNaN(nextIndex)) {
                game.currentFontSizeIndex = nextIndex;
                updateSandboxFontInfo(game);
            }
        });
    }

    panel.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            handleSandboxAction(game, action);
            if (action === 'spawn-monsters' || action === 'clear-monsters' || action === 'generate-map') {
                game.drawGame();
            }
        });
    });

    panel.querySelectorAll('input[type="checkbox"][data-action]').forEach(input => {
        input.addEventListener('change', () => {
            const action = input.getAttribute('data-action');
            handleSandboxAction(game, action, input.checked);
        });
    });
}

function handleSandboxAction(game, action, value = null) {
    if (!game || !action) {
        return;
    }

    const handler = SANDBOX_ACTIONS[action];
    if (typeof handler === 'function') {
        handler(game, value);
    }
}

function updateSandboxFontInfo(game) {
    const info = document.getElementById('current-font-info');
    if (!info || !game) {
        return;
    }

    const font = Array.isArray(game.availableFonts)
        ? game.availableFonts[game.currentFontIndex] || game.availableFonts[0]
        : 'monospace';
    const size = Array.isArray(game.availableFontSizes)
        ? game.availableFontSizes[game.currentFontSizeIndex] || game.availableFontSizes[0]
        : 16;

    info.textContent = `Current: ${font} ${size}px`;
}

function toggleSandboxControls(game, forceState = null) {
    let panel = document.getElementById('sandbox-panel');
    if (!panel) {
        if (!game) {
            return;
        }
        initializeSandboxControls(game);
        panel = document.getElementById('sandbox-panel');
    }

    if (!panel) {
        return;
    }

    let show;
    if (typeof forceState === 'boolean') {
        show = forceState;
    } else {
        show = panel.style.display === 'none';
    }

    panel.style.display = show ? 'block' : 'none';
    if (show && game) {
        updateSandboxFontInfo(game);
    }
}

// We'll add more UI functions here later
