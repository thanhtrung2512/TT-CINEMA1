const CinemaService = require('../services/cinema.service');
const { OK } = require('../core/success.response');

class CinemaController {
    async createCinema(req, res) {
        const cinema = await CinemaService.createCinema(req.body);
        new OK({ message: 'Tạo rạp thành công', metadata: cinema }).send(res);
    }
    async getAllCinemas(req, res) {
        const cinemas = await CinemaService.getAllCinemas();
        new OK({ message: 'Lấy danh sách rạp thành công', metadata: cinemas }).send(res);
    }
    async updateCinema(req, res) {
        const cinema = await CinemaService.updateCinema(req.params.id, req.body);
        new OK({ message: 'Cập nhật rạp thành công', metadata: cinema }).send(res);
    }
    async deleteCinema(req, res) {
        const cinema = await CinemaService.deleteCinema(req.params.id);
        new OK({ message: 'Xoá rạp thành công', metadata: cinema }).send(res);
    }
}
module.exports = new CinemaController();
