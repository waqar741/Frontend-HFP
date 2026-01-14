export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function sendChatMessage(
    messages: Message[],
    targetNode: string | null,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
): Promise<{ tokens?: number; timeMs?: number; tokensPerSec?: number; model?: string } | undefined> {
    let stats: { tokens?: number; timeMs?: number; tokensPerSec?: number; model?: string } | undefined;
    let detectedModel: string | undefined;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                targetNode
            }),
            signal, // Pass abort signal
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
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
