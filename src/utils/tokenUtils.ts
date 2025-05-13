// 액세스 토큰 저장
export const setAccessToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

// 리프레시 토큰 저장
export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

// 액세스 토큰 가져오기
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// 리프레시 토큰 가져오기
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// 모든 토큰 제거
export const removeTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// 토큰 존재 여부로 인증 상태 확인
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// JWT 토큰에서 만료 시간 추출 (선택적)
export const getTokenExpiration = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    return exp;
  } catch (error) {
    return null;
  }
};
