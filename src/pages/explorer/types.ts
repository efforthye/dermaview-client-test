// src/pages/explorer/types.ts

// 이미지 정보 타입 정의
export interface ImageInfo {
  imgId: string;         // 이미지 ID
  visitId: string;       // 방문 ID
  imgUploadDate: string; // 업로드 날짜
  imgOrgName: string;    // 원본 파일명
  imgNewName: string;    // 새 파일명 (서버에 저장된 이름)
  imgPath: string;       // 이미지 경로
  thumbImgNewName: string; // 썸네일 파일명
  thumbImgPath: string;  // 썸네일 경로
  imgRemark: string;     // 이미지 비고
  imgCluster: string;    // 이미지 클러스터
  imgModality: string;   // 영상 종류
  imgBodyPart: string;   // 영상 부위
  imgStatus: string;     // 이미지 상태
  path: string;          // 로컬 경로 (UI 용도)
  isLoaded?: boolean;    // 이미지 로드 여부
}

// 날짜별 이미지 그룹 타입 정의
export interface ImageGroups {
  [key: string]: ImageInfo[];
}

// 환자 정보 타입 정의
export interface PatientInfo {
  patientInfoId: string;
  patientName: string;
  patientRegNo: string;
  patientBirthDate?: string;
  patientGender?: string;
  doctor?: string;
  visitCount?: number;
}

// 방문 정보 타입 정의
export interface VisitInfo {
  visitId: string;
  patientInfoId: string;
  visitDate: string;
  visitDiagnosis: string;
  visitRemark: string;
}

// API 기본 URL
export const API_BASE_URL = 'http://localhost:8080';