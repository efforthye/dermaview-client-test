import { ipcRenderer } from 'electron';

const BASE_URL = 'http://localhost:8080';

export interface VisitInfo {
  visitId?: string | number;
  patientInfoId: string | number;
  visitDate: string;
  visitDiagnosis?: string;
  visitRemark?: string;
  imgCluster?: string;
  imgIds?: string;
  regUserId?: string;
  modUserId?: string;
}

export const visitApi = {
  // 내원 정보 조회
  getVisit: async (params: Partial<VisitInfo>): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/visit/getVisit`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: params
      });
      
      if (response.error) {
        throw new Error(response.message || '내원 정보 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('내원 정보 조회 오류:', error);
      throw error;
    }
  },
  
  // 내원 정보별 영상 조회
  getImageListByVisit: async (visitId: string | number): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/visit/getImageListByVisit`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          visitId
        }
      });
      
      if (response.error) {
        throw new Error(response.message || '내원 영상 목록 조회 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('내원 영상 목록 조회 오류:', error);
      throw error;
    }
  },
  
  // 클러스터 단위로 내원 정보 입력
  setVisitByCluster: async (visitInfo: VisitInfo): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      if (!visitInfo.patientInfoId) {
        throw new Error('환자 ID가 필요합니다.');
      }
      
      if (!visitInfo.visitDate) {
        throw new Error('방문 날짜가 필요합니다.');
      }
      
      if (!visitInfo.imgCluster) {
        throw new Error('이미지 클러스터가 필요합니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/visit/setVisitByCluster`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: visitInfo
      });
      
      if (response.error) {
        throw new Error(response.message || '내원 정보 등록 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('내원 정보 등록 오류:', error);
      throw error;
    }
  },
  
  // 영상번호 단위로 내원 정보 입력
  setVisitByImgIds: async (visitInfo: VisitInfo): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      if (!visitInfo.patientInfoId) {
        throw new Error('환자 ID가 필요합니다.');
      }
      
      if (!visitInfo.visitDate) {
        throw new Error('방문 날짜가 필요합니다.');
      }
      
      if (!visitInfo.imgIds) {
        throw new Error('이미지 ID가 필요합니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/visit/setVisitByImgIds`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: visitInfo
      });
      
      if (response.error) {
        throw new Error(response.message || '내원 정보 등록 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('내원 정보 등록 오류:', error);
      throw error;
    }
  },
  
  // 내원 정보 수정
  updateVisit: async (visitInfo: VisitInfo): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      if (!visitInfo.visitId) {
        throw new Error('내원 ID가 필요합니다.');
      }
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/visit/updateVisit`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: visitInfo
      });
      
      if (response.error) {
        throw new Error(response.message || '내원 정보 수정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('내원 정보 수정 오류:', error);
      throw error;
    }
  }
};