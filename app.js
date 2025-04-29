// 더마뷰 클라이언트 애플리케이션

// 앱 설정
const app = {
  name: 'DermaView',
  version: '1.0.0',
  author: 'DermaView Team',
  description: '피부 분석 및 관리 애플리케이션'
};

// DOM 요소 가져오기
document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.querySelector('.primary-button');
  const featureCards = document.querySelectorAll('.feature-card');
  const navLinks = document.querySelectorAll('.main-nav a');
  
  // 시작 버튼 이벤트 리스너
  if (startButton) {
    startButton.addEventListener('click', () => {
      console.log('분석 시작 버튼 클릭됨');
      // 여기에 분석 페이지로 이동하는 로직 추가
      alert('피부 분석을 시작합니다!');
    });
  }
  
  // 네비게이션 링크 이벤트 리스너
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // 기본 동작 방지
      
      // 현재 활성화된 링크에서 active 클래스 제거
      navLinks.forEach(item => item.classList.remove('active'));
      
      // 클릭된 링크에 active 클래스 추가
      link.classList.add('active');
      
      console.log(`${link.textContent} 메뉴 클릭됨`);
      // 여기에 페이지 라우팅 로직 추가
    });
  });
  
  // 기능 카드 호버 효과 강화
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 10px 30px rgba(67, 97, 238, 0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
    });
  });
  
  console.log(`${app.name} 버전 ${app.version}이 성공적으로 초기화되었습니다.`);
});

// 피부 분석 함수 (향후 구현)
function analyzeSkin(imageData) {
  return new Promise((resolve, reject) => {
    // 실제 분석 로직은 백엔드 API와 연동
    setTimeout(() => {
      // 테스트용 더미 데이터
      const result = {
        skinType: '복합성',
        moisture: 62,
        oil: 58,
        sensitivity: 35,
        issues: ['건조함', '모공'],
        recommendations: [
          '저자극 수분 크림 사용',
          '주 2회 각질 관리',
          '자외선 차단제 필수 사용'
        ]
      };
      
      resolve(result);
    }, 2000); // 분석에 2초 소요된다고 가정
  });
}

// 피부 분석 결과 표시 함수 (향후 구현)
function displayAnalysisResult(result) {
  // 결과 화면에 데이터 표시하는 로직
  console.log('분석 결과:', result);
}

// 맞춤형 관리 추천 함수 (향후 구현)
function recommendCare(skinData) {
  // 피부 타입에 맞는 관리법 추천 로직
  console.log('맞춤 관리법 추천:', skinData);
}