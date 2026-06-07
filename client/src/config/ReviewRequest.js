import { request } from './request';
import { apiClient } from './axiosClient';

const apiReview = '/api/reviews';

export const requestGetReviewsByMovie = async (movieId) => {
    try {
        const response = await request.get(`${apiReview}/movie/${movieId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestCreateReview = async (movieId, data) => {
    try {
        const response = await apiClient.post(`${apiReview}/${movieId}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetMyReviews = async () => {
    try {
        const response = await apiClient.get(`${apiReview}/me`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetAllReviews = async () => {
    try {
        const response = await apiClient.get(`${apiReview}/all`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestDeleteReview = async (id) => {
    try {
        const response = await apiClient.delete(`${apiReview}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
