const scheduleService = require('../services/schedule.service');

function validateGameBody(body, partial = false) {
    const date = body.date;
    const team1Id = body.team1Id;
    const team2Id = body.team2Id;
    const location = body.location;

    const missing = [];
    if (!partial || date !== undefined) {
        if (date === undefined || date === null || String(date).trim() === '') missing.push('date');
    }
    if (!partial || team1Id !== undefined) {
        if (team1Id === undefined || team1Id === null || String(team1Id).trim() === '') {
            missing.push('team1Id');
        }
    }
    if (!partial || team2Id !== undefined) {
        if (team2Id === undefined || team2Id === null || String(team2Id).trim() === '') {
            missing.push('team2Id');
        }
    }
    if (!partial || location !== undefined) {
        if (location === undefined || location === null || String(location).trim() === '') {
            missing.push('location');
        }
    }

    if (missing.length) {
        return { ok: false, error: `Відсутні або порожні поля: ${missing.join(', ')}` };
    }
    const t1 = String(team1Id).trim();
    const t2 = String(team2Id).trim();
    if (t1 === t2) {
        return { ok: false, error: 'team1Id та team2Id мають бути різними' };
    }
    return {
        ok: true,
        data: {
            date: String(date).trim(),
            team1Id: t1,
            team2Id: t2,
            location: String(location).trim(),
        },
    };
}

async function list(req, res) {
    try {
        const payload = await scheduleService.getGamesPaginated(req.query);
        return res.status(200).json(payload);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}

async function getById(req, res) {
    try {
        const game = await scheduleService.getGameById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Гру не знайдено' });
        }
        return res.status(200).json(game);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}

async function create(req, res) {
    const v = validateGameBody(req.body || {}, false);
    if (!v.ok) {
        return res.status(400).json({ error: v.error });
    }
    try {
        const created = await scheduleService.createGame(v.data);
        const full = await scheduleService.getGameById(created.id);
        return res.status(201).location(`/api/games/${created.id}`).json(full);
    } catch (err) {
        console.error(err);
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'Невірні посилання на команди (foreign key)' });
        }
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}

async function update(req, res) {
    const v = validateGameBody(req.body || {}, false);
    if (!v.ok) {
        return res.status(400).json({ error: v.error });
    }
    try {
        const updated = await scheduleService.updateGame(req.params.id, v.data);
        if (!updated) {
            return res.status(404).json({ error: 'Гру не знайдено' });
        }
        const full = await scheduleService.getGameById(req.params.id);
        return res.status(200).json(full);
    } catch (err) {
        console.error(err);
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'Невірні посилання на команди (foreign key)' });
        }
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}

async function remove(req, res) {
    try {
        const ok = await scheduleService.deleteGame(req.params.id);
        if (!ok) {
            return res.status(404).json({ error: 'Гру не знайдено' });
        }
        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}

module.exports = {
    list,
    getById,
    create,
    update,
    remove,
};
