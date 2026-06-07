const RoomService = require('../services/room.service');
const { OK } = require('../core/success.response');

class RoomController {
    async createRoom(req, res) {
        const room = await RoomService.createRoom(req.body);
        new OK({ message: 'Tạo phòng chiếu thành công', metadata: room }).send(res);
    }
    async getAllRooms(req, res) {
        // Có thể truyền ?cinemaId=...
        const { cinemaId } = req.query;
        const rooms = await RoomService.getAllRooms(cinemaId);
        new OK({ message: 'Lấy danh sách phòng thành công', metadata: rooms }).send(res);
    }
    async updateRoom(req, res) {
        const room = await RoomService.updateRoom(req.params.id, req.body);
        new OK({ message: 'Cập nhật phòng thành công', metadata: room }).send(res);
    }
    async deleteRoom(req, res) {
        const room = await RoomService.deleteRoom(req.params.id);
        new OK({ message: 'Xoá phòng thành công', metadata: room }).send(res);
    }
}
module.exports = new RoomController();
