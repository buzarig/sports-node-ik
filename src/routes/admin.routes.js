const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Dashboard
router.get('/admin', adminController.dashboard);

// Create
router.get('/admin/create', adminController.createForm);
router.post('/admin/create', adminController.createGame);

// Edit
router.get('/admin/edit/:id', adminController.editForm);
router.post('/admin/edit/:id', adminController.updateGame);

// Delete
router.post('/admin/delete/:id', adminController.deleteGame);

// Result
router.get('/admin/result/:id', adminController.resultForm);
router.post('/admin/result/:id', adminController.saveResult);

module.exports = router;
