import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export interface SignUpRequest {
  userId: string;
  password: string;
  email: string;
  phone: string;
}

export interface SignInRequest {
  userId: string;
  password: string;
}

export interface SignInResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    accessToken: string;
  };
}

export const authApi = {
  signUp: async (userData: SignUpRequest): Promise<any> => {
    try {
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/auth/signUp`,
        data: userData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '회원가입 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('회원가입 요청 오류:', error);
      throw error;
    }
  },

  signIn: async (credentials: SignInRequest): Promise<SignInResponse> => {
    try {
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/auth/signIn`,
        data: credentials,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '로그인 실패');
      }
      
      // 응답 처리
      const accessToken = response.data?.data?.accessToken;
      if (accessToken) {
        // 토큰 저장
        localStorage.setItem('access_token', accessToken);
        
        // 전역 액세스 토큰 설정 (메인 프로세스)
        ipcRenderer.send('set-access-token', { token: accessToken });
      }
      
      return response.data;
    } catch (error) {
      console.error('로그인 요청 오류:', error);
      throw error;
    }
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/auth/token/refresh`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '토큰 갱신 실패');
      }
      
      // 새 액세스 토큰 저장
      const newToken = response.data?.data?.accessToken;
      if (newToken) {
        localStorage.setItem('access_token', newToken);
        ipcRenderer.send('set-access-token', { token: newToken });
      }
      
      return response.data;
    } catch (error) {
      console.error('토큰 갱신 요청 오류:', error);
      throw error;
    }
  },
  
  // 로그아웃 함수 추가
  logout: () => {
    localStorage.removeItem('access_token');
    ipcRenderer.send('set-access-token', { token: '' });
  }
};