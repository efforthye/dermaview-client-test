import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export interface ImageInfo {
  imgId: string;
  visitId: string;
  imgUploadDate: string;
  imgModality: string;
  imgBodyPart: string;
  imgOrgName: string;
  imgNewName: string;
  imgPath: string;
  thumbImgNewName: string;
  thumbImgPath: string;
  imgRemark: string;
  imgCluster: string;
  imgStatus: string;
  regUserId: string;
  regDatetime: string;
  modUserId: string;
  modDatetime: string;
}

export interface ImageUpdateOptions {
  imgId: string;
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
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/file/getTempImageList?uploadDate=${uploadDate}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '임시 이미지 목록 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('임시 이미지 목록 조회 오류:', error);
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
      
      // IPC를 통해 파일 업로드 요청
      const response = await ipcRenderer.invoke('file-upload', {
        url: `${BASE_URL}/file/upload`,
        files: fileInfos,
        uploadDate: uploadDate || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        token
      });
      
      if (response.error) {
        throw new Error(response.message || '파일 업로드 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
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
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/file/setRandomCluster?uploadDate=${uploadDate}`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '클러스터 배정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('클러스터 배정 오류:', error);
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
      
      // IPC를 통해 이미지 정보 수정 요청
      const response = await ipcRenderer.invoke('update-image-info', {
        url: BASE_URL,
        token,
        ...options
      });
      
      if (response.error) {
        throw new Error(response.message || '이미지 정보 수정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('이미지 정보 수정 오류:', error);
      throw error;
    }
  }
};