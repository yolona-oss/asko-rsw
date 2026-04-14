import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { join } from 'path';

export interface CertificatePdfData {
    certificateNumber: string;
    deviceName: string;
    deviceBrand: string;
    deviceModel: string;
    deviceDescription: string;
    issuedAt: string;
    expiresAt: string;
    durationMonths: number;
    status: string;
    statusLabel: string;
    isActive: boolean;
    deviceImage?: Buffer;
}

const FONT_DIR = join(__dirname, '..', 'assets', 'fonts');
const FONT_REGULAR = join(FONT_DIR, 'DejaVuSans.ttf');
const FONT_BOLD = join(FONT_DIR, 'DejaVuSans-Bold.ttf');

@Injectable()
export class CertificatePdfService {
    async generate(data: CertificatePdfData): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Uint8Array[] = [];

            doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.registerFont('Regular', FONT_REGULAR);
            doc.registerFont('Bold', FONT_BOLD);

            const pageWidth = doc.page.width - 100; // minus margins
            const imageWidth = 180;
            const imageHeight = 180;
            const hasImage = !!data.deviceImage;
            const textWidth = hasImage ? pageWidth - imageWidth - 20 : pageWidth;

            // ── Header ──
            doc.font('Bold').fontSize(18).fillColor('#EB001C')
                .text('ASKO', 50, 50, { continued: true })
                .fillColor('#111111')
                .text(' — Сертификат расширенной гарантии', { continued: false });

            doc.moveDown(0.3);
            doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
            doc.moveDown(1);

            // ── Device image (positioned at top-right of content area) ──
            const contentStartY = doc.y;
            let imageBottomY = contentStartY;

            if (hasImage) {
                try {
                    doc.image(data.deviceImage!, 50 + textWidth + 20, contentStartY, {
                        fit: [imageWidth, imageHeight],
                        align: 'center',
                        valign: 'center',
                    });
                    imageBottomY = contentStartY + imageHeight;
                } catch {
                    // Skip image on error (unsupported format, etc.)
                }
            }

            // ── Title: Device Name + Brand Model ──
            const brandModel = [data.deviceBrand, data.deviceModel].filter(Boolean).join(' ');

            doc.font('Regular').fontSize(22).fillColor('#111111');
            if (brandModel) {
                doc.text(data.deviceName + ' ', 50, contentStartY, {
                    width: textWidth,
                    continued: true,
                });
                doc.font('Bold').text(brandModel, { continued: false });
            } else {
                doc.text(data.deviceName, 50, contentStartY, { width: textWidth });
            }

            doc.moveDown(0.5);

            // ── Device description ──
            if (data.deviceDescription) {
                doc.font('Regular').fontSize(10).fillColor('#979797')
                    .text(data.deviceDescription, 50, doc.y, { width: textWidth });
            }

            doc.moveDown(1.5);

            // ── Certificate details ──
            this.detailRow(doc, 'Номер сертификата', data.certificateNumber, textWidth);
            doc.moveDown(0.3);
            this.detailRow(doc, 'Дата активации', data.issuedAt, textWidth);
            doc.moveDown(0.3);
            this.detailRow(doc, 'Срок действия', `${data.durationMonths} месяцев`, textWidth);

            doc.moveDown(1);

            // Ensure we're below the image before drawing the divider
            if (doc.y < imageBottomY + 10) {
                doc.y = imageBottomY + 10;
            }

            // ── Divider ──
            doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
            doc.moveDown(0.8);

            // ── Status line ──
            const statusColor = data.isActive ? '#108b00' : '#979797';
            doc.font('Regular').fontSize(11).fillColor('#333333')
                .text('Статус: ', 50, doc.y, { continued: true })
                .font('Bold').fillColor(statusColor)
                .text(data.statusLabel, { continued: true })
                .font('Regular').fillColor('#979797')
                .text(`   Действителен до ${data.expiresAt}`, { continued: false });

            doc.moveDown(0.5);

            if (data.isActive) {
                doc.font('Regular').fontSize(11).fillColor('#333333')
                    .text('Расширенная гарантия активна');
            }

            // ── Footer ──
            doc.font('Regular').fontSize(7).fillColor('#999999');
            const footerY = doc.page.height - 60;
            doc.text(
                'Сертификат подтверждает право на обслуживание и ремонт устройства в сервисных центрах ASKO. '
                + 'Документ сгенерирован автоматически и является подтверждением расширенной гарантии.',
                50, footerY, { width: pageWidth, align: 'center' },
            );

            doc.end();
        });
    }

    private detailRow(doc: PDFKit.PDFDocument, label: string, value: string, maxWidth: number): void {
        doc.font('Regular').fontSize(13).fillColor('#333333')
            .text(`${label}: `, 50, doc.y, { width: maxWidth, continued: true })
            .font('Bold')
            .text(value, { continued: false });
    }
}
