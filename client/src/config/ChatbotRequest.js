import { apiClient } from './axiosClient';

/**
 * Gửi tin nhắn chat
 * @param {string} message
 * @param {string|null} sessionId - ID phiên đang chat (null = tạo mới)
 */
export const requestChat = async (message, sessionId = null) => {
    try {
        const res = await apiClient.post('/api/chatbot/chat', { message, sessionId });
        return res.data;
    } catch (err) {
        throw err.response?.data || err;
    }
};

export const requestGetMySessions = async () => {
    try {
        const res = await apiClient.get('/api/chatbot/sessions');
        return res.data;
    } catch (err) {
        throw err.response?.data || err;
    }
};

export const requestGetSession = async (id) => {
    try {
        const res = await apiClient.get(`/api/chatbot/sessions/${id}`);
        return res.data;
    } catch (err) {
        throw err.response?.data || err;
    }
};

export const requestDeleteSession = async (id) => {
    try {
        const res = await apiClient.delete(`/api/chatbot/sessions/${id}`);
        return res.data;
    } catch (err) {
        throw err.response?.data || err;
    }
};
