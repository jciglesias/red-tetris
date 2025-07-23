import { NetworkUtils } from './NetworkUtils';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock window.location
const mockLocation = {
  hostname: 'localhost',
  protocol: 'http:'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('NetworkUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockConsoleWarn.mockClear();
    // Reset location to default
    mockLocation.hostname = 'localhost';
    mockLocation.protocol = 'http:';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    jest.useRealTimers();
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response);

      const result = await NetworkUtils.testConnection('http://localhost:3001');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should return false when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as Response);

      const result = await NetworkUtils.testConnection('http://localhost:3001');

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should return false and log warning when fetch throws error', async () => {
      const mockError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(mockError);

      const result = await NetworkUtils.testConnection('http://localhost:3001');

      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Impossible de se connecter à http://localhost:3001:',
        mockError
      );
    });

    it('should handle timeout correctly', async () => {
      // Mock a fetch that never resolves but gets aborted
      let abortController: AbortController;
      mockFetch.mockImplementationOnce((_url, options: any) => {
        abortController = { signal: options.signal } as AbortController;
        return new Promise((_, reject) => {
          // Simulate abort signal
          options.signal.addEventListener('abort', () => {
            reject(new Error('The operation was aborted'));
          });
        });
      });

      const testPromise = NetworkUtils.testConnection('http://localhost:3001');

      // Fast-forward time to trigger the timeout
      jest.advanceTimersByTime(5000);

      const result = await testPromise;

      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Impossible de se connecter à http://localhost:3001:',
        expect.any(Error)
      );
    }, 10000); // Increase timeout for this test

    it('should clear timeout when request completes successfully', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response);

      await NetworkUtils.testConnection('http://localhost:3001');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    it('should use correct URL format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response);

      await NetworkUtils.testConnection('https://example.com:3001');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });
  });

  describe('findWorkingServerUrl', () => {
    it('should return first working URL when localhost is hostname', async () => {
      mockLocation.hostname = 'localhost';
      mockLocation.protocol = 'http:';

      // Mock testConnection to return true for localhost:3001
      mockFetch
        .mockResolvedValueOnce({ ok: true } as Response) // localhost:3001
        .mockResolvedValueOnce({ ok: false } as Response); // 127.0.0.1:3001

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://localhost:3001');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should test 127.0.0.1 when localhost fails', async () => {
      mockLocation.hostname = 'localhost';
      mockLocation.protocol = 'http:';

      // Mock testConnection to fail for localhost but succeed for 127.0.0.1
      mockFetch
        .mockResolvedValueOnce({ ok: false } as Response) // localhost:3001 fails
        .mockResolvedValueOnce({ ok: true } as Response); // 127.0.0.1:3001 succeeds

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://127.0.0.1:3001');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should include hostname URL when not localhost or 127.0.0.1', async () => {
      mockLocation.hostname = 'example.com';
      mockLocation.protocol = 'https:';

      // Mock testConnection to succeed for example.com
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('https://example.com:3001');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should skip hostname URL when hostname is 127.0.0.1', async () => {
      mockLocation.hostname = '127.0.0.1';
      mockLocation.protocol = 'http:';

      // Mock testConnection to succeed for localhost
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://localhost:3001');
      // Should not try the hostname URL since it's 127.0.0.1
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return default URL when all connections fail', async () => {
      mockLocation.hostname = 'localhost';
      mockLocation.protocol = 'http:';

      // Mock all connections to fail
      mockFetch
        .mockResolvedValueOnce({ ok: false } as Response) // localhost:3001
        .mockResolvedValueOnce({ ok: false } as Response); // 127.0.0.1:3001

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://localhost:3001');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should test URLs in correct order for external hostname', async () => {
      mockLocation.hostname = 'myserver.com';
      mockLocation.protocol = 'http:';

      // Mock all connections to fail so we can check the order
      mockFetch
        .mockResolvedValueOnce({ ok: false } as Response) // myserver.com:3001
        .mockResolvedValueOnce({ ok: false } as Response) // localhost:3001
        .mockResolvedValueOnce({ ok: false } as Response); // 127.0.0.1:3001

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://localhost:3001');
      
      // Check the order of calls
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://myserver.com:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
      expect(mockFetch).toHaveBeenNthCalledWith(3, 'http://127.0.0.1:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should handle https protocol correctly', async () => {
      mockLocation.hostname = 'secure.example.com';
      mockLocation.protocol = 'https:';

      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('https://secure.example.com:3001');
      expect(mockFetch).toHaveBeenCalledWith('https://secure.example.com:3001/health', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should stop testing once a working URL is found', async () => {
      mockLocation.hostname = 'example.com';
      mockLocation.protocol = 'http:';

      // Mock first URL to succeed
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://example.com:3001');
      // Should only call fetch once since first URL works
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in testConnection during URL testing', async () => {
      mockLocation.hostname = 'localhost';
      mockLocation.protocol = 'http:';

      // Mock first call to throw error, second to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://127.0.0.1:3001');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Impossible de se connecter à http://localhost:3001:',
        expect.any(Error)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty hostname', async () => {
      mockLocation.hostname = '';
      mockLocation.protocol = 'http:';

      // Mock first call (empty hostname) to fail, second call (localhost) to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Invalid URL')) // http://:3001/health will fail
        .mockResolvedValueOnce({ ok: true } as Response); // localhost succeeds

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://localhost:3001');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Impossible de se connecter à http://:3001:',
        expect.any(Error)
      );
    });

    it('should handle malformed URLs gracefully', async () => {
      mockLocation.hostname = 'invalid-hostname-with-spaces ';
      mockLocation.protocol = 'http:';

      // This might throw an error due to invalid URL, but should be caught
      mockFetch
        .mockRejectedValueOnce(new TypeError('Invalid URL'))
        .mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://localhost:3001');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should work with different port in hostname (though not expected)', async () => {
      mockLocation.hostname = 'example.com';
      mockLocation.protocol = 'http:';

      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      const result = await NetworkUtils.findWorkingServerUrl();

      expect(result).toBe('http://example.com:3001');
    });
  });
});
