import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ipcRenderer } from 'electron';

export const SignUp = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPwd] = useState<string>('');
  const [confirmPwd, setConfirmPwd] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const nav = useNavigate();
  
  // 이메일 유효성 검사 함수
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 전화번호 유효성 검사 함수
  const isValidPhone = (phone: string): boolean => {
    // 간단한 전화번호 검증 (숫자만, 최소 9자 이상)
    const phoneRegex = /^\d{9,}$/;
    return phoneRegex.test(phone);
  };
  
  const onSignUp = async () => {
    // 필수 필드 유효성 검사
    if (!userId || !password || !confirmPwd || !email || !phone) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    // 비밀번호 일치 확인
    if (password !== confirmPwd) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    // 이메일 형식 확인
    if (!isValidEmail(email)) {
      setError('유효한 이메일 형식이 아닙니다.');
      return;
    }
    
    // 전화번호 형식 확인
    if (!isValidPhone(phone)) {
      setError('유효한 전화번호 형식이 아닙니다.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 이 로그는 렌더러 프로세스에서만 볼 수 있음
      console.log('회원가입 시도:', { userId, password, email, phone, name, position });
      // 메인 프로세스에 로그 전송
      ipcRenderer.send('console-log', '회원가입 시도: ' + JSON.stringify({ userId, password, email, phone, name, position }));
      
      const success = await signUp({
        userId,
        password,
        email,
        phone,
        name,
        position
      });
      
      console.log('회원가입 결과:', success);
      ipcRenderer.send('console-log', '회원가입 결과: ' + success);
      
      if (success) {
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        nav('/signin');
      } else {
        setError('회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      ipcRenderer.send('console-log', '회원가입 오류: ' + (err instanceof Error ? err.message : String(err)));
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 z-10 w-[100vw] h-[100vh] bg-[#1B1E2B] flex flex-col items-center justify-center">
      <div className="bg-[#1F2235] rounded shadow-lg p-8 w-[400px] max-w-[90%]">
        <h1 className="text-2xl font-bold text-center text-white mb-6">SIGN UP</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded text-center mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ID *"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Password *"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Confirm Password *"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
          {password && confirmPwd && password !== confirmPwd && (
            <p className="text-red-400 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>
        
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number *"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Position"
            className="w-full px-3 py-2 bg-transparent border-b border-gray-500 text-white focus:outline-none"
          />
        </div>
        
        <button
          disabled={loading || password !== confirmPwd}
          onClick={onSignUp}
          className="w-full py-3 bg-transparent border border-white text-white rounded-full mb-4 hover:bg-white hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
        
        <div className="text-center text-gray-400 mt-2">
          <span 
            className="cursor-pointer hover:text-white"
            onClick={() => nav('/signin')}
          >
            로그인 페이지로 돌아가기
          </span>
        </div>
      </div>
      
      <div className="mt-4 text-gray-400 text-xs">
        <p>* 표시는 필수 입력 항목입니다</p>
      </div>
    </div>
  );
};