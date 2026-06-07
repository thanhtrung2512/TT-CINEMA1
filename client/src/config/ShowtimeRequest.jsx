import { request } from './request';
import { apiClient } from './axiosClient';

const api = '/api/showtimes';

export const requestCreateShowtime = async (data) => {
    const res = await apiClient.post(`${api}/create`, data);
    return res.data;
};

export const requestGetAllShowtimes = async (movieId = '', cinemaId = '') => {
    let query = '?';
    if (movieId) query += `movieId=${movieId}&`;
    if (cinemaId) query += `cinemaId=${cinemaId}`;
    const res = await request.get(`${api}/all${query}`);
    return res.data;
};

export const requestGetShowtimeById = async (id) => {
    const res = await request.get(`${api}/${id}`);
    return res.data;
};

export const requestUpdateShowtime = async (id, data) => {
    const res = await apiClient.put(`${api}/update/${id}`, data);
    return res.data;
};

export const requestDeleteShowtime = async (id) => {
    const res = await apiClient.delete(`${api}/delete/${id}`);
    return res.data;
};

export const requestUpdateSeatMaintenance = async (showtimeId, seatCode, isMaintenance) => {
    const res = await apiClient.put(`${api}/${showtimeId}/seats/maintenance`, { seatCode, isMaintenance });
    return res.data;
};
