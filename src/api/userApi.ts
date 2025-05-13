import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export interface UserInfo {
  id: number;
  userId: string;
  email: string;
  phone: string;
  refreshToken: string;
}

export const userApi = {
  getUserInfo: async (): Promise<UserInfo> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'get',
        url: `${BASE_URL}/user/info`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '사용자 정보 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      throw error;
    }
  }
};
