import axiosInstance from './axios';
import { AxiosResponse } from 'axios';
import { ApiResponse } from './authApi';

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
  // 기타 파일 관련 정보
}

export interface ImageUpdateOptions {
  imgId: number;
  imgRemark?: string;
  imgModality?: string;
  imgBodyPart?: string;
  imgCluster?: string;
  modUserId?: string;
}

export const fileApi = {
  // 파일 업로드
  uploadFiles: async (formData: FormData): Promise<ApiResponse<any>> => {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await axiosInstance.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      throw error;
    }
  },
  
  // 미분류영상 목록 가져오기
  getTempImageList: async (uploadDate: string): Promise<ApiResponse<Record<string, FileTempImageDto[]>>> => {
    try {
      const response: AxiosResponse<ApiResponse<Record<string, FileTempImageDto[]>>> = 
        await axiosInstance.post(`/file/getTempImageList?uploadDate=${uploadDate}`);
      return response.data;
    } catch (error) {
      console.error('임시 이미지 목록 조회 오류:', error);
      throw error;
    }
  },
  
  // 미분류영상 클러스터 임의 배정 (테스트용)
  setRandomCluster: async (uploadDate: string): Promise<ApiResponse<any>> => {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await axiosInstance.post(`/file/setRandomCluster?uploadDate=${uploadDate}`);
      return response.data;
    } catch (error) {
      console.error('클러스터 배정 오류:', error);
      throw error;
    }
  },
  
  // 파일 삭제
  deleteFile: async (imgId: number): Promise<ApiResponse<any>> => {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await axiosInstance.post(`/file/deleteFile?imgId=${imgId}`);
      return response.data;
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      throw error;
    }
  },
  
  // 이미지 정보 수정
  updateImageInfo: async (options: ImageUpdateOptions): Promise<ApiResponse<any>> => {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await axiosInstance.post('/file/updateImageInfo', options);
      return response.data;
    } catch (error) {
      console.error('이미지 정보 수정 오류:', error);
      throw error;
    }
  }
};
