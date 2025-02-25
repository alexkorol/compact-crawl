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
        <div>Dungeon Level: ${window.game.level || 1}</div>
    `;
}

// We'll add more UI functions here later