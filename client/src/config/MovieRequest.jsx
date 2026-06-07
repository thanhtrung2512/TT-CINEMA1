import { request } from './request';
import { apiClient } from './axiosClient';

const apiMovie = '/api/movies';

// Sử dụng FormData do có upload file
export const requestCreateMovie = async (formData) => {
    const res = await apiClient.post(`${apiMovie}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const requestGetAllMovies = async (search = '') => {
    const url = search ? `${apiMovie}/all?search=${encodeURIComponent(search)}` : `${apiMovie}/all`;
    const res = await request.get(url);
    return res.data;
};

export const requestGetMovieById = async (id) => {
    const res = await request.get(`${apiMovie}/${id}`);
    return res.data;
};

export const requestGetMovieBySlug = async (slug) => {
    const res = await request.get(`${apiMovie}/slug/${slug}`);
    return res.data;
};

// Sử dụng FormData do có upload file
export const requestUpdateMovie = async (id, formData) => {
    const res = await apiClient.post(`${apiMovie}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const requestDeleteMovie = async (id) => {
    const res = await apiClient.delete(`${apiMovie}/delete/${id}`);
    return res.data;
};
