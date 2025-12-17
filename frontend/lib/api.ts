import { ApiResponse, PaginatedResponse, ApiError } from '../types/api';

// API 客户端配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 10000; // 10 秒超时

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // 设置默认请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 处理 HTTP 错误状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.code || `HTTP_${response.status}`,
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.details
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', '请求超时，请检查网络连接');
      }

      if (error instanceof TypeError) {
        throw new ApiError('NETWORK_ERROR', '网络连接失败，请检查服务器状态');
      }

      throw new ApiError('UNKNOWN_ERROR', error instanceof Error ? error.message : '未知错误');
    }
  }

  // GET 请求
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  // POST 请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH 请求
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }

  // 获取 API 信息
  async getApiInfo(): Promise<ApiResponse<{ version: string; endpoints: Record<string, string> }>> {
    return this.get('/api');
  }
}

// 自定义错误类
class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 创建默认 API 客户端实例
export const apiClient = new ApiClient();
export { ApiError };

// API 请求包装器，包含错误处理和重试逻辑
export async function withErrorHandling<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: ApiError) => void;
  } = {}
): Promise<ApiResponse<T>> {
  const { retries = 2, retryDelay = 1000, onError } = options;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error as ApiError;

      // 调用错误处理回调
      if (onError) {
        onError(lastError);
      }

      // 某些错误不应重试
      if (lastError.code === 'HTTP_400' || lastError.code === 'HTTP_401' || lastError.code === 'HTTP_403') {
        break;
      }

      // 最后一次尝试不需要延迟
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

// 创建带有类型安全的 API 方法生成器
export function createApiMethod<TRequest = void, TResponse = void>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string
) {
  return async (data?: TRequest): Promise<ApiResponse<TResponse>> => {
    switch (method) {
      case 'GET':
        return apiClient.get<TResponse>(endpoint, data as any);
      case 'POST':
        return apiClient.post<TResponse>(endpoint, data);
      case 'PUT':
        return apiClient.put<TResponse>(endpoint, data);
      case 'DELETE':
        return apiClient.delete<TResponse>(endpoint);
      case 'PATCH':
        return apiClient.patch<TResponse>(endpoint, data);
      default:
        throw new Error(`不支持的 HTTP 方法: ${method}`);
    }
  };
}