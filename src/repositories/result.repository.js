const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const RESULTS_PATH = path.join(__dirname, '..', 'data', 'results.json');

async function getAllAsync() {
    const raw = await fsp.readFile(RESULTS_PATH, 'utf-8');
    return JSON.parse(raw);
}

async function getByGameIdAsync(gameId) {
    const results = await getAllAsync();
    return results.find((r) => r.gameId === gameId) || null;
}

async function saveAsync(gameId, team1Score, team2Score) {
    const results = await getAllAsync();
    const idx = results.findIndex((r) => r.gameId === gameId);
    const entry = {
        gameId,
        team1Score: Number(team1Score),
        team2Score: Number(team2Score),
    };

    if (idx !== -1) {
        results[idx] = entry;
    } else {
        results.push(entry);
    }

    await fsp.writeFile(
        RESULTS_PATH,
        JSON.stringify(results, null, 2),
        'utf-8',
    );
    return entry;
}

module.exports = { getAllAsync, getByGameIdAsync, saveAsync };
