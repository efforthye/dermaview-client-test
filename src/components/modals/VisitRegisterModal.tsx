import React, { useState, useEffect } from 'react';
import { VisitInfo, visitApi } from '../../api/visitApi';
import { PatientInfo } from '../../api/patientApi';

interface VisitRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: PatientInfo | null;
}

const VisitRegisterModal: React.FC<VisitRegisterModalProps> = ({ isOpen, onClose, onSuccess, patient }) => {
  const [visitInfo, setVisitInfo] = useState<VisitInfo>({
    patientInfoId: patient?.patientInfoId || '',
    visitDate: new Date().toISOString().slice(0, 10),
    visitDiagnosis: '',
    visitRemark: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registerType, setRegisterType] = useState<'cluster' | 'imgIds'>('cluster');
  const [clusterOrImgIds, setClusterOrImgIds] = useState<string>('');
  
  // 환자 정보가 변경되면 patientInfoId 업데이트
  useEffect(() => {
    if (patient) {
      setVisitInfo(prev => ({
        ...prev,
        patientInfoId: patient.patientInfoId || ''
      }));
    }
  }, [patient]);
  
  if (!isOpen || !patient) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVisitInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleClusterOrImgIdsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClusterOrImgIds(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 필수 필드 검증
      if (!patient?.patientInfoId) {
        throw new Error('환자 정보가 필요합니다.');
      }
      
      if (!visitInfo.visitDate) {
        throw new Error('방문일자를 선택해주세요.');
      }
      
      if (!clusterOrImgIds.trim()) {
        throw new Error(registerType === 'cluster' ? '클러스터를 입력해주세요.' : '이미지 ID를 입력해주세요.');
      }
      
      let response;
      
      if (registerType === 'cluster') {
        // 클러스터 단위로 내원 정보 등록
        response = await visitApi.setVisitByCluster({
          ...visitInfo,
          imgCluster: clusterOrImgIds
        });
      } else {
        // 이미지 ID 단위로 내원 정보 등록
        response = await visitApi.setVisitByImgIds({
          ...visitInfo,
          imgIds: clusterOrImgIds
        });
      }
      
      if (response && response.success) {
        // 등록 성공 시 목록 갱신 및 모달 닫기
        onSuccess();
        onClose();
      } else {
        setError('방문 정보 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('방문 정보 등록 오류:', err);
      setError(err instanceof Error ? err.message : '방문 정보 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">방문 정보 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            &times;
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              환자
            </label>
            <div className="p-2 bg-gray-700 rounded text-white">
              {patient.patientName} ({patient.patientRegNo})
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              방문일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="visitDate"
              value={visitInfo.visitDate}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              진단명
            </label>
            <input
              type="text"
              name="visitDiagnosis"
              value={visitInfo.visitDiagnosis || ''}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="진단명을 입력하세요"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              비고
            </label>
            <textarea
              name="visitRemark"
              value={visitInfo.visitRemark || ''}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="비고 사항을 입력하세요"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              등록 방식
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="registerType"
                  value="cluster"
                  checked={registerType === 'cluster'}
                  onChange={() => setRegisterType('cluster')}
                  className="mr-2"
                />
                <span className="text-white">클러스터 단위</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="registerType"
                  value="imgIds"
                  checked={registerType === 'imgIds'}
                  onChange={() => setRegisterType('imgIds')}
                  className="mr-2"
                />
                <span className="text-white">이미지 ID 단위</span>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {registerType === 'cluster' ? '클러스터' : '이미지 ID'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clusterOrImgIds}
              onChange={handleClusterOrImgIdsChange}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder={registerType === 'cluster' ? '클러스터를 입력하세요' : '이미지 ID를 입력하세요 (예: 1,2,3)'}
              required
            />
            {registerType === 'imgIds' && (
              <p className="text-gray-400 text-xs mt-1">쉼표(,)로 구분하여 여러 이미지 ID를 입력하세요</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-gray-400 text-gray-400 rounded-full hover:bg-white hover:bg-opacity-5"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
              ) : null}
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitRegisterModal;