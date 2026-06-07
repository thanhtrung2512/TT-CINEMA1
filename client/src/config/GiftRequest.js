import { apiClient } from './axiosClient';

const api = '/api/gifts';

export const requestGetAllGifts = async () => {
    try {
        const res = await apiClient.get(api);
        return res.data;
    } catch (err) { throw err.response?.data || err; }
};

export const requestGetGiftById = async (id) => {
    try {
        const res = await apiClient.get(`${api}/${id}`);
        return res.data;
    } catch (err) { throw err.response?.data || err; }
};

export const requestCreateGift = async (data) => {
    try {
        const res = await apiClient.post(api, data);
        return res.data;
    } catch (err) { throw err.response?.data || err; }
};

export const requestUpdateGift = async (id, data) => {
    try {
        const res = await apiClient.put(`${api}/${id}`, data);
        return res.data;
    } catch (err) { throw err.response?.data || err; }
};

export const requestDeleteGift = async (id) => {
    try {
        const res = await apiClient.delete(`${api}/${id}`);
        return res.data;
    } catch (err) { throw err.response?.data || err; }
};

export const requestGetMyGifts = async () => {
    try {
        const res = await apiClient.get(`${api}/my-gifts`);
        return res.data;
    } catch (err) { throw err.response?.data || err; }
};
