const fs = require('fs');
const path = require('path');

const TEAMS_PATH = path.join(__dirname, '..', 'data', 'teams.json');

function getAllSync() {
    const raw = fs.readFileSync(TEAMS_PATH, 'utf-8');
    return JSON.parse(raw);
}

function getByIdSync(id) {
    const teams = getAllSync();
    return teams.find((t) => t.id === id) || null;
}

module.exports = { getAllSync, getByIdSync };
