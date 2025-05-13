import { ipcRenderer } from 'electron';
import { useAtom } from 'jotai/index';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../electron/schema.ts';
import logo from '../assets/react.svg';
import { settingsAtom } from '../atoms/states.ts';
import { refreshSettings } from '../utils/utils.ts';
import { IPC_CALLS } from "../IPC_CALLS.ts";
import { useAuth } from '../hooks/useAuth';

export const Configure = () => {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [inputDbPath, setInputDbPath] = useState<boolean>(false);
  const { signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!settings?.userContext) {
      nav('/auth');
    }
  }, [settings, nav]);

  const handleLogout = async () => {
    try {
      // 로그아웃 함수 호출
      const success = await signOut();
      
      if (success) {
        // 중요: 설정에서 userContext만 제거하고 rootDirPath는 유지
        if (settings) {
          const rootDirPath = settings.rootDirPath;
          
          // 새 설정 객체 생성 - userContext는 null로, rootDirPath는 유지
          const newSettings = {
            ...settings,
            userContext: null,
            userLastActive: null,
            // rootDirPath는 유지
            rootDirPath: rootDirPath
          };
          
          // 설정 업데이트
          setSettings(newSettings);
          await refreshSettings(newSettings);
          
          // 메인 프로세스에 토큰 무효화 알림
          ipcRenderer.send('set-access-token', { token: '' });
        }
        
        // 로그인 페이지로 리다이렉트
        nav('/signin');
      } else {
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const reset = () => {
    setSettings(null);
  };

  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    ipcRenderer.invoke(IPC_CALLS.LIST_USERS).then((users) => {
      setAllUsers(users);
    });
  }, []);

  const updateRootDirPath = async (path: string) => {
    const valid = await ipcRenderer.invoke('validate-path', path);
    if (valid) {
      const newSetting: any = { 
        ...settings, 
        rootDirPath: path 
      };
      setSettings(newSetting);
      
      // 설정 변경 저장
      await refreshSettings(newSetting);
    } else {
      alert('올바른 경로를 입력해주세요.');
    }
  };

  return (
    <div className="w-[100vw] h-[100vh] bg-black bg-opacity-90 flex flex-col items-center justify-center space-y-4">
      {inputDbPath ? (
        <div className={'w-[100vw] h-[100vh] flex items-center justify-center'}>
          <div className="flex flex-col items-center justify-center space-y-4 text-white w-full">
            Select Root Path
            <p className="text-white">{settings?.rootDirPath ?? ''}</p>
            <button
              onClick={async () => {
                try {
                  const folderPath = await ipcRenderer.invoke('select-folder');
                  console.log('folderPath', folderPath);
                  if (folderPath) {
                    await updateRootDirPath(folderPath);
                    setInputDbPath(false);
                  }
                } catch (e) {
                  alert('올바른 경로를 입력해주세요.');
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Select Root Directory
            </button>
          </div>
        </div>
      ) : (
        <>
          <img
            className="max-w-full max-h-full object-contain mb-20"
            src={logo}
            alt="logo"
            loading="lazy"
            style={{ transform: 'scale(2.5)' }}
          />
          <p className={'text-white'}>
            {'현재 리모트 경로: ' + settings?.rootDirPath}
          </p>
          <p className={'text-white'}>
            {'현재 유저: ' +
              settings?.userContext?.name +
              '  [' +
              settings?.userContext?.role +
              ']'}
          </p>
          <div className={'flex-row'}>
            <button
              className="px-4 py-2 bg-blue-500 text-amber-50 rounded ml-2 mr-2"
              onClick={() => {
                setInputDbPath(true);
              }}
            >
              리모트 경로 변경
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-amber-50 rounded ml-2 ml-2"
              onClick={handleLogout}
            >
              로그아웃
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-amber-50 rounded ml-2 ml-2"
              onClick={() => {
                reset();
                refreshSettings(null).then(() => {
                  setSettings(null);
                });
              }}
            >
              세팅 초기화
            </button>
          </div>
        </>
      )}
    </div>
  );
};