import axios from "./axios";
import { API } from "./endpoints";

export const register = async ( registerData : any ) => {
    try{
        console.log('Registering user with data:', registerData);
        console.log('Register endpoint:', API.AUTH.REGISTER);
        console.log('Axios baseURL:', axios.defaults.baseURL);
        console.log('Full URL will be:', axios.defaults.baseURL + API.AUTH.REGISTER);
        const response = await axios.post(
            API.AUTH.REGISTER, //path
            registerData //body data
        );
        console.log('Register response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Register error object:', err);
        console.error('Register error response:', err.response?.data);
        console.error('Register error message:', err.message);
        console.error('Register error status:', err.response?.status);
        const errorMessage = 
            err.response?.data?.message 
            || err.response?.data?.error
            || err.message 
            || "Registration failed";
        console.error('Final error message:', errorMessage);
        throw { 
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
}

export const login = async ( loginData : any ) => {
    try{
        console.log('Logging in user with data:', loginData);
        console.log('Login endpoint:', API.AUTH.LOGIN);
        console.log('Axios baseURL:', axios.defaults.baseURL);
        console.log('Full URL will be:', axios.defaults.baseURL + API.AUTH.LOGIN);
        const response = await axios.post(
            API.AUTH.LOGIN, 
            loginData 
        );
        console.log('Login response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Login error object:', err);
        console.error('Login error response:', err.response?.data);
        console.error('Login error message:', err.message);
        console.error('Login error status:', err.response?.status);
        const errorMessage = 
            err.response?.data?.message 
            || err.response?.data?.error
            || err.message 
            || "Login failed";
        console.error('Final error message:', errorMessage);
        throw { 
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
}

export const exportMyData = async () => {
    // Download the authenticated user's own data as a JSON Blob.
    const response = await axios.get(API.AUTH.EXPORT_DATA, { responseType: 'blob' });
    return response.data as Blob;
};

export const getProfile = async () => {
    try {
        console.log('Getting user profile');
        const response = await axios.get(API.AUTH.PROFILE);
        console.log('Profile response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Get profile error:', err);
        const errorMessage = 
            err.response?.data?.message 
            || err.message 
            || "Failed to get profile";
        throw { 
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
}

export const updateProfile = async (id: string, formData: FormData) => {
    try {
        console.log('Updating user profile with id:', id);
        const response = await axios.put(
            API.AUTH.UPDATE_PROFILE(id),
            formData
        );
        console.log('Update profile response:', response.data);
        return response.data;
    } catch (err: Error | any) {
        console.error('Update profile error:', err);
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to update profile";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
}

export const requestPasswordReset = async (email: string) => {
    try {
        const response = await axios.post(API.AUTH.REQUEST_PASSWORD_RESET, { email });
        return response.data;
    } catch (error: Error | any) {
        throw new Error(error.response?.data?.message || error.message || 'Request password reset failed');
    }
};

export const resetPassword = async (token: string, newPassword: string) => {
    try {
        const response = await axios.post(API.AUTH.RESET_PASSWORD(token), { newPassword: newPassword });
        return response.data;
    } catch (error: Error | any) {
        throw new Error(error.response?.data?.message || error.message || 'Reset password failed');
    }
}