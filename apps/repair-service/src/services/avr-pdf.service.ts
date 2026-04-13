import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { join } from 'path';

export interface AvrData {
    requestId: string;
    documentDate: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    repairerName: string;
    deviceName: string;
    deviceBrand: string;
    deviceModel: string;
    serialNumber: string;
    description: string;
    workSteps: { title: string; description?: string; status: string }[];
    totalCost: number;
    completionNote?: string;
    certificateNumber?: string;
    address?: string;
}

const FONT_DIR = join(__dirname, '..', 'assets', 'fonts');
const FONT_REGULAR = join(FONT_DIR, 'DejaVuSans.ttf');
const FONT_BOLD = join(FONT_DIR, 'DejaVuSans-Bold.ttf');

const STATUS_LABEL: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В процессе',
    completed: 'Выполнен',
    skipped: 'Пропущен',
    declined: 'Отклонён',
};

@Injectable()
export class AvrPdfService {
    async generate(data: AvrData): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Uint8Array[] = [];

            doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.registerFont('Regular', FONT_REGULAR);
            doc.registerFont('Bold', FONT_BOLD);

            const shortId = data.requestId.slice(0, 8).toUpperCase();
            const pageWidth = doc.page.width - 100; // minus margins

            // ── Header ──
            doc.font('Bold').fontSize(18).fillColor('#EB001C')
                .text('ASKO', 50, 50, { continued: true })
                .fillColor('#111111')
                .text(' — Ремонтный сервис', { continued: false });

            doc.fontSize(8).font('Regular').fillColor('#666666')
                .text('ООО «АСКО-Сервис» · ИНН 0000000000 · ОГРН 0000000000000', 50, 75);

            doc.moveDown(1.5);

            // ── Title ──
            doc.font('Bold').fontSize(14).fillColor('#111111')
                .text(`АКТ ВЫПОЛНЕННЫХ РАБОТ №${shortId}`, { align: 'center' });
            doc.font('Regular').fontSize(10).fillColor('#666666')
                .text(`от ${data.documentDate}`, { align: 'center' });

            doc.moveDown(1.5);

            // ── Section: Заказчик ──
            this.sectionHeader(doc, 'Заказчик');
            this.fieldRow(doc, 'ФИО', data.userName);
            if (data.userPhone) this.fieldRow(doc, 'Телефон', data.userPhone);
            if (data.userEmail) this.fieldRow(doc, 'Email', data.userEmail);
            if (data.address) this.fieldRow(doc, 'Адрес', data.address);

            doc.moveDown(0.8);

            // ── Section: Устройство ──
            this.sectionHeader(doc, 'Устройство');
            this.fieldRow(doc, 'Название', data.deviceName);
            if (data.deviceBrand) this.fieldRow(doc, 'Бренд', data.deviceBrand);
            if (data.deviceModel) this.fieldRow(doc, 'Модель', data.deviceModel);
            if (data.serialNumber) this.fieldRow(doc, 'Серийный №', data.serialNumber);

            doc.moveDown(0.8);

            // ── Section: Описание проблемы ──
            this.sectionHeader(doc, 'Описание проблемы');
            doc.font('Regular').fontSize(9).fillColor('#333333')
                .text(data.description, { width: pageWidth });

            doc.moveDown(0.8);

            // ── Section: Выполненные работы ──
            this.sectionHeader(doc, 'Выполненные работы');

