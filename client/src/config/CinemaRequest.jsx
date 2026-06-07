import { request } from './request';
import { apiClient } from './axiosClient';

const api = '/api/cinemas';

export const requestCreateCinema = async (data) => {
    const res = await apiClient.post(`${api}/create`, data);
    return res.data;
};

export const requestGetAllCinemas = async () => {
    const res = await request.get(`${api}/all`);
    return res.data;
};

export const requestUpdateCinema = async (id, data) => {
    const res = await apiClient.put(`${api}/update/${id}`, data);
    return res.data;
};

export const requestDeleteCinema = async (id) => {
    const res = await apiClient.delete(`${api}/delete/${id}`);
    return res.data;
};
