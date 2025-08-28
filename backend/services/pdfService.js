const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');

async function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getTemplatePath() {
  const provided = process.env.INVOICE_TEMPLATE_PATH;
  if (provided && fs.existsSync(provided)) return provided;
  // fallback to a relative template path if user copies it into repo later
  const fallback = path.join(__dirname, '..', 'templates', 'invoice-template.pdf');
  return fallback;
}

function getTemplateConfig() {
  const configPath = path.join(__dirname, '..', 'config', 'invoiceTemplateConfig.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    // default positions (rough). User can calibrate via config/invoiceTemplateConfig.json
    return {
      page: 0,
      fields: {
        invoiceNumber: { x: 430, y: 740, size: 12 },
        issueDate: { x: 430, y: 720, size: 12 },
        dueDate: { x: 430, y: 700, size: 12 },
        clientName: { x: 60, y: 700, size: 12 },
        clientEmail: { x: 60, y: 682, size: 12 },
        projectName: { x: 60, y: 664, size: 12 },
        total: { x: 470, y: 120, size: 14 },
        notes: { x: 60, y: 600, size: 10 }
      }
    };
  }
}

async function generateInvoicePdf(invoiceData, destRelativePath) {
  const templatePath = getTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Invoice template not found at ${templatePath}. Set INVOICE_TEMPLATE_PATH or copy a template to templates/invoice-template.pdf`);
  }

  const bytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const cfg = getTemplateConfig();
  const page = pdfDoc.getPage(cfg.page || 0);

  const draw = (text, pos) => {
    if (!pos) return;
    page.drawText(String(text ?? ''), {
      x: pos.x,
      y: pos.y,
      size: pos.size || 12,
      font
    });
  };

  draw(invoiceData.invoiceNumber, cfg.fields.invoiceNumber);
  draw(invoiceData.issueDate, cfg.fields.issueDate);
  draw(invoiceData.dueDate, cfg.fields.dueDate);
  draw(invoiceData.clientName, cfg.fields.clientName);
  draw(invoiceData.clientEmail, cfg.fields.clientEmail);
  draw(invoiceData.projectName, cfg.fields.projectName);
  draw((invoiceData.total ?? 0).toFixed(2), cfg.fields.total);
  draw(invoiceData.notes || '', cfg.fields.notes);

  const outDir = path.join(__dirname, '..', 'uploads', 'invoices');
  await ensureDir(outDir);
  const destFullPath = path.join(outDir, destRelativePath);
  await ensureDir(path.dirname(destFullPath));

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(destFullPath, pdfBytes);

  // return relative path for storage
  const relativePath = path.join('uploads', 'invoices', destRelativePath);
  return { relativePath, fullPath: destFullPath };
}

module.exports = { generateInvoicePdf };
