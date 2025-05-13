import React, { useState, useEffect } from 'react';

// 이미지 정보 타입 정의
export interface MultiImageInfoProps {
  images: Array<{
    imgId: string;
    imgOrgName?: string;
    imgPath?: string;
    imgModality?: string;
    imgBodyPart?: string;
    imgRemark?: string;
    imgCluster?: string;
  }>;
  onClose: () => void;
  onSave?: (data: any[]) => Promise<void>;
}

const MultiImageInfoModal: React.FC<MultiImageInfoProps> = ({ 
  images,
  onClose,
  onSave
}) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 공통 필드 찾기 (모든 이미지에서 같은 값을 가진 필드)
  const findCommonFields = () => {
    if (!images || images.length === 0) return {};
    
    const result: any = {};
    const fields = ['imgModality', 'imgBodyPart', 'imgRemark', 'imgCluster'];
    
    fields.forEach(field => {
      const firstValue = images[0][field as keyof typeof images[0]];
      const isCommon = images.every(img => img[field as keyof typeof img] === firstValue);
      
      if (isCommon) {
        result[field] = firstValue || '';
      } else {
        result[field] = '';
      }
    });
    
    return result;
  };
  
  // 수정 가능한 필드 상태 관리
  const [editableFields, setEditableFields] = useState(() => findCommonFields());
  
  // 이미지가 변경될 때 공통 필드 다시 계산
  useEffect(() => {
    setEditableFields(findCommonFields());
  }, [images]);
  
  // 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableFields((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 저장 처리
  const handleSave = async () => {
    if (!onSave || images.length === 0) return;
    
    try {
      setLoading(true);
      
      // 수정된 필드만 필터링
      const updatedFields: Record<string, any> = {};
      
      Object.keys(editableFields).forEach(key => {
        if (editableFields[key] !== '') {
          updatedFields[key] = editableFields[key];
        }
      });
      
      // 각 이미지별로 업데이트 데이터 준비
      const updateData = images.map(img => ({
        imgId: img.imgId,
        ...updatedFields
      }));
      
      await onSave(updateData);
      
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
          <h2 className="text-xl font-bold text-white">
            다중 이미지 정보 {images.length}장
          </h2>
          <div className="space-x-2">
            {onSave && !editMode && (
              <button 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                onClick={() => setEditMode(true)}
              >
                일괄 수정
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
        
        {/* 수정 가능한 필드 */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">공통 정보 수정</h3>
          <p className="text-gray-400 mb-3 text-sm">
            * 빈 칸으로 두면 각 이미지의 원래 값이 유지됩니다.
          </p>
          
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
                  {editableFields.imgModality || '각기 다른 값'}
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
                  {editableFields.imgBodyPart || '각기 다른 값'}
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
                  <option value="">선택 (유지)</option>
                  <option value="1">Cluster 1</option>
                  <option value="2">Cluster 2</option>
                  <option value="3">Cluster 3</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-600 text-white rounded-md">
                  {editableFields.imgCluster ? `Cluster ${editableFields.imgCluster}` : '각기 다른 값'}
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
                  {editableFields.imgRemark || '각기 다른 값'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 이미지 목록 */}
        <div className="mt-4">
          <h3 className="text-lg font-medium text-white mb-3">선택된 이미지 {images.length}장</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {images.map((img, index) => (
              <div key={img.imgId || index} className="bg-gray-700 rounded-lg p-2">
                {img.imgPath && (
                  <img 
                    src={`local-image:/${img.imgPath}`} 
                    alt={img.imgOrgName || `이미지 ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md mb-1"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNhM2E0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjZmZmIj7snbTrr7jsp4Dqsowg7JeF7ISx64Sk66GdPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                )}
                <div className="text-gray-300 text-xs truncate" title={img.imgOrgName}>
                  {img.imgOrgName || `이미지 ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiImageInfoModal;