// src/App.tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { Configure } from './components/Configure.tsx';
import { ViewerContainer } from './components/Viewer.tsx';
import { Auth } from './pages/auth/Auth.tsx';
import { SignIn } from './pages/auth/SignIn.tsx';
import { SignUp } from './pages/auth/SignUp.tsx';
import { Explorer } from './pages/explorer/Explorer.tsx';
import { InitialLaunch } from './pages/InitialLaunch.tsx';
import {useEffect, useState} from "react";
import {refreshSettings} from "./utils/utils.ts";
import {useAtom} from "jotai";
import {isValid, settingsAtom} from "./atoms/states.ts";
import {ipcRenderer} from "electron";
import {useAuth} from './hooks/useAuth';

export default function App() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const { getUserInfo } = useAuth();
  const [loading, setLoading] = useState(true);

  // 토큰 유효성 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userInfo = await getUserInfo();
        if (userInfo && settings) {
          // 사용자 정보가 유효하면 settings 업데이트
          const newSettings = {
            ...settings,
            userContext: {
              name: userInfo.userId,
              role: 'user',
              lastActive: new Date(),
            },
            userLastActive: new Date(),
          };
          setSettings(newSettings);
        } else {
          // 유효한 사용자 정보가 없으면 로그인 페이지로 리다이렉트 (수정된 부분)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/signin';
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        // 인증 오류 발생 시 로그인 페이지로 리다이렉트 (수정된 부분)
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/signin';
      }
    } else {
      // 토큰이 없으면 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 관련 페이지가 아닌 경우)
      const nonAuthPaths = ['/signin', '/signup', '/auth'];
      const currentPath = window.location.pathname;
      
      if (!nonAuthPaths.includes(currentPath)) {
        window.location.href = '/signin';
      }
    }
    // 로딩 화면을 좀 더 오래 표시하기 위한 인위적인 지연 (테스트용)
    setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5초 지연
  };

  checkAuth();
}, []);

  // settings 관리
  useEffect(() => {
    if (settings === null) {
      const load = async () => {
        try {
          const preset = await ipcRenderer.invoke('load-settings');
          if (isValid(preset)) {
            await refreshSettings(preset);
            // console.log('settings loaded', preset);
            setSettings(preset);
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      }

      load();
    } else {
      // console.log('settings refreshed', settings);
      refreshSettings(settings);
    }
  }, [setSettings, settings]);

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#1B1E2B]">
        <div className="flex flex-col items-center justify-center">
          {/* Dermaview 로고 */}
          <div className="logo-animation">
            <img src="/dermaview_logo.png" width="150" height="150" alt="Dermaview Logo" />
          </div>
          
          {/* Dermaview 텍스트 */}
          <h1 className="mt-6 text-[#FFFFFF] text-[80px] font-['KoHo'] font-medium tracking-wider text-animation">DERMAVIEW</h1>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Explorer />} />
        <Route path="/view/:path" element={<ViewerContainer />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/initial-launch" element={<InitialLaunch />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/configure" element={<Configure />} />
      </Routes>
    </BrowserRouter>
  );
}