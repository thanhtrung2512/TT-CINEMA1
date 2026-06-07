import { request } from './request';
import { apiClient } from './axiosClient';

const api = '/api/rooms';

export const requestCreateRoom = async (data) => {
    const res = await apiClient.post(`${api}/create`, data);
    return res.data;
};

export const requestGetAllRooms = async (cinemaId = '') => {
    const query = cinemaId ? `?cinemaId=${cinemaId}` : '';
    const res = await request.get(`${api}/all${query}`);
    return res.data;
};

export const requestUpdateRoom = async (id, data) => {
    const res = await apiClient.put(`${api}/update/${id}`, data);
    return res.data;
};

export const requestDeleteRoom = async (id) => {
    const res = await apiClient.delete(`${api}/delete/${id}`);
    return res.data;
};
