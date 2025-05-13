import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export interface FileDto {
  imgUploadDate: string;
  files: File[];
}

export interface FileTempImageDto {
  imgId: number;
  imgUploadDate: string;
  imgOrgName: string;
  imgNewName: string;
  imgPath: string;
  thumbImgNewName: string;
  thumbImgPath: string;
  imgRemark?: string;
  imgCluster?: string;
  imgModality?: string;
  imgBodyPart?: string;
}

export interface ImageUpdateOptions {
  imgId: string | number;
  imgRemark?: string;
  imgModality?: string;
  imgBodyPart?: string;
  imgCluster?: string;
  modUserId?: string;
}

export const fileApi = {
  // 임시 이미지 목록 가져오기
  getTempImageList: async (uploadDate: string): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      ipcRenderer.send('console-log', `임시 이미지 목록 조회 요청 데이터: ${uploadDate}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/file/getTempImageList?uploadDate=${uploadDate}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      ipcRenderer.send('console-log', `임시 이미지 목록 조회 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '임시 이미지 목록 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('임시 이미지 목록 조회 오류:', error);
      ipcRenderer.send('console-log', `임시 이미지 목록 조회 오류: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
  
  // 파일 업로드
  uploadFiles: async (files: File[], uploadDate?: string): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      // 파일 정보 변환
      const fileInfos = Array.from(files).map(file => ({
        name: file.name,
        path: (file as any).path, // Electron File 객체에는 path 속성이 있습니다.
        type: file.type
      }));
      
      const uploadDateValue = uploadDate || new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      ipcRenderer.send('console-log', `파일 업로드 요청 데이터: ${uploadDateValue}, 파일 수: ${files.length}`);
      
      // IPC를 통해 파일 업로드 요청
      const response = await ipcRenderer.invoke('file-upload', {
        url: `${BASE_URL}/file/upload`,
        files: fileInfos,
        uploadDate: uploadDateValue,
        token
      });
      
      ipcRenderer.send('console-log', `파일 업로드 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '파일 업로드 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      ipcRenderer.send('console-log', `파일 업로드 오류: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
  
  // 클러스터 랜덤 배정
  setRandomCluster: async (uploadDate: string): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      ipcRenderer.send('console-log', `클러스터 랜덤 배정 요청 데이터: ${uploadDate}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/file/setRandomCluster?uploadDate=${uploadDate}`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      ipcRenderer.send('console-log', `클러스터 랜덤 배정 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '클러스터 배정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('클러스터 배정 오류:', error);
      ipcRenderer.send('console-log', `클러스터 배정 오류: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
  
  // 파일 삭제
  deleteFile: async (imgId: string | number): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      ipcRenderer.send('console-log', `파일 삭제 요청 데이터: ${imgId}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/file/deleteFile?imgId=${imgId}`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      ipcRenderer.send('console-log', `파일 삭제 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '파일 삭제 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      ipcRenderer.send('console-log', `파일 삭제 오류: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
  
  // 이미지 정보 수정
  updateImageInfo: async (options: ImageUpdateOptions): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      ipcRenderer.send('console-log', `이미지 정보 수정 요청 데이터: ${JSON.stringify(options)}`);
      
      // IPC를 통해 이미지 정보 수정 요청
      const response = await ipcRenderer.invoke('update-image-info', {
        url: BASE_URL,
        token,
        ...options
      });
      
      ipcRenderer.send('console-log', `이미지 정보 수정 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '이미지 정보 수정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('이미지 정보 수정 오류:', error);
      ipcRenderer.send('console-log', `이미지 정보 수정 오류: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
};