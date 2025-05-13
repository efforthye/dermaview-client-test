import axiosInstance from './axios';
import { AxiosResponse } from 'axios';
import { ApiResponse } from './authApi';

export interface VisitInfo {
  visitId?: number;
  patientInfoId: number;
  visitDate: string;
  visitDiagnosis?: string;
  visitRemark?: string;
  imgCluster?: string;
  imgIds?: string;
  regUserId?: string;
  modUserId?: string;
  pageCount?: number;
  pageSize?: number;
  pageOffset?: number;
}

export interface VisitImageInfo {
  imgId: number;
  imgUploadDate: string;
  imgModality?: string;
  imgBodyPart?: string;
  imgOrgName: string;
  imgNewName: string;
  imgPath: string;
  thumbImgNewName: string;
  thumbImgPath: string;
  imgRemark?: string;
  imgCluster?: string;
  // 기타 이미지 관련 정보
}

export interface VisitListDto {
  visitId: number;
  pageCount?: number;
  pageSize?: number;
  pageOffset?: number;
}

export const visitApi = {
  // 내원 정보 조회
  getVisit: async (params: Partial<VisitInfo>): Promise<ApiResponse<any[]>> => {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await axiosInstance.post('/visit/getVisit', params);
      return response.data;
    } catch (error) {
      console.error('내원 정보 조회 오류:', error);
      throw error;
    }
  },
  
  // 내원 정보별 영상 조회
  getImageListByVisit: async (params: VisitListDto): Promise<ApiResponse<VisitImageInfo[]>> => {
    try {
      const requestParams = {
        visitId: params.visitId,
        pageCount: params.pageCount || 0,
        pageSize: params.pageSize || 10
      };
      
      const response: AxiosResponse<ApiResponse<VisitImageInfo[]>> = await axiosInstance.post('/visit/getImageListByVisit', requestParams);
      return response.data;
    } catch (error) {
      console.error('내원 영상 목록 조회 오류:', error);
      throw error;
    }
  },
  
  // 클러스터 단위로 내원 정보 입력
  setVisitByCluster: async (visitInfo: VisitInfo): Promise<ApiResponse<void>> => {
    if (!visitInfo.patientInfoId) {
      throw new Error('환자 ID가 필요합니다.');
    }
    
    if (!visitInfo.visitDate) {
      throw new Error('방문 날짜가 필요합니다.');
    }
    
    if (!visitInfo.imgCluster) {
      throw new Error('이미지 클러스터가 필요합니다.');
    }
    
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/visit/setVisitByCluster', visitInfo);
      return response.data;
    } catch (error) {
      console.error('내원 정보 등록 오류:', error);
      throw error;
    }
  },
  
  // 영상번호 단위로 내원 정보 입력
  setVisitByImgIds: async (visitInfo: VisitInfo): Promise<ApiResponse<void>> => {
    if (!visitInfo.patientInfoId) {
      throw new Error('환자 ID가 필요합니다.');
    }
    
    if (!visitInfo.visitDate) {
      throw new Error('방문 날짜가 필요합니다.');
    }
    
    if (!visitInfo.imgIds) {
      throw new Error('이미지 ID가 필요합니다.');
    }
    
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/visit/setVisitByImgIds', visitInfo);
      return response.data;
    } catch (error) {
      console.error('내원 정보 등록 오류:', error);
      throw error;
    }
  },
  
  // 내원 정보 수정
  updateVisit: async (visitInfo: VisitInfo): Promise<ApiResponse<void>> => {
    if (!visitInfo.visitId) {
      throw new Error('내원 ID가 필요합니다.');
    }
    
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/visit/updateVisit', visitInfo);
      return response.data;
    } catch (error) {
      console.error('내원 정보 수정 오류:', error);
      throw error;
    }
  }
};
