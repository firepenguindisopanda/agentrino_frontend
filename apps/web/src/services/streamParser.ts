export type OnDelta = (deltaText: string) => void;

export interface RagMetadata {
  rag_used: boolean;
  rag_docs_count: number;
}

export interface StreamOptions {
  signal?: AbortSignal;
  onDelta: OnDelta;
  onDone?: (ragMetadata?: RagMetadata) => void;
  onError?: (err: Error) => void;
}

/**
 * Parses Server-Sent Events from the chat streaming response
 * Based on the backend SSE format with "data: {text: ...}" and "event: done"
 */
export async function parseStream(
  response: Response,
  { signal, onDelta, onDone, onError }: StreamOptions
): Promise<void> {
  try {
    if (!response.ok || !response.body) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      // Check if operation was cancelled
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by "\n\n" blocks
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? ''; // partial chunk remains in buffer

      for (const part of parts) {
        // each `part` contains one event block (possibly multiple lines)
        // parse lines like: "data: {...}" and optional "event: done"
        const lines = part.split('\n').map(l => l.trim());
        let event = 'message';
        let data = '';

        for (const line of lines) {
          if (!line) continue;
          if (line.startsWith('event:')) {
            event = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            data += line.replace('data:', '').trim();
          }
        }

        if (event === 'done') {
          let ragMetadata: RagMetadata | undefined;
          if (data) {
            try {
              ragMetadata = JSON.parse(data);
            } catch {
              // ignore parse error for done event
            }
          }
          onDone?.(ragMetadata);
          return;
        }

        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed.text === 'string') {
              onDelta(parsed.text);
            }
          } catch (err) {
            console.error('Failed to parse SSE data', err);
            onError?.(err as Error);
          }
        }
      }
    }

    // final flush in case server closed without explicit `done` event
    if (buffer.trim()) {
      try {
        const dataLine = buffer.split('\n').find(l => l.startsWith('data:'))?.slice('data:'.length).trim();
        if (dataLine) {
          const parsed = JSON.parse(dataLine);
          if (parsed?.text) onDelta(parsed.text);
        }
      } catch (err) {
        console.error('Failed to parse final buffer', err);
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err as Error);
  }
}