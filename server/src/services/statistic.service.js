const Booking = require('../models/booking.model');
const Movie = require('../models/movies.model');
const User = require('../models/users.model');
const moment = require('moment');

class StatisticService {
    async getDashboardStats() {
        // 1. Overview Stats (all-time)
        const [totalRevenueResult, totalTicketsResult, activeMovies, totalCustomers] = await Promise.all([
            Booking.aggregate([
                { $match: { status: { $in: ['Paid', 'CheckedIn'] } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Booking.aggregate([
                { $match: { status: { $in: ['Paid', 'CheckedIn'] } } },
                { $project: { numSeats: { $size: '$seats' } } },
                { $group: { _id: null, totalSeats: { $sum: '$numSeats' } } }
            ]),
            Movie.countDocuments({ status: 'Đang chiếu' }),
            User.countDocuments({ role: 'user' })
        ]);

        const totalRevenue = totalRevenueResult[0]?.total || 0;
        const totalTickets = totalTicketsResult[0]?.totalSeats || 0;

        // 2. Revenue Chart - 7 ngày
        const sevenDaysChart = await this._buildDailyChart(7);

        // 3. Revenue Chart - 12 tháng gần nhất
        const monthlyChart = await this._buildMonthlyChart(12);

        // 4. Revenue Chart - 5 năm gần nhất
        const yearlyChart = await this._buildYearlyChart(5);

        // 5. Top 5 Phim bán chạy nhất
        const topMovies = await this._getTopMovies();

        return {
            overview: { totalRevenue, totalTickets, activeMovies, totalCustomers },
            charts: {
                weekly: sevenDaysChart,
                monthly: monthlyChart,
                yearly: yearlyChart,
            },
            topMovies,
        };
    }

    async _buildDailyChart(days) {
        const from = moment().subtract(days - 1, 'days').startOf('day').toDate();
        const raw = await Booking.aggregate([
            { $match: { status: { $in: ['Paid', 'CheckedIn'] }, createdAt: { $gte: from } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, tickets: { $sum: { $size: '$seats' } } } },
            { $sort: { _id: 1 } }
        ]);

        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const dateStr = moment().subtract(i, 'days').format('YYYY-MM-DD');
            const found = raw.find(r => r._id === dateStr);
            result.push({
                label: moment(dateStr).format('DD/MM'),
                revenue: found?.revenue || 0,
                tickets: found?.tickets || 0,
            });
        }
        return result;
    }

    async _buildMonthlyChart(months) {
        const from = moment().subtract(months - 1, 'months').startOf('month').toDate();
        const raw = await Booking.aggregate([
            { $match: { status: { $in: ['Paid', 'CheckedIn'] }, createdAt: { $gte: from } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, tickets: { $sum: { $size: '$seats' } } } },
            { $sort: { _id: 1 } }
        ]);

        const result = [];
        for (let i = months - 1; i >= 0; i--) {
            const key = moment().subtract(i, 'months').format('YYYY-MM');
            const found = raw.find(r => r._id === key);
            result.push({
                label: `T${moment(key, 'YYYY-MM').format('MM/YY')}`,
                revenue: found?.revenue || 0,
                tickets: found?.tickets || 0,
            });
        }
        return result;
    }

    async _buildYearlyChart(years) {
        const from = moment().subtract(years - 1, 'years').startOf('year').toDate();
        const raw = await Booking.aggregate([
            { $match: { status: { $in: ['Paid', 'CheckedIn'] }, createdAt: { $gte: from } } },
            { $group: { _id: { $dateToString: { format: '%Y', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, tickets: { $sum: { $size: '$seats' } } } },
            { $sort: { _id: 1 } }
        ]);

        const result = [];
        for (let i = years - 1; i >= 0; i--) {
            const key = moment().subtract(i, 'years').format('YYYY');
            const found = raw.find(r => r._id === key);
            result.push({
                label: key,
                revenue: found?.revenue || 0,
                tickets: found?.tickets || 0,
            });
        }
        return result;
    }

    async _getTopMovies() {
        const raw = await Booking.aggregate([
            { $match: { status: { $in: ['Paid', 'CheckedIn'] } } },
            { $lookup: { from: 'showtimes', localField: 'showtimeId', foreignField: '_id', as: 'showtime' } },
            { $unwind: '$showtime' },
            { $lookup: { from: 'movies', localField: 'showtime.movieId', foreignField: '_id', as: 'movie' } },
            { $unwind: '$movie' },
            { $group: { _id: '$movie._id', title: { $first: '$movie.title' }, totalTickets: { $sum: { $size: '$seats' } }, totalRevenue: { $sum: '$totalPrice' } } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);
        return raw.map(item => ({ name: item.title, tickets: item.totalTickets, revenue: item.totalRevenue }));
    }
}

module.exports = new StatisticService();
