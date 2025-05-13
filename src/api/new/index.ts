// API 모듈 중앙 내보내기
export * from './axios';
export * from './authApi';
export * from './patientApi';
export * from './visitApi';
export * from './fileApi';
export * from './userApi';

// 기본 내보내기
import axiosInstance from './axios';
export default axiosInstance;
