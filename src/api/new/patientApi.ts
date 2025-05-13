import axiosInstance from './axios';
import { AxiosResponse } from 'axios';
import { ApiResponse } from './authApi';

export interface PatientInfo {
  patientInfoId?: number;
  patientRegNo?: string;
  patientName: string;
  doctor: string;
  patientBirthDate?: string;
  patientGender?: string;
  regUserId?: string;
  modUserId?: string;
  pageCount?: number;
  pageSize?: number;
  pageOffset?: number;
}

export interface PatientImageByDate {
  dateGroup: string;
  count: number;
  images: Array<{
    imgId: number;
    imgPath: string;
    thumbImgPath: string;
    // 기타 이미지 관련 정보
  }>;
}

export const patientApi = {
  // 환자 정보 조회
  getPatient: async (params: Partial<PatientInfo>): Promise<ApiResponse<PatientInfo[]>> => {
    try {
      const searchParams = {
        ...params,
        pageCount: params.pageCount || 0,
        pageSize: params.pageSize || 10
      };
      
      const response: AxiosResponse<ApiResponse<PatientInfo[]>> = await axiosInstance.post('/patient/getPatient', searchParams);
      return response.data;
    } catch (error) {
      console.error('환자 정보 조회 오류:', error);
      throw error;
    }
  },
  
  // 환자 정보 등록
  setPatient: async (patientInfo: PatientInfo): Promise<ApiResponse<void>> => {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/patient/setPatient', patientInfo);
      return response.data;
    } catch (error) {
      console.error('환자 정보 등록 오류:', error);
      throw error;
    }
  },
  
  // 환자 정보 수정
  updatePatient: async (patientInfo: PatientInfo): Promise<ApiResponse<void>> => {
    if (!patientInfo.patientInfoId) {
      throw new Error('환자 ID가 필요합니다.');
    }
    
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axiosInstance.post('/patient/updatePatient', patientInfo);
      return response.data;
    } catch (error) {
      console.error('환자 정보 수정 오류:', error);
      throw error;
    }
  },
  
  // 환자의 날짜별 사진 목록 조회
  getPatientImageListByDate: async (patientInfoId: number, params?: { pageCount?: number, pageSize?: number }): Promise<ApiResponse<PatientImageByDate[]>> => {
    try {
      const requestParams = {
        patientInfoId,
        pageCount: params?.pageCount || 0,
        pageSize: params?.pageSize || 10
      };
      
      const response: AxiosResponse<ApiResponse<PatientImageByDate[]>> = await axiosInstance.post('/patient/getPatientImageListByDate', requestParams);
      return response.data;
    } catch (error) {
      console.error('환자 이미지 목록 조회 오류:', error);
      throw error;
    }
  }
};
