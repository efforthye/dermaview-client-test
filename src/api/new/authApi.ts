import axiosInstance from './axios';
import { AxiosResponse } from 'axios';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface SignInParams {
  userId: string;
  password: string;
}

export interface SignUpParams {
  userId: string;
  password: string;
  email: string;
  phone: string;
  name?: string;
  position?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const authApi = {
  // 로그인
  signIn: async (params: SignInParams): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await axiosInstance.post('/auth/signin', params);
      return response.data;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  },
  
  // 회원가입
  signUp: async (params: SignUpParams): Promise<ApiResponse<void>> => {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/auth/signup', params);
      return response.data;
    } catch (error) {
      console.error('회원가입 오류:', error);
      throw error;
    }
  },
  
  // 토큰 갱신
  refreshToken: async (): Promise<ApiResponse<AuthResponse>> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }
    
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await axiosInstance.post('/auth/token/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      throw error;
    }
  },
  
  // 로그아웃
  signOut: async (): Promise<void> => {
    try {
      await axiosInstance.post('/auth/signout');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 로그아웃 실패 시에도 로컬 토큰은 삭제
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  },
  
  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      throw error;
    }
  }
};
