import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // 서버에서 에러 메시지를 제공한 경우
    if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
      const serverError = axiosError.response.data as any;
      return {
        message: serverError.message || '서버 오류가 발생했습니다.',
        status: axiosError.response.status,
        details: serverError.details || axiosError.message
      };
    }
    
    // HTTP 상태 코드별 기본 메시지
    switch (axiosError.response?.status) {
      case 400:
        return { message: '잘못된 요청입니다.', status: 400 };
      case 401:
        return { message: '인증에 실패했습니다.', status: 401 };
      case 403:
        return { message: '접근 권한이 없습니다.', status: 403 };
      case 404:
        return { message: '요청한 리소스를 찾을 수 없습니다.', status: 404 };
      case 500:
        return { message: '서버 오류가 발생했습니다.', status: 500 };
      default:
        return { 
          message: '요청 처리 중 오류가 발생했습니다.', 
          status: axiosError.response?.status,
          details: axiosError.message
        };
    }
  }
  
  // 일반 Error 객체인 경우
  if (error instanceof Error) {
    return {
      message: '오류가 발생했습니다.',
      details: error.message
    };
  }
  
  // 기타 예외 상황
  return {
    message: '알 수 없는 오류가 발생했습니다.'
  };
};