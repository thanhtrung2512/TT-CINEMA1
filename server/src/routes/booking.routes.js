const express = require('express');
const router = express.Router();
const bookingController = require('../controller/booking.controller');
const { authUser, authAdmin, authEmployee, asyncHandler } = require('../auth/checkAuth');

router.post('/', authUser, asyncHandler(bookingController.createBooking));
router.get('/my-bookings', authUser, asyncHandler(bookingController.getMyBookings));
router.get('/all', authEmployee, asyncHandler(bookingController.getAllBookings));

// Employee routes
router.post('/offline', authEmployee, asyncHandler(bookingController.createOfflineBooking));
router.get('/employee-report', authEmployee, asyncHandler(bookingController.getEmployeeReport));
router.put('/:id/confirm-payment', authAdmin, asyncHandler(bookingController.adminConfirmPayment));
router.get('/:id/verify', authEmployee, asyncHandler(bookingController.verifyBooking));
router.put('/:id/checkin', authEmployee, asyncHandler(bookingController.checkInBooking));

// User route (must be below specific paths like /all, /my-bookings, /:id/verify to avoid conflict)
router.get('/:id', authUser, asyncHandler(bookingController.getBookingById));

module.exports = router;
