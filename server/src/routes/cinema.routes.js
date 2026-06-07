const express = require('express');
const router = express.Router();
const { asyncHandler, authUser } = require('../auth/checkAuth');
const cinemaController = require('../controller/cinema.controller');

router.post('/create', authUser, asyncHandler(cinemaController.createCinema));
router.get('/all', asyncHandler(cinemaController.getAllCinemas));
router.put('/update/:id', authUser, asyncHandler(cinemaController.updateCinema));
router.delete('/delete/:id', authUser, asyncHandler(cinemaController.deleteCinema));

module.exports = router;
