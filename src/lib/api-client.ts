export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function sendChatMessage(messages: Message[], targetNode: string | null, onChunk: (chunk: string) => void) {
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

            const chunk = decoder.decode(value, { stream: true });

            // Handle potentially multiple JSON objects in one chunk
            // NOTE: The proxy returns a raw stream from the backend.
            // If the backend returns SSE or raw text, we simply pass it through.
            // Assuming the backend returns the raw text content of the LLM stream directly for now.
            // If it returns OpenAI-style SSE, we would need to parse "data: {...}" lines.

            // For this specific backend proxy implementation (which returns response.body directly),
            // let's assume we just need to append the chunks if it's raw text, 
            // OR if it's SSE, we need to parse.

            // HFP Backend Standard: 
            // Returns raw text chunks or standard SSE?
            // "Return streaming response (new Response(backendResponse.body))"
            // Let's forward the raw chunks first. 
            // IF invalid, we can refine parsing.

            onChunk(chunk);
        }

    } catch (error) {
        console.error('API Client Error:', error);
        throw error;
    }
}
