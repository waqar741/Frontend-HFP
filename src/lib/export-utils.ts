import { ChatSession } from '@/types/chat';
import jsPDF from 'jspdf';

// ─── Anonymization Helper ─────────────────────────────────────────────────────

export function anonymizeText(text: string): string {
    let result = text;
    // Basic regex for Names (e.g., John Doe - very crude, mostly looking for common honorifics + Caps)
    result = result.replace(/\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME REDACTED]');
    result = result.replace(/\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+\b/g, '[NAME REDACTED]');
    // Phone numbers (various formats)
    result = result.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE REDACTED]');
    // Emails
    result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, '[EMAIL REDACTED]');
    // SSN / ID formats (XXX-XX-XXXX)
    result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ID REDACTED]');
    // Dates (MM/DD/YYYY, YYYY-MM-DD)
    result = result.replace(/\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/g, '[DATE REDACTED]');

    // Explicit patient markers
    result = result.replace(/\b(?:Patient Name|Patient|Name):\s*([A-Za-z\s]+)\b/gi, 'Patient: [REDACTED]');

    return result;
}

// ─── Shared Formatters ────────────────────────────────────────────────────────

// ─── TXT Export ───────────────────────────────────────────────────────────────

export function exportChatToText(session: ChatSession, isAnonymized: boolean = false) {
    if (!session) return;
    exportAllChatsToText([session], isAnonymized); // Delegate single to all
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportChatToPDF(session: ChatSession, isAnonymized: boolean = false) {
    if (!session) return;
    exportAllChatsToPDF([session], isAnonymized); // Delegate single to all
}

// ─── Export ALL Chats ─────────────────────────────────────────────────────────

export function exportAllChatsToText(sessions: ChatSession[], isAnonymized: boolean = false) {
    if (!sessions || sessions.length === 0) return;

    const filename = `HFP-All-Records-${new Date().toISOString().split('T')[0]}.txt`;
    const dividerThick = '═'.repeat(60);
    const dividerThin = '─'.repeat(60);

    let content = '';
    content += `${dividerThick}\n`;
    content += `  HEALTH FIRST PRIORITY — ALL CONFIDENTIAL PATIENT RECORDS\n`;
    content += `${dividerThick}\n\n`;
    content += `  Total Sessions: ${sessions.length}\n`;
    content += `  Generated On  : ${new Date().toLocaleString('en-US')}\n\n`;

    sessions.forEach((session, index) => {
        const sessionDate = new Date(session.timestamp);
        const dateStr = sessionDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const timeStr = sessionDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
        });

        content += `${dividerThick}\n`;
        content += `  SESSION ${index + 1} OF ${sessions.length}\n`;
        content += `${dividerThick}\n`;
        content += `  Title  : ${session.title}\n`;
        content += `  Date   : ${dateStr} at ${timeStr}\n`;
        content += `  ID     : ${session.id}\n\n`;

        session.messages.forEach((msg) => {
            const role = msg.role === 'user' ? '👤 CLINICIAN / USER' : '🤖 HFP AI ASSISTANT';
            const msgTime = new Date(msg.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });

            content += `  ${role}  [${msgTime}]\n`;
            content += `${dividerThin}\n`;

            const rawContent = isAnonymized ? anonymizeText(msg.content) : msg.content;
            const lines = rawContent.split('\n');
            lines.forEach((line) => {
                content += `  ${line}\n`;
            });

            content += `\n`;
        });
        content += `\n`;
    });

    content += `${dividerThick}\n`;
    content += `  END OF ALL RECORDS\n`;
    content += `  HealthFirstPriority Secure Workspace\n`;
    content += `${dividerThick}\n`;

    triggerDownload(content, filename, 'text/plain');
}

