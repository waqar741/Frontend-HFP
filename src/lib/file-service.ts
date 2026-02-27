
export interface UploadResponse {
    paths: string[];
    [key: string]: any;
}

export const FileService = {
    async uploadFiles(files: File[]): Promise<string[]> {
        if (files.length === 0) return [];

        const formData = new FormData();
        let useAgent = 'false';
        files.forEach((file) => {
            formData.append('files', file);
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                useAgent = 'true';
            }
        });

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'X-Use-Agent': useAgent,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data: UploadResponse = await response.json();
        // Assuming the backend returns { paths: [...] } or { file_paths: [...] }
        // Adjust based on actual backend response. Prioritizing 'paths' or 'file_paths'.
        return data.paths || data.file_paths || (data.file_path ? [data.file_path] : []) || [];
    }
};
