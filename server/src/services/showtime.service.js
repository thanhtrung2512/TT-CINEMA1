const Showtime = require('../models/showtime.model');
const Room = require('../models/room.model');

class ShowtimeService {
    async createShowtime(data) {
        // Lấy thông tin phòng chiếu để lấy sơ đồ ghế
        const room = await Room.findById(data.roomId);
        if (!room) {
            throw new Error('Phòng chiếu không tồn tại');
        }

        // Kiểm tra trùng lịch chiếu trong cùng một phòng
        const overlappingShowtimes = await Showtime.find({
            roomId: data.roomId,
            startTime: { $lt: new Date(data.endTime) },
            endTime: { $gt: new Date(data.startTime) }
        });

        if (overlappingShowtimes.length > 0) {
            throw new Error('Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này');
        }

        // Clone mảng seatLayout từ Room sang seats của Showtime
        // Đặt mặc định trạng thái 'Available' cho tất cả
        const showtimeSeats = room.seatLayout.map(seat => ({
            row: seat.row,
            number: seat.number,
            type: seat.type,
            status: 'Available',
            userId: null
        }));

        data.seats = showtimeSeats;

        // Tính endTime dựa trên startTime và thời lượng phim (Tạm để client tự truyền hoặc update sau)
        // Nếu data.endTime chưa có, client bắt buộc truyền.

        const showtime = await Showtime.create(data);
        return showtime;
    }

    async getAllShowtimes(movieId = null, cinemaId = null) {
        // Tuỳ chọn lọc suất chiếu theo phim và rạp
        let filter = {};
        if (movieId) filter.movieId = movieId;

        // Lưu ý: cinemaId phải lọc thông qua roomId
        const query = Showtime.find(filter)
            .populate('movieId', 'title posterUrl')
            .populate({
                path: 'roomId',
                select: 'name cinemaId',
                populate: { path: 'cinemaId', select: 'name city' }
            })
            .sort({ startTime: 1 }); // Xếp theo giờ chiếu

        let showtimes = await query.exec();

        // Nếu có truyền cinemaId, lọc bằng JS (hoặc viết aggregate phức tạp hơn)
        if (cinemaId) {
            showtimes = showtimes.filter(st => st.roomId && st.roomId.cinemaId && st.roomId.cinemaId._id.toString() === cinemaId.toString());
        }

        return showtimes;
    }

    async getShowtimeById(id) {
        return await Showtime.findById(id)
            .populate('movieId')
            .populate({
                path: 'roomId',
                populate: { path: 'cinemaId' }
            });
    }

    async updateShowtime(id, data) {
        // Cập nhật thông tin cơ bản (không cập nhật ghế ở đây)
        return await Showtime.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteShowtime(id) {
        return await Showtime.findByIdAndDelete(id);
    }

    async updateSeatMaintenance(showtimeId, seatCode, isMaintenance) {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) throw new Error('Suất chiếu không tồn tại');

        const seat = showtime.seats.find(s => `${s.row}${s.number}` === seatCode);
        if (!seat) throw new Error('Ghế không tồn tại');

        if (isMaintenance) {
            if (seat.status !== 'Available' && seat.status !== 'Maintenance') {
                throw new Error('Ghế này đã có người đặt, không thể bảo trì');
            }
            seat.status = 'Maintenance';
        } else {
            if (seat.status === 'Maintenance') {
                seat.status = 'Available';
            }
        }

        await showtime.save();
        return showtime;
    }
}
module.exports = new ShowtimeService();
