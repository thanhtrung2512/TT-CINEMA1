const express = require('express');
const router = express.Router();
const { asyncHandler, authUser, authEmployee } = require('../auth/checkAuth');
const showtimeController = require('../controller/showtime.controller');

router.post('/create', authUser, asyncHandler(showtimeController.createShowtime));
router.get('/all', asyncHandler(showtimeController.getAllShowtimes));
router.get('/:id', asyncHandler(showtimeController.getShowtimeById));
router.put('/update/:id', authUser, asyncHandler(showtimeController.updateShowtime));
router.delete('/delete/:id', authUser, asyncHandler(showtimeController.deleteShowtime));

router.put('/:id/seats/maintenance', authEmployee, asyncHandler(showtimeController.updateSeatMaintenance));

module.exports = router;
