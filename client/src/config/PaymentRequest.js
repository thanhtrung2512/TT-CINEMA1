import { apiClient } from './axiosClient';

const apiPayment = '/api/payment';

export const requestPayMomo = async (data) => {
    try {
        const response = await apiClient.post(`${apiPayment}/momo`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestResumeMomoPayment = async (bookingId) => {
    try {
        const response = await apiClient.post(`${apiPayment}/momo/resume/${bookingId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestPayVNPay = async (data) => {
    try {
        const response = await apiClient.post(`${apiPayment}/vnpay`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestPayCash = async (data) => {
    try {
        const response = await apiClient.post(`${apiPayment}/cash`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestPayMock = async (data) => {
    try {
        const response = await apiClient.post(`${apiPayment}/mock`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestConfirmMomoReturn = async (params) => {
    try {
        const response = await apiClient.post(`${apiPayment}/momo/confirm-return`, params);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestConfirmVNPayReturn = async (params) => {
    try {
        const response = await apiClient.post(`${apiPayment}/vnpay/confirm-return`, params);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
