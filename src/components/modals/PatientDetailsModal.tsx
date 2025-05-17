import React, { useState, useEffect } from 'react';
import { patientApi, PatientInfo } from '../../api/patientApi';
import { formatDisplayDate } from '../../pages/explorer/Explorer';
import { ipcRenderer } from 'electron';
import { IPC_CALLS } from '../../IPC_CALLS';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientInfo | null;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ isOpen, onClose, patient }) => {
  const [isEditingPatient, setIsEditingPatient] = useState<boolean>(false);
  const [editedPatientData, setEditedPatientData] = useState<Partial<PatientInfo>>({});
  const [patientImages, setPatientImages] = useState<Record<string, any[]>>({});
  const [selectedImageDate, setSelectedImageDate] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageDates, setImageDates] = useState<string[]>([]);
  const [isEditingImageInfo, setIsEditingImageInfo] = useState<boolean>(false);
  const [editedImageInfo, setEditedImageInfo] = useState<Partial<any>>({});
  const [error, setError] = useState<string | null>(null);

  // 모달이 열리면 환자 이미지 조회
  useEffect(() => {
    if (isOpen && patient && patient.patientInfoId) {
      fetchPatientImages(patient.patientInfoId);
    } else {
      // 모달이 닫히면 상태 초기화
      resetState();
    }
  }, [isOpen, patient]);

  // 상태 초기화 함수
  const resetState = () => {
    setIsEditingPatient(false);
    setEditedPatientData({});
    setPatientImages({});
    setSelectedImageDate(null);
    setSelectedImage(null);
    setImageLoading(false);
    setImageDates([]);
    setIsEditingImageInfo(false);
    setEditedImageInfo({});
    setError(null);
  };

  // 환자 이미지 조회
  const fetchPatientImages = async (patientInfoId: string | number) => {
    setImageLoading(true);
    try {
      // 디버깅을 위한 로그 추가
      console.log(`환자 이미지 조회 시작: patientInfoId=${patientInfoId}`);
      ipcRenderer.send('console-log', `환자 이미지 조회 시작: patientInfoId=${patientInfoId}`);
      
      const response = await patientApi.getPatientImageListByDate(patientInfoId);
      
      console.log('환자 이미지 조회 응답:', response);
      ipcRenderer.send('console-log', `환자 이미지 조회 응답: ${JSON.stringify(response)}`);
      
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
        console.log('환자 이미지 데이터가 없거나 형식이 올바르지 않습니다.');
        ipcRenderer.send('console-log', '환자 이미지 데이터가 없거나 형식이 올바르지 않습니다.');
        setPatientImages({});
        setImageDates([]);
        setSelectedImageDate(null);
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('환자 이미지 조회 오류:', err);
      ipcRenderer.send('console-log', `환자 이미지 조회 오류: ${err instanceof Error ? err.message : String(err)}`);
      setPatientImages({});
      setImageDates([]);
      setSelectedImageDate(null);
      setSelectedImage(null);
      
      // 오류 메시지 표시
      setError(`환자 이미지 조회 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImageLoading(false);
    }
  };

  // 환자 정보 수정 시작 핸들러
  const handleStartEditingPatient = () => {
    if (patient) {
      setEditedPatientData({
        patientName: patient.patientName,
        patientRegNo: patient.patientRegNo,
        patientBirthDate: patient.patientBirthDate,
        patientGender: patient.patientGender,
        doctor: patient.doctor
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
    if (!patient || !patient.patientInfoId) return;
    
    try {
      // 환자 정보 수정 API 호출
      const response = await patientApi.updatePatient({
        patientInfoId: patient.patientInfoId,
        ...editedPatientData
      });
      
      if (response && response.success) {
        // 환자 정보 갱신 성공 시 수정 모드 종료
        setIsEditingPatient(false);
        // 부모 컴포넌트에 알려 환자 목록을 갱신할 수 있도록 함
        onClose(); // 일단 모달 닫기
      } else {
        setError('환자 정보 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('환자 정보 수정 오류:', err);
      setError('환자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // 이미지 날짜 선택 핸들러
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
      // IPC를 통해 이미지 다운로드 요청
      await ipcRenderer.invoke('patient-image-download', {
        imagePath: selectedImage.imgPath,
        fileName: selectedImage.imgOrgName || `image_${Date.now()}.jpg`
      });
      
      ipcRenderer.send('console-log', '이미지 다운로드 요청 완료');
    } catch (err) {
      console.error('이미지 다운로드 오류:', err);
      ipcRenderer.send('console-log', `이미지 다운로드 오류: ${err instanceof Error ? err.message : String(err)}`);
      setError('이미지 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 모든 이미지 다운로드 핸들러
  const handleDownloadAllImages = async () => {
    if (!selectedImageDate || !patientImages[selectedImageDate] || patientImages[selectedImageDate].length === 0) return;
    
    try {
      // IPC를 통해 모든 이미지 다운로드 요청
      const result = await ipcRenderer.invoke(IPC_CALLS.PATIENT_IMAGES_DOWNLOAD, {
        date: selectedImageDate,
        images: patientImages[selectedImageDate],
        patientName: patient?.patientName || 'unknown'
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

  // 대표 이미지 설정 핸들러
  const handleSetAsRepresentative = async () => {
    if (!selectedImage || !selectedImage.imgId || !patient || !patient.patientInfoId) return;
    
    try {
      // IPC를 통해 대표 이미지 설정 요청
      const response = await ipcRenderer.invoke(IPC_CALLS.SET_REPRESENTATIVE_IMAGE, {
        patientInfoId: patient.patientInfoId,
        imageId: selectedImage.imgId
      });
      
      if (response && response.success) {
        // 대표 이미지 설정 성공 시 이미지 다시 조회
        if (patient?.patientInfoId) {
          fetchPatientImages(patient.patientInfoId);
        }
      } else {
        setError('대표 이미지 설정에 실패했습니다.');
      }
    } catch (err) {
      console.error('대표 이미지 설정 오류:', err);
      setError('대표 이미지 설정 중 오류가 발생했습니다.');
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
        if (patient?.patientInfoId) {
          fetchPatientImages(patient.patientInfoId);
        }
      } else {
        console.error('이미지 정보 업데이트 실패:', response?.message || '알 수 없는 오류');
        setError('이미지 정보 업데이트에 실패했습니다.');
      }
    } catch (err) {
      console.error('이미지 정보 업데이트 오류:', err);
      setError('이미지 정보 업데이트 중 오류가 발생했습니다.');
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="w-[90%] h-[90%] bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">환자 상세 정보</h2>
          <button 
            className="text-gray-400 hover:text-white text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        {/* 모달 컨텐츠 */}
        <div className="flex-1 overflow-auto p-4">
          {patient ? (
            <div className="flex flex-col gap-4">
              {/* 환자 정보 */}
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">환자 정보</h2>
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
                    <label className="text-sm mb-1 text-gray-300">번호</label>
                    {isEditingPatient ? (
                      <div className="p-2 bg-gray-800 rounded user-select-all text-gray-300">
                        {patient.patientInfoId || '정보 없음'}
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-700 rounded user-select-all text-white">
                        {patient.patientInfoId || '정보 없음'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm mb-1 text-gray-300">이름</label>
                    {isEditingPatient ? (
                      <input
                        type="text"
                        className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                        value={editedPatientData.patientName || ''}
                        onChange={(e) => setEditedPatientData({...editedPatientData, patientName: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded user-select-all text-white">
                        {patient.patientName || '정보 없음'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-sm mb-1 text-gray-300">환자번호</label>
                    {isEditingPatient ? (
                      <input
                        type="text"
                        className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                        value={editedPatientData.patientRegNo || ''}
                        onChange={(e) => setEditedPatientData({...editedPatientData, patientRegNo: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded user-select-all text-white">
                        {patient.patientRegNo || '정보 없음'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-sm mb-1 text-gray-300">생년월일</label>
                    {isEditingPatient ? (
                      <input
                        type="date"
                        className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                        value={formatDateForInput(editedPatientData.patientBirthDate || '')}
                        onChange={(e) => setEditedPatientData({...editedPatientData, patientBirthDate: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded user-select-all text-white">
                        {patient.patientBirthDate || '정보 없음'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-sm mb-1 text-gray-300">성별</label>
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
                      <div className="p-2 bg-gray-700 rounded user-select-all text-white">
                        {patient.patientGender === 'M' ? '남성' : (patient.patientGender === 'F' ? '여성' : '정보 없음')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-sm mb-1 text-gray-300">담당의사</label>
                    {isEditingPatient ? (
                      <input
                        type="text"
                        className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                        value={editedPatientData.doctor || ''}
                        onChange={(e) => setEditedPatientData({...editedPatientData, doctor: e.target.value})}
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded user-select-all text-white">
                        {patient.doctor || '지정되지 않음'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 에러 메시지 표시 */}
              {error && (
                <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* 좌측: 환자 이미지 */}
                <div className="w-full md:w-1/2 flex flex-col bg-gray-800 p-4 rounded border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">환자 이미지</h2>
                    {!imageLoading && selectedImageDate && patientImages[selectedImageDate] && patientImages[selectedImageDate].length > 0 && (
                      <button 
                        className="px-3 py-1 bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm"
                        onClick={handleDownloadAllImages}
                      >
                        선택 일자 사진 다운로드
                      </button>
                    )}
                  </div>

                  {/* 이미지 로딩 중 표시 */}
                  {imageLoading && (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                      <span className="ml-2 text-white">이미지 로딩 중...</span>
                    </div>
                  )}
                  
                  {/* 촬영 일자 선택 */}
                  {!imageLoading && imageDates && imageDates.length > 0 ? (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-1 text-white">촬영 일자</h3>
                      <div className="flex flex-wrap gap-2">
                        {imageDates.map((date) => (
                          <button
                            key={date}
                            className={`px-3 py-1 rounded ${selectedImageDate === date ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
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
                  {!imageLoading && selectedImageDate && patientImages && patientImages[selectedImageDate] && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-white">이미지 목록</h3>
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
                              onError={(e) => {
                                // 이미지 로드 실패 시 에러 처리
                                console.error('이미지 로드 실패:', image.thumbImgPath);
                                ipcRenderer.send('console-log', `이미지 로드 실패: ${image.thumbImgPath}`);
                                e.currentTarget.src = ''; // 이미지 제거
                                e.currentTarget.alt = '이미지 로드 실패';
                                e.currentTarget.style.backgroundColor = '#555';
                              }}
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
                              onError={(e) => {
                                // 이미지 로드 실패 시 에러 처리
                                console.error('대표 이미지 로드 실패:', selectedImage.imgPath);
                                ipcRenderer.send('console-log', `대표 이미지 로드 실패: ${selectedImage.imgPath}`);
                                e.currentTarget.src = ''; // 이미지 제거
                                e.currentTarget.alt = '이미지 로드 실패';
                                e.currentTarget.style.backgroundColor = '#555';
                              }}
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
                                onClick={handleSetAsRepresentative}
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
                <div className="w-full md:w-1/2 flex flex-col bg-gray-800 p-4 rounded border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">이미지 정보</h2>
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
                        <h3 className="text-sm font-semibold mb-1 text-white">촬영 방식</h3>
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
                          <div className="p-2 bg-gray-700 rounded text-white">
                            {selectedImage.imgModality || '정보 없음'}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-1 text-white">부위</h3>
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
                          <div className="p-2 bg-gray-700 rounded text-white">
                            {selectedImage.imgBodyPart || '정보 없음'}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-1 text-white">메모</h3>
                        {isEditingImageInfo ? (
                          <textarea
                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                            rows={4}
                            value={editedImageInfo.imgRemark || ''}
                            onChange={(e) => setEditedImageInfo({...editedImageInfo, imgRemark: e.target.value})}
                          />
                        ) : (
                          <div className="p-2 bg-gray-700 rounded min-h-[4rem] whitespace-pre-wrap text-white">
                            {selectedImage.imgRemark || '메모 없음'}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-1 text-white">클러스터</h3>
                        <div className="p-2 bg-gray-700 rounded text-white">
                          {selectedImage.imgCluster || '정보 없음'}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-1 text-white">업로드 일자</h3>
                        <div className="p-2 bg-gray-700 rounded text-white">
                          {selectedImage.imgUploadDate ? formatDisplayDate(selectedImage.imgUploadDate) : '정보 없음'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      {imageLoading ? '이미지 로딩 중...' : '이미지를 선택해주세요.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-400 text-lg">환자 정보를 불러올 수 없습니다.</div>
            </div>
          )}
        </div>
        
        {/* 모달 푸터 */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button 
            className="px-4 py-2 bg-transparent border border-gray-400 text-gray-400 rounded-full hover:bg-white hover:bg-opacity-5"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;