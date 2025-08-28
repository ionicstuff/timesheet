const path = require('path');
const fs = require('fs');
const sequelize = require('../config/database');
const { Invoice } = require('../models');
const { generateOrRegenerateInvoice } = require('../services/invoiceService');
const emailService = require('../services/emailService');

// List closed projects ready for invoicing (no existing invoice)
const getReadyProjects = async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT 
        p.id AS project_id,
        p.project_name,
        p.closed_at,
        c.id AS client_id,
        c.client_name,
        c.email AS client_email
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.status = 'completed'
        AND p.closed_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM tasks t
          WHERE t.project_id = p.id AND t.status <> 'completed'
        )
        AND NOT EXISTS (
          SELECT 1 FROM invoices i
          WHERE i.project_id = p.id
        )
      ORDER BY p.closed_at DESC NULLS LAST, p.updated_at DESC
      LIMIT 50
    `);

    return res.json({ data: rows });
  } catch (e) {
    console.error('getReadyProjects error', e);
    return res.status(500).json({ message: 'Failed to load ready projects' });
  }
};

// Create or regenerate invoice (Finance only)
const generateInvoice = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { invoice, project, client, pdfFullPath } = await generateOrRegenerateInvoice(projectId, req.user);

    // Notify finance users in-app (placeholder) and via email
    try {
      await emailService.sendInvoiceGeneratedEmail(invoice, project, client);
    } catch (e) {
      console.warn('sendInvoiceGeneratedEmail failed (non-blocking):', e.message);
    }

    return res.status(201).json({
      message: 'Invoice generated',
      invoice: {
        id: invoice.id,
        projectId: invoice.projectId,
        invoiceNumber: invoice.invoiceNumber,
        version: invoice.version,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        total: Number(invoice.total || 0),
        pdfUrl: `/api/finance/invoices/${invoice.id}/pdf`
      }
    });
  } catch (e) {
    console.error('generateInvoice error', e);
    return res.status(400).json({ message: e.message || 'Failed to generate invoice' });
  }
};

const listInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    const where = [];
    const binds = [];
    if (status) {
      where.push('i.status = $1');
      binds.push(status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await sequelize.query(`
      SELECT i.*, p.project_name, c.client_name
      FROM invoices i
      JOIN projects p ON p.id = i.project_id
      JOIN clients c ON c.id = p.client_id
      ${whereSql}
      ORDER BY i.updated_at DESC
    `, { bind: binds });

    return res.json({ data: rows });
  } catch (e) {
    console.error('listInvoices error', e);
    return res.status(500).json({ message: 'Failed to list invoices' });
  }
};

const getInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice || !invoice.pdfPath) {
      return res.status(404).json({ message: 'Invoice or PDF not found' });
    }
    const pdfPath = path.join(__dirname, '..', invoice.pdfPath);
    if (!fs.existsSync(pdfPath)) return res.status(404).json({ message: 'PDF file missing on disk' });
    return res.sendFile(path.resolve(pdfPath));
  } catch (e) {
    console.error('getInvoicePdf error', e);
    return res.status(500).json({ message: 'Failed to fetch invoice PDF' });
  }
};

const approveInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'sent') return res.status(400).json({ message: 'Cannot approve a sent invoice' });
    invoice.status = 'approved';
    invoice.approvedByUserId = req.user.id;
    await invoice.save();
    return res.json({ message: 'Invoice approved', invoice });
  } catch (e) {
    console.error('approveInvoice error', e);
    return res.status(500).json({ message: 'Failed to approve invoice' });
  }
};

const sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (!invoice.pdfPath) return res.status(400).json({ message: 'Invoice PDF missing. Generate first.' });

    // Load project and client for recipient
    const [rows] = await sequelize.query(`
      SELECT p.project_name, c.client_name, c.email AS client_email
      FROM invoices i
      JOIN projects p ON p.id = i.project_id
      JOIN clients c ON c.id = p.client_id
      WHERE i.id = $1
    `, { bind: [id] });
    if (!rows || !rows[0]) return res.status(404).json({ message: 'Linked project/client not found' });

    const pdfFullPath = path.join(__dirname, '..', invoice.pdfPath);
    await emailService.sendInvoiceToClient(rows[0].client_email, rows[0], pdfFullPath);

    invoice.status = 'sent';
    invoice.sentByUserId = req.user.id;
    invoice.sentAt = new Date();
    await invoice.save();

    return res.json({ message: 'Invoice sent to client', invoice });
  } catch (e) {
    console.error('sendInvoice error', e);
    return res.status(500).json({ message: 'Failed to send invoice' });
  }
};

module.exports = {
  getReadyProjects,
  generateInvoice,
  listInvoices,
  getInvoicePdf,
  approveInvoice,
  sendInvoice
};
