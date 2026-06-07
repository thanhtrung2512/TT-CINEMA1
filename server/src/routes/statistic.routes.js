const express = require('express');
const router = express.Router();
const { asyncHandler, authAdmin } = require('../auth/checkAuth');
const statisticController = require('../controller/statistic.controller');

router.get('/dashboard', authAdmin, asyncHandler(statisticController.getDashboardStats));

module.exports = router;