            const activeSteps = data.workSteps.filter(s => s.status !== 'declined');
            if (activeSteps.length > 0) {
                // Table header
                const colStep = 30;
                const colStatus = 80;
                const colTitle = pageWidth - colStep - colStatus;
                const tableX = 50;

                doc.font('Bold').fontSize(8).fillColor('#666666');
                doc.text('№', tableX, doc.y, { width: colStep });
                doc.text('Наименование', tableX + colStep, doc.y - doc.currentLineHeight(), { width: colTitle });
                doc.text('Статус', tableX + colStep + colTitle, doc.y - doc.currentLineHeight(), { width: colStatus, align: 'right' });

                doc.moveDown(0.3);
                doc.moveTo(tableX, doc.y).lineTo(tableX + pageWidth, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
                doc.moveDown(0.3);

                activeSteps.forEach((step, i) => {
                    doc.font('Regular').fontSize(9).fillColor('#333333');
                    const y = doc.y;
                    doc.text(`${i + 1}`, tableX, y, { width: colStep });
                    doc.text(step.title, tableX + colStep, y, { width: colTitle });
                    doc.font('Regular').fontSize(8).fillColor('#666666');
                    doc.text(STATUS_LABEL[step.status] ?? step.status, tableX + colStep + colTitle, y, { width: colStatus, align: 'right' });
                    doc.moveDown(0.2);
                });
            }

            doc.moveDown(0.8);

            // ── Completion note ──
            if (data.completionNote) {
                this.sectionHeader(doc, 'Заключение');
                doc.font('Regular').fontSize(9).fillColor('#333333')
                    .text(data.completionNote, { width: pageWidth });
                doc.moveDown(0.8);
            }

            // ── Section: Итого ──
            doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#111111').lineWidth(1).stroke();
            doc.moveDown(0.5);
            doc.font('Bold').fontSize(12).fillColor('#111111')
                .text(`Итого: ${data.totalCost.toLocaleString('ru-RU')} ₽`, { align: 'right' });

            if (data.certificateNumber) {
                doc.moveDown(0.3);
                doc.font('Regular').fontSize(8).fillColor('#666666')
                    .text(`Сертификат: ${data.certificateNumber}`, { align: 'right' });
            }

            doc.moveDown(2);

            // ── Section: Подписи ──
            this.sectionHeader(doc, 'Подписи сторон');
            doc.moveDown(0.5);

            const signY = doc.y;
            const halfWidth = pageWidth / 2 - 20;

            // Left: Исполнитель
            doc.font('Bold').fontSize(9).fillColor('#111111')
                .text('Исполнитель:', 50, signY, { width: halfWidth });
            doc.moveDown(0.3);
            doc.font('Regular').fontSize(9).fillColor('#333333')
                .text(data.repairerName, 50, doc.y, { width: halfWidth });
            doc.moveDown(1.5);
            doc.moveTo(50, doc.y).lineTo(50 + halfWidth, doc.y).strokeColor('#AAAAAA').lineWidth(0.5).stroke();
            doc.moveDown(0.2);
            doc.font('Regular').fontSize(7).fillColor('#999999')
                .text('(подпись)', 50, doc.y, { width: halfWidth, align: 'center' });

            // Right: Заказчик
            const rightX = 50 + halfWidth + 40;
            doc.font('Bold').fontSize(9).fillColor('#111111')
                .text('Заказчик:', rightX, signY, { width: halfWidth });
            doc.font('Regular').fontSize(9).fillColor('#333333')
                .text(data.userName, rightX, signY + 15, { width: halfWidth });
            doc.moveTo(rightX, signY + 55).lineTo(rightX + halfWidth, signY + 55).strokeColor('#AAAAAA').lineWidth(0.5).stroke();
            doc.font('Regular').fontSize(7).fillColor('#999999')
                .text('(подпись)', rightX, signY + 58, { width: halfWidth, align: 'center' });

            // ── Footer ──
            doc.font('Regular').fontSize(7).fillColor('#999999');
            const footerY = doc.page.height - 60;
            doc.text(
                'Настоящий акт составлен в двух экземплярах, по одному для каждой стороны. '
                + 'Подписывая данный акт, Заказчик подтверждает, что работы выполнены в полном объёме и претензий не имеет.',
                50, footerY, { width: pageWidth, align: 'center' },
            );

            doc.end();
        });
    }

    private sectionHeader(doc: PDFKit.PDFDocument, title: string): void {
        doc.font('Bold').fontSize(10).fillColor('#111111').text(title);
        doc.moveDown(0.3);
    }

    private fieldRow(doc: PDFKit.PDFDocument, label: string, value: string): void {
        doc.font('Regular').fontSize(9).fillColor('#666666')
            .text(`${label}: `, { continued: true })
            .fillColor('#333333')
            .text(value);
    }
}
