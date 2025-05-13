import { useCallback, useState } from 'react';

interface UseLoadingReturn {
  isLoading: boolean;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

const useLoading = (initialState: boolean = false): UseLoadingReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(initialState);

  const withLoading = useCallback(
    async <T>(promise: Promise<T>): Promise<T> => {
      try {
        setIsLoading(true);
        const result = await promise;
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    withLoading,
  };
};

export default useLoading;
