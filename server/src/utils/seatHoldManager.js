/**
 * Seat Holding Manager (In-Memory)
 * Quản lý ghế đang được giữ tạm thời bởi người dùng.
 * key: `${showtimeId}::${seatCode}` → { userId, socketId, timer }
 */
const holdMap = new Map();

const HOLD_SECONDS = 300; // 5 phút giữ ghế

let _io = null;

function init(io) {
    _io = io;
}

/**
 * Giữ ghế. Nếu ghế đã bị giữ bởi người khác → trả về false.
 */
function holdSeat(showtimeId, seatCode, userId, socketId) {
    const key = `${showtimeId}::${seatCode}`;
    const existing = holdMap.get(key);

    // Ghế đã bị người khác giữ
    if (existing && existing.userId !== userId) return false;

    // Huỷ timer cũ nếu cùng người dùng đang gia hạn
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
        releaseSeat(showtimeId, seatCode, userId);
    }, HOLD_SECONDS * 1000);

    holdMap.set(key, { userId, socketId, timer });
    return true;
}

/**
 * Thả ghế. Chỉ thả nếu đúng userId hoặc force=true.
 */
function releaseSeat(showtimeId, seatCode, userId, force = false) {
    const key = `${showtimeId}::${seatCode}`;
    const existing = holdMap.get(key);
    if (!existing) return;
    if (!force && existing.userId !== userId) return;

    clearTimeout(existing.timer);
    holdMap.delete(key);

    // Broadcast tới tất cả client trong room
    if (_io) {
        _io.to(`showtime:${showtimeId}`).emit('seat:released', { seatCode });
    }
}

/**
 * Thả toàn bộ ghế của 1 socket khi disconnect
 */
function releaseAllBySocket(socketId) {
    for (const [key, val] of holdMap.entries()) {
        if (val.socketId === socketId) {
            const [showtimeId, seatCode] = key.split('::');
            clearTimeout(val.timer);
            holdMap.delete(key);
            if (_io) {
                _io.to(`showtime:${showtimeId}`).emit('seat:released', { seatCode });
            }
        }
    }
}

/**
 * Lấy danh sách ghế đang bị giữ của 1 suất chiếu
 */
function getHeldSeats(showtimeId) {
    const held = [];
    for (const [key, val] of holdMap.entries()) {
        if (key.startsWith(`${showtimeId}::`)) {
            held.push({
                seatCode: key.split('::')[1],
                userId: val.userId,
            });
        }
    }
    return held;
}

module.exports = { init, holdSeat, releaseSeat, releaseAllBySocket, getHeldSeats, HOLD_SECONDS };
