# DermaView 클라이언트

DermaView는 의료 이미지 관리 시스템으로, 특히 피부과 이미지를 효율적으로 관리하고 분석할 수 있는 데스크톱 애플리케이션입니다.

![DermaView 로고](https://raw.githubusercontent.com/efforthye/dermaview-client-test/main/public/dermaview-icon.svg)

## 프로젝트 개요

DermaView 클라이언트는 React와 Electron을 기반으로 구축된 크로스 플랫폼 데스크톱 애플리케이션으로, 의료진이 환자의 피부 사진을 효율적으로 관리하고 분석할 수 있도록 설계되었습니다. 직관적인 사용자 인터페이스와 강력한 기능을 통해 피부과 의사와 의료 전문가들의 업무 효율을 높이는 것을 목표로 합니다.

## 주요 기능

### 1. 이미지 관리
- **검색 및 필터링**: 날짜별, 환자별 이미지 검색 기능
- **업로드 및 다운로드**: 로컬 시스템과 서버 간 이미지 전송
- **환자 정보 연동**: 이미지와 환자 정보를 효과적으로 연결

### 2. 환자 관리
- **환자 정보 등록/수정**: 환자 기본 정보 관리
- **방문 정보 관리**: 환자 방문 이력 및 진단 정보 관리
- **이미지 연결**: 방문 시 촬영한 이미지 연결 관리

### 3. 이미지 뷰어
- **고품질 뷰어**: 의료용 이미지를 선명하게 확인
- **확대/축소**: 필요한 부분을 자세히 관찰
- **이미지 비교**: 여러 이미지 동시 비교 기능

### 4. 분석 기능
- **클러스터링**: 유사한 특성을 가진 이미지 그룹화
- **메타데이터 관리**: 이미지 속성 및 추가 정보 관리
- **기록 추적**: 변경 이력 및 접근 로그 관리

### 5. 보안 기능
- **사용자 인증**: 안전한 로그인 및 권한 관리
- **데이터 보호**: 환자 정보 및 의료 이미지 암호화
- **활동 로깅**: 사용자 활동 기록 및 감사

## 기술 스택

- **프레임워크**: React + Electron
- **언어**: TypeScript
- **상태관리**: Jotai
- **스타일링**: TailwindCSS
- **라우팅**: React Router
- **데이터베이스**: SQLite (better-sqlite3)
- **HTTP 클라이언트**: Axios

## 아키텍처

DermaView 클라이언트는 다음과 같은 아키텍처로 구성되어 있습니다:

### 메인 프로세스 (Electron)
- 애플리케이션 창 관리
- 파일 시스템 접근 제어
- IPC 통신 처리
- 로컬 데이터베이스 연결

### 렌더러 프로세스 (React)
- 사용자 인터페이스
- 상태 관리
- API 통신
- 라우팅

### 통신 흐름
- IPC를 통한 프로세스 간 통신
- REST API를 통한 서버 통신
- 로컬 파일 시스템 프로토콜 처리

## 설치 및 실행

### 요구 사항
- Node.js 16.x 이상
- npm 또는 yarn

### 개발 환경 설정

```bash
# 저장소 복제
git clone https://github.com/efforthye/dermaview-client-test.git
cd dermaview-client-test

# 의존성 설치
npm install
# 또는
yarn install

# 개발 모드 실행
npm run dev
# 또는
yarn dev

# 배포용 빌드
npm run build
# 또는
yarn build
```

## 프로젝트 구조

```
dermaview-client/
├── electron/            # Electron 메인 프로세스
│   ├── main.ts          # 애플리케이션 엔트리 포인트
│   ├── preload.mjs      # 프리로드 스크립트
│   ├── database.ts      # 데이터베이스 연결 관리
│   └── image-reader.ts  # 이미지 메타데이터 처리
├── src/
│   ├── api/             # API 연결 모듈
│   ├── atoms/           # Jotai 상태 관리
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── hooks/           # 커스텀 React 훅
│   ├── pages/           # 페이지 컴포넌트
│   ├── utils/           # 유틸리티 함수
│   ├── App.tsx          # 메인 애플리케이션 컴포넌트
│   └── main.tsx         # React 엔트리 포인트
├── public/              # 정적 파일
├── dist-electron/       # Electron 빌드 출력
└── package.json         # 프로젝트 메타데이터
```

## 기여 방법

1. 이 저장소를 포크하세요
2. 새 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 보내주세요

## 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

## 연락처

프로젝트 관리자: [GitHub 프로필](https://github.com/efforthye)

---

DermaView - 의료 영상 관리의 미래