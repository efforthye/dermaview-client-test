import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const SignIn = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPwd] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const nav = useNavigate();

  const onSubmit = async () => {
    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await signIn({ userId, password });
      if (success) {
        nav('/');
      } else {
        setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 z-10 w-[100vw] h-[100vh] bg-black bg-opacity-90 flex flex-col items-center justify-center space-y-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-center text-white">로그인</p>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded text-center">
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) {
              onSubmit();
            }
          }}
          placeholder="비밀번호"
          className="w-64 p-2 border rounded focus:outline-none"
        />
        
        <button
          onClick={onSubmit}
          disabled={loading}
          className={`w-full px-4 py-2 bg-blue-500 text-amber-50 rounded ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '처리 중...' : '로그인'}
        </button>
        
        <div
          className="text-white flex justify-center items-center opacity-40 content-center mt-2 cursor-pointer hover:opacity-80"
          onClick={() => nav('/signup')}
        >
          회원가입
        </div>
      </div>
    </div>
  );
};