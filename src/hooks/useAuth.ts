import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { ipcRenderer } from 'electron';
import { settingsAtom } from '../atoms/states';
import { authApi } from '../api/authApi';

const BASE_URL = 'http://localhost:8080';

// 타입 정의
interface SignInRequest {
  userId: string;
  password: string;
}

interface SignUpRequest {
  userId: string;
  password: string;
  email: string;
  phone: string;
}

interface UserInfo {
  id: number;
  userId: string;
  email: string;
  phone: string;
}

export function useAuth() {
  const [settings, setSettings] = useAtom(settingsAtom);

  // 회원가입 함수
  const signUp = useCallback(async (userData: SignUpRequest) => {
    try {
      ipcRenderer.send('console-log', '회원가입 요청 데이터: ' + JSON.stringify(userData));
      
      // API 모듈을 통해 회원가입 요청
      const response = await authApi.signUp(userData);
      
      ipcRenderer.send('console-log', '회원가입 응답: ' + JSON.stringify(response));
      
      if (response && response.statusCode === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ipcRenderer.send('console-log', '회원가입 처리 오류: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }, []);

  // 로그인 함수
  const signIn = useCallback(async (credentials: SignInRequest) => {
    try {
      ipcRenderer.send('console-log', '로그인 요청 데이터: ' + JSON.stringify(credentials));
      
      // API 모듈을 통해 로그인 요청
      const response = await authApi.signIn(credentials);
      
      ipcRenderer.send('console-log', '로그인 응답: ' + JSON.stringify(response));
      
      if (response && response.statusCode === 200) {
        const authData = response.data;
        
        // 액세스 토큰 저장
        if (authData.accessToken) {
          localStorage.setItem('access_token', authData.accessToken);
          
          // 메인 프로세스에 토큰 전달
          ipcRenderer.send('set-access-token', { token: authData.accessToken });
          ipcRenderer.send('console-log', '토큰 메인 프로세스로 전달됨: ' + authData.accessToken.substring(0, 10) + '...');
        }
        
        // 리프레시 토큰 저장
        if (authData.refreshToken) {
          localStorage.setItem('refresh_token', authData.refreshToken);
        }
        
        // settings 업데이트
        if (settings) {
          const newSettings = {
            ...settings,
            userContext: {
              name: credentials.userId,
              role: 'user',
              lastActive: new Date(),
            },
            userLastActive: new Date(),
          };
          setSettings(newSettings);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      ipcRenderer.send('console-log', '로그인 처리 오류: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }, [settings, setSettings]);

  // 토큰 갱신 함수
  const refreshToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('refresh_token');
      
      if (!token) {
        // 토큰이 없으면 로그인 페이지로 리다이렉트
        window.location.href = '/signin';
        return false;
      }
      
      ipcRenderer.send('console-log', '토큰 갱신 요청');
      
      // API 모듈을 통해 토큰 갱신 요청
      const response = await authApi.refreshToken();
      
      ipcRenderer.send('console-log', '토큰 갱신 응답: ' + JSON.stringify(response));
      
      if (response && response.statusCode === 200 && response.data) {
        const authData = response.data;
        
        if (authData.accessToken) {
          localStorage.setItem('access_token', authData.accessToken);
          
          // 메인 프로세스에 토큰 전달
          ipcRenderer.send('set-access-token', { token: authData.accessToken });
          ipcRenderer.send('console-log', '갱신된 토큰 메인 프로세스로 전달됨: ' + authData.accessToken.substring(0, 10) + '...');
          
          return true;
        }
      }
      
      // 토큰 갱신 실패 시 처리
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return false;
    } catch (error) {
      ipcRenderer.send('console-log', '토큰 갱신 오류: ' + (error instanceof Error ? error.message : String(error)));
      
      // 오류 발생 시 토큰 삭제 및 로그인 페이지 리다이렉트
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return false;
    }
  }, []);

  // 사용자 정보 가져오기 함수
  const getUserInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // 토큰이 없으면 로그인 페이지로 리다이렉트
        window.location.href = '/signin';
        return null;
      }
      
      ipcRenderer.send('console-log', '사용자 정보 요청');
      
      // 현재 사용자 정보 요청
      const response = await authApi.getCurrentUser();
      
      ipcRenderer.send('console-log', '사용자 정보 응답: ' + JSON.stringify(response));
      
      if (response && response.statusCode === 200 && response.data) {
        return response.data as UserInfo;
      }
      
      // 사용자 정보 조회 실패 시 로그인 페이지로 리다이렉트
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return null;
    } catch (error) {
      ipcRenderer.send('console-log', '사용자 정보 조회 오류: ' + (error instanceof Error ? error.message : String(error)));
      
      // 오류 발생 시 토큰 삭제 및 로그인 페이지 리다이렉트
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return null;
    }
  }, []);

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      ipcRenderer.send('console-log', '로그아웃 요청');
      
      // API 모듈을 통해 로그아웃 요청
      await authApi.signOut();
      
      // settings 업데이트
      if (settings) {
        const newSettings = {
          ...settings,
          userContext: null,
          userLastActive: null,
        };
        setSettings(newSettings);
      }
      
      // 메인 프로세스에 토큰 제거 알림
      ipcRenderer.send('set-access-token', { token: '' });
      ipcRenderer.send('console-log', '로그아웃: 토큰이 메인 프로세스에서 제거됨');
      
      return true;
    } catch (error) {
      ipcRenderer.send('console-log', '로그아웃 처리 오류: ' + (error instanceof Error ? error.message : String(error)));
      
      // 오류 발생 시에도 토큰 제거
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      
      return false;
    }
  }, [settings, setSettings]);

  return {
    signIn,
    signUp,
    signOut,
    refreshToken,
    getUserInfo
  };
}