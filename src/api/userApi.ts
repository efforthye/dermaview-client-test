import axiosInstance from './axios';
import { AxiosResponse } from 'axios';
import { ApiResponse } from './authApi';

export interface UserInfo {
  id?: number;
  userId: string;
  email: string;
  phone: string;
  name?: string;
  position?: string;
}

export const userApi = {
  // 사용자 정보 조회
  getUserInfo: async (): Promise<ApiResponse<UserInfo>> => {
    try {
      const response: AxiosResponse<ApiResponse<UserInfo>> = await axiosInstance.get('/user/info');
      return response.data;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      throw error;
    }
  },
  
  // 사용자 정보 수정
  updateUserInfo: async (userInfo: Partial<UserInfo>): Promise<ApiResponse<void>> => {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/user/update', userInfo);
      return response.data;
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      throw error;
    }
  },
  
  // 비밀번호 변경
  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/user/change-password', {
        oldPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      throw error;
    }
  }
};
