import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.response.use(
  (response) => {
    if ('success' in response.data && !response.data.success) {
      return Promise.reject(response.data.message ?? 'Unknown error');
    } 
    return response;
  },
  (error) => {
    return Promise.reject(error.message ?? 'Server error');
  },
);

export default axiosInstance;
