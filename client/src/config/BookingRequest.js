import { request } from './request';
import { apiClient } from './axiosClient';

const apiBooking = '/api/bookings';

export const requestCreateBooking = async (data) => {
    try {
        const response = await apiClient.post(`${apiBooking}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestCreateOfflineBooking = async (data) => {
    try {
        const response = await apiClient.post(`${apiBooking}/offline`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetEmployeeReport = async () => {
    try {
        const response = await apiClient.get(`${apiBooking}/employee-report`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetMyBookings = async () => {
    try {
        const response = await apiClient.get(`${apiBooking}/my-bookings`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetBookingById = async (id) => {
    try {
        const response = await apiClient.get(`${apiBooking}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestGetAllBookings = async () => {
    try {
        const response = await apiClient.get(`${apiBooking}/all`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestVerifyBooking = async (id) => {
    try {
        const response = await apiClient.get(`${apiBooking}/${id}/verify`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestCheckInBooking = async (id) => {
    try {
        const response = await apiClient.put(`${apiBooking}/${id}/checkin`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestAdminConfirmPayment = async (id) => {
    try {
        const response = await apiClient.put(`${apiBooking}/${id}/confirm-payment`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
