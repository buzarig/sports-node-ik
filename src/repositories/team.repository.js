const { Team } = require('../models');

async function getAll() {
    const rows = await Team.findAll({
        order: [['name', 'ASC']],
        raw: true,
    });
    return rows;
}

async function getById(id) {
    const row = await Team.findByPk(id, { raw: true });
    return row || null;
}

module.exports = { getAll, getById };
