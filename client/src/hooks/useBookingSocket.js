import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useStore } from './useStore';

let _socket = null;

function getSocket(userId) {
    if (!_socket || _socket.disconnected) {
        _socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
            auth: { userId },
            transports: ['websocket', 'polling'],
        });
    }
    return _socket;
}

/**
 * Hook quản lý kết nối Socket.IO cho trang đặt vé.
 * @param {string} showtimeId
 * @param {object} handlers - { onSnapshot, onHeld, onReleased, onHoldFailed }
 */
export function useBookingSocket(showtimeId, handlers = {}) {
    const { dataUser } = useStore();
    const socketRef = useRef(null);
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!showtimeId) return;

        const userId = dataUser?._id || 'guest_' + Math.random().toString(36).slice(2);
        const socket = getSocket(userId);
        socketRef.current = socket;

        // Tham gia phòng suất chiếu
        socket.emit('showtime:join', { showtimeId });

        const onSnapshot = (data) => handlersRef.current.onSnapshot?.(data);
        const onHeld     = (data) => handlersRef.current.onHeld?.(data);
        const onReleased = (data) => handlersRef.current.onReleased?.(data);
        const onFailed   = (data) => handlersRef.current.onHoldFailed?.(data);

        socket.on('seat:snapshot',    onSnapshot);
        socket.on('seat:held',        onHeld);
        socket.on('seat:released',    onReleased);
        socket.on('seat:hold_failed', onFailed);

        return () => {
            socket.emit('showtime:leave', { showtimeId });
            socket.off('seat:snapshot',    onSnapshot);
            socket.off('seat:held',        onHeld);
            socket.off('seat:released',    onReleased);
            socket.off('seat:hold_failed', onFailed);
        };
    }, [showtimeId, dataUser]);

    const holdSeat = useCallback((seatCode) => {
        socketRef.current?.emit('seat:hold', { showtimeId, seatCode });
    }, [showtimeId]);

    const releaseSeat = useCallback((seatCode) => {
        socketRef.current?.emit('seat:release', { showtimeId, seatCode });
    }, [showtimeId]);

    return { holdSeat, releaseSeat };
}
