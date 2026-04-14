const { Op } = require('sequelize');
const { sequelize, Game, Team } = require('../models');

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

function clampLimit(limit, max = 100) {
    const n = Number(limit);
    if (!Number.isFinite(n) || n < 1) return 10;
    return Math.min(max, Math.floor(n));
}

function clampPage(page) {
    const n = Number(page);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
}

/**
 * Список ігор з пагінацією та фільтрами (дата, назва команди).
 */
async function findPaginated({ page = 1, limit = 10, teamName, dateFrom, dateTo } = {}) {
    const lim = clampLimit(limit);
    const pg = clampPage(page);
    const offset = (pg - 1) * lim;

    const conditions = [];

    if (dateFrom || dateTo) {
        const dateCond = {};
        if (dateFrom) dateCond[Op.gte] = dateFrom;
        if (dateTo) dateCond[Op.lte] = dateTo;
        conditions.push({ gameDate: dateCond });
    }

    if (teamName && String(teamName).trim()) {
        const like = `%${String(teamName).trim()}%`;
        const matching = await Team.findAll({
            where: { name: { [Op.iLike]: like } },
            attributes: ['id'],
            raw: true,
        });
        const teamIds = matching.map((t) => t.id);
        if (teamIds.length === 0) {
            return { rows: [], total: 0, page: pg, limit: lim };
        }
        conditions.push({
            [Op.or]: [{ team1Id: { [Op.in]: teamIds } }, { team2Id: { [Op.in]: teamIds } }],
        });
    }

    const where = conditions.length ? { [Op.and]: conditions } : {};

    const { count, rows } = await Game.findAndCountAll({
        where,
        include: [
            { model: Team, as: 'team1', attributes: ['id', 'name', 'city', 'logo'] },
            { model: Team, as: 'team2', attributes: ['id', 'name', 'city', 'logo'] },
        ],
        order: [
            ['gameDate', 'ASC'],
            ['id', 'ASC'],
        ],
        limit: lim,
        offset,
        distinct: true,
    });

    return { rows, total: count, page: pg, limit: lim };
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    findPaginated,
};
