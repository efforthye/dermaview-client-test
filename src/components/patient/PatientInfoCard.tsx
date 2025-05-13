import { FC, useState, useEffect } from 'react';
import { patientApi, PatientInfo } from '../../api/new/patientApi';

interface PatientInfoCardProps {
  patient: PatientInfo | null;
  onClose?: () => void;
  onSave?: (patient: PatientInfo) => void;
}

export const PatientInfoCard: FC<PatientInfoCardProps> = ({
  patient,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<PatientInfo>({
    patientName: '',
    doctor: '',
    patientRegNo: '',
    patientGender: '',
    patientBirthDate: '',
  });
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 환자 정보가 변경되면 폼 상태 업데이트
  useEffect(() => {
    if (patient) {
      setForm({
        ...patient,
      });
      
      // 신규 환자면 생성 모드로, 아니면 조회 모드로 설정
      setMode(patient.patientInfoId ? 'view' : 'create');
    }
  }, [patient]);
  
  // 폼 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.patientName) {
      setError('환자명은 필수 입력 항목입니다.');
      return;
    }
    
    if (!form.doctor) {
      setError('담당의는 필수 입력 항목입니다.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'create') {
        // 환자 정보 생성
        await patientApi.setPatient(form);
      } else if (mode === 'edit') {
        // 환자 정보 수정
        await patientApi.updatePatient(form);
      }
      
      // 저장 후 콜백 호출
      if (onSave) {
        onSave(form);
      }
      
      // 조회 모드로 변경
      setMode('view');
    } catch (err) {
      setError('환자 정보 저장 중 오류가 발생했습니다.');
      console.error('환자 정보 저장 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 환자 정보가 없는 경우
  if (!patient) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? '환자 추가' : mode === 'edit' ? '환자 정보 수정' : '환자 정보'}
        </h2>
        <div className="flex space-x-2">
          {mode === 'view' && (
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => setMode('edit')}
            >
              수정
            </button>
          )}
          {(mode === 'edit' || mode === 'create') && (
            <>
              <button
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                onClick={() => {
                  // 신규 환자 작성 중이었으면 닫기, 아니면 조회 모드로 변경
                  if (mode === 'create' && onClose) {
                    onClose();
                  } else {
                    setMode('view');
                    // 폼 초기화
                    setForm({
                      ...patient,
                    });
                  }
                }}
              >
                취소
              </button>
              <button
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                onClick={handleSubmit}
                disabled={loading}
              >
                저장
              </button>
            </>
          )}
          {mode === 'view' && onClose && (
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800">
          {error}
        </div>
      )}
      
      <div className="p-4">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="patientRegNo" className="block text-sm font-medium text-gray-700">
                등록번호
              </label>
              <input
                type="text"
                name="patientRegNo"
                id="patientRegNo"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.patientRegNo || ''}
                onChange={handleChange}
                readOnly={mode === 'view'}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">
                환자명 *
              </label>
              <input
                type="text"
                name="patientName"
                id="patientName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.patientName}
                onChange={handleChange}
                readOnly={mode === 'view'}
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="patientBirthDate" className="block text-sm font-medium text-gray-700">
                생년월일
              </label>
              <input
                type="date"
                name="patientBirthDate"
                id="patientBirthDate"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.patientBirthDate ? form.patientBirthDate.substring(0, 10) : ''}
                onChange={handleChange}
                readOnly={mode === 'view'}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700">
                성별
              </label>
              <select
                name="patientGender"
                id="patientGender"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.patientGender || ''}
                onChange={handleChange}
                disabled={mode === 'view' || loading}
              >
                <option value="">선택</option>
                <option value="M">남</option>
                <option value="F">여</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                담당의 *
              </label>
              <input
                type="text"
                name="doctor"
                id="doctor"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.doctor}
                onChange={handleChange}
                readOnly={mode === 'view'}
                disabled={loading}
                required
              />
            </div>
          </div>
        </form>
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
