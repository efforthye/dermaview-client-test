import React, { useState } from 'react';

// 이미지 정보 타입 정의
export interface ImageInfoProps {
  imgId?: string;
  imgOrgName?: string;
  imgNewName?: string;
  imgPath?: string;
  imgUploadDate?: string;
  imgModality?: string;
  imgBodyPart?: string;
  imgRemark?: string;
  imgCluster?: string;
  creationTime?: string;
  modificationTime?: string;
  size?: string;
  patientName?: string;
  patientId?: string;
  onClose: () => void;
  onSave?: (data: any) => Promise<void>;
}

const ImageInfoModal: React.FC<ImageInfoProps> = ({ 
  imgId,
  imgOrgName,
  imgNewName,
  imgPath,
  imgUploadDate,
  imgModality,
  imgBodyPart,
  imgRemark,
  imgCluster,
  creationTime,
  modificationTime,
  size,
  patientName,
  patientId,
  onClose,
  onSave
}) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 수정 가능한 필드 상태 관리
  const [editableFields, setEditableFields] = useState({
    imgModality: imgModality || '',
    imgBodyPart: imgBodyPart || '',
    imgRemark: imgRemark || '',
    imgCluster: imgCluster || ''
  });
  
  // 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 저장 처리
  const handleSave = async () => {
    if (!onSave || !imgId) return;
    
    try {
      setLoading(true);
      
      await onSave({
        imgId,
        ...editableFields
      });
      
      // 수정 모드 종료
      setEditMode(false);
    } catch (error) {
      console.error('정보 저장 중 오류 발생:', error);
      alert('정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">이미지 상세 정보</h2>
          <div className="space-x-2">
            {onSave && !editMode && (
              <button 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                onClick={() => setEditMode(true)}
              >
                수정
              </button>
            )}
            {editMode && (
              <>
                <button 
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button 
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  취소
                </button>
              </>
            )}
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 기본 정보 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-3">기본 정보</h3>
            
            <div className="space-y-2">
              {imgId && (
                <div>
                  <span className="text-gray-300">이미지 ID:</span>
                  <span className="ml-2 text-white">{imgId}</span>
                </div>
              )}
              
              {imgOrgName && (
                <div>
                  <span className="text-gray-300">원본 파일명:</span>
                  <span className="ml-2 text-white">{imgOrgName}</span>
                </div>
              )}
              
              {imgUploadDate && (
                <div>
                  <span className="text-gray-300">업로드 날짜:</span>
                  <span className="ml-2 text-white">
                    {`${imgUploadDate.substring(0, 4)}-${imgUploadDate.substring(4, 6)}-${imgUploadDate.substring(6, 8)}`}
                  </span>
                </div>
              )}
              
              {size && (
                <div>
                  <span className="text-gray-300">파일 크기:</span>
                  <span className="ml-2 text-white">{size}</span>
                </div>
              )}
              
              {creationTime && (
                <div>
                  <span className="text-gray-300">생성 시간:</span>
                  <span className="ml-2 text-white">{new Date(creationTime).toLocaleString()}</span>
                </div>
              )}
              
              {modificationTime && (
                <div>
                  <span className="text-gray-300">수정 시간:</span>
                  <span className="ml-2 text-white">{new Date(modificationTime).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 환자 정보 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-3">환자 정보</h3>
            
            <div className="space-y-2">
              {patientId && (
                <div>
                  <span className="text-gray-300">환자 ID:</span>
                  <span className="ml-2 text-white">{patientId}</span>
                </div>
              )}
              
              {patientName && (
                <div>
                  <span className="text-gray-300">환자명:</span>
                  <span className="ml-2 text-white">{patientName}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 수정 가능한 필드 */}
          <div className="bg-gray-700 p-4 rounded-lg md:col-span-2">
            <h3 className="text-lg font-medium text-white mb-3">상세 정보</h3>
            
            <div className="space-y-4">
              {/* Modality */}
              <div>
                <label className="block text-gray-300 mb-1">Modality:</label>
                {editMode ? (
                  <input
                    type="text"
                    name="imgModality"
                    value={editableFields.imgModality}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
                    placeholder="예: X-ray, MRI, CT 등"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-600 text-white rounded-md">
                    {editableFields.imgModality || '정보 없음'}
                  </div>
                )}
              </div>
              
              {/* Body Part */}
              <div>
                <label className="block text-gray-300 mb-1">Body Part:</label>
                {editMode ? (
                  <input
                    type="text"
                    name="imgBodyPart"
                    value={editableFields.imgBodyPart}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
                    placeholder="예: 머리, 목, A/W, 손등 등"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-600 text-white rounded-md">
                    {editableFields.imgBodyPart || '정보 없음'}
                  </div>
                )}
              </div>
              
              {/* Cluster */}
              <div>
                <label className="block text-gray-300 mb-1">Cluster:</label>
                {editMode ? (
                  <select
                    name="imgCluster"
                    value={editableFields.imgCluster}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
                  >
                    <option value="">선택</option>
                    <option value="1">Cluster 1</option>
                    <option value="2">Cluster 2</option>
                    <option value="3">Cluster 3</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-gray-600 text-white rounded-md">
                    {editableFields.imgCluster ? `Cluster ${editableFields.imgCluster}` : '정보 없음'}
                  </div>
                )}
              </div>
              
              {/* Remark */}
              <div>
                <label className="block text-gray-300 mb-1">비고:</label>
                {editMode ? (
                  <textarea
                    name="imgRemark"
                    value={editableFields.imgRemark}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
                    rows={3}
                    placeholder="추가 정보를 입력하세요..."
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-600 text-white rounded-md min-h-[80px]">
                    {editableFields.imgRemark || '정보 없음'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 이미지 미리보기 */}
        {imgPath && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white mb-3">이미지 미리보기</h3>
            <div className="relative bg-gray-700 p-2 rounded-lg flex items-center justify-center">
              <img 
                src={`local-image:/${imgPath}`} 
                alt={imgOrgName || '이미지 미리보기'}
                className="max-h-[300px] object-contain rounded-md"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNhM2E0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjZmZmIj7snbTrr7jsp4Dqsowg7JeF7ISx64Sk66GdPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageInfoModal;