import { ChatSession } from '@/types/chat';
import jsPDF from 'jspdf';

// ─── TXT Export ───────────────────────────────────────────────────────────────

export function exportChatToText(session: ChatSession) {
    if (!session) return;

    const sessionDate = new Date(session.timestamp);
    const dateStr = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = sessionDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
    });
    const filename = `HFP-Record-${new Date().toISOString().split('T')[0]}.txt`;

    const dividerThick = '═'.repeat(60);
    const dividerThin = '─'.repeat(60);

    let content = '';
    content += `${dividerThick}\n`;
    content += `  HEALTH FIRST PRIORITY — CONFIDENTIAL PATIENT RECORD\n`;
    content += `${dividerThick}\n\n`;
    content += `  Session  : ${session.title}\n`;
    content += `  Date     : ${dateStr}\n`;
    content += `  Time     : ${timeStr}\n`;
    content += `  ID       : ${session.id}\n\n`;
    content += `${dividerThick}\n`;
    content += `  CONVERSATION LOG\n`;
    content += `${dividerThick}\n\n`;

    session.messages.forEach((msg) => {
        const role = msg.role === 'user' ? '👤 CLINICIAN / USER' : '🤖 HFP AI ASSISTANT';
        const msgTime = new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });

        content += `  ${role}  [${msgTime}]\n`;
        content += `${dividerThin}\n`;

        // Indent message body
        const lines = msg.content.split('\n');
        lines.forEach((line) => {
            content += `  ${line}\n`;
        });

        content += `\n`;
    });

    content += `${dividerThick}\n`;
    content += `  END OF RECORD\n`;
    content += `  Generated: ${new Date().toLocaleString('en-US')}\n`;
    content += `  HealthFirstPriority Secure Workspace\n`;
    content += `${dividerThick}\n`;

    triggerDownload(content, filename, 'text/plain');
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportChatToPDF(session: ChatSession) {
    if (!session) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    type RGB = [number, number, number];
    const PRIMARY: RGB = [16, 185, 129];        // emerald-500
    const DARK: RGB = [30, 41, 59];              // slate-800
    const MUTED: RGB = [100, 116, 139];          // slate-500
    const USER_BG: RGB = [240, 253, 244];        // green-50
    const AI_BG: RGB = [239, 246, 255];          // blue-50
    const USER_ACCENT: RGB = [22, 163, 74];      // green-600
    const AI_ACCENT: RGB = [37, 99, 235];        // blue-600

    const sessionDate = new Date(session.timestamp);
    const dateStr = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = sessionDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
    });
    const filename = `HFP-Record-${new Date().toISOString().split('T')[0]}.pdf`;

    // ── Helper: add footer to current page ──
    const addFooter = () => {
        const pageNum = doc.getNumberOfPages();
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
        // thin line above footer
        doc.setDrawColor(...MUTED);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    };

    // ── Helper: ensure space or add new page ──
    const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - 20) {
            addFooter();
            doc.addPage();
            y = margin;
        }
    };

    // ── Header ──
    // Green accent bar
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
    doc.text('CONFIDENTIAL PATIENT RECORD', margin, y);
    y += 10;

    // Divider
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── Session Metadata ──
    const metaItems = [
        ['Session', session.title],
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
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── Conversation Heading ──
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Conversation Log', margin, y);
    y += 8;

    // ── Messages ──
    session.messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        const roleLabel = isUser ? 'Clinician / User' : 'HFP AI Assistant';
        const accentColor = isUser ? USER_ACCENT : AI_ACCENT;
        const bgColor = isUser ? USER_BG : AI_BG;
        const msgTime = new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
        });

        // Pre-calculate wrapped text
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const wrappedLines = doc.splitTextToSize(msg.content, contentWidth - 10);
        const blockHeight = 12 + wrappedLines.length * 4 + 6;

        ensureSpace(blockHeight);

        // Background card
        doc.setFillColor(...bgColor);
        doc.roundedRect(margin, y - 2, contentWidth, blockHeight, 2, 2, 'F');

        // Left accent bar
        doc.setFillColor(...accentColor);
        doc.rect(margin, y - 2, 1.5, blockHeight, 'F');

        // Role label
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor);
        doc.text(roleLabel, margin + 6, y + 4);

        // Timestamp
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MUTED);
        doc.text(msgTime, pageWidth - margin - 5, y + 4, { align: 'right' });

        // Message content
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

    // ── Final footer ──
    addFooter();

    doc.save(filename);
}

// ─── Export ALL Chats ─────────────────────────────────────────────────────────

export function exportAllChatsToText(sessions: ChatSession[]) {
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

            const lines = msg.content.split('\n');
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

export function exportAllChatsToPDF(sessions: ChatSession[]) {
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
            const wrappedLines = doc.splitTextToSize(msg.content, contentWidth - 10);
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
