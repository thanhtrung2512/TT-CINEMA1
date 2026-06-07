const { Server } = require('socket.io');
const seatHold = require('../utils/seatHoldManager');

function initSocket(httpServer, corsOrigin) {
    const io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    seatHold.init(io);

    io.on('connection', (socket) => {
        const userId = socket.handshake.auth?.userId || socket.id;
        console.log(`[Socket] Connect: ${socket.id} | user: ${userId}`);

        // Client tham gia phòng của 1 suất chiếu
        socket.on('showtime:join', ({ showtimeId }) => {
            socket.join(`showtime:${showtimeId}`);

            // Gửi ngay danh sách ghế đang bị giữ cho client mới
            const held = seatHold.getHeldSeats(showtimeId);
            socket.emit('seat:snapshot', { heldSeats: held, holdSeconds: seatHold.HOLD_SECONDS });
        });

        // Người dùng chọn ghế → giữ ghế
        socket.on('seat:hold', ({ showtimeId, seatCode }) => {
            const ok = seatHold.holdSeat(showtimeId, seatCode, userId, socket.id);
            if (ok) {
                // Thông báo cho TẤT CẢ mọi người trong phòng (kể cả người gửi)
                io.to(`showtime:${showtimeId}`).emit('seat:held', {
                    seatCode,
                    userId,
                    holdSeconds: seatHold.HOLD_SECONDS,
                });
            } else {
                // Báo lại riêng cho người gửi: ghế đã bị người khác giữ
                socket.emit('seat:hold_failed', { seatCode, reason: 'Ghế đang được người khác chọn' });
            }
        });

        // Người dùng bỏ chọn ghế → thả ghế
        socket.on('seat:release', ({ showtimeId, seatCode }) => {
            seatHold.releaseSeat(showtimeId, seatCode, userId);
            // releaseSeat tự broadcast seat:released
        });

        // Client rời phòng suất chiếu
        socket.on('showtime:leave', ({ showtimeId }) => {
            socket.leave(`showtime:${showtimeId}`);
        });

        // Khi disconnect → thả toàn bộ ghế đang giữ của socket này
        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnect: ${socket.id}`);
            seatHold.releaseAllBySocket(socket.id);
        });
    });

    return io;
}

module.exports = { initSocket };
