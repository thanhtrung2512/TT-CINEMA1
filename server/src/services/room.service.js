const Room = require('../models/room.model');

class RoomService {
    async createRoom(data) {
        // Tự động tính capacity dựa trên mảng seatLayout
        if (data.seatLayout && Array.isArray(data.seatLayout)) {
            data.capacity = data.seatLayout.length;
        }
        return await Room.create(data);
    }
    
    // Lấy tất cả phòng chiếu (có tuỳ chọn lọc theo rạp)
    async getAllRooms(cinemaId = null) {
        const filter = cinemaId ? { cinemaId } : {};
        return await Room.find(filter).populate('cinemaId', 'name city').sort({ createdAt: -1 });
    }

    async getRoomById(id) {
        return await Room.findById(id).populate('cinemaId', 'name city');
    }

    async updateRoom(id, data) {
        if (data.seatLayout && Array.isArray(data.seatLayout)) {
            data.capacity = data.seatLayout.length;
        }
        return await Room.findByIdAndUpdate(id, data, { new: true }).populate('cinemaId', 'name city');
    }

    async deleteRoom(id) {
        return await Room.findByIdAndDelete(id);
    }
}
module.exports = new RoomService();
