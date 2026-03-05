/**
 * text-preprocessor.ts
 * Compresses document text for efficient LLM context window usage.
 *
 * Techniques applied:
 *   1. Stopword removal (medical-context-aware — keeps medical terms)
 *   2. Whitespace normalization (collapse multiple spaces/newlines)
 *   3. PDF boilerplate removal (page numbers, headers, footers)
 *   4. Redundant punctuation cleanup
 *   5. Simple relevance scoring for chunk selection
 */

/** Common English stopwords to remove — excludes medical-relevant words like "not", "no", "without" */
const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'because', 'until', 'while', 'about', 'against',
    'also', 'am', 'are', 'be', 'been', 'being', 'could', 'did', 'do',
    'does', 'doing', 'done', 'had', 'has', 'have', 'having', 'he', 'her',
    'hers', 'herself', 'him', 'himself', 'his', 'i', 'if', 'it', 'its',
    'itself', 'me', 'mine', 'my', 'myself', 'our', 'ours', 'ourselves',
    'she', 'should', 'that', 'their', 'theirs', 'them', 'themselves',
    'these', 'they', 'this', 'those', 'up', 'we', 'were', 'what',
    'which', 'who', 'whom', 'will', 'would', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'was', 'is', 'can',
]);

/**
 * Words we NEVER remove even if they look like stopwords.
 * Critical for medical context.
 */
const MEDICAL_KEEP_WORDS = new Set([
    'not', 'no', 'nor', 'none', 'never', 'neither', 'without',
    'positive', 'negative', 'absent', 'present',
    'left', 'right', 'upper', 'lower',
    'before', 'after', // important in medical history
]);

/** PDF boilerplate patterns to strip */
const BOILERPLATE_PATTERNS = [
    /page\s+\d+\s*(of\s+\d+)?/gi,                    // "Page 1 of 5"
    /^\s*\d+\s*$/gm,                                   // standalone page numbers
    /confidential\s*page\s*\d+/gi,                     // "Confidential Page 1"
    /generated\s+\d{1,2}\/\d{1,2}\/\d{4}/gi,          // "Generated 3/3/2026"
    /—\s*confidential/gi,                              // "— Confidential"
    /all\s+rights\s+reserved/gi,
    /©\s*\d{4}/g,
    /healthfirstpriority/gi,                            // app-specific branding repeated in PDFs
];

/** Remove stopwords from text while keeping medical-critical words */
export function removeStopwords(text: string): string {
    return text.split(/\s+/).filter(word => {
        const lower = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!lower) return true; // keep numbers, special chars
        if (MEDICAL_KEEP_WORDS.has(lower)) return true;
        return !STOPWORDS.has(lower);
    }).join(' ');
}

/** Normalize whitespace: collapse multiple spaces/newlines */
export function normalizeWhitespace(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')    // max 2 newlines
        .replace(/[ \t]{2,}/g, ' ')     // collapse spaces
        .replace(/\n /g, '\n')          // trim leading spaces after newline
        .trim();
}

/** Remove PDF boilerplate text */
export function removeBoilerplate(text: string): string {
    let cleaned = text;
    for (const pattern of BOILERPLATE_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }
    return cleaned;
}

/** Remove redundant punctuation */
export function cleanPunctuation(text: string): string {
    return text
        .replace(/\.{2,}/g, '.')       // "...." → "."
        .replace(/\s+\./g, '.')        // " ." → "."
        .replace(/,{2,}/g, ',')        // ",," → ","
        .replace(/\s+,/g, ',')        // " ," → ","
        .replace(/•\s*/g, '- ')        // bullet → dash (shorter)
        .replace(/\s*[-–—]\s*[-–—]\s*/g, ' — '); // clean up dashes
}

/**
 * Full preprocessing pipeline: clean text for minimal token usage.
 * Typically reduces text by 30-50%.
 */
export function preprocessForContext(text: string): string {
    let result = text;
    result = removeBoilerplate(result);
    result = cleanPunctuation(result);
    result = removeStopwords(result);
    result = normalizeWhitespace(result);
    return result;
}

/**
 * Score a chunk's relevance to a user query.
 * Uses simple keyword overlap (TF-like scoring).
 * Returns 0-1 where 1 = highly relevant.
 */
export function scoreChunkRelevance(chunkText: string, query: string): number {
    // Extract meaningful words from query (remove @mentions and stopwords)
    const queryWords = query
        .replace(/@[\w-]+/g, '')  // remove @mentions
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w));

    if (queryWords.length === 0) return 0.5; // no specific query, medium relevance

    const chunkLower = chunkText.toLowerCase();
    let matchCount = 0;
    for (const word of queryWords) {
        if (chunkLower.includes(word)) matchCount++;
    }

    return matchCount / queryWords.length;
}

/**
 * Select and rank chunks by relevance, then preprocess them.
 * Returns compressed, relevant context string.
 */
export function buildOptimizedContext(
    chunks: { text: string; index: number }[],
    query: string,
    wordBudget = 2000
): string {
    // Score each chunk
    const scored = chunks.map(chunk => ({
        ...chunk,
        score: scoreChunkRelevance(chunk.text, query),
    }));

    // Sort by relevance (highest first), but keep original order for tied scores
    scored.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        return a.index - b.index; // maintain document order for similar scores
    });

    // Take chunks up to word budget, preprocessing each
    const parts: string[] = [];
    let wordCount = 0;

    for (const chunk of scored) {
        if (chunk.score < 0.1 && parts.length > 0) break; // skip irrelevant chunks

        const processed = preprocessForContext(chunk.text);
        const words = processed.split(/\s+/).length;

        if (wordCount + words > wordBudget && parts.length > 0) break;
        parts.push(processed);
        wordCount += words;
    }

    return parts.join('\n\n');
}
