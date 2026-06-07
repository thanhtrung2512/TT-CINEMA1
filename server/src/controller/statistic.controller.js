const StatisticService = require('../services/statistic.service');
const { OK } = require('../core/success.response');

class StatisticController {
    async getDashboardStats(req, res) {
        const stats = await StatisticService.getDashboardStats();
        new OK({
            message: 'Lấy dữ liệu thống kê thành công',
            metadata: stats
        }).send(res);
    }
}

module.exports = new StatisticController();
