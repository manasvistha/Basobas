import axios from "./axios";
import { API } from "./endpoints";

export const register = async ( registerData : any ) => {
    try{
        const response = await axios.post(
            API.AUTH.REGISTER, //path
            registerData //body data
        );
        return response.data;
    } catch (err: Error | any) {
        const errorMessage =
            err.response?.data?.message
            || err.response?.data?.error
            || err.message
            || "Registration failed";
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
}

export const login = async ( loginData : any ) => {
    try{
        const response = await axios.post(
            API.AUTH.LOGIN,
            loginData
        );
        return response.data;
    } catch (err: Error | any) {
        // A wrong email/password is an expected outcome, not a program error —
        // surface a friendly message to the form; do not log to the console
        // (that would trip the Next.js dev error overlay and leak credentials).
        const raw =
            err.response?.data?.message
            || err.response?.data?.error
            || err.message
            || "Login failed";
        const errorMessage =
            raw === "Invalid credentials"
                ? "Incorrect email or password. Please try again."
                : raw;
        throw {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        };
    }
}

export const logout = async () => {
    // Ask the server to clear the HttpOnly session cookie. Ignore network errors
    // so the client can still clear its own state and redirect.
    try {
        await axios.post(API.AUTH.LOGOUT);
    } catch {
        // no-op
    }
};

export const verifyLoginMfa = async (mfaToken: string, otp: string) => {
    const response = await axios.post(API.AUTH.VERIFY_MFA, { mfaToken, otp });
    return response.data;
};

export const changeExpiredPassword = async (changeToken: string, newPassword: string) => {
    const response = await axios.post(API.AUTH.CHANGE_EXPIRED, { changeToken, newPassword });
    return response.data;
};

export const mfaSetup = async () => {
    const response = await axios.post(API.AUTH.MFA_SETUP);
    return response.data as { success: boolean; otpauthUrl: string; qrDataUrl: string; secret: string };
};

export const mfaEnable = async (otp: string) => {
    const response = await axios.post(API.AUTH.MFA_ENABLE, { otp });
    return response.data;
};

export const mfaDisable = async (otp: string) => {
    const response = await axios.post(API.AUTH.MFA_DISABLE, { otp });
    return response.data;
};

export const exportMyData = async () => {
    // Download the authenticated user's own data as a JSON Blob.
    const response = await axios.get(API.AUTH.EXPORT_DATA, { responseType: 'blob' });
    return response.data as Blob;
};

export const importMyData = async (file: File) => {
    // Upload a previously-exported JSON file to restore the current user's own
    // profile and property listings. The server ignores any ids in the file.
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(API.AUTH.IMPORT_DATA, formData);
    return response.data;
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