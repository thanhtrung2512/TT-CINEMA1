import { apiClient } from './axiosClient';

const API = '/api/notifications';

export const requestGetNotifications = async () => {
    const res = await apiClient.get(API);
    return res.data;
};

export const requestMarkAsRead = async (id) => {
    const res = await apiClient.patch(`${API}/${id}/read`);
    return res.data;
};

export const requestMarkAllAsRead = async () => {
    const res = await apiClient.patch(`${API}/read-all`);
    return res.data;
};

export const requestDeleteNotification = async (id) => {
    const res = await apiClient.delete(`${API}/${id}`);
    return res.data;
};
