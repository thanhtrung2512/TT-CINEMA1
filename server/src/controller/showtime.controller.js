const ShowtimeService = require('../services/showtime.service');
const { OK } = require('../core/success.response');

class ShowtimeController {
    async createShowtime(req, res) {
        const showtime = await ShowtimeService.createShowtime(req.body);
        new OK({ message: 'Tạo suất chiếu thành công', metadata: showtime }).send(res);
    }
    async getAllShowtimes(req, res) {
        const { movieId, cinemaId } = req.query;
        const showtimes = await ShowtimeService.getAllShowtimes(movieId, cinemaId);
        new OK({ message: 'Lấy danh sách suất chiếu thành công', metadata: showtimes }).send(res);
    }
    async getShowtimeById(req, res) {
        const showtime = await ShowtimeService.getShowtimeById(req.params.id);
        new OK({ message: 'Lấy thông tin suất chiếu thành công', metadata: showtime }).send(res);
    }
    async updateShowtime(req, res) {
        const showtime = await ShowtimeService.updateShowtime(req.params.id, req.body);
        new OK({ message: 'Cập nhật suất chiếu thành công', metadata: showtime }).send(res);
    }
    async deleteShowtime(req, res) {
        const showtime = await ShowtimeService.deleteShowtime(req.params.id);
        new OK({ message: 'Xoá suất chiếu thành công', metadata: showtime }).send(res);
    }
    async updateSeatMaintenance(req, res) {
        const { seatCode, isMaintenance } = req.body;
        const result = await ShowtimeService.updateSeatMaintenance(req.params.id, seatCode, isMaintenance);
        new OK({ message: 'Cập nhật trạng thái ghế thành công', metadata: result }).send(res);
    }
}
module.exports = new ShowtimeController();
