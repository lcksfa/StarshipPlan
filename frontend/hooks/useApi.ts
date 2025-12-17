import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, ApiResponse } from '../types/api';
import { withErrorHandling } from '../lib/api';

interface UseApiOptions<T> {
  immediate?: boolean;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  dependencies?: any[];
}

interface UseApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  refetch: () => Promise<T | null>;
}

/**
 * 通用的 API 调用 Hook
 */
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    retries = 2,
    retryDelay = 1000,
    onSuccess,
    onError,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!mountedRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result = await withErrorHandling(apiCall, {
        retries,
        retryDelay,
        onError: (apiError) => {
          if (mountedRef.current) {
            setError(apiError);
            onError?.(apiError);
          }
        }
      });

      if (mountedRef.current && result.success && result.data) {
        setData(result.data);
        onSuccess?.(result.data);
        return result.data;
      } else if (mountedRef.current && result.error) {
        throw new ApiError('API_ERROR', result.error);
      }

      return null;
    } catch (err) {
      if (mountedRef.current) {
        const apiError = err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR', err instanceof Error ? err.message : '未知错误');
        setError(apiError);
        onError?.(apiError);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiCall, retries, retryDelay, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  // 自动执行
  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [immediate, execute, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    refetch
  };
}

/**
 * 分页数据获取 Hook
 */
export function usePaginatedApi<T>(
  apiCall: (page: number) => Promise<ApiResponse<T[]>>,
  options: UseApiOptions<T[]> & {
    pageSize?: number;
  } = {}
) {
  const { pageSize = 20, ...apiOptions } = options;

  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const loadPage = useCallback(async (page: number, isLoadMore = false) => {
    if (!hasMore && page > 1) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await withErrorHandling(() => apiCall(page), {
        retries: 2,
        retryDelay: 1000
      });

      if (result.success && result.data) {
        const newData = result.data;
        const updatedData = isLoadMore ? [...data, ...newData] : newData;

        setData(updatedData);
        setCurrentPage(page);
        setHasMore(newData.length === pageSize);

        options.onSuccess?.(updatedData);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR', err instanceof Error ? err.message : '未知错误');
      setError(apiError);
      options.onError?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, pageSize, hasMore, data, options.onSuccess, options.onError]);

  const loadMore = useCallback(() => {
    loadPage(currentPage + 1, true);
  }, [currentPage, loadPage]);

  const refresh = useCallback(() => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    loadPage(1, false);
  }, [loadPage]);

  // 初始加载
  useEffect(() => {
    if (apiOptions.immediate !== false) {
      loadPage(1);
    }
  }, [loadPage, apiOptions.immediate]);

  return {
    data,
    isLoading,
    error,
    currentPage,
    hasMore,
    loadMore,
    refresh,
    refetch: refresh
  };
}

/**
 * 实时数据同步 Hook
 */
export function useRealtimeSync<T>(
  subscribe: (callback: (data: T) => void) => () => void,
  initialData: T | null = null
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let unsubscribe: () => void;

    try {
      setIsConnected(true);
      unsubscribe = subscribe((newData) => {
        setData(newData);
      });
    } catch (error) {
      console.error('实时数据订阅失败:', error);
      setIsConnected(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      setIsConnected(false);
    };
  }, [subscribe]);

  return {
    data,
    isConnected,
    setData
  };
}

/**
 * 防抖 API 调用 Hook
 */
export function useDebouncedApi<T>(
  apiCall: (params: any) => Promise<ApiResponse<T>>,
  delay: number = 500
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const execute = useCallback((params: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await withErrorHandling(() => apiCall(params));
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR', err instanceof Error ? err.message : '未知错误');
        setError(apiError);
      } finally {
        setIsLoading(false);
      }
    }, delay);
  }, [apiCall, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    execute
  };
}