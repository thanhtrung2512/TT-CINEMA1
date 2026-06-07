import { apiClient } from './axiosClient';

const apiVoucher = '/api/vouchers';

export const requestCreateVoucher = async (data) => {
    try {
        const response = await apiClient.post(`${apiVoucher}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetActiveVouchers = async () => {
    try {
        const response = await apiClient.get(`${apiVoucher}/active`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetAllVouchers = async () => {
    try {
        const response = await apiClient.get(`${apiVoucher}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestUpdateVoucher = async (id, data) => {
    try {
        const response = await apiClient.put(`${apiVoucher}/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestDeleteVoucher = async (id) => {
    try {
        const response = await apiClient.delete(`${apiVoucher}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestApplyVoucher = async (code, orderValue) => {
    try {
        const response = await apiClient.post(`${apiVoucher}/apply`, { code, orderValue });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
