import axios from "axios";

// Get base URL from environment variables
// In Next.js, only NEXT_PUBLIC_ prefixed variables are available in the browser
const Base_URL = "http://localhost:5000"; // Temporarily hardcoded for debugging

console.log("Axios Base URL:", Base_URL);
console.log("NEXT_PUBLIC_API_BASE_URL env:", process.env.NEXT_PUBLIC_API_BASE_URL);

const axiosInstance = axios.create({
    baseURL: Base_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Enable sending cookies with requests
});

console.log("Axios instance created with baseURL:", axiosInstance.defaults.baseURL);

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from cookies (client-side)
        if (typeof window !== "undefined") {
            const tokenCookie = document.cookie
                .split("; ")
                .find((row) => row.startsWith("auth_token="));
            
            if (tokenCookie) {
                const token = decodeURIComponent(tokenCookie.split("=")[1]);
                config.headers.Authorization = `Bearer ${token}`;
                console.log("✅ Auth token added to request header");
            } else {
                console.log("⚠️ No auth token found in cookies");
            }
        }

        // If sending FormData, remove default Content-Type to let browser set it with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401 && typeof window !== "undefined") {
            // Clear cookies
            document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }
        // Return error for handling in server actions
        return Promise.reject(error);
    }
);

export default axiosInstance;