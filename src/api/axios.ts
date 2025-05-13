import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 모든 요청에 Authorization 헤더 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 갱신 처리
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 액세스 토큰 만료 (401) 및 재시도 안 한 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('리프레시 토큰이 없습니다.');
        }
        
        // 토큰 갱신 요청
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          }
        );
        
        const newToken = response.data?.accessToken;
        
        if (newToken) {
          // 새 액세스 토큰 저장
          localStorage.setItem('access_token', newToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('토큰 갱신 실패:', refreshError);
        
        // 토큰 관련 데이터 삭제
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
