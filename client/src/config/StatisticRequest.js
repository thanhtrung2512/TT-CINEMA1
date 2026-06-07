import { request } from './request';
import { apiClient } from './axiosClient';

const api = '/api/statistics';

export const requestGetDashboardStats = async () => {
    try {
        const response = await apiClient.get(`${api}/dashboard`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
