import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { ipcRenderer } from 'electron';
import { settingsAtom } from '../atoms/states';

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
      const signUpData = {
        id: 1,
        userId: userData.userId,
        password: userData.password,
        email: userData.email,
        phone: userData.phone,
        refreshToken: "1"
      };
      
      ipcRenderer.send('console-log', '회원가입 요청 데이터: ' + JSON.stringify(signUpData));
      
      // 메인 프로세스를 통해 HTTP 요청
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/auth/signUp`,
        data: signUpData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      ipcRenderer.send('console-log', '회원가입 응답: ' + JSON.stringify(response));
      
      if (!response.error && (response.status === 200 || response.status === 201)) {
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
      
      // 메인 프로세스를 통해 HTTP 요청
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/auth/signIn`,
        data: credentials,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      ipcRenderer.send('console-log', '로그인 응답: ' + JSON.stringify(response));
      
      if (!response.error && (response.status === 200 || response.status === 201)) {
        // 응답 데이터가 토큰 문자열인 경우
        if (typeof response.data === 'string') {
          // 토큰 저장
          localStorage.setItem('access_token', response.data);
          
          // 메인 프로세스에 토큰 전달
          ipcRenderer.send('set-access-token', { token: response.data });
          ipcRenderer.send('console-log', '토큰 메인 프로세스로 전달됨(문자열): ' + response.data.substring(0, 10) + '...');
          
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
        // 응답 데이터가 객체인 경우 (토큰 포함)
        else if (response.data && typeof response.data === 'object') {
          let accessToken = '';
          
          // API 응답 구조에 따라 토큰 추출
          if (response.data.accessToken) {
            accessToken = response.data.accessToken;
            localStorage.setItem('access_token', accessToken);
          } else if (response.data.data && response.data.data.accessToken) {
            accessToken = response.data.data.accessToken;
            localStorage.setItem('access_token', accessToken);
          }
          
          // 메인 프로세스에 토큰 전달
          if (accessToken) {
            ipcRenderer.send('set-access-token', { token: accessToken });
            ipcRenderer.send('console-log', '토큰 메인 프로세스로 전달됨(객체): ' + accessToken.substring(0, 10) + '...');
          }
          
          // 리프레시 토큰 처리
          if (response.data.refreshToken) {
            localStorage.setItem('refresh_token', response.data.refreshToken);
          } else if (response.data.data && response.data.data.refreshToken) {
            localStorage.setItem('refresh_token', response.data.data.refreshToken);
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
      
      // 메인 프로세스를 통해 HTTP 요청
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/auth/token/refresh`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      ipcRenderer.send('console-log', '토큰 갱신 응답: ' + JSON.stringify(response));
      
      if (!response.error && (response.status === 200 || response.status === 201)) {
        let accessToken = '';
        
        if (typeof response.data === 'object') {
          if (response.data.accessToken) {
            accessToken = response.data.accessToken;
          } else if (response.data.data && response.data.data.accessToken) {
            accessToken = response.data.data.accessToken;
          }
          
          if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            
            // 메인 프로세스에 토큰 전달
            ipcRenderer.send('set-access-token', { token: accessToken });
            ipcRenderer.send('console-log', '갱신된 토큰 메인 프로세스로 전달됨: ' + accessToken.substring(0, 10) + '...');
            
            return true;
          }
        }
      }
      
      // 토큰 갱신 실패 시 처리 (수정된 부분)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return false;
    } catch (error) {
      ipcRenderer.send('console-log', '토큰 갱신 오류: ' + (error instanceof Error ? error.message : String(error)));
      
      // 오류 발생 시 토큰 삭제 및 로그인 페이지 리다이렉트 (수정된 부분)
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
        // 토큰이 없으면 로그인 페이지로 리다이렉트 (수정된 부분)
        window.location.href = '/signin';
        return null;
      }
      
      ipcRenderer.send('console-log', '사용자 정보 요청');
      
      // 메인 프로세스를 통해 HTTP 요청
      const response = await ipcRenderer.invoke('http-request', {
        method: 'get',
        url: `${BASE_URL}/user/info`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      ipcRenderer.send('console-log', '사용자 정보 응답: ' + JSON.stringify(response));
      
      if (!response.error && (response.status === 200 || response.status === 201)) {
        return response.data as UserInfo;
      }
      
      // 사용자 정보 조회 실패 시 로그인 페이지로 리다이렉트 (수정된 부분)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return null;
    } catch (error) {
      ipcRenderer.send('console-log', '사용자 정보 조회 오류: ' + (error instanceof Error ? error.message : String(error)));
      
      // 오류 발생 시 토큰 삭제 및 로그인 페이지 리다이렉트 (수정된 부분)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      ipcRenderer.send('set-access-token', { token: '' });
      window.location.href = '/signin';
      return null;
    }
  }, []);

  // 로그아웃 함수
  const signOut = useCallback(() => {
    try {
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // 메인 프로세스에 토큰 제거 알림
      ipcRenderer.send('set-access-token', { token: '' });
      ipcRenderer.send('console-log', '로그아웃: 토큰이 메인 프로세스에서 제거됨');
      
      // settings 업데이트
      if (settings) {
        const newSettings = {
          ...settings,
          userContext: null,
          userLastActive: null,
        };
        setSettings(newSettings);
      }
      
      return true;
    } catch (error) {
      ipcRenderer.send('console-log', '로그아웃 처리 오류: ' + (error instanceof Error ? error.message : String(error)));
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