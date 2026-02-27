export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Use dynamic system message instead of hardcoded
// Default fallback provided by the caller


export async function sendChatMessage(
    messages: Message[],
    targetNode: string | null,
    systemMessage: Message,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
): Promise<{ tokens?: number; timeMs?: number; tokensPerSec?: number; model?: string } | undefined> {
    let stats: { tokens?: number; timeMs?: number; tokensPerSec?: number; model?: string } | undefined;
    let detectedModel: string | undefined;

    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Inject target node header if selected (same as Web-UI pattern)
        if (targetNode) {
            headers['X-Target-Node'] = targetNode;
        }

        // Call through Next.js Edge route handler for proper SSE streaming
        // (Next.js rewrites buffer SSE, so we use a route handler instead)
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: 'Qwen2.5-1.5B-Instruct',
                messages: [systemMessage, ...messages],
                stream: true,
            }),
            signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('No response body for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6); // Remove 'data: ' prefix

                    if (data === '[DONE]') {
                        continue; // Stream finished
                    }

                    try {
                        const parsed = JSON.parse(data);

                        // Extract content
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            onChunk(content);
                        }

                        // Extract model name if present
                        if (parsed.model && !detectedModel) {
                            detectedModel = parsed.model;
                        }

                        // Extract timing stats from final chunk
                        if (parsed.timings) {
                            stats = {
                                tokens: parsed.timings.predicted_n,
                                timeMs: parsed.timings.predicted_ms,
                                tokensPerSec: parsed.timings.predicted_per_second,
                                model: detectedModel
                            };
                        }
                    } catch (e) {
                        // Skip malformed JSON
                        console.warn('Failed to parse SSE data:', data);
                    }
                }
            }
        }

        return stats;

    } catch (error) {
        console.error('API Client Error:', error);
        throw error;
    }
}
