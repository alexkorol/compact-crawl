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

function toggleInventoryScreen() {
    const screen = document.getElementById('inventory-screen');
    screen.style.display = screen.style.display === 'none' ? 'block' : 'none';
    
    if (screen.style.display === 'block') {
        updateInventoryDisplay();
    }
}

function updateInventoryDisplay() {
    const content = document.getElementById('inventory-content');
    const player = window.game.player;
    
    if (!player.inventory.length) {
        content.innerHTML = '<p>Your inventory is empty.</p>';
        return;
    }
    
    let html = '<ul>';
    player.inventory.forEach((item, index) => {
        html += `<li>[${index + 1}] ${item.name}</li>`;
    });
    html += '</ul>';
    
    content.innerHTML = html;
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