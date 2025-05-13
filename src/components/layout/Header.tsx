import { FC, useState } from 'react';
import { useAtom } from 'jotai';
import { settingsAtom } from '../../atoms/states';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/new';

interface HeaderProps {
  onSearch?: (query: string, field: string) => void;
}

export const Header: FC<HeaderProps> = ({ onSearch }) => {
  const [settings] = useAtom(settingsAtom);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('등록번호'); // 기본값: 등록번호
  
  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery, searchField);
    }
  };
  
  const handleLogout = async () => {
    try {
      await authApi.signOut();
      // 로그인 페이지로 이동
      navigate('/signin');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };
  
  return (
    <div className="w-full bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold mr-4">DERMAVIEW</Link>
      </div>
      
      <div className="flex items-center max-w-xl w-full mx-4">
        <div className="flex items-center bg-white rounded-full overflow-hidden w-full">
          <div className="flex items-center px-4 py-2 text-gray-800 border-r border-gray-300">
            <span>{searchField}</span>
            <button className="ml-2" onClick={() => setSearchField(searchField === '등록번호' ? '날짜' : '등록번호')}>
              ▼
            </button>
          </div>
          <input
            type="text"
            className="flex-grow py-2 px-4 outline-none text-black"
            placeholder="검색어를 입력하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="bg-blue-500 text-white py-2 px-4 hover:bg-blue-600"
            onClick={handleSearch}
          >
            검 색
          </button>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="mr-4">
          {settings?.userContext?.name || '사용자'} / {settings?.userContext?.role || '피부과'}
        </div>
        <button
          className="flex items-center justify-center bg-gray-700 rounded-full w-10 h-10"
          onClick={handleLogout}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </div>
  );
};
