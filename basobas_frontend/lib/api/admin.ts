// Approve a property (admin)
export const approveProperty = async (id: string) => {
    try {
        const response = await axios.put(`/api/property/admin/${id}/approve`);
        return response.data;
    } catch (err: Error | any) {
        throw {
            message: err.response?.data?.message || err.message || "Failed to approve property",
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

// Reject a property (admin)
export const rejectProperty = async (id: string) => {
    try {
        const response = await axios.put(`/api/property/admin/${id}/reject`);
        return response.data;
    } catch (err: Error | any) {
        throw {
            message: err.response?.data?.message || err.message || "Failed to reject property",
            status: err.response?.status,
            data: err.response?.data
        };
    }
};
// Admin API layer
// Call admin endpoints from backend

import axios from "./axios";
import { API } from "./endpoints";

export const getUsers = async (page: number = 1, limit: number = 10) => {
    try {
        console.log('Fetching users list from admin endpoint');
        const response = await axios.get(API.ADMIN.LIST_USERS, {
            params: { page, limit }
        });
        console.log('Users response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to load users', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to load users";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const getUserById = async (id: string) => {
    try {
        console.log('Fetching user with id:', id);
        const response = await axios.get(API.ADMIN.GET_USER(id));
        console.log('User response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to load user', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to load user";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const createUser = async (formData: FormData) => {
    try {
        console.log('Creating user');
        const response = await axios.post(API.ADMIN.CREATE_USER, formData);
        console.log('Create user response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to create user', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to create user";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const updateUser = async (id: string, formData: FormData) => {
    try {
        console.log('Updating user with id:', id);
        const response = await axios.put(API.ADMIN.UPDATE_USER(id), formData);
        console.log('Update user response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to update user', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to update user";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const deleteUser = async (id: string) => {
    try {
        console.log('Deleting user with id:', id);
        const response = await axios.delete(API.ADMIN.DELETE_USER(id));
        console.log('Delete user response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to delete user', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to delete user";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const promoteUser = async (id: string) => {
    try {
        console.log('Promoting user to admin:', id);
        const response = await axios.post(API.ADMIN.PROMOTE_USER(id));
        console.log('Promote user response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to promote user', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to promote user";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

// Admin Property Management Functions
export const getAllProperties = async () => {
    try {
        console.log('Fetching all properties from admin endpoint');
        const response = await axios.get('/api/admin/properties');
        console.log('Properties response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to load properties', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to load properties";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const updatePropertyStatus = async (id: string, status: string) => {
    try {
        console.log('Updating property status:', id, status);
        const response = await axios.put(`/api/admin/properties/${id}/status`, { status });
        console.log('Update property status response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to update property status', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to update property status";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const deleteProperty = async (id: string) => {
    try {
        console.log('Deleting property:', id);
        const response = await axios.delete(`/api/admin/properties/${id}`);
        console.log('Delete property response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Failed to delete property', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to delete property";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};

export const getAllBookings = async () => {
    try {
        const response = await axios.get(API.ADMIN.LIST_BOOKINGS);
        return response.data;
    } catch (err: Error | any) {
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to load bookings";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
};
