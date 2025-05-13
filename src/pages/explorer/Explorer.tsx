// src/pages/explorer/Explorer.tsx

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExplorerLocation, explorerLocation, settingsAtom } from '../../atoms/states';
import { Configure } from '../../components/Configure';
import { SideBar } from '../../components/Sidebar';
import { Uploader } from '../Uploader';
import { ExplorerContent } from './ExplorerContent';
import { PatientsList } from '../patients/PatientsList';

export const Explorer = () => {
  const settings = useAtomValue(settingsAtom);
  const nav = useNavigate();
  const loc = useAtomValue(explorerLocation);

  // 경로 수정
  const rootPath = `${settings?.rootDirPath}/dermaview-server/upload` ?? '';

  useEffect(() => {
    if (!settings?.userContext) {
      nav('/auth');
    }
  }, [settings]);

  return (
    <div className="w-full h-full flex text-white" style={{ backgroundColor: '#1B1E2B' }}>
      <SideBar />
      {!loc || loc === ExplorerLocation.EXPLORER ? (
        <ExplorerContent filePath={rootPath} userContext={settings?.userContext} />
      ) : null}
      {loc === ExplorerLocation.SETTINGS ? <Configure /> : null}
      {loc === ExplorerLocation.UPLOADER ? <Uploader /> : null}
      {loc === ExplorerLocation.PATIENTS ? <PatientsList /> : null}
    </div>
  );
};

// 날짜 포맷 함수
export const formatDisplayDate = (dateString: string) => {
  if (dateString === '날짜 없음') return dateString;
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 요일 표시 추가
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};

// 파일 크기 포맷 함수
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};