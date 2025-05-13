// YYYYMMDD 형식을 YYYY-MM-DD로 변환
export const formatDateWithHyphen = (dateString: string): string => {
  if (!dateString || dateString.length !== 8) return dateString;
    
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
  };
  
  // YYYY-MM-DD 형식을 YYYYMMDD로 변환
  export const formatDateWithoutHyphen = (dateString: string): string => {
    if (!dateString) return '';
    
    return dateString.replace(/-/g, '');
  };
  
  // 현재 날짜를 YYYYMMDD 형식으로 반환
  export const getCurrentDateFormatted = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  };
  
  // 날짜 포맷팅 (연월일 + 요일)
  export const formatDisplayDate = (dateString: string): string => {
    if (dateString === '날짜 없음') return dateString;
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 요일 표시 추가
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
};