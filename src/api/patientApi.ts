import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export interface PatientInfo {
  patientInfoId?: string | number;
  patientRegNo: string;
  patientName: string;
  doctor?: string;
  patientBirthDate?: string;
  patientGender?: string;
  regUserId?: string;
  modUserId?: string;
}

export const patientApi = {
  // 환자 정보 조회
  getPatient: async (params: Partial<PatientInfo>): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/getPatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: params
      });
      
      if (response.error) {
        throw new Error(response.message || '환자 정보 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('환자 정보 조회 오류:', error);
      throw error;
    }
  },
  
  // 환자 정보 등록
  setPatient: async (patientInfo: PatientInfo): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/setPatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: patientInfo
      });
      
      if (response.error) {
        throw new Error(response.message || '환자 정보 등록 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('환자 정보 등록 오류:', error);
      throw error;
    }
  },
  
  // 환자 정보 수정
  updatePatient: async (patientInfo: PatientInfo): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      if (!patientInfo.patientInfoId) {
        throw new Error('환자 ID가 필요합니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/updatePatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: patientInfo
      });
      
      if (response.error) {
        throw new Error(response.message || '환자 정보 수정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('환자 정보 수정 오류:', error);
      throw error;
    }
  },
  
  // 환자의 날짜별 사진 목록 조회
  getPatientImageListByDate: async (patientInfoId: string | number): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/getPatientImageListByDate`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          patientInfoId
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '환자 이미지 목록 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('환자 이미지 목록 조회 오류:', error);
      throw error;
    }
  }
};