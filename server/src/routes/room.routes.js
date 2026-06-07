const express = require('express');
const router = express.Router();
const { asyncHandler, authUser } = require('../auth/checkAuth');
const roomController = require('../controller/room.controller');

router.post('/create', authUser, asyncHandler(roomController.createRoom));
router.get('/all', asyncHandler(roomController.getAllRooms));
router.put('/update/:id', authUser, asyncHandler(roomController.updateRoom));
router.delete('/delete/:id', authUser, asyncHandler(roomController.deleteRoom));

module.exports = router;
