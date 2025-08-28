const path = require('path');
const sequelize = require('../config/database');
const { Project, Client, Invoice, InvoiceRevision } = require('../models');
const InvoiceCounter = require('../models/InvoiceCounter');
const { generateInvoicePdf } = require('./pdfService');

function formatDateISO(date) {
  // yyyy-mm-dd
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function nextInvoiceNumber(t) {
  const year = new Date().getFullYear();
  // Upsert counter row and increment atomically
  let counter = await InvoiceCounter.findByPk(year, { transaction: t, lock: t.LOCK.UPDATE });
  if (!counter) {
    counter = await InvoiceCounter.create({ year, lastSeq: 0, updatedAt: new Date() }, { transaction: t });
  }
  const next = counter.lastSeq + 1;
  counter.lastSeq = next;
  counter.updatedAt = new Date();
  await counter.save({ transaction: t });
  const number = `INV-${year}-${String(next).padStart(4, '0')}`;
  return number;
}

async function generateOrRegenerateInvoice(projectId, actingUser) {
  return await sequelize.transaction(async (t) => {
    const project = await Project.findByPk(projectId, { transaction: t });
    if (!project) throw new Error('Project not found');

    const client = project.clientId ? await Client.findByPk(project.clientId, { transaction: t }) : null;

    // Find existing invoice if any
    let invoice = await Invoice.findOne({ where: { projectId }, transaction: t, lock: t.LOCK.UPDATE });

    const today = new Date();
    const issueDate = formatDateISO(today);
    const dueDate = formatDateISO(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));

    if (!invoice) {
      const invoiceNumber = await nextInvoiceNumber(t);
      invoice = await Invoice.create({
        projectId,
        invoiceNumber,
        version: 1,
        status: 'generated',
        issueDate,
        dueDate,
        subtotal: 0,
        total: 0,
        currency: project.currency || 'USD',
        notes: null,
        createdByUserId: actingUser?.id || null
      }, { transaction: t });
    } else {
      // Regenerate: bump version, reset status to generated, clear approval
      invoice.version = (invoice.version || 1) + 1;
      invoice.status = 'generated';
      invoice.issueDate = issueDate;
      invoice.dueDate = dueDate;
      invoice.approvedByUserId = null;
      invoice.sentByUserId = null;
      invoice.sentAt = null;
      await invoice.save({ transaction: t });
    }

    // Build PDF file name: {projectId}-{invoiceNumber}-v{version}.pdf
    const fileName = `${projectId}-${invoice.invoiceNumber}-v${invoice.version}.pdf`;

    const { relativePath, fullPath } = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      clientName: client?.clientName || client?.companyName || `Client ${client?.id || ''}`,
      clientEmail: client?.email || '',
      projectName: project.projectName || project.projectCode,
      total: 0,
      notes: invoice.notes || ''
    }, fileName);

    // Save pdf path on invoice
    invoice.pdfPath = relativePath;
    await invoice.save({ transaction: t });

    // Save revision record
    await InvoiceRevision.create({
      invoiceId: invoice.id,
      version: invoice.version,
      pdfPath: relativePath,
      createdByUserId: actingUser?.id || null
    }, { transaction: t });

    return { invoice, project, client, pdfFullPath: fullPath };
  });
}

module.exports = { generateOrRegenerateInvoice };
