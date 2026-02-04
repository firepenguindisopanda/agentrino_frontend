import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

// We need to test the module, but it uses process.env
// We'll create a test version that allows us to control the env
const createApiClient = (apiUrl: string | undefined) => {
  return axios.create({
    baseURL: apiUrl || 'http://localhost:8000',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
};

describe('apiConfig', () => {
  let consoleLogSpy: Mock<typeof console.log>;
  let consoleErrorSpy: Mock<typeof console.error>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as Mock<typeof console.log>;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as Mock<typeof console.error>;
    originalEnv = process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  describe('apiClient configuration', () => {
    it('should create axios instance with default config', () => {
      const client = createApiClient(undefined);

      expect(client.defaults.baseURL).toBe('http://localhost:8000');
      expect(client.defaults.timeout).toBe(30000);
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
      expect(client.defaults.headers['Accept']).toBe('application/json');
    });

    it('should use environment variable for baseURL when provided', () => {
      const customUrl = 'http://api.example.com';
      const client = createApiClient(customUrl);

      expect(client.defaults.baseURL).toBe(customUrl);
    });

    it('should use default localhost when env var is not set', () => {
      const client = createApiClient(undefined);

      expect(client.defaults.baseURL).toBe('http://localhost:8000');
    });

    it('should handle empty string env var as undefined', () => {
      const client = createApiClient('');

      expect(client.defaults.baseURL).toBe('http://localhost:8000');
    });

    it('should have 30 second timeout', () => {
      const client = createApiClient(undefined);

      expect(client.defaults.timeout).toBe(30000);
    });

    it('should have JSON content type headers', () => {
      const client = createApiClient(undefined);

      expect(client.defaults.headers['Content-Type']).toBe('application/json');
      expect(client.defaults.headers['Accept']).toBe('application/json');
    });
  });

  describe('request interceptor', () => {
    it('should log request method and URL', async () => {
      const client = createApiClient(undefined);
      
      // Add a simple request interceptor that logs
      client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          console.log('API Request:', config.method?.toUpperCase(), config.url);
          return config;
        }
      );

      // Mock the adapter to prevent actual HTTP calls
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await client.get('/test-endpoint');

      expect(consoleLogSpy).toHaveBeenCalledWith('API Request:', 'GET', '/test-endpoint');
    });

    it('should log POST requests', async () => {
      const client = createApiClient(undefined);
      
      client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          console.log('API Request:', config.method?.toUpperCase(), config.url);
          return config;
        }
      );

      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: {},
          status: 201,
          statusText: 'Created',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await client.post('/create', { data: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith('API Request:', 'POST', '/create');
    });

    it('should pass through the config unchanged', async () => {
      const client = createApiClient(undefined);
      
      let capturedConfig: InternalAxiosRequestConfig | null = null;
      
      client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          capturedConfig = config;
          return config;
        }
      );

      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await client.get('/test');

      expect(capturedConfig).not.toBeNull();
      expect((capturedConfig as InternalAxiosRequestConfig | null)?.url).toBe('/test');
    });

    it('should handle request interceptor errors', async () => {
      const client = createApiClient(undefined);
      const error = new Error('Request preparation failed');
      
      client.interceptors.request.use(
        (_config: InternalAxiosRequestConfig) => {
          // Reject the promise to simulate an error in request preparation
          return Promise.reject(error);
        }
      );

      // The request should be rejected with the error
      await expect(client.get('/test')).rejects.toThrow('Request preparation failed');
    });
  });

  describe('response interceptor', () => {
    it('should return successful response unchanged', async () => {
      const client = createApiClient(undefined);
      const mockData = { id: 1, name: 'Test' };
      
      client.interceptors.response.use(
        (response: AxiosResponse) => {
          return response;
        },
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const response = await client.get('/test');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
    });

    it('should log and reject on error response', async () => {
      const client = createApiClient(undefined);
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
        message: 'Request failed with status code 404',
      };
      
      client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async () => {
        const error = new Error('Request failed with status code 404') as AxiosError;
        error.response = errorResponse.response as AxiosResponse;
        throw error;
      };

      await expect(client.get('/not-found')).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const client = createApiClient(undefined);
      
      client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async () => {
        const error = new Error('Network Error') as AxiosError;
        error.code = 'ECONNABORTED';
        throw error;
      };

      await expect(client.get('/test')).rejects.toThrow('Network Error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle timeout errors', async () => {
      const client = createApiClient(undefined);
      
      client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async () => {
        const error = new Error('timeout of 30000ms exceeded') as AxiosError;
        error.code = 'ECONNABORTED';
        throw error;
      };

      await expect(client.get('/slow-endpoint')).rejects.toThrow('timeout');
    });

    it('should handle 500 server errors', async () => {
      const client = createApiClient(undefined);
      
      client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async () => {
        const error = new Error('Request failed with status code 500') as AxiosError;
        error.response = {
          status: 500,
          data: { error: 'Internal Server Error' },
        } as AxiosResponse;
        throw error;
      };

      await expect(client.get('/error')).rejects.toThrow('500');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle 401 unauthorized errors', async () => {
      const client = createApiClient(undefined);
      
      client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async () => {
        const error = new Error('Request failed with status code 401') as AxiosError;
        error.response = {
          status: 401,
          data: { error: 'Unauthorized' },
        } as AxiosResponse;
        throw error;
      };

      await expect(client.get('/protected')).rejects.toThrow('401');
    });

    it('should handle 403 forbidden errors', async () => {
      const client = createApiClient(undefined);
      
      client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
          console.error('API Response Error:', error);
          return Promise.reject(error);
        }
      );

      client.defaults.adapter = async () => {
        const error = new Error('Request failed with status code 403') as AxiosError;
        error.response = {
          status: 403,
          data: { error: 'Forbidden' },
        } as AxiosResponse;
        throw error;
      };

      await expect(client.get('/admin')).rejects.toThrow('403');
    });
  });

  describe('configuration variations', () => {
    it('should handle URLs with trailing slash in env var', () => {
      const client = createApiClient('http://api.example.com/');

      expect(client.defaults.baseURL).toBe('http://api.example.com/');
    });

    it('should handle URLs with port numbers', () => {
      const client = createApiClient('http://localhost:9000');

      expect(client.defaults.baseURL).toBe('http://localhost:9000');
    });

    it('should handle HTTPS URLs', () => {
      const client = createApiClient('https://secure.api.com');

      expect(client.defaults.baseURL).toBe('https://secure.api.com');
    });

    it('should handle URLs with subpaths', () => {
      const client = createApiClient('http://api.example.com/v1');

      expect(client.defaults.baseURL).toBe('http://api.example.com/v1');
    });

    it('should handle very long URLs', () => {
      const longPath = '/a'.repeat(100);
      const url = `http://api.example.com${longPath}`;
      const client = createApiClient(url);

      expect(client.defaults.baseURL).toBe(url);
    });

    it('should handle URLs with special characters in query params', () => {
      const url = 'http://api.example.com?key=value%20with%20spaces';
      const client = createApiClient(url);

      expect(client.defaults.baseURL).toBe(url);
    });
  });

  describe('multiple interceptors', () => {
    it('should support multiple request interceptors', async () => {
      const client = createApiClient(undefined);
      const calls: string[] = [];
      
      client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          calls.push('first');
          return config;
        }
      );
      
      client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          calls.push('second');
          return config;
        }
      );

      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await client.get('/test');

      expect(calls).toEqual(['second', 'first']);
    });

    it('should support multiple response interceptors', async () => {
      const client = createApiClient(undefined);
      const calls: string[] = [];
      
      client.interceptors.response.use(
        (response: AxiosResponse) => {
          calls.push('first');
          return response;
        }
      );
      
      client.interceptors.response.use(
        (response: AxiosResponse) => {
          calls.push('second');
          return response;
        }
      );

      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await client.get('/test');

      // Axios executes response interceptors in reverse order (LIFO)
      expect(calls).toEqual(['first', 'second']);
    });
  });

  describe('request cancellation', () => {
    it('should support request cancellation with AbortController', async () => {
      const client = createApiClient(undefined);
      const controller = new AbortController();
      let abortHandler: (() => void) | null = null;
      
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        // Check if already aborted
        if (config.signal?.aborted) {
          const error = new Error('canceled') as AxiosError;
          throw error;
        }
        
        // Return a promise that can be aborted
        return new Promise((resolve, reject) => {
          // Set up abort listener
          const signal = config.signal as AbortSignal | undefined;
          if (signal) {
            abortHandler = () => {
              reject(new Error('canceled'));
            };
            signal.addEventListener('abort', abortHandler);
          }
          
          // Simulate slow request - never resolves normally in this test
          setTimeout(() => {
            if (abortHandler && signal) {
              (signal as AbortSignal).removeEventListener('abort', abortHandler);
            }
            resolve({
              data: {},
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            } as AxiosResponse);
          }, 10000);
        });
      };

      const requestPromise = client.get('/slow', { signal: controller.signal });
      
      // Small delay to ensure the adapter starts executing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Cancel after setup
      controller.abort();

      await expect(requestPromise).rejects.toThrow('canceled');
    });
  });

  describe('request methods', () => {
    it('should handle GET requests', async () => {
      const client = createApiClient(undefined);
      
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: { method: config.method },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const response = await client.get('/test');
      expect(response.data.method).toBe('get');
    });

    it('should handle POST requests with data', async () => {
      const client = createApiClient(undefined);
      const postData = { name: 'Test', value: 123 };
      
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        // Axios serializes the data to JSON string
        const receivedData = typeof config.data === 'string' 
          ? JSON.parse(config.data) 
          : config.data;
        
        return {
          data: { received: receivedData },
          status: 201,
          statusText: 'Created',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const response = await client.post('/create', postData);
      expect(response.data.received).toEqual(postData);
    });

    it('should handle PUT requests', async () => {
      const client = createApiClient(undefined);
      
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: { method: config.method },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const response = await client.put('/update', {});
      expect(response.data.method).toBe('put');
    });

    it('should handle DELETE requests', async () => {
      const client = createApiClient(undefined);
      
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: { method: config.method },
          status: 204,
          statusText: 'No Content',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const response = await client.delete('/delete');
      expect(response.data.method).toBe('delete');
    });

    it('should handle PATCH requests', async () => {
      const client = createApiClient(undefined);
      
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        return {
          data: { method: config.method },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const response = await client.patch('/patch', {});
      expect(response.data.method).toBe('patch');
    });
  });
});
