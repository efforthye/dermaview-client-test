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
  pageCount?: number;
  pageSize?: number;
  pageOffset?: number;
}

export const patientApi = {
  // 환자 정보 조회
  getPatient: async (params: Partial<PatientInfo>): Promise<any> => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const searchParams = {
        ...params,
        pageCount: params.pageCount || 0,
        pageSize: params.pageSize || 10
      };
      
      ipcRenderer.send('console-log', `환자 목록 요청 데이터: ${JSON.stringify(searchParams)}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/getPatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: searchParams
      });
      
      ipcRenderer.send('console-log', `환자 목록 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '환자 정보 조회 실패');
      }
      
      // 응답 객체에서 환자 목록과 전체 환자 수 추출
      let patientList = [];
      let totalCount = 0;
      
      if (response.data && response.data.data) {
        if (response.data.data.list && Array.isArray(response.data.data.list)) {
          patientList = response.data.data.list;
        } else if (Array.isArray(response.data.data)) {
          patientList = response.data.data;
        }
        
        if (response.data.data.totalCount !== undefined) {
          totalCount = response.data.data.totalCount;
        }
      }
      
      return {
        success: true,
        data: patientList,
        totalCount: totalCount
      };
    } catch (error) {
      console.error('환자 정보 조회 오류:', error);
      ipcRenderer.send('console-log', `환자 정보 조회 오류: ${error instanceof Error ? error.message : String(error)}`);
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
      
      // 다양한 소스에서 사용자 ID 조회 시도
      const userIdNum = localStorage.getItem('userIdNum');
      const userId = localStorage.getItem('userId');
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // 백엔드에서 기대하는 형식에 맞게 데이터 준비
      // 백엔드에서 REG_USER_ID 필드가 필요하므로 여러 형태로 시도
      const requestData = {
        ...patientInfo,
        // 다양한 필드 이름으로 시도 (백엔드 요구사항에 맞추기)
        regUserId: patientInfo.regUserId || userIdNum || userId || (userInfo.id?.toString()) || '1',
        REG_USER_ID: patientInfo.regUserId || userIdNum || userId || (userInfo.id?.toString()) || '1',
        reg_user_id: patientInfo.regUserId || userIdNum || userId || (userInfo.id?.toString()) || '1'
      };
      
      ipcRenderer.send('console-log', `환자 정보 등록 요청 데이터: ${JSON.stringify(requestData)}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/setPatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: requestData
      });
      
      ipcRenderer.send('console-log', `환자 정보 등록 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '환자 정보 등록 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('환자 정보 등록 오류:', error);
      ipcRenderer.send('console-log', `환자 정보 등록 오류: ${error instanceof Error ? error.message : String(error)}`);
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
      
      // 로컬 스토리지에서 사용자 정보 가져오기
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const userId = localStorage.getItem('userId') || userInfo.userId || '';
      
      // 명시적으로 modUserId 추가
      const requestData = {
        ...patientInfo,
        modUserId: userId || '1234' // 기본값으로 '1234' 설정 (테스트용)
      };
      
      ipcRenderer.send('console-log', `환자 정보 수정 요청 데이터: ${JSON.stringify(requestData)}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/updatePatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: requestData
      });
      
      ipcRenderer.send('console-log', `환자 정보 수정 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '환자 정보 수정 실패');
      }
      
      return response.data;
    } catch (error) {
      console.error('환자 정보 수정 오류:', error);
      ipcRenderer.send('console-log', `환자 정보 수정 오류: ${error instanceof Error ? error.message : String(error)}`);
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
      
      ipcRenderer.send('console-log', `환자 이미지 목록 요청 데이터: ${JSON.stringify({ patientInfoId })}`);
      
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${BASE_URL}/patient/getPatientImageListByDate`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          patientInfoId
        },
        timeout: 30000 // 30초 타임아웃 설정
      });
      
      ipcRenderer.send('console-log', `환자 이미지 목록 응답: ${JSON.stringify(response)}`);
      
      if (response.error) {
        throw new Error(response.message || '환자 이미지 목록 조회 실패');
      }
      
      // 응답 데이터 구조 검증
      if (!response.data || !response.data.data) {
        ipcRenderer.send('console-log', '환자 이미지 목록 응답 데이터 형식 오류: data 또는 data.data가 없음');
        return {
          success: false,
          message: '응답 데이터 형식이 올바르지 않습니다.',
          data: {}
        };
      }
      
      // success가 false인 경우 처리
      if (response.data.success === false) {
        ipcRenderer.send('console-log', `API 호출 실패: ${response.data.message}`);
        return {
          success: false,
          message: response.data.message || '환자 이미지 목록 조회 실패',
          data: {}
        };
      }
      
      return {
        success: true,
        data: response.data.data || {} // 데이터가 없으면 빈 객체 반환
      };
    } catch (error) {
      console.error('환자 이미지 목록 조회 오류:', error);
      ipcRenderer.send('console-log', `환자 이미지 목록 조회 오류: ${error instanceof Error ? error.message : String(error)}`);
      
      // 자세한 오류 정보 반환
      return {
        success: false,
        message: error instanceof Error ? error.message : '환자 이미지 목록 조회 중 오류가 발생했습니다.',
        error: error,
        data: {}
      };
    }
  }
};