import { request } from './request';
import { apiClient } from './axiosClient';

const api = '/api/services';

export const requestCreateService = async (formData) => {
    const res = await apiClient.post(`${api}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const requestGetAllServices = async () => {
    const res = await request.get(`${api}/all`);
    return res.data;
};

export const requestUpdateService = async (id, formData) => {
    const res = await apiClient.post(`${api}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const requestDeleteService = async (id) => {
    const res = await apiClient.delete(`${api}/delete/${id}`);
    return res.data;
};
