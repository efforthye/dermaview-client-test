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
    
    setLoading(true);
    setError(null);
    
    try {
      // 이 로그는 렌더러 프로세스에서만 볼 수 있음
      console.log('회원가입 시도:', { userId, password, email, phone });
      // 메인 프로세스에 로그 전송
      ipcRenderer.send('console-log', '회원가입 시도: ' + JSON.stringify({ userId, password, email, phone }));
      
      const success = await signUp({
        userId,
        password,
        email,
        phone,
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
    <div className="absolute top-0 left-0 z-10 w-[100vw] h-[100vh] bg-black bg-opacity-90 flex flex-col items-center justify-center space-y-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-center text-white">회원가입</p>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded text-center w-64">
            {error}
          </div>
        )}
        
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="아이디"
          className="w-64 p-2 border rounded focus:outline-none"
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="비밀번호"
          className="w-64 p-2 border rounded focus:outline-none"
        />
        
        <input
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          placeholder="비밀번호 확인"
          className="w-64 p-2 border rounded focus:outline-none"
        />
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-64 p-2 border rounded focus:outline-none"
        />
        
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="전화번호"
          className="w-64 p-2 border rounded focus:outline-none"
        />
        
        <button
          disabled={loading || password !== confirmPwd}
          onClick={onSignUp}
          className={`w-full px-4 py-2 bg-blue-500 text-amber-50 rounded ${
            loading || password !== confirmPwd ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
        
        <div
          className="text-white flex justify-center items-center opacity-40 content-center mt-2 cursor-pointer hover:opacity-80"
          onClick={() => nav('/signin')}
        >
          로그인 페이지로 돌아가기
        </div>
      </div>
    </div>
  );
};