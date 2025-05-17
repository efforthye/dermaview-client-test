import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { isValidDirPath, settingsAtom } from '../../atoms/states';
import { ipcRenderer } from 'electron';
import { useAuth } from '../../hooks/useAuth';

export const Auth = () => {
  const nav = useNavigate();
  const [, setSettings] = useAtom(settingsAtom);
  const { getUserInfo } = useAuth();

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      // 로컬 설정 불러오기
      const preset = await ipcRenderer.invoke('load-settings');
      const isValidSettings = isValidDirPath(preset);
      console.log('Setting preset loaded', preset, isValidSettings);

      if (isValidSettings) {
        try {
          setSettings(preset);
        } catch (e) {
          console.error('Failed to refresh settings', e);
          setSettings({ ...preset, rootDirPath: '' });
        }

        console.log('User context found', preset?.userContext);
        
        // 토큰 확인 및 사용자 정보 조회
        const token = localStorage.getItem('access_token');
        if (token) {
          // 토큰이 존재하면 메인 프로세스에 전달 (추가된 부분)
          ipcRenderer.send('set-access-token', { token });
          console.log('액세스 토큰이 메인 프로세스로 전달됨');
          
          const userInfo = await getUserInfo();
          if (userInfo) {
            // 사용자 정보가 유효하면 홈으로
            nav('/');
            return;
          }
        }

        // 인증 실패 또는 토큰 없으면 로그인 페이지로
        nav('/signin');
      } else {
        // 유효한 설정이 없으면 초기 설정 페이지로
        nav('/initial-launch');
      }
    } catch (error) {
      console.error("Error in auth check:", error);
      nav('/initial-launch');
    }
  };

  return <></>;
};