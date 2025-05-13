import axios from 'axios';
import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

// 기본 Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // CORS 문제를 해결하기 위한 설정 추가
  withCredentials: false, // 서버가 CORS를 허용하는 경우만 true로 설정
  timeout: 10000 // 타임아웃 설정
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

// 응답 로깅
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`API 응답 (${response.config.url}):`);
    console.log('상태 코드:', response.status);
    console.log('데이터:', response.data);
    ipcRenderer.send('console-log', `API 응답 (${response.config.url}): 상태 ${response.status}`);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`API 오류 (${error.config?.url}):`);
      console.error('상태 코드:', error.response.status);
      console.error('데이터:', error.response.data);
      ipcRenderer.send('console-log', `API 오류 (${error.config?.url}): 상태 ${error.response.status}`);
    } else {
      console.error('API 오류:', error);
      ipcRenderer.send('console-log', `API 오류: ${error instanceof Error ? error.message : String(error)}`);
    }
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
        // IPC를 통해 토큰 갱신 요청
        const response = await ipcRenderer.invoke('http-request', {
          method: 'post',
          url: `${BASE_URL}/auth/token/refresh`,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('refresh_token')}`
          }
        });
        
        if (response.error) {
          throw new Error(response.message || '토큰 갱신 실패');
        }
        
        const newToken = response.data?.data?.accessToken;
        
        if (newToken) {
          // 새 액세스 토큰 저장
          localStorage.setItem('access_token', newToken);
          ipcRenderer.send('set-access-token', { token: newToken });
          
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
    
    // 다른 401 에러의 경우에도 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/signin';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;