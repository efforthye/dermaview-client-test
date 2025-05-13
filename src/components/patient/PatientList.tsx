import { FC, useState, useEffect } from 'react';
import { patientApi, PatientInfo } from '../../api/new/patientApi';

interface PatientListProps {
  onPatientSelect: (patient: PatientInfo) => void;
  searchQuery?: string;
  searchField?: string;
}

// 생년월일 포맷팅 함수
const formatBirthDate = (birthDate: string) => {
  // YYYYMMDD 형식을 YYYY-MM-DD로 변환
  if (birthDate.length === 8) {
    return `${birthDate.substring(0, 4)}-${birthDate.substring(4, 6)}-${birthDate.substring(6, 8)}`;
  }
  return birthDate;
};

export const PatientList: FC<PatientListProps> = ({ 
  onPatientSelect, 
  searchQuery = '', 
  searchField = '등록번호' 
}) => {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  
  // 환자 목록 조회
  const fetchPatients = async (page = 0, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 검색 조건 설정
      const searchParams: Partial<PatientInfo> = {
        pageCount: page,
        pageSize: pageSize
      };
      
      // 검색어가 있는 경우 조건 추가
      if (searchQuery) {
        if (searchField === '등록번호') {
          searchParams.patientRegNo = searchQuery;
        } else if (searchField === '이름') {
          searchParams.patientName = searchQuery;
        }
      }
      
      const response = await patientApi.getPatient(searchParams);
      const newPatients = response.data || [];
      
      if (reset) {
        setPatients(newPatients);
      } else {
        setPatients(prev => [...prev, ...newPatients]);
      }
      
      // 더 불러올 데이터가 있는지 확인
      setHasMore(newPatients.length === pageSize);
      setCurrentPage(page);
    } catch (err) {
      setError('환자 목록을 불러오는 중 오류가 발생했습니다.');
      console.error('환자 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 검색어나 필드가 변경되면 환자 목록 초기화 후 다시 조회
  useEffect(() => {
    fetchPatients(0, true);
  }, [searchQuery, searchField]);
  
  // 더 불러오기
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPatients(currentPage + 1);
    }
  };
  
  // 환자 선택 처리
  const handlePatientSelect = (patient: PatientInfo) => {
    onPatientSelect(patient);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold">환자 목록</h2>
        <p className="text-sm text-gray-500">총 {patients.length}명</p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800">
          {error}
        </div>
      )}
      
      <div className="overflow-y-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                등록번호
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                환자명
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                성별
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생년월일
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당의
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr 
                key={patient.patientInfoId} 
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handlePatientSelect(patient)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.patientRegNo || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {patient.patientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.patientGender === 'M' ? '남' : patient.patientGender === 'F' ? '여' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.patientBirthDate ? formatBirthDate(patient.patientBirthDate) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.doctor || '-'}
                </td>
              </tr>
            ))}
            
            {patients.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchQuery ? '검색 결과가 없습니다.' : '환자 정보가 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {loading && (
        <div className="p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
      )}
      
      {hasMore && !loading && patients.length > 0 && (
        <div className="p-4 text-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={loadMore}
          >
            더 보기
          </button>
        </div>
      )}
      
      <div className="p-4 border-t">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-full"
          onClick={() => {
            // 환자 추가 모달 표시 (임시로 빈 객체로 처리)
            onPatientSelect({
              patientName: '',
              doctor: '',
            });
          }}
        >
          환자 추가
        </button>
      </div>
    </div>
  );
};
