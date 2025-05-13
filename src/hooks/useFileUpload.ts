import { useCallback } from 'react';
import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export function useFileUpload() {
    // 파일 업로드 함수
    const uploadFiles = useCallback(async (files: File[]) => {
      try {
        ipcRenderer.send('console-log', `파일 업로드 시작: ${files.length}개 파일`);
        
        // FormData 객체 생성
        const formData = new FormData();
  
        // 파일을 하나씩 FormData에 추가
        files.forEach(file => {
          // 파일을 Blob으로 변환하여 FormData에 추가
          formData.append('files', file);
        });
  
        // 메인 프로세스에 파일 업로드 요청을 보낸다
        const response = await ipcRenderer.invoke('file-upload', {
          url: `${BASE_URL}/file/upload`,
          formData
        });
        
        ipcRenderer.send('console-log', '파일 업로드 응답: ' + JSON.stringify(response));
        
        if (!response.error && (response.status === 200 || response.status === 201)) {
          return {
            success: true,
            data: response.data
          };
        } else {
          return {
            success: false,
            error: response.message || '파일 업로드에 실패했습니다.'
          };
        }
      } catch (error) {
        ipcRenderer.send('console-log', '파일 업로드 오류: ' + (error instanceof Error ? error.message : String(error)));
        return {
          success: false,
          error: '파일 업로드 중 오류가 발생했습니다.'
        };
      }
    }, []);
  
    return {
      uploadFiles
    };
  }