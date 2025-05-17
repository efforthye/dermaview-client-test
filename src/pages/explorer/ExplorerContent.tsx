// src/pages/explorer/ExplorerContent.tsx

import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { imagesAtom, selectedImageAtom } from '../../atoms/filePath';
import { fileApi } from '../../api/fileApi';
import { formatDateWithHyphen } from '../../utils/dateUtils';
import ImageInfoModal from '../../components/ImageInfoModal';
import MultiImageInfoModal from '../../components/MultiImageInfoModal';
import { formatDisplayDate, formatFileSize } from './Explorer';
import { ImageCard } from './ImageCard';

// 이미지 정보 타입 정의
interface ImageInfo {
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
interface ImageGroups {
  [key: string]: ImageInfo[];
}

// 환자 정보 타입 정의
interface PatientInfo {
  patientInfoId: string;
  patientName: string;
  patientRegNo: string;
  patientBirthDate?: string;
  patientGender?: string;
  doctor?: string;
  visitCount?: number;
}

// 방문 정보 타입 정의
interface VisitInfo {
  visitId: string;
  patientInfoId: string;
  visitDate: string;
  visitDiagnosis: string;
  visitRemark: string;
  imgIds?: any;
}

// API 기본 URL
const API_BASE_URL = 'http://localhost:8080';

// 날짜별 이미지 목록 컴포넌트
const ImageList = ({ 
  imageGroups, 
  imageWidth,
  imageHeight, 
  selectedImages,
  setSelectedImages,
  loading,
  queryField,
  onImageInfoClick
}: { 
  imageGroups: ImageGroups,
  imageWidth: number,
  imageHeight: number,
  selectedImages: string[],
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>,
  loading: boolean,
  queryField: string,
  onImageInfoClick: (e: React.MouseEvent) => void
}) => {
  // 날짜를 최신순으로 정렬
  const sortedDates = Object.keys(imageGroups).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (loading) {
    return (
      <div className="text-gray-300 m-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <div className="ml-4">사진을 불러오는 중...</div>
      </div>
    );
  }

  if (sortedDates.length === 0) {
    return (
      <div className="text-gray-300 m-4 flex flex-col items-center justify-center h-full">
        <div className="text-4xl mb-4">😔</div>
        <div className="text-xl">이미지를 찾을 수 없습니다.</div>
        {queryField === '등록번호' && (
          <div className="text-sm mt-2 text-gray-400">
            등록번호를 정확히 입력했는지 확인해주세요. <br />
            예: 100001 또는 BBB111 (정확히 일치해야 합니다)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar p-4">
      {sortedDates.map(date => (
        <div key={date} className="mb-8">
          <h3 className="text-white text-xl font-semibold mb-4">
            {formatDisplayDate(date)}
            <span className="ml-2 text-sm text-gray-400">
              ({imageGroups[date].length}장)
            </span>
          </h3>
          <div className="flex flex-wrap gap-4">
            {imageGroups[date].map(image => (
              <ImageCard 
                key={image.imgId || image.path} 
                image={image} 
                width={imageWidth}
                height={imageHeight}
                isSelected={selectedImages.includes(image.path)}
                onToggleSelect={(path) => {
                  setSelectedImages(prev => 
                    prev.includes(path)
                      ? prev.filter(p => p !== path)
                      : [...prev, path]
                  );
                }}
                onInfoClick={onImageInfoClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface ExplorerContentProps {
  filePath: string | null;
  userContext?: any;
}

export const ExplorerContent = ({ filePath, userContext }: ExplorerContentProps) => {
  const [queryField, setQueryField] = useState('날짜');
  const [queryString, setQueryString] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100); // 기본 이미지 크기 (%)
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageGroups, setImageGroups] = useState<ImageGroups>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectImage = useSetAtom(selectedImageAtom);
  const [images, setImages] = useAtom(imagesAtom);
  const nav = useNavigate();
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  // 환자 목록과 현재 선택된 환자 상태 추가
  const [patientList, setPatientList] = useState<PatientInfo[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  // 방문 목록과 현재 선택된 방문 상태 추가
  const [visitList, setVisitList] = useState<VisitInfo[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitInfo | null>(null);
  // 환자 정보 입력/수정을 위한 모달 상태
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [newPatientInfo, setNewPatientInfo] = useState<Partial<PatientInfo>>({});
  // 방문 정보 입력/수정을 위한 모달 상태
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [newVisitInfo, setNewVisitInfo] = useState<Partial<VisitInfo>>({});
  // 이미지 클러스터링 모달 상태
  const [showClusterModal, setShowClusterModal] = useState(false);
  // 이미지 정보 모달 상태
  const [showImageInfoModal, setShowImageInfoModal] = useState(false);
  const [showMultiImageInfoModal, setShowMultiImageInfoModal] = useState(false);
  const [selectedImageInfo, setSelectedImageInfo] = useState<any>(null);

  // 확대/축소 시의 이미지 크기 계산
  const imageWidth = 280 * (zoomLevel / 100);
  const imageHeight = 210 * (zoomLevel / 100);

  // API 호출을 위한 토큰 가져오기
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  // 날짜별 이미지 검색
  const searchImagesByDate = async (date: string) => {
    setLoading(true);
    setError(null);
    setPatientInfo(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      // 날짜가 비어있으면 오늘 날짜로 검색
      let url = `${API_BASE_URL}/file/getTempImageList`;
      
      if (date) {
        // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
        const formattedDate = date.replace(/-/g, '');
        url += `?uploadDate=${formattedDate}`;
      } else {
        // 날짜가 없는 경우 오늘 날짜로 검색
        const today = new Date();
        const formattedToday = today.toISOString().slice(0, 10).replace(/-/g, '');
        url += `?uploadDate=${formattedToday}`;
      }
      
      // HTTP 요청을 통해 서버에서 이미지 목록 가져오기
      const response = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.error) {
        throw new Error(response.message || '이미지 검색 중 오류가 발생했습니다.');
      }

      if (response.data?.success) {
        // 이미지 데이터 처리
        const imageData = response.data.data || {};
        const groupedImages: ImageGroups = {};
        
        // 이미지 그룹화 (클러스터별로)
        Object.keys(imageData).forEach(clusterId => {
          const clusterImages = imageData[clusterId] || [];
          
          clusterImages.forEach((img: any) => {
            // 날짜를 YYYYMMDD에서 YYYY-MM-DD 형식으로 변환
            const uploadDate = img.imgUploadDate;
            const formattedDate = uploadDate ? 
              `${uploadDate.substring(0, 4)}-${uploadDate.substring(4, 6)}-${uploadDate.substring(6, 8)}` : 
              '날짜 없음';
            
            if (!groupedImages[formattedDate]) {
              groupedImages[formattedDate] = [];
            }
            
            // 이미지 경로 수정 - 썸네일 경로 오류 수정
            const imgPath = img.imgNewName || '';
            // 첫 번째 thumb_ 접두사만 유지 (중복 제거)
            const cleanedPath = imgPath.replace('/images/', '').replace(/thumb_.*\//, 'thumb_');
            const localPath = `${filePath}/${cleanedPath}`;
            
            groupedImages[formattedDate].push({
              ...img,
              path: localPath,
              isLoaded: false
            });
          });
        });
        
        setImageGroups(groupedImages);
        
        // 검색 결과 이미지 경로를 imagesAtom에 저장 (다른 컴포넌트에서 사용할 수 있도록)
        const allImagePaths = Object.values(groupedImages)
          .flat()
          .map(img => img.path || '')
          .filter(Boolean);
        
        setImages(allImagePaths);
      } else {
        throw new Error(response.data?.message || '이미지 데이터를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 검색 중 오류 발생:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 환자 ID로 이미지 검색
  const searchImagesByPatient = async (patientRegNo: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }
      
      // 1. 먼저 환자 정보 조회
      const patientResponse = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${API_BASE_URL}/patient/getPatient`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          patientRegNo: patientRegNo
        }
      });
      
      if (patientResponse.error || !patientResponse.data?.success) {
        throw new Error(patientResponse.message || '환자 정보를 가져오는데 실패했습니다.');
      }
      
      const patientList = patientResponse.data?.data || [];
      if (patientList.length === 0) {
        throw new Error('해당 등록번호로 환자 정보를 찾을 수 없습니다.');
      }
      
      // 환자 정보 저장
      setPatientInfo({
        patientInfoId: patientList[0].patientInfoId,
        patientRegNo: patientRegNo,
        patientName: patientList[0].patientName || '이름 없음',
        doctor: patientList[0].doctor,
        patientBirthDate: patientList[0].patientBirthDate,
        patientGender: patientList[0].patientGender,
      });
      
      // 2. 환자 ID로 방문 정보 조회
      const visitResponse = await ipcRenderer.invoke('http-request', {
        method: 'post',
        url: `${API_BASE_URL}/visit/getVisit`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          patientInfoId: patientList[0].patientInfoId
        }
      });
      
      if (visitResponse.error || !visitResponse.data?.success) {
        throw new Error(visitResponse.message || '방문 정보를 가져오는데 실패했습니다.');
      }
    
      const visitList = visitResponse.data?.data || [];
      
      // 방문 횟수 기록
      setVisitCount(visitList.length);
      
      // 3. 각 방문별 이미지 조회
      const groupedImages: ImageGroups = {};
      
      for (const visit of visitList) {
        const imageResponse = await ipcRenderer.invoke('http-request', {
          method: 'post',
          url: `${API_BASE_URL}/visit/getImageListByVisit`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            visitId: visit.visitId
          }
        });
        
        if (imageResponse.error || !imageResponse.data?.success) {
          console.error('방문 이미지 조회 실패:', visit.visitId);
          continue;
        }
        
        const images = imageResponse.data?.data || [];
        
        // 방문 날짜를 YYYYMMDD에서 YYYY-MM-DD 형식으로 변환
        const visitDate = visit.visitDate;
        const formattedDate = visitDate ? 
          `${visitDate.substring(0, 4)}-${visitDate.substring(4, 6)}-${visitDate.substring(6, 8)}` : 
          '날짜 없음';
        
        if (!groupedImages[formattedDate]) {
          groupedImages[formattedDate] = [];
        }
        
        // 이미지에 로컬 경로 추가
        images.forEach((img: any) => {
          const imgPath = img.imgNewName || '';
          // 첫 번째 thumb_ 접두사만 유지 (중복 제거)
          const cleanedPath = imgPath.replace('/images/', '').replace(/thumb_.*\//, 'thumb_');
          const localPath = `${filePath}/${cleanedPath}`;
          
          groupedImages[formattedDate].push({
            ...img,
            path: localPath,
            isLoaded: false
          });
        });
      }
      
      setImageGroups(groupedImages);
      
      // 검색 결과 이미지 경로를 imagesAtom에 저장
      const allImagePaths = Object.values(groupedImages)
        .flat()
        .map(img => img.path)
        .filter(Boolean);
      
      setImages(allImagePaths);
      
    } catch (error) {
      console.error('환자 이미지 검색 중 오류 발생:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (queryField === '날짜') {
      await searchImagesByDate(queryString);
    } else if (queryField === '등록번호') {
      if (!queryString) {
        setError('환자 등록번호를 입력해주세요.');
        return;
      }
      await searchImagesByPatient(queryString);
    }
  };

  // 쿼리 필드 변경 시 입력창 초기화 처리
  const handleQueryFieldChange = (newField: string) => {
    setQueryField(newField);
    setQueryString(''); // 입력창 초기화
    setError(null);     // 에러 메시지 초기화
    
    // 필드에 따라 기본값 설정
    if (newField === '날짜') {
      // 날짜 필드를 선택한 경우 오늘 날짜로 설정
      const today = new Date().toISOString().slice(0, 10);
      setQueryString(today);
    }
  };

  const loadImages = async () => {
    try {
      // 기본적으로 오늘 날짜로 검색
      const today = new Date().toISOString().slice(0, 10);
      setQueryString(today);
      await searchImagesByDate(today);
    } catch (error) {
      console.error('이미지 불러오기 오류:', error);
      setError('이미지를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev + 10, 150)); // 최대 150%
    } else {
      setZoomLevel(prev => Math.max(prev - 10, 50)); // 최소 50%
    }
  };

  // 선택된 이미지 처리 함수
  const handleSelectAll = () => {
    // 모든 이미지 선택/해제 토글
    setSelectedImages(prev => 
      prev.length > 0 ? [] : [...document.querySelectorAll('[data-image-path]')]
        .map(el => el.getAttribute('data-image-path') || '')
        .filter(Boolean)
    );
  };

  // 단일 이미지 정보 표시 함수
  const handleShowImageInfo = async (imagePath: string) => {
    try {
      // 이미지 경로에서 해당 이미지 정보 찾기
      const imageInfo = Object.values(imageGroups)
        .flat()
        .find(img => img.path === imagePath);
        
      if (!imageInfo) {
        throw new Error('이미지 정보를 찾을 수 없습니다.');
      }
      
      // 메타데이터 로드
      const metadata = await ipcRenderer.invoke('get-image-metadata', imagePath);
      
      // 이미지 정보 설정
      setSelectedImageInfo({
        ...imageInfo,
        creationTime: metadata.creationTime,
        modificationTime: metadata.modificationTime,
        size: formatFileSize(metadata.size),
      });
      
      // 모달 표시
      setShowImageInfoModal(true);
    } catch (error) {
      console.error('이미지 정보 로드 중 오류 발생:', error);
      alert('이미지 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 다중 이미지 정보 표시 함수
  const handleShowMultiImageInfo = async () => {
    if (selectedImages.length === 0) return;
    
    try {
      // 선택된 모든 이미지의 정보 가져오기
      const imagesInfo = selectedImages.map(imagePath => {
        const imageInfo = Object.values(imageGroups)
          .flat()
          .find(img => img.path === imagePath);
          
        if (!imageInfo) {
          throw new Error('이미지 정보를 찾을 수 없습니다.');
        }
        
        return imageInfo;
      });
      
      // 이미지 정보 설정
      setSelectedImageInfo(imagesInfo);
      
      // 다중 이미지 모달 표시
      setShowMultiImageInfoModal(true);
    } catch (error) {
        console.error('이미지 정보 로드 중 오류 발생:', error);
        alert('이미지 정보를 불러오는 중 오류가 발생했습니다.');
      }
    };
  
    // 이미지 정보 저장 함수
    const handleSaveImageInfo = async (data: any) => {
      try {
        await fileApi.updateImageInfo({
          imgId: data.imgId,
          imgModality: data.imgModality,
          imgBodyPart: data.imgBodyPart,
          imgRemark: data.imgRemark,
          imgCluster: data.imgCluster,
          modUserId: userContext?.userId || 'system'
        });
        
        // 성공 메시지
        alert('이미지 정보가 성공적으로 저장되었습니다.');
        
        // 이미지 목록 다시 로드
        handleSearch();
      } catch (error) {
        console.error('이미지 정보 저장 중 오류 발생:', error);
        throw error;
      }
    };
  
    // 다중 이미지 정보 저장 함수
    const handleSaveMultiImageInfo = async (dataList: any[]) => {
      try {
        // 각 이미지에 대한 업데이트 요청
        const promises = dataList.map(data => 
          fileApi.updateImageInfo({
            imgId: data.imgId,
            imgModality: data.imgModality,
            imgBodyPart: data.imgBodyPart,
            imgRemark: data.imgRemark,
            imgCluster: data.imgCluster,
            modUserId: userContext?.userId || 'system'
          })
        );
        
        await Promise.all(promises);
        
        // 성공 메시지
        alert(`${dataList.length}개 이미지의 정보가 성공적으로 저장되었습니다.`);
        
        // 이미지 목록 다시 로드
        handleSearch();
      } catch (error) {
        console.error('이미지 정보 저장 중 오류 발생:', error);
        throw error;
      }
    };
  
    // 선택된 이미지 정보 표시 함수
    const handleShowSelectedInfo = async () => {
      if (selectedImages.length === 0) return;
      
      if (selectedImages.length === 1) {
        // 단일 이미지 정보 모달
        handleShowImageInfo(selectedImages[0]);
      } else {
        // 다중 이미지 정보 모달
        handleShowMultiImageInfo();
      }
    };
  
    // 환자 정보 저장/수정 함수
    const handleSavePatient = async () => {
      try {
        const token = getToken();
        if (!token) {
          throw new Error('로그인이 필요합니다.');
        }
        
        const isUpdate = newPatientInfo.patientInfoId ? true : false;
        const url = isUpdate ? 
          `${API_BASE_URL}/patient/updatePatient` : 
          `${API_BASE_URL}/patient/setPatient`;
        
        const response = await ipcRenderer.invoke('http-request', {
          method: 'post',
          url: url,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            ...newPatientInfo,
            regUserId: userContext?.userId || 'system',
            modUserId: userContext?.userId || 'system'
          }
        });
        
        if (response.error || !response.data?.success) {
          throw new Error(response.message || (isUpdate ? '환자 정보 수정 실패' : '환자 정보 등록 실패'));
        }
        
        alert(isUpdate ? '환자 정보가 수정되었습니다.' : '환자 정보가 등록되었습니다.');
        setShowPatientModal(false);
        
        // 등록번호 검색일 경우 새로고침
        if (queryField === '등록번호' && newPatientInfo.patientRegNo) {
          await searchImagesByPatient(newPatientInfo.patientRegNo);
        }
        
      } catch (error) {
        console.error('환자 정보 저장 중 오류 발생:', error);
        alert(error instanceof Error ? error.message : '환자 정보 저장 중 오류가 발생했습니다.');
      }
    };
  
    // 방문 정보 저장/수정 함수
    const handleSaveVisit = async () => {
      try {
        const token = getToken();
        if (!token) {
          throw new Error('로그인이 필요합니다.');
        }
        
        // 방문 정보 저장 전 필수 값 확인
        if (!newVisitInfo.patientInfoId) {
          throw new Error('환자 정보가 필요합니다.');
        }
        
        if (!newVisitInfo.visitDate) {
          throw new Error('방문 날짜를 입력해주세요.');
        }
        
        const isUpdate = newVisitInfo.visitId ? true : false;
        
        // 이미지 ID 또는 클러스터로 방문 정보 설정
        let url;
        if (selectedImages.length > 0 && !isUpdate) {
          // 선택된 이미지가 있고 새 방문 정보인 경우
          // 이미지 ID 추출
          const imgIds: any = selectedImages.map(path => {
            const imgInfo = Object.values(imageGroups)
              .flat()
              .find(img => img.path === path);
            return imgInfo?.imgId;
          })
          .filter(Boolean)
          .join(',');
          
          if (imgIds) {
            url = `${API_BASE_URL}/visit/setVisitByImgIds`;
            newVisitInfo.imgIds = imgIds;
          } else {
            url = `${API_BASE_URL}/visit/setVisitByCluster`;
          }
        } else {
          // 그 외 경우: 일반 업데이트 또는 새 방문 등록
          url = isUpdate ? 
            `${API_BASE_URL}/visit/updateVisit` : 
            `${API_BASE_URL}/visit/setVisitByCluster`;
        }
        
        const response = await ipcRenderer.invoke('http-request', {
          method: 'post',
          url: url,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            ...newVisitInfo,
            regUserId: userContext?.userId || 'system',
            modUserId: userContext?.userId || 'system'
          }
        });
        
        if (response.error || !response.data?.success) {
          throw new Error(response.message || (isUpdate ? '방문 정보 수정 실패' : '방문 정보 등록 실패'));
        }
        
        alert(isUpdate ? '방문 정보가 수정되었습니다.' : '방문 정보가 등록되었습니다.');
        setShowVisitModal(false);
        
        // 환자 정보 검색일 경우 새로고침
        if (queryField === '등록번호' && patientInfo?.patientRegNo) {
          await searchImagesByPatient(patientInfo.patientRegNo);
        }
        
      } catch (error) {
        console.error('방문 정보 저장 중 오류 발생:', error);
        alert(error instanceof Error ? error.message : '방문 정보 저장 중 오류가 발생했습니다.');
      }
    };
  
    // 날짜 포맷 함수 (기존 formatDate 함수와 다름)
    const formatDate = (dateString: string): string => {
      if (!dateString) return '알 수 없음';
      
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
  
    const handleUpdateCluster = async () => {
      if (selectedImages.length === 0) return;
      
      try {
        const token = getToken();
        if (!token) {
          throw new Error('로그인이 필요합니다.');
        }
        
        // 클러스터 설정을 위한 모달 표시
        const clusterValue = prompt('설정할 클러스터 번호를 입력하세요 (1-3):', '1');
        if (!clusterValue) return;
        
        // 유효한 클러스터 번호인지 확인
        const cluster = parseInt(clusterValue);
        if (isNaN(cluster) || cluster < 1 || cluster > 3) {
          alert('클러스터 번호는 1에서 3 사이의 값이어야 합니다.');
          return;
        }
        
        let successCount = 0;
        let failCount = 0;
        // 선택된 각 이미지에 대해 클러스터 업데이트
        for (const imagePath of selectedImages) {
          try {
            // 이미지 경로에서 ID 추출
            const imgInfo = Object.values(imageGroups)
              .flat()
              .find(img => img.path === imagePath);
              
            if (!imgInfo || !imgInfo.imgId) {
              console.error(`이미지 ID를 찾을 수 없음: ${imagePath}`);
              failCount++;
              continue;
            }
            
            // 이미지 정보 수정 API 사용
            await fileApi.updateImageInfo({
              imgId: imgInfo.imgId,
              imgCluster: cluster.toString(),
              modUserId: userContext?.userId || 'system'
            });
            
            successCount++;
          } catch (error) {
            console.error(`클러스터 업데이트 중 오류 발생: ${error}`);
            failCount++;
          }
        }
        
        // 결과 메시지 표시
        if (failCount === 0) {
          alert(`${successCount}개의 이미지 클러스터가 성공적으로 업데이트되었습니다.`);
        } else {
          alert(`${successCount}개의 이미지 클러스터를 업데이트했습니다. ${failCount}개의 이미지는 업데이트하지 못했습니다.`);
        }
        
        // 이미지 목록 새로고침
        handleSearch();
        
      } catch (error) {
        console.error('클러스터 업데이트 중 오류 발생:', error);
        alert(error instanceof Error ? error.message : '클러스터 업데이트 중 오류가 발생했습니다.');
      }
    };
  
    // 파일 다운로드 처리 함수
    const handleDownloadSelected = async () => {
      if (selectedImages.length === 0) return;
  
      try {
        // 다운로드 위치 선택 (메인 프로세스에 요청)
        const downloadPath = await ipcRenderer.invoke('select-download-folder');
        
        // 사용자가 취소한 경우
        if (!downloadPath) return;
        
        // 다운로드 진행
        const downloadPromises = selectedImages.map(async (imagePath) => {
          try {
            // 이미지 다운로드 요청 (메인 프로세스에 복사 요청)
            await ipcRenderer.invoke('download-image', {
              sourcePath: imagePath,
              targetDir: downloadPath,
              // 원본 파일명 유지
              fileName: imagePath.split('/').pop() 
            });
            
            return { path: imagePath, success: true };
          } catch (error) {
            console.error(`이미지 다운로드 중 오류 발생: ${error}`);
            return { path: imagePath, success: false, error };
          }
        });
        
        const results = await Promise.all(downloadPromises);
        
        // 다운로드 결과 확인
        const successCount = results.filter(r => r.success).length;
        
        if (successCount === selectedImages.length) {
          alert(`${successCount}개의 이미지가 성공적으로 다운로드되었습니다.\n위치: ${downloadPath}`);
        } else {
          alert(`${successCount}/${selectedImages.length}개의 이미지가 다운로드되었습니다.\n위치: ${downloadPath}`);
        }
        
      } catch (error) {
        console.error('다운로드 처리 중 오류 발생:', error);
        alert('다운로드 중 오류가 발생했습니다.');
      }
    };
  
    const handleDeleteSelected = () => {
      // 삭제 확인 대화상자 표시
      const isConfirmed = window.confirm(`선택한 ${selectedImages.length}개의 이미지를 삭제하시겠습니까?`);
      
      // 사용자가 확인을 선택한 경우에만 삭제 진행
      if (isConfirmed) {
        // 실제 삭제 로직 구현
        // 예시: 선택된 각 이미지에 대해 삭제 API 호출
        selectedImages.forEach(async (imagePath) => {
          try {
            // 실제 구현 시에는 ipcRenderer.invoke를 사용하여 메인 프로세스에서 파일 삭제 수행
            await ipcRenderer.invoke('delete-image', imagePath);
            console.log(`이미지 삭제: ${imagePath}`);
          } catch (error) {
            console.error(`이미지 삭제 중 오류 발생: ${error}`);
          }
        });
        
        // 선택 상태 초기화
        setSelectedImages([]);
        
        // 이미지 목록 새로고침 (삭제 후 목록 업데이트)
        loadImages();
      } else {
        // 사용자가 취소를 선택한 경우 아무 작업도 수행하지 않음
        console.log('이미지 삭제가 취소되었습니다.');
      }
    };
  
    // 환자 정보 등록 모달 표시 함수
    const showPatientRegistration = () => {
      setNewPatientInfo({
        patientRegNo: '',
        patientName: '',
        doctor: userContext?.name || '',
        patientBirthDate: '',
        patientGender: ''
      });
      setShowPatientModal(true);
    };
  
    // 환자 정보 수정 모달 표시 함수
    const showPatientEdit = () => {
      if (!patientInfo) {
        alert('수정할 환자 정보가 없습니다. 먼저 환자를 검색해주세요.');
        return;
      }
      
      setNewPatientInfo({
        patientInfoId: patientInfo.patientInfoId,
        patientRegNo: patientInfo.patientRegNo,
        patientName: patientInfo.patientName,
        doctor: patientInfo.doctor || userContext?.name || '',
        patientBirthDate: patientInfo.patientBirthDate || '',
        patientGender: patientInfo.patientGender || ''
      });
      setShowPatientModal(true);
    };
  
    // 방문 정보 등록 모달 표시 함수
    const showVisitRegistration = () => {
      if (!patientInfo) {
        alert('방문 정보를 등록할 환자 정보가 없습니다. 먼저 환자를 검색해주세요.');
        return;
      }
      
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      setNewVisitInfo({
        patientInfoId: patientInfo.patientInfoId,
        visitDate: today,
        visitDiagnosis: '',
        visitRemark: ''
      });
      setShowVisitModal(true);
    };
  
    // 방문 정보 수정 모달 표시 함수
    const showVisitEdit = (visit: VisitInfo) => {
      setNewVisitInfo({
        visitId: visit.visitId,
        patientInfoId: visit.patientInfoId,
        visitDate: visit.visitDate,
        visitDiagnosis: visit.visitDiagnosis,
        visitRemark: visit.visitRemark
      });
      setShowVisitModal(true);
    };
  
    // 정보 버튼 클릭 처리 함수
    const handleInfo = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (selectedImages.length > 1) {
        // 여러 이미지가 선택된 경우
        handleShowMultiImageInfo();
      } else {
        // 단일 이미지인 경우
        const imagePath = selectedImages.length === 1 
          ? selectedImages[0] 
          : (e.currentTarget as HTMLElement).closest('[data-image-path]')?.getAttribute('data-image-path') || '';
          
        if (imagePath) {
          handleShowImageInfo(imagePath);
        }
      }
    };
  
    useEffect(() => {
      loadImages();
    }, []);
  
    // 로그인 상태에서 사용자 정보
    const userName = userContext?.name || '사용자';
    const userDepartment = userContext?.role || '부서';
  
    // 환자 정보 입력 모달 렌더링
    const renderPatientModal = () => {
      if (!showPatientModal) return null;
      
      const isUpdate = newPatientInfo.patientInfoId ? true : false;
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-white">
              {isUpdate ? '환자 정보 수정' : '환자 정보 등록'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">등록번호</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newPatientInfo.patientRegNo || ''}
                onChange={(e) => setNewPatientInfo({...newPatientInfo, patientRegNo: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">환자명</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newPatientInfo.patientName || ''}
                onChange={(e) => setNewPatientInfo({...newPatientInfo, patientName: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">의사명</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newPatientInfo.doctor || ''}
                onChange={(e) => setNewPatientInfo({...newPatientInfo, doctor: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">생년월일 (YYYYMMDD)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newPatientInfo.patientBirthDate || ''}
                onChange={(e) => setNewPatientInfo({...newPatientInfo, patientBirthDate: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">성별</label>
              <select
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newPatientInfo.patientGender || ''}
                onChange={(e) => setNewPatientInfo({...newPatientInfo, patientGender: e.target.value})}
              >
                <option value="">선택</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
            
            <div className="flex justify-end mt-6 space-x-2">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                onClick={() => setShowPatientModal(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                onClick={handleSavePatient}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      );
    };
  
    // 방문 정보 입력 모달 렌더링
    const renderVisitModal = () => {
      if (!showVisitModal) return null;
      
      const isUpdate = newVisitInfo.visitId ? true : false;
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-white">
              {isUpdate ? '방문 정보 수정' : '방문 정보 등록'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">방문 날짜 (YYYYMMDD)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newVisitInfo.visitDate || ''}
                onChange={(e) => setNewVisitInfo({...newVisitInfo, visitDate: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">진단명</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                value={newVisitInfo.visitDiagnosis || ''}
                onChange={(e) => setNewVisitInfo({...newVisitInfo, visitDiagnosis: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">비고</label>
              <textarea
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                rows={3}
                value={newVisitInfo.visitRemark || ''}
                onChange={(e) => setNewVisitInfo({...newVisitInfo, visitRemark: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end mt-6 space-x-2">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                onClick={() => setShowVisitModal(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                onClick={handleSaveVisit}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
        <div className="overflow-hidden w-full flex flex-col">
          {/* 상단 검색바 및 로그인 정보 */}
          <div className="flex justify-between items-center p-4 bg-gray-900">
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex">
                <select
                  className="bg-gray-800 text-white px-3 py-2 rounded-l-md border border-gray-700"
                  value={queryField}
                  onChange={(e) => handleQueryFieldChange(e.target.value)}
                >
                  <option value="날짜">날짜</option>
                  <option value="등록번호">등록번호</option>
                </select>
                <input
                  type="text"
                  placeholder={queryField === '날짜' ? 'YYYY-MM-DD' : '등록번호를 입력하세요'}
                  className="bg-gray-800 text-white px-4 py-2 w-64 border border-gray-700"
                  value={queryString}
                  onChange={(e) => setQueryString(e.target.value)}
                />
                <button
                  className="bg-transparent hover:bg-white hover:bg-opacity-10 text-white px-4 py-2 border border-white rounded-r-md ml-[10px]"
                  onClick={handleSearch}
                >
                  검색
                </button>
              </div>
            </div>
            
            {/* 로그인 정보 */}
            <div className="flex items-center space-x-2">
              <div className="text-white">{userName} / {userDepartment}</div>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
    
          {/* 오류 메시지 표시 */}
          {error && (
            <div className="p-3 bg-red-600 bg-opacity-25 text-red-300">
              {error}
            </div>
          )}
    
          {/* 선택 이미지 액션 바 - 이미지가 선택되었을 때만 표시 */}
      {selectedImages.length > 0 && (
        <div className="flex justify-between items-center py-3 px-4 bg-[#2E3048] border-b border-gray-700 h-[50px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              {queryField === '등록번호' ? (
                <span className="text-white font-medium">환자별 검색</span>
              ) : (
                <span className="text-white font-medium">날짜별 검색</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 정보 버튼 */}
              <button 
                onClick={handleShowSelectedInfo}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500"
                title="선택한 이미지 정보 보기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 삭제 버튼 */}
              <button 
                onClick={handleDeleteSelected}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500"
                title="선택한 이미지 삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 다운로드 버튼 */}
              <button 
                onClick={handleDownloadSelected}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500"
                title="선택한 이미지 다운로드"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 뷰어 버튼 */}
              <button 
                onClick={() => {
                  if (selectedImages.length > 0) {
                    // 선택된 이미지를 Atom에 저장하고 뷰어 페이지로 이동
                    selectImage(selectedImages[0]);
                    // 선택된 이미지 목록 전체를 전달하도록 수정
                    setImages(selectedImages);
                    nav(`/view/${encodeURIComponent(selectedImages[0])}`);
                  }
                }}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500"
                title="선택한 이미지 뷰어로 보기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 1px 세로 구분선 */}
              <div className="h-8 border-l border-gray-600 mx-2"></div>
              
              {/* n개 선택됨 버튼 - 선택 영역에서 가장 오른쪽에 배치 */}
              <button 
                onClick={() => setSelectedImages([])}
                className="flex items-center space-x-1 bg-[#99A0BD] hover:bg-[#8890A7] text-white px-3 py-1.5 rounded-full text-sm border border-[#99A0BD] h-[35px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>{selectedImages.length}개 선택됨</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 경로 및 제목 표시 */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-900 mb-2">
        {/* 제목과 이미지 수를 함께 표시 */}
        <div>
          <h1 className="text-white text-1xl font-bold inline-flex items-center">
            {queryField === '등록번호' ? '환자별 검색' : '날짜별 검색'} : {
              queryField === '등록번호' && patientInfo 
                ? `${queryString} ${patientInfo.patientName}`
                : queryString || "전체"
            }
            <span className="ml-2 text-sm text-gray-300">
              {queryField === '등록번호' && patientInfo 
                ? `(내원 ${visitCount}회, 총 ${Object.values(imageGroups).flat().length}장)`
                : `(${Object.keys(imageGroups).length}개 날짜, 총 ${Object.values(imageGroups).flat().length}장)`
              }
            </span>
          </h1>
        </div>
        
        {/* 확대/축소 컨트롤 (드래그 가능) - 오른쪽으로 이동 */}
        <div className="flex items-center space-x-2 ml-auto">
          <button 
            onClick={() => handleZoom('out')}
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
          >
            -
          </button>
          <div 
            className="w-32 h-2 bg-gray-800 rounded-full relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = Math.max(50, Math.min(150, (x / rect.width) * 100 + 50));
              setZoomLevel(percentage);
            }}
          >
            <div 
              className="h-2 bg-blue-500 rounded-full" 
              style={{ width: `${((zoomLevel - 50) / 100) * 100}%` }}
            ></div>
            {/* 드래그 가능한 핸들 */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full cursor-pointer"
              style={{ 
                left: `calc(${((zoomLevel - 50) / 100) * 100}% - 8px)`,
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                
                const sliderRect = e.currentTarget.parentElement!.getBoundingClientRect();
                const sliderWidth = sliderRect.width;
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const x = moveEvent.clientX - sliderRect.left;
                  const percentage = Math.max(50, Math.min(150, (x / sliderWidth) * 100 + 50));
                  setZoomLevel(percentage);
                };
                
                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };
                
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
            ></div>
          </div>
          <button 
            onClick={() => handleZoom('in')}
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
          >
            +
          </button>
        </div>
      </div>
      
      {/* 경로 표시 */}
      <div className="text-gray-300 text-sm px-4 mb-3">
        {filePath ? `/${filePath.split('/').slice(-3).join('/')}` : ''}
      </div>
      
      {/* 이미지 목록 */}
      <ImageList 
        imageGroups={imageGroups}
        imageWidth={imageWidth}
        imageHeight={imageHeight} 
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
        loading={loading}
        queryField={queryField}
        onImageInfoClick={handleInfo}
      />

      {/* 환자 정보 모달 */}
      {renderPatientModal()}

      {/* 방문 정보 모달 */}
      {renderVisitModal()}

      {/* 이미지 정보 모달 */}
      {showImageInfoModal && selectedImageInfo && (
        <ImageInfoModal 
          {...selectedImageInfo}
          onClose={() => setShowImageInfoModal(false)}
          onSave={handleSaveImageInfo}
        />
      )}

      {/* 다중 이미지 정보 모달 */}
      {showMultiImageInfoModal && selectedImageInfo && (
        <MultiImageInfoModal 
          images={selectedImageInfo}
          onClose={() => setShowMultiImageInfoModal(false)}
          onSave={handleSaveMultiImageInfo}
        />
      )}
    </div>
  );
};