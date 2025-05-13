import axios, { AxiosInstance } from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, removeTokens } from '../utils/tokenUtils';

const BASE_URL = 'http://localhost:8080';

export const setupInterceptors = (axiosInstance: AxiosInstance) => {
  // 요청 인터셉터
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // 액세스 토큰 만료 (401 에러) 및 재시도 안한 경우
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            // 리프레시 토큰도 없으면 로그아웃 처리
            removeTokens();
            window.location.href = '/signin';
            return Promise.reject(error);
          }
          
          // 리프레시 토큰으로 새로운 액세스 토큰 요청
          const response = await axios.post(
            `${BASE_URL}/auth/token/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          
          const { accessToken } = response.data;
          
          // 새 액세스 토큰 저장
          setAccessToken(accessToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // 리프레시 토큰도 만료되었으면 로그아웃
          removeTokens();
          window.location.href = '/signin';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};