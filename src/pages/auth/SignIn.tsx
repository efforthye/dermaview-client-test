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
    <div className="absolute top-0 left-0 z-10 w-[100vw] h-[100vh] bg-[#1B1E2B] flex flex-col items-center justify-center">
      <div className="bg-[#1F2235] rounded shadow-lg p-8 w-[400px] max-w-[90%]">
        <h1 className="text-2xl font-bold text-center text-white mb-8">LOGIN</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded text-center mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ID"
            className="w-full px-3 py-3 bg-transparent border-b border-gray-500 text-white text-center focus:outline-none"
          />
        </div>
        
        <div className="mb-8">
          <input
            type="password"
            value={password}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                onSubmit();
              }
            }}
            placeholder="password"
            className="w-full px-3 py-3 bg-transparent border-b border-gray-500 text-white text-center focus:outline-none"
          />
        </div>
        
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full py-3 bg-transparent border border-white text-white rounded-full mb-6 hover:bg-white hover:bg-opacity-10"
        >
          {loading ? '처리 중...' : 'Login'}
        </button>
        
        <div className="flex justify-between text-gray-400 text-sm">
          <span 
            className="cursor-pointer hover:text-white"
            onClick={() => nav('/signup')}
          >
            Create Account
          </span>
          <span className="cursor-pointer hover:text-white">
            Forgot Password
          </span>
        </div>
      </div>
    </div>
  );
};