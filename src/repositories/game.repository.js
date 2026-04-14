const { sequelize, Game } = require('../models');

function mapGameRow(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    let dateVal = plain.gameDate;
    if (dateVal instanceof Date) {
        dateVal = dateVal.toISOString().slice(0, 10);
    } else if (typeof dateVal === 'string') {
        dateVal = dateVal.slice(0, 10);
    }
    return {
        id: plain.id,
        date: dateVal,
        team1Id: plain.team1Id,
        team2Id: plain.team2Id,
        location: plain.location,
    };
}

async function getAll() {
    const rows = await Game.findAll({
        order: [
            ['gameDate', 'ASC'],
            ['id', 'ASC'],
        ],
    });
    return rows.map(mapGameRow);
}

async function getById(id) {
    const row = await Game.findByPk(id);
    return mapGameRow(row);
}

async function create(game) {
    return sequelize.transaction(async (transaction) => {
        const created = await Game.create(
            {
                id: game.id,
                gameDate: game.date,
                team1Id: game.team1Id,
                team2Id: game.team2Id,
                location: game.location,
            },
            { transaction },
        );
        return mapGameRow(created);
    });
}

async function update(id, data) {
    return sequelize.transaction(async (transaction) => {
        const row = await Game.findByPk(id, { transaction });
        if (!row) return null;
        await row.update(
            {
                gameDate: data.date,
                team1Id: data.team1Id,
                team2Id: data.team2Id,
                location: data.location,
            },
            { transaction },
        );
        return mapGameRow(row);
    });
}

async function remove(id) {
    return sequelize.transaction(async (transaction) => {
        const n = await Game.destroy({ where: { id }, transaction });
        return n > 0;
    });
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
