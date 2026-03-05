const express = require('express');
const scheduleController = require('../controllers/schedule.controller');

const router = express.Router();

// Головна сторінка = розклад
router.get('/', scheduleController.viewSchedule);
router.get('/schedule', scheduleController.viewSchedule);

// Деталі гри
router.get('/game/:id', scheduleController.viewGame);

// Пошук
router.get('/search', scheduleController.searchSchedule);

module.exports = router;
