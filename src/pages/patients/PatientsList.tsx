import React, { useState, useEffect, useRef } from 'react';
import { patientApi, PatientInfo } from '../../api/patientApi';
import { visitApi } from '../../api/visitApi';
import { formatDisplayDate } from '../explorer/Explorer';
import { ipcRenderer } from 'electron';
import { IPC_CALLS } from '../../IPC_CALLS';
import PatientRegisterModal from '../../components/modals/PatientRegisterModal';
import VisitRegisterModal from '../../components/modals/VisitRegisterModal';

interface SearchParams {
  patientRegNo?: string;
  patientName?: string;
  doctor?: string;
  searchOperator?: 'AND' | 'OR';
  visitDateFrom?: string;
  visitDateTo?: string;
}

export const PatientsList: React.FC = () => {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchOperator: 'AND'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [patientImages, setPatientImages] = useState<Record<string, any[]>>({});
  const [selectedImageDate, setSelectedImageDate] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageDates, setImageDates] = useState<string[]>([]);
  const [isEditingPatient, setIsEditingPatient] = useState<boolean>(false);
  const [editedPatientData, setEditedPatientData] = useState<Partial<PatientInfo>>({});
  const [isEditingImageInfo, setIsEditingImageInfo] = useState<boolean>(false);
  const [editedImageInfo, setEditedImageInfo] = useState<Partial<any>>({});
  const [selectedPatients, setSelectedPatients] = useState<PatientInfo[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [isPatientRegisterModalOpen, setIsPatientRegisterModalOpen] = useState<boolean>(false);
  const [isVisitRegisterModalOpen, setIsVisitRegisterModalOpen] = useState<boolean>(false);

  // 환자 목록 조회
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.getPatient(searchParams);
      if (response && response.success && response.data) {
        setPatients(response.data);
        // 검색 결과가 변경되면 선택 상태 초기화
        setSelectedPatients([]);
        setSelectAll(false);
      } else {
        setError('환자 정보를 가져오는데 실패했습니다.');
        setPatients([]);
      }
    } catch (err) {
      console.error('환자 조회 오류:', err);
      setError('환자 정보 조회 중 오류가 발생했습니다.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // 환자 이미지 조회
  const fetchPatientImages = async (patientInfoId: string | number) => {
    setImageLoading(true);
    try {
      const response = await patientApi.getPatientImageListByDate(patientInfoId);
      
      if (response && response.success && response.data) {
        const imagesData = response.data;
        setPatientImages(imagesData);
        
        const dates = Object.keys(imagesData);
        setImageDates(dates);
        
        if (dates.length > 0) {
          setSelectedImageDate(dates[0]);
          
          if (imagesData[dates[0]] && imagesData[dates[0]].length > 0) {
            setSelectedImage(imagesData[dates[0]][0]);
          } else {
            setSelectedImage(null);
          }
        } else {
          setSelectedImageDate(null);
          setSelectedImage(null);
        }
      } else {
        setPatientImages({});
        setImageDates([]);
        setSelectedImageDate(null);
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('환자 이미지 조회 오류:', err);
      setPatientImages({});
      setImageDates([]);
      setSelectedImageDate(null);
      setSelectedImage(null);
    } finally {
      setImageLoading(false);
    }
  };

  // 방문 정보 조회
  const fetchPatientVisits = async (patientInfoId: string | number) => {
    try {
      const response = await visitApi.getVisit({ patientInfoId });
      return response && response.success && response.data 
        ? response.data 
        : [];
    } catch (err) {
      console.error('방문 정보 조회 오류:', err);
      return [];
    }
  };

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  // 환자 선택 핸들러
  const handlePatientSelect = (patient: PatientInfo) => {
    // 이미 선택된 환자를 다시 클릭한 경우 접기
    if (selectedPatient?.patientInfoId === patient.patientInfoId) {
      setSelectedPatient(null); // 선택 해제
      // 관련 상태 초기화
      setIsEditingPatient(false);
      setEditedPatientData({});
      setPatientImages({});
      setImageDates([]);
      setSelectedImageDate(null);
      setSelectedImage(null);
    } else {
      // 새로운 환자 선택
      setSelectedPatient(patient);
      setIsEditingPatient(false);
      setEditedPatientData({});
      if (patient.patientInfoId) {
        fetchPatientImages(patient.patientInfoId);
      }
    }
  };

  // 체크박스 선택 핸들러
  const handlePatientCheckboxChange = (patient: PatientInfo) => {
    const isSelected = selectedPatients.some(p => p.patientInfoId === patient.patientInfoId);
    if (isSelected) {
      // 이미 선택된 경우 제거
      setSelectedPatients(selectedPatients.filter(p => p.patientInfoId !== patient.patientInfoId));
    } else {
      // 선택되지 않은 경우 추가
      setSelectedPatients([...selectedPatients, patient]);
    }
  };

  // 전체 선택 핸들러
  const handleSelectAll = () => {
    if (selectAll) {
      // 전체 선택 해제
      setSelectedPatients([]);
    } else {
      // 전체 선택
      setSelectedPatients([...patients]);
    }
    setSelectAll(!selectAll);
  };

  // 환자 정보 수정 시작 핸들러
  const handleStartEditingPatient = () => {
    if (selectedPatient) {
      setEditedPatientData({
        patientName: selectedPatient.patientName,
        patientRegNo: selectedPatient.patientRegNo,
        patientBirthDate: selectedPatient.patientBirthDate,
        patientGender: selectedPatient.patientGender,
        doctor: selectedPatient.doctor
      });
      setIsEditingPatient(true);
    }
  };

  // 환자 정보 수정 취소 핸들러
  const handleCancelEditingPatient = () => {
    setIsEditingPatient(false);
    setEditedPatientData({});
  };

  // 환자 정보 수정 저장 핸들러
  const handleSavePatientEdit = async () => {
    if (!selectedPatient || !selectedPatient.patientInfoId) return;
    
    try {
      // 환자 정보 수정 API 호출
      const response = await patientApi.updatePatient({
        patientInfoId: selectedPatient.patientInfoId,
        ...editedPatientData
      });
      
      if (response && response.success) {
        // 환자 목록 갱신
        fetchPatients();
        // 선택된 환자 정보 갱신
        setSelectedPatient({
          ...selectedPatient,
          ...editedPatientData
        });
        setIsEditingPatient(false);
      } else {
        setError('환자 정보 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('환자 정보 수정 오류:', err);
      setError('환자 정보 수정 중 오류가 발생했습니다.');
    }
  };
  const handleImageDateSelect = (date: string) => {
    setSelectedImageDate(date);
    if (patientImages[date] && patientImages[date].length > 0) {
      setSelectedImage(patientImages[date][0]);
    } else {
      setSelectedImage(null);
    }
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (image: any) => {
    setSelectedImage(image);
    setIsEditingImageInfo(false);
    setEditedImageInfo({});
  };

  // 이미지 다운로드 핸들러
  const handleDownloadImage = async () => {
    if (!selectedImage || !selectedImage.imgPath) return;
    
    try {
      // IPC를 통해 이미지 다운로드 요청 (이름이 변경된 핸들러 사용)
      await ipcRenderer.invoke('patient-image-download', {
        imagePath: selectedImage.imgPath,
        fileName: selectedImage.imgOrgName || `image_${Date.now()}.jpg`
      });
      
      ipcRenderer.send('console-log', '이미지 다운로드 요청 완료');
    } catch (err) {
      console.error('이미지 다운로드 오류:', err);
      ipcRenderer.send('console-log', `이미지 다운로드 오류: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 엑셀 다운로드 핸들러 - 전체 검색 결과
  const handleExportAllExcel = async () => {
    try {
      if (patients.length === 0) {
        setError('내보낼 환자 데이터가 없습니다.');
        return;
      }
      
      // 환자 데이터 준비
      const excelData = await Promise.all(
        patients.map(async (patient) => {
          // 환자별 방문 정보 조회
          const visits = patient.patientInfoId 
            ? await fetchPatientVisits(patient.patientInfoId)
            : [];
          
          // 최근 방문 정보
          const latestVisit = visits.length > 0 ? visits[0] : null;
          
          return {
            번호: patient.patientInfoId,
            이름: patient.patientName,
            환자번호: patient.patientRegNo,
            생년월일: patient.patientBirthDate,
            성별: patient.patientGender === 'M' ? '남성' : '여성',
            현재나이: calculateAge(patient.patientBirthDate || ''),
            최근촬영일자: latestVisit?.visitDate ? formatDisplayDate(latestVisit.visitDate) : '-',
            진단명: latestVisit?.visitDiagnosis || '-',
            부위및장수: '-'
          };
        })
      );
      
      // IPC를 통해 엑셀 다운로드 요청
      const response = await ipcRenderer.invoke('export-excel', {
        data: excelData,
        fileName: `환자목록_전체_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`
      });
      
      if (response.error) {
        setError('엑셀 파일 저장 중 오류가 발생했습니다.');
      }
      
      console.log('엑셀 파일 다운로드 요청 완료');
    } catch (err) {
      console.error('엑셀 다운로드 오류:', err);
      setError('엑셀 파일 저장 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 다운로드 핸들러 - 선택한 환자만
  const handleExportSelectedExcel = async () => {
    try {
      if (selectedPatients.length === 0) {
        setError('선택된 환자가 없습니다.');
        return;
      }
      
      // 환자 데이터 준비
      const excelData = await Promise.all(
        selectedPatients.map(async (patient) => {
          // 환자별 방문 정보 조회
          const visits = patient.patientInfoId 
            ? await fetchPatientVisits(patient.patientInfoId)
            : [];
          
          // 최근 방문 정보
          const latestVisit = visits.length > 0 ? visits[0] : null;
          
          return {
            번호: patient.patientInfoId,
            이름: patient.patientName,
            환자번호: patient.patientRegNo,
            생년월일: patient.patientBirthDate,
            성별: patient.patientGender === 'M' ? '남성' : '여성',
            현재나이: calculateAge(patient.patientBirthDate || ''),
            최근촬영일자: latestVisit?.visitDate ? formatDisplayDate(latestVisit.visitDate) : '-',
            진단명: latestVisit?.visitDiagnosis || '-',
            부위및장수: '-'
          };
        })
      );
      
      // IPC를 통해 엑셀 다운로드 요청
      const response = await ipcRenderer.invoke('export-excel', {
        data: excelData,
        fileName: `환자목록_선택항목_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`
      });
      
      if (response.error) {
        setError('엑셀 파일 저장 중 오류가 발생했습니다.');
      }
      
      console.log('선택 환자 엑셀 파일 다운로드 요청 완료');
    } catch (err) {
      console.error('엑셀 다운로드 오류:', err);
      setError('엑셀 파일 저장 중 오류가 발생했습니다.');
    }
  };

  // 이미지 메모 업데이트 핸들러
  const handleUpdateImageInfo = async (updatedInfo: any) => {
    if (!selectedImage || !selectedImage.imgId) return;
    
    try {
      // IPC를 통해 이미지 정보 업데이트 요청
      const response = await ipcRenderer.invoke('update-image-info', {
        imgId: selectedImage.imgId,
        ...updatedInfo
      });
      
      if (response && !response.error) {
        // 업데이트 성공 시 이미지 다시 조회
        if (selectedPatient?.patientInfoId) {
          fetchPatientImages(selectedPatient.patientInfoId);
        }
      } else {
        console.error('이미지 정보 업데이트 실패:', response?.message || '알 수 없는 오류');
      }
    } catch (err) {
      console.error('이미지 정보 업데이트 오류:', err);
    }
  };
  
  // 대표 이미지 설정 핸들러
  const handleSetAsRepresentative = async () => {
    if (!selectedImage || !selectedImage.imgId || !selectedPatient || !selectedPatient.patientInfoId) return;
    
    try {
      // IPC를 통해 대표 이미지 설정 요청
      const response = await ipcRenderer.invoke(IPC_CALLS.SET_REPRESENTATIVE_IMAGE, {
        patientInfoId: selectedPatient.patientInfoId,
        imageId: selectedImage.imgId
      });
      
      if (response && response.success) {
        // 대표 이미지 설정 성공 시 이미지 다시 조회
        if (selectedPatient?.patientInfoId) {
          fetchPatientImages(selectedPatient.patientInfoId);
        }
      } else {
        setError('대표 이미지 설정에 실패했습니다.');
      }
    } catch (err) {
      console.error('대표 이미지 설정 오류:', err);
      setError('대표 이미지 설정 중 오류가 발생했습니다.');
    }
  };
  
  // 선택된 날짜의 모든 이미지 다운로드 핸들러
  const handleDownloadAllImages = async () => {
    if (!selectedImageDate || !patientImages[selectedImageDate] || patientImages[selectedImageDate].length === 0) return;
    
    try {
      // IPC를 통해 모든 이미지 다운로드 요청
      const result = await ipcRenderer.invoke(IPC_CALLS.PATIENT_IMAGES_DOWNLOAD, {
        date: selectedImageDate,
        images: patientImages[selectedImageDate],
        patientName: selectedPatient?.patientName || 'unknown'
      });
      
      if (result.cancelled) {
        return;
      }
      
      if (!result || !result.success) {
        setError('이미지 다운로드에 실패했습니다.');
      }
    } catch (err) {
      console.error('이미지 다운로드 오류:', err);
      setError('이미지 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 환자 목록 조회
  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="w-full h-full flex flex-col p-4 text-white overflow-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">환자 목록</h1>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10"
            onClick={() => setIsPatientRegisterModalOpen(true)}
          >
            환자 등록
          </button>
          <button 
            className="px-4 py-2 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10"
            onClick={() => setIsVisitRegisterModalOpen(true)}
            disabled={!selectedPatient}
            title={!selectedPatient ? "환자를 먼저 선택해주세요" : ""}
          >
            방문 등록
          </button>
        </div>
      </div>
      
      {/* 검색 폼 */}
      <div className="mb-4 bg-gray-800 p-4 rounded">
        <form onSubmit={handleSearch} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="환자번호"
              className="p-2 rounded bg-gray-700 text-white border border-gray-600"
              value={searchParams.patientRegNo || ''}
              onChange={(e) => setSearchParams({...searchParams, patientRegNo: e.target.value})}
            />
            <input
              type="text"
              placeholder="환자이름"
              className="p-2 rounded bg-gray-700 text-white border border-gray-600"
              value={searchParams.patientName || ''}
              onChange={(e) => setSearchParams({...searchParams, patientName: e.target.value})}
            />
            <div className="ml-2 flex items-center">
              <span className="mr-2">검색조건:</span>
              <select
                className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                value={searchParams.searchOperator}
                onChange={(e) => setSearchParams({
                  ...searchParams, 
                  searchOperator: e.target.value as 'AND' | 'OR'
                })}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
            <button
              type="button"
              className="p-2 bg-transparent border border-white text-white rounded hover:bg-white hover:bg-opacity-10"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced
            </button>
            <button
              type="submit" 
              className="p-2 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10"
            >
              검색
            </button>
          </div>
          
          {/* 고급 검색 옵션 */}
          {showAdvanced && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-gray-700 rounded">
              <div className="flex flex-col">
                <label className="text-sm mb-1">담당의사</label>
                <input
                  type="text"
                  placeholder="담당의사"
                  className="p-2 rounded bg-gray-600 text-white border border-gray-500"
                  value={searchParams.doctor || ''}
                  onChange={(e) => setSearchParams({...searchParams, doctor: e.target.value})}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">촬영일자(시작)</label>
                <input
                  type="date"
                  className="p-2 rounded bg-gray-600 text-white border border-gray-500"
                  value={searchParams.visitDateFrom || ''}
                  onChange={(e) => setSearchParams({...searchParams, visitDateFrom: e.target.value})}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">촬영일자(종료)</label>
                <input
                  type="date"
                  className="p-2 rounded bg-gray-600 text-white border border-gray-500"
                  value={searchParams.visitDateTo || ''}
                  onChange={(e) => setSearchParams({...searchParams, visitDateTo: e.target.value})}
                />
              </div>
            </div>
          )}
        </form>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="flex justify-center items-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* 선택 정보 표시 */}
      {patients.length > 0 && (
        <div className="mb-2 flex justify-between items-center">
          <div className="text-sm">
            총 <span className="font-bold">{patients.length}</span>명의 환자 중 
            <span className="font-bold ml-1">{selectedPatients.length}</span>명 선택됨
          </div>
          {selectedPatients.length > 0 && (
            <button 
            className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-xs"
            onClick={() => setSelectedPatients([])}
          >
            선택 초기화
          </button>
          )}
        </div>
      )}
      
      {/* 환자 목록 테이블 */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-800">
              <th className="border border-gray-600 p-2">
                <input 
                  type="checkbox" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="border border-gray-600 p-2">번호</th>
              <th className="border border-gray-600 p-2">이름</th>
              <th className="border border-gray-600 p-2">환자번호</th>
              <th className="border border-gray-600 p-2">생년월일</th>
              <th className="border border-gray-600 p-2">성별</th>
              <th className="border border-gray-600 p-2">현재 나이</th>
              <th className="border border-gray-600 p-2">촬영 일자</th>
              <th className="border border-gray-600 p-2">진단명</th>
              <th className="border border-gray-600 p-2">부위 및 장수</th>
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((patient, index) => (
                <tr 
                  key={index} 
                  className={`${selectedPatient?.patientInfoId === patient.patientInfoId ? 'bg-blue-500 bg-opacity-50' : 'bg-gray-700'} hover:bg-gray-600 cursor-pointer`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <td className="border border-gray-600 p-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedPatients.some(p => p.patientInfoId === patient.patientInfoId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handlePatientCheckboxChange(patient);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="border border-gray-600 p-2 text-center user-select-all">{patient.patientInfoId}</td>
                  <td className="border border-gray-600 p-2 user-select-all">{patient.patientName}</td>
                  <td className="border border-gray-600 p-2 user-select-all">{patient.patientRegNo}</td>
                  <td className="border border-gray-600 p-2 user-select-all">{patient.patientBirthDate}</td>
                  <td className="border border-gray-600 p-2">{patient.patientGender === 'M' ? '남성' : '여성'}</td>
                  <td className="border border-gray-600 p-2">
                    {calculateAge(patient.patientBirthDate || '')}
                  </td>
                  <td className="border border-gray-600 p-2">-</td>
                  <td className="border border-gray-600 p-2">-</td>
                  <td className="border border-gray-600 p-2">-</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="border border-gray-600 p-2 text-center">
                  {loading ? '로딩 중...' : '환자 정보가 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 선택한 환자 정보 및 이미지 표시 */}
      {selectedPatient && (
        <div className="flex flex-col gap-4">
          {/* 환자 정보 */}
          <div className="bg-gray-800 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">환자 정보</h2>
              {!isEditingPatient ? (
                <button 
                  className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                  onClick={handleStartEditingPatient}
                >
                  환자 정보 수정
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                    onClick={handleSavePatientEdit}
                  >
                    저장
                  </button>
                  <button 
                    className="px-3 py-1 bg-transparent border border-gray-400 text-gray-400 rounded-full hover:bg-white hover:bg-opacity-5 text-sm"
                    onClick={handleCancelEditingPatient}
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm mb-1">번호</label>
                {isEditingPatient ? (
                  <div className="p-2 bg-gray-800 rounded user-select-all text-gray-300">
                    {selectedPatient.patientInfoId}
                  </div>
                ) : (
                  <div className="p-2 bg-gray-700 rounded user-select-all">
                    {selectedPatient.patientInfoId}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">이름</label>
                {isEditingPatient ? (
                  <input
                    type="text"
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editedPatientData.patientName || ''}
                    onChange={(e) => setEditedPatientData({...editedPatientData, patientName: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-700 rounded user-select-all">
                    {selectedPatient.patientName}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm mb-1">환자번호</label>
                {isEditingPatient ? (
                  <input
                    type="text"
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editedPatientData.patientRegNo || ''}
                    onChange={(e) => setEditedPatientData({...editedPatientData, patientRegNo: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-700 rounded user-select-all">
                    {selectedPatient.patientRegNo}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm mb-1">생년월일</label>
                {isEditingPatient ? (
                  <input
                    type="date"
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={formatDateForInput(editedPatientData.patientBirthDate || '')}
                    onChange={(e) => setEditedPatientData({...editedPatientData, patientBirthDate: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-700 rounded user-select-all">
                    {selectedPatient.patientBirthDate}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm mb-1">성별</label>
                {isEditingPatient ? (
                  <select
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editedPatientData.patientGender || ''}
                    onChange={(e) => setEditedPatientData({...editedPatientData, patientGender: e.target.value})}
                  >
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>
                ) : (
                  <div className="p-2 bg-gray-700 rounded user-select-all">
                    {selectedPatient.patientGender === 'M' ? '남성' : '여성'}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm mb-1">담당의사</label>
                {isEditingPatient ? (
                  <input
                    type="text"
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editedPatientData.doctor || ''}
                    onChange={(e) => setEditedPatientData({...editedPatientData, doctor: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-700 rounded user-select-all">
                    {selectedPatient.doctor || '지정되지 않음'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* 좌측: 환자 이미지 */}
            <div className="w-full md:w-1/2 flex flex-col bg-gray-800 p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">환자 이미지</h2>
                {!imageLoading && selectedImageDate && patientImages[selectedImageDate] && patientImages[selectedImageDate].length > 0 && (
                  <button 
                    className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                    onClick={() => {
                      // 모든 이미지 다운로드 구현
                      handleDownloadAllImages();
                    }}
                  >
                    선택 일자 사진 다운로드
                  </button>
                )}
              </div>

              {/* 이미지 로딩 중 표시 */}
              {imageLoading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* 촬영 일자 선택 */}
              {!imageLoading && imageDates.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-1">촬영 일자</h3>
                  <div className="flex flex-wrap gap-2">
                    {imageDates.map((date) => (
                      <button
                        key={date}
                        className={`px-3 py-1 rounded ${selectedImageDate === date ? 'bg-blue-600' : 'bg-gray-600'}`}
                        onClick={() => handleImageDateSelect(date)}
                      >
                        {formatDisplayDate(date)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !imageLoading && (
                <div className="text-gray-400 mb-4">이미지가 없습니다.</div>
              )}
              
              {/* 이미지 표시 */}
              {!imageLoading && selectedImageDate && patientImages[selectedImageDate] && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">이미지 목록</h3>
                  <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
                    {patientImages[selectedImageDate].map((image, idx) => (
                      <div
                        key={idx}
                        className={`relative w-24 h-24 rounded overflow-hidden border-2 ${selectedImage?.imgId === image.imgId ? 'border-blue-500' : 'border-gray-500'}`}
                        onClick={() => handleImageSelect(image)}
                      >
                        <img
                          src={`${image.thumbImgPath ? `file://${image.thumbImgPath}` : ''}`}
                          alt={`환자 이미지 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* 대표 이미지 표시 */}
                        {image.isRepresentative && (
                          <div className="absolute top-0 right-0 px-1 bg-yellow-500 text-xs text-black">
                            대표
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* 선택된 이미지 대표 표시 */}
                  {selectedImage && (
                    <div className="mt-2">
                      <div className="max-w-full max-h-96 rounded overflow-hidden border-2 border-white mb-2">
                        <img
                          src={`${selectedImage.imgPath ? `file://${selectedImage.imgPath}` : ''}`}
                          alt="대표 이미지"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                          onClick={handleDownloadImage}
                        >
                          이미지 다운로드
                        </button>
                        {!selectedImage.isRepresentative && (
                          <button 
                            className="px-3 py-1 bg-transparent border border-yellow-500 text-yellow-500 rounded-full hover:bg-yellow-500 hover:bg-opacity-10 text-sm"
                            onClick={() => {
                              // 대표 이미지 설정
                              handleSetAsRepresentative();
                            }}
                          >
                            대표 이미지로 설정
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 우측: 이미지 정보 */}
            <div className="w-full md:w-1/2 flex flex-col bg-gray-800 p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">이미지 정보</h2>
                {selectedImage && (
                  <div className="flex gap-2">
                    {!isEditingImageInfo ? (
                      <button 
                        className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                        onClick={() => {
                          setIsEditingImageInfo(true);
                          setEditedImageInfo({
                            imgModality: selectedImage.imgModality,
                            imgBodyPart: selectedImage.imgBodyPart,
                            imgRemark: selectedImage.imgRemark
                          });
                        }}
                      >
                        이미지 정보 수정
                      </button>
                    ) : (
                      <>
                        <button 
                          className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                          onClick={() => {
                            handleUpdateImageInfo(editedImageInfo);
                            setIsEditingImageInfo(false);
                          }}
                        >
                          저장
                        </button>
                        <button 
                          className="px-3 py-1 bg-transparent border border-gray-400 text-gray-400 rounded-full hover:bg-white hover:bg-opacity-5 text-sm"
                          onClick={() => {
                            setIsEditingImageInfo(false);
                            setEditedImageInfo({});
                          }}
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {selectedImage ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1">촬영 방식</h3>
                    {isEditingImageInfo ? (
                      <select
                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                        value={editedImageInfo.imgModality || ''}
                        onChange={(e) => setEditedImageInfo({...editedImageInfo, imgModality: e.target.value})}
                      >
                        <option value="">선택하세요</option>
                        <option value="Dermoscopy">Dermoscopy</option>
                        <option value="DSLR">DSLR</option>
                        <option value="우드등">우드등</option>
                      </select>
                    ) : (
                      <div className="p-2 bg-gray-700 rounded">
                        {selectedImage.imgModality || '정보 없음'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1">부위</h3>
                    {isEditingImageInfo ? (
                      <select
                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                        value={editedImageInfo.imgBodyPart || ''}
                        onChange={(e) => setEditedImageInfo({...editedImageInfo, imgBodyPart: e.target.value})}
                      >
                        <option value="">선택하세요</option>
                        <option value="얼굴 측면(좌)">얼굴 측면(좌)</option>
                        <option value="얼굴 측면(우)">얼굴 측면(우)</option>
                        <option value="얼굴 정면">얼굴 정면</option>
                        <option value="배">배</option>
                        <option value="손발톱">손발톱</option>
                      </select>
                    ) : (
                      <div className="p-2 bg-gray-700 rounded">
                        {selectedImage.imgBodyPart || '정보 없음'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1">메모</h3>
                    {isEditingImageInfo ? (
                      <textarea
                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                        rows={4}
                        value={editedImageInfo.imgRemark || ''}
                        onChange={(e) => setEditedImageInfo({...editedImageInfo, imgRemark: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded min-h-[4rem] whitespace-pre-wrap">
                        {selectedImage.imgRemark || '메모 없음'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1">클러스터</h3>
                    <div className="p-2 bg-gray-700 rounded">
                      {selectedImage.imgCluster || '정보 없음'}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1">업로드 일자</h3>
                    <div className="p-2 bg-gray-700 rounded">
                      {selectedImage.imgUploadDate ? formatDisplayDate(selectedImage.imgUploadDate) : '정보 없음'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">이미지를 선택해주세요.</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 하단 버튼 */}
      <div className="mt-auto pt-4 flex flex-wrap justify-end gap-2">
        <button 
          className="px-4 py-2 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExportAllExcel}
          disabled={patients.length === 0}
        >
          검색결과 저장
        </button>
        <button 
          className="px-4 py-2 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExportSelectedExcel}
          disabled={selectedPatients.length === 0}
        >
          선택항목 저장
        </button>
      </div>
      
      {/* 환자 등록 모달 */}
      <PatientRegisterModal
        isOpen={isPatientRegisterModalOpen}
        onClose={() => setIsPatientRegisterModalOpen(false)}
        onSuccess={fetchPatients}
      />
      
      {/* 방문 등록 모달 */}
      <VisitRegisterModal
        isOpen={isVisitRegisterModalOpen}
        onClose={() => setIsVisitRegisterModalOpen(false)}
        onSuccess={fetchPatients}
        patient={selectedPatient}
      />
    </div>
  );
};

// date 입력 필드를 위한 날짜 포맷 함수
const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // YYYYMMDD 형식이면 YYYY-MM-DD로 변환
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  
  // YYMMDD 형식이면 20YY-MM-DD 또는 19YY-MM-DD로 변환
  if (/^\d{6}$/.test(dateStr)) {
    const year = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    
    // 연도에 대한 세기 추정 (현재 20년 기준으로 이전은 1900년대, 이후는 2000년대)
    const currentYear = new Date().getFullYear() % 100;
    const fullYear = parseInt(year) > currentYear ? `19${year}` : `20${year}`;
    
    return `${fullYear}-${month}-${day}`;
  }
  
  return dateStr;
};

// 나이 계산 함수
const calculateAge = (birthDate: string): string => {
  if (!birthDate || typeof birthDate !== 'string' || birthDate.trim() === '') {
    return '-';
  }

  try {
    const today = new Date();
    let birth: Date | null = null;
    
    // YYMMDD 형식 처리
    if (birthDate.length === 6) {
      const year = parseInt(birthDate.substring(0, 2));
      const month = parseInt(birthDate.substring(2, 4)) - 1;
      const day = parseInt(birthDate.substring(4, 6));
      
      if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
        return '-';
      }
      
      // 1900년대 or 2000년대 판단
      const fullYear = year > (today.getFullYear() % 100) ? 1900 + year : 2000 + year;
      birth = new Date(fullYear, month, day);
    } 
    // ISO 형식 처리 (YYYY-MM-DD)
    else if (birthDate.includes('-')) {
      birth = new Date(birthDate);
    }
    // 기타 형식 (YYYYMMDD)
    else if (birthDate.length === 8) {
      const year = parseInt(birthDate.substring(0, 4));
      const month = parseInt(birthDate.substring(4, 6)) - 1;
      const day = parseInt(birthDate.substring(6, 8));
      
      if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
        return '-';
      }
      
      birth = new Date(year, month, day);
    } else {
      // 지원되지 않는 형식
      return '-';
    }
    
    // 유효한 날짜인지 확인
    if (birth === null || isNaN(birth.getTime())) {
      return '-';
    }
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return isNaN(age) ? '-' : age.toString();
  } catch (error) {
    console.error('나이 계산 중 오류 발생:', error, '생년월일:', birthDate);
    return '-';
  }
};