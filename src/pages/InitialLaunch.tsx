import { ipcRenderer } from 'electron';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { settingsAtom } from '../atoms/states';
import { refreshSettings } from '../utils/utils.ts';

export const InitialLaunch = () => {
  const nav = useNavigate();

  const [setting, setSetting] = useAtom(settingsAtom);
  const updateSetting = (updated: { rootDirPath: string }) => {
    const newSetting = { ...setting, ...updated };
    setSetting(newSetting);
  };

  const updateRootDirPath = async (path: string) => {
    const valid = await ipcRenderer.invoke('validate-path', path);
    if (valid) {
      const [, _] = await ipcRenderer.invoke('fetch-database-root', path);
      const newSetting = { ...setting, rootDirPath: path };
      setSetting(newSetting);
    } else {
      alert('올바른 경로를 입력해주세요.');
    }
  };

  return (
    <div className="absolute top-0 left-0 z-10 w-[100vw] h-[100vh] bg-black bg-opacity-90 flex flex-col items-center justify-center space-y-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-white w-full">
        Select Root Path
        <p className="text-white">{setting?.rootDirPath ?? ''}</p>
        <button
          onClick={async () => {
            try {
              const folderPath = await ipcRenderer.invoke('select-folder');
              await updateRootDirPath(folderPath);
              nav('/signin');
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
  );
};
