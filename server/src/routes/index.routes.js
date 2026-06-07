const userRoutes = require('./users.routes');
const categoryRoutes = require('./category.routes');
const movieRoutes = require('./movie.routes');
const cinemaRoutes = require('./cinema.routes');
const roomRoutes = require('./room.routes');
const showtimeRoutes = require('./showtime.routes');
const serviceRoutes = require('./service.routes');
const bookingRoutes = require('./booking.routes');
const voucherRoutes = require('./voucher.routes');
const paymentRoutes = require('./payment.routes');
const reviewRoutes = require('./review.routes');
const statisticRoutes = require('./statistic.routes');
const giftRoutes = require('./gift.routes');
const chatbotRoutes = require('./chatbot.routes');
const notificationRoutes = require('./notification.routes');

function routes(app) {
    app.use('/api/users', userRoutes);
    app.use('/api/category', categoryRoutes);
    app.use('/api/movies', movieRoutes);
    app.use('/api/cinemas', cinemaRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/showtimes', showtimeRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/vouchers', voucherRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/statistics', statisticRoutes);
    app.use('/api/gifts', giftRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/notifications', notificationRoutes);
}

module.exports = routes;
