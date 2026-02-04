import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { parseStream, type StreamOptions, type OnDelta } from '@/services/streamParser';

describe('streamParser', () => {
  let mockResponse: Response;
  let onDeltaMock: Mock<OnDelta>;
  let onDoneMock: Mock<() => void>;
  let onErrorMock: Mock<(err: Error) => void>;

  beforeEach(() => {
    onDeltaMock = vi.fn() as Mock<OnDelta>;
    onDoneMock = vi.fn() as Mock<() => void>;
    onErrorMock = vi.fn() as Mock<(err: Error) => void>;
  });

  // Helper function to create a mock ReadableStream
  const createMockStream = (chunks: string[]): ReadableStream => {
    let index = 0;
    return new ReadableStream({
      pull(controller) {
        if (index < chunks.length) {
          const chunk = chunks[index++];
          controller.enqueue(new TextEncoder().encode(chunk));
        } else {
          controller.close();
        }
      },
    });
  };

  // Helper function to create a mock Response
  const createMockResponse = (body: ReadableStream, status = 200, ok = true): Response => {
    return {
      ok,
      status,
      body,
    } as Response;
  };

  describe('parseStream', () => {
    it('should parse single SSE event with text data', async () => {
      const chunks = ['data: {"text": "Hello"}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('Hello');
      expect(onDeltaMock).toHaveBeenCalledTimes(1);
      expect(onDoneMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).not.toHaveBeenCalled();
    });

    it('should parse multiple SSE events in sequence', async () => {
      const chunks = [
        'data: {"text": "Hello"}\n\n',
        'data: {"text": " world"}\n\n',
        'data: {"text": "!"}\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledTimes(3);
      expect(onDeltaMock).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onDeltaMock).toHaveBeenNthCalledWith(2, ' world');
      expect(onDeltaMock).toHaveBeenNthCalledWith(3, '!');
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    it('should handle event: done to signal completion', async () => {
      const chunks = [
        'data: {"text": "Partial"}\n\n',
        'event: done\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('Partial');
      expect(onDeltaMock).toHaveBeenCalledTimes(1);
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    it('should handle chunks split across multiple reads', async () => {
      // Simulate a message split across multiple chunks
      const chunks = [
        'data: {',
        '"text": "Hello',
        ' World"}\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('Hello World');
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    it('should handle incomplete events in buffer', async () => {
      // The last event might be incomplete and needs to wait for more data
      const chunks = [
        'data: {"text": "First"}\n\ndata: {',
        '"text": "Second"}\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledTimes(2);
      expect(onDeltaMock).toHaveBeenNthCalledWith(1, 'First');
      expect(onDeltaMock).toHaveBeenNthCalledWith(2, 'Second');
    });

    it('should call onError for invalid JSON data', async () => {
      const chunks = ['data: {invalid json}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).not.toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should call onError for missing text field in data', async () => {
      const chunks = ['data: {"other": "value"}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      // The data has no 'text' field, so onDelta should not be called with it
      expect(onDeltaMock).not.toHaveBeenCalled();
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    it('should handle response with non-ok status', async () => {
      mockResponse = createMockResponse(createMockStream([]), 500, false);

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onErrorMock.mock.calls[0][0].message).toContain('500');
    });

    it('should handle response with null body', async () => {
      mockResponse = {
        ok: true,
        status: 200,
        body: null,
      } as Response;

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const chunks = [
        'data: {"text": "First"}\n\n',
        'data: {"text": "Second"}\n\n',
      ];
      
      // Create a slow stream to ensure we can abort mid-stream
      let index = 0;
      const slowStream = new ReadableStream({
        async pull(controller) {
          if (index < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
            const chunk = chunks[index++];
            controller.enqueue(new TextEncoder().encode(chunk));
          } else {
            controller.close();
          }
        },
      });

      mockResponse = createMockResponse(slowStream);

      const options: StreamOptions = {
        signal: controller.signal,
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      // Start parsing
      const parsePromise = parseStream(mockResponse, options);

      // Abort after a short delay
      setTimeout(() => controller.abort(), 25);

      await parsePromise;

      // Should have called onDelta for the first chunk only
      expect(onDeltaMock).toHaveBeenCalledTimes(1);
      expect(onDeltaMock).toHaveBeenCalledWith('First');
    });

    it('should handle already aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const chunks = ['data: {"text": "Hello"}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        signal: controller.signal,
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      // Should cancel immediately and call onError or just exit gracefully
      expect(onDeltaMock).not.toHaveBeenCalled();
    });

    it('should handle empty response body', async () => {
      mockResponse = createMockResponse(createMockStream([]));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).not.toHaveBeenCalled();
      expect(onDoneMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).not.toHaveBeenCalled();
    });

    it('should handle final buffer flush when server closes without done event', async () => {
      const chunks = ['data: {"text": "Final chunk"}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('Final chunk');
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    it('should concatenate multiple data lines in single event', async () => {
      // The stream parser concatenates multiple data: lines together
      // This results in invalid JSON when there are multiple complete JSON objects
      const chunks = ['data: {"text": "Part 1"}\ndata: {"text": "Part 2"}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      // The concatenated data is invalid JSON, so onError should be called
      expect(onErrorMock).toHaveBeenCalled();
      expect(onDeltaMock).not.toHaveBeenCalled();
    });

    it('should handle text with special characters', async () => {
      const chunks = [
        'data: {"text": "Special chars: \\"quoted\\" <br> & ampersand"}\n\n',
        'data: {"text": "Unicode: 你好 🎉"}\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenNthCalledWith(1, 'Special chars: "quoted" <br> & ampersand');
      expect(onDeltaMock).toHaveBeenNthCalledWith(2, 'Unicode: 你好 🎉');
    });

    it('should handle very long text content', async () => {
      const longText = 'A'.repeat(10000);
      const chunks = [`data: {"text": "${longText}"}\n\n`];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith(longText);
    });

    it('should handle empty text field', async () => {
      const chunks = ['data: {"text": ""}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('');
    });

    it('should handle whitespace-only text', async () => {
      const chunks = ['data: {"text": "   \\n\\t  "}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('   \n\t  ');
    });

    it('should handle response where body reader throws', async () => {
      const errorStream = new ReadableStream({
        pull() {
          throw new Error('Reader error');
        },
      });

      mockResponse = createMockResponse(errorStream);

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onErrorMock.mock.calls[0][0].message).toBe('Reader error');
    });

    it('should handle events with id and retry fields', async () => {
      const chunks = [
        'id: 123\nevent: message\ndata: {"text": "With ID"}\n\n',
        'retry: 5000\nevent: message\ndata: {"text": "With retry"}\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledTimes(2);
      expect(onDeltaMock).toHaveBeenNthCalledWith(1, 'With ID');
      expect(onDeltaMock).toHaveBeenNthCalledWith(2, 'With retry');
    });

    it('should handle comments in SSE (lines starting with colon)', async () => {
      const chunks = [
        ': This is a comment\n',
        'data: {"text": "After comment"}\n\n',
        ': Another comment\n',
        'event: done\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledWith('After comment');
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    it('should handle missing optional callbacks gracefully', async () => {
      const chunks = ['data: {"text": "Hello"}\n\n'];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        // onDone and onError are optional
      };

      // Should not throw
      await expect(parseStream(mockResponse, options)).resolves.not.toThrow();
      expect(onDeltaMock).toHaveBeenCalledWith('Hello');
    });

    it('should handle concurrent data events without events', async () => {
      // Multiple data-only events without explicit event type
      const chunks = [
        'data: {"text": "A"}\n\n',
        'data: {"text": "B"}\n\n',
        'data: {"text": "C"}\n\n',
      ];
      mockResponse = createMockResponse(createMockStream(chunks));

      const options: StreamOptions = {
        onDelta: onDeltaMock,
        onDone: onDoneMock,
        onError: onErrorMock,
      };

      await parseStream(mockResponse, options);

      expect(onDeltaMock).toHaveBeenCalledTimes(3);
      expect(onDeltaMock).toHaveBeenNthCalledWith(1, 'A');
      expect(onDeltaMock).toHaveBeenNthCalledWith(2, 'B');
      expect(onDeltaMock).toHaveBeenNthCalledWith(3, 'C');
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });
  });
});
