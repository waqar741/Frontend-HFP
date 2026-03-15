/**
 * A safe wrapper for localStorage that doesn't throw SecurityError
 * when cookies are blocked or in strict privacy modes.
 */
export const safeStorage = {
    getItem: (key: string): string | null => {
        try {
            if (typeof window !== 'undefined') {
                return window.localStorage.getItem(key);
            }
        } catch (error) {
            console.warn('localStorage is not available', error);
        }
        return null;
    },

    setItem: (key: string, value: string): void => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value);
            }
        } catch (error) {
            console.warn('localStorage is not available', error);
        }
    },

    removeItem: (key: string): void => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
        } catch (error) {
            console.warn('localStorage is not available', error);
        }
    },

    clear: (): void => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.clear();
            }
        } catch (error) {
            console.warn('localStorage is not available', error);
        }
    }
};