export function exportAllChatsToPDF(sessions: ChatSession[], isAnonymized: boolean = false) {
    if (!sessions || sessions.length === 0) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    type RGB = [number, number, number];
    const PRIMARY: RGB = [16, 185, 129];
    const DARK: RGB = [30, 41, 59];
    const MUTED: RGB = [100, 116, 139];
    const USER_BG: RGB = [240, 253, 244];
    const AI_BG: RGB = [239, 246, 255];
    const USER_ACCENT: RGB = [22, 163, 74];
    const AI_ACCENT: RGB = [37, 99, 235];

    const filename = `HFP-All-Records-${new Date().toISOString().split('T')[0]}.pdf`;
    let pageNum = 1;

    const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(
            `HealthFirstPriority — Confidential`,
            margin, pageHeight - 10
        );
        doc.text(
            `Page ${pageNum}  •  Generated ${new Date().toLocaleDateString('en-US')}`,
            pageWidth - margin, pageHeight - 10, { align: 'right' }
        );
        doc.setDrawColor(...MUTED);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
        pageNum++;
    };

    const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - 20) {
            addFooter();
            doc.addPage();
            y = margin;
        }
    };

    const drawHeader = (sessionTitle: string = "All Confidential Records") => {
        doc.setFillColor(...PRIMARY);
        doc.rect(0, 0, pageWidth, 4, 'F');

        y = 18;
        doc.setFontSize(20);
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'bold');
        doc.text('Health', margin, y);
        const healthWidth = doc.getTextWidth('Health');
        doc.setTextColor(...PRIMARY);
        doc.text('FirstPriority', margin + healthWidth, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.setFont('helvetica', 'normal');
        doc.text(sessionTitle.toUpperCase(), margin, y);
        y += 10;

        doc.setDrawColor(...PRIMARY);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
    };

    sessions.forEach((session, idx) => {
        if (idx > 0) {
            addFooter();
            doc.addPage();
            y = margin;
            drawHeader(`Session ${idx + 1} of ${sessions.length}`);
        } else {
            drawHeader(`All Confidential Records`);
            doc.setFontSize(12);
            doc.setTextColor(...DARK);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Sessions: ${sessions.length}`, margin, y);
            y += 15;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...PRIMARY);
            doc.text(`Session ${idx + 1} of ${sessions.length}: ${session.title}`, margin, y);
            y += 10;
        }

        if (idx > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...PRIMARY);
            doc.text(`Session ${idx + 1} of ${sessions.length}: ${session.title}`, margin, y);
            y += 10;
        }

        const sessionDate = new Date(session.timestamp);
        const dateStr = sessionDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const timeStr = sessionDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
        });

        const metaItems = [
            ['Date', `${dateStr}  •  ${timeStr}`],
            ['Session ID', session.id],
        ];

        doc.setFontSize(9);
        metaItems.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...DARK);
            doc.text(`${label}:`, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...MUTED);
            const labelWidth = doc.getTextWidth(`${label}:  `);
            const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth);
            doc.text(valueLines, margin + labelWidth, y);
            y += valueLines.length * 4.5 + 2;
        });

        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        session.messages.forEach((msg) => {
            const isUser = msg.role === 'user';
            const roleLabel = isUser ? 'Clinician / User' : 'HFP AI Assistant';
            const accentColor = isUser ? USER_ACCENT : AI_ACCENT;
            const bgColor = isUser ? USER_BG : AI_BG;
            const msgTime = new Date(msg.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
            });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            const rawContent = isAnonymized ? anonymizeText(msg.content) : msg.content;
            const wrappedLines = doc.splitTextToSize(rawContent, contentWidth - 10);
            const blockHeight = 12 + wrappedLines.length * 4 + 6;

            ensureSpace(blockHeight);

            doc.setFillColor(...bgColor);
            doc.roundedRect(margin, y - 2, contentWidth, blockHeight, 2, 2, 'F');
            doc.setFillColor(...accentColor);
            doc.rect(margin, y - 2, 1.5, blockHeight, 'F');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...accentColor);
            doc.text(roleLabel, margin + 6, y + 4);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...MUTED);
            doc.text(msgTime, pageWidth - margin - 5, y + 4, { align: 'right' });

            y += 10;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...DARK);

            wrappedLines.forEach((line: string) => {
                ensureSpace(5);
                doc.text(line, margin + 6, y);
                y += 4;
            });

            y += 6;
        });
    });

    addFooter();
    doc.save(filename);
}

// ─── Markdown Export ──────────────────────────────────────────────────────────

export function exportAllChatsToMarkdown(sessions: ChatSession[], isAnonymized: boolean = false) {
    if (!sessions || sessions.length === 0) return;

    const filename = `HFP-Records-${new Date().toISOString().split('T')[0]}.md`;
    let content = `# HealthFirstPriority — Patient Records\n\n`;
    content += `**Total Sessions:** ${sessions.length}\n`;
    content += `**Generated On:** ${new Date().toLocaleString('en-US')}\n`;
    if (isAnonymized) content += `**Status:** Anonymized (PII Redacted)\n\n`;
    else content += `**Status:** Unredacted (Contains PII)\n\n`;

    content += `---\n\n`;

    sessions.forEach((session, index) => {
        const sessionDate = new Date(session.timestamp);
        const dateStr = sessionDate.toLocaleString('en-US');

        content += `## Session ${index + 1}: ${session.title}\n`;
        content += `- **Date/Time:** ${dateStr}\n`;
        content += `- **Session ID:** \`${session.id}\`\n\n`;
        content += `### Conversation Log\n\n`;

        session.messages.forEach((msg) => {
            const isUser = msg.role === 'user';
            const roleLabel = isUser ? '👤 **Clinician / User**' : '🤖 **HFP AI Assistant**';
            const msgTime = new Date(msg.timestamp).toLocaleTimeString('en-US');

            const rawContent = isAnonymized ? anonymizeText(msg.content) : msg.content;

            content += `${roleLabel}  *(${msgTime})*\n\n`;
            if (!isUser) {
                // Formatting AI response as a blockquote or simple text
                content += `${rawContent}\n\n`;
            } else {
                // User text
                content += `> ${rawContent.replace(/\n/g, '\n> ')}\n\n`;
            }
        });
        content += `---\n\n`;
    });

    triggerDownload(content, filename, 'text/markdown');
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportAllChatsToCSV(sessions: ChatSession[], isAnonymized: boolean = false) {
    if (!sessions || sessions.length === 0) return;

    const filename = `HFP-Records-${new Date().toISOString().split('T')[0]}.csv`;

    // CSV Header
    let content = `Session ID,Session Title,Message Timestamp,Role,Message Content\n`;

    const escapeCSV = (str: string) => {
        // Escape quotes by doubling them, and wrap in quotes if there are commas, newlines, or quotes
        if (/[,\n"]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    sessions.forEach((session) => {
        const sessionId = escapeCSV(session.id);
        const sessionTitle = escapeCSV(session.title);

        session.messages.forEach((msg) => {
            const timestamp = escapeCSV(new Date(msg.timestamp).toISOString());
            const role = escapeCSV(msg.role);
            const rawContent = isAnonymized ? anonymizeText(msg.content) : msg.content;
            const messageContent = escapeCSV(rawContent);

            content += `${sessionId},${sessionTitle},${timestamp},${role},${messageContent}\n`;
        });
    });

    triggerDownload(content, filename, 'text/csv');
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export function exportAllChatsToJSON(sessions: ChatSession[], isAnonymized: boolean = false) {
    if (!sessions || sessions.length === 0) return;

    const filename = `HFP-Records-${new Date().toISOString().split('T')[0]}.json`;

    // Clone sessions to avoid mutating original state if we need to anonymize
    let exportData = sessions;

    if (isAnonymized) {
        exportData = sessions.map(session => ({
            ...session,
            messages: session.messages.map(msg => ({
                ...msg,
                content: anonymizeText(msg.content)
            }))
        }));
    }

    const content = JSON.stringify(exportData, null, 2);
    triggerDownload(content, filename, 'application/json');
}

// ─── Shared Download Helper ──────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
