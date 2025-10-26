// compact-crawl/ui.js - User interface and UI-related functions
function updatePlayerStats() {
    if (!window.game || !window.game.player) return;
    
    const player = window.game.player;
    const statsElement = document.getElementById('player-stats');
    
    statsElement.innerHTML = `
        <div>HP: ${player.hp}/${player.maxHp}</div>
        <div>Attack: ${player.attack}</div>
        <div>Defense: ${player.defense}</div>
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

// We'll add more UI functions here later