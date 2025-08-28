const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async getFinanceEmails() {
    try {
      const sequelize = require('../config/database');
      const [rows] = await sequelize.query(`
        SELECT u.email
        FROM users u
        JOIN role_masters rm ON u.role_id = rm.id
        WHERE u.is_active = true AND LOWER(rm.role_name) = 'finance'
      `);
      return (rows || []).map(r => r.email).filter(Boolean);
    } catch (e) {
      console.error('Failed to fetch finance emails', e);
      return [];
    }
  }

  async init() {
    // Create transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      // Development - use Ethereal Email for testing
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (error) {
        console.error('Failed to create test email account:', error);
        // Fallback to console logging in development
        this.transporter = {
          sendMail: async (mailOptions) => {
            console.log('📧 Email would be sent:');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('Content:', mailOptions.html || mailOptions.text);
            return { messageId: 'development-mode' };
          }
        };
      }
    }
  }

  async sendPasswordResetEmail(email, firstName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"TimeSheet Pro" <${process.env.EMAIL_FROM || 'noreply@timesheet.com'}>`,
      to: email,
      subject: 'Password Reset Request - TimeSheet Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #273C63 0%, #66697D 100%); color: white; text-align: center; padding: 30px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .btn { display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .btn:hover { background-color: #c82333; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🕒 TimeSheet Pro</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>We received a request to reset the password for your TimeSheet Pro account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>For security reasons, never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
              
              <p>If you have any questions or concerns, please contact our support team.</p>
              
              <p>Best regards,<br>The TimeSheet Pro Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TimeSheet Pro by Evolute Global. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Password reset email sent successfully!');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return info;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
  async sendTaskStatusEmail(task, verb, actorUser) {
    try {
      const { Project, User } = require('../models');
      const project = await Project.findByPk(task.projectId);
      const pm = project?.projectManagerId ? await User.findByPk(project.projectManagerId) : null;
      // Find account managers (simple query: role ACM)
      const sequelize = require('../config/database');
      const [ams] = await sequelize.query(`
        SELECT u.email, u.first_name AS firstName, u.last_name AS lastName
        FROM users u
        LEFT JOIN role_masters rm ON u.role_id = rm.id
        WHERE rm.role_code = 'ACM' AND u.is_active = true
      `);

      const recipients = [];
      if (pm?.email) recipients.push(pm.email);
      for (const am of ams || []) recipients.push(am.email);
      if (!recipients.length) return;

      const subject = `Task ${verb}: ${task.name}`;
      const html = `
        <p>Hello,</p>
        <p>Task <strong>${task.name}</strong> in project <strong>${project?.projectName || task.projectId}</strong> was <strong>${verb}</strong> by ${actorUser?.firstName || 'a user'} ${actorUser?.lastName || ''}.</p>
        <ul>
          <li>Status: ${task.status}</li>
          <li>Total tracked: ${Math.round((task.totalTrackedSeconds||0)/60)} min</li>
        </ul>
        <p>Regards,<br/>TimeSheet Pro</p>
      `;

      await this.transporter.sendMail({
        from: `"TimeSheet Pro" <${process.env.EMAIL_FROM || 'noreply@timesheet.com'}>`,
        to: recipients.join(','),
        subject,
        html
      });
    } catch (err) {
      console.error('Failed to send task status email', err);
    }
  }

  async sendProjectClosedEmail(project, actorUser, reason) {
    try {
      const { User } = require('../models');
      const pm = project?.projectManagerId ? await User.findByPk(project.projectManagerId) : null;
      const teamRecipients = [];
      const sequelize = require('../config/database');
      const [team] = await sequelize.query(`
        SELECT DISTINCT u.email
        FROM tasks t
        JOIN users u ON u.id = t.assigned_to
        WHERE t.project_id = $1
      `, { bind: [project.id] });
      for (const m of team || []) if (m.email) teamRecipients.push(m.email);
      const to = [pm?.email, ...teamRecipients].filter(Boolean).join(',');
      if (!to) return;

      const subject = `Project closed: ${project.projectName}`;
      const html = `
        <p>Hello,</p>
        <p>Project <strong>${project.projectName}</strong> was closed by ${actorUser?.firstName || 'a user'} ${actorUser?.lastName || ''}.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ''}
        <p>Regards,<br/>TimeSheet Pro</p>
      `;
      await this.transporter.sendMail({
        from: `"TimeSheet Pro" <${process.env.EMAIL_FROM || 'noreply@timesheet.com'}>`,
        to,
        subject,
        html
      });
    } catch (err) {
      console.error('Failed to send project closed email', err);
    }
  }

  async sendInvoiceGeneratedEmail(invoice, project, client) {
    try {
      const toList = await this.getFinanceEmails();
      if (!toList.length) return;
      const subject = `Invoice generated: ${invoice.invoiceNumber} for ${project.projectName || project.id}`;
      const html = `
        <p>Hello Finance,</p>
        <p>An invoice has been generated.</p>
        <ul>
          <li>Invoice: <strong>${invoice.invoiceNumber}</strong> (v${invoice.version})</li>
          <li>Project: ${project.projectName || project.id}</li>
          <li>Client: ${client?.clientName || client?.companyName || client?.id || ''}</li>
          <li>Total: 0.00</li>
          <li>Issue Date: ${invoice.issueDate}</li>
          <li>Due Date: ${invoice.dueDate}</li>
        </ul>
        <p>Review in the app and approve/send when ready.</p>
      `;
      await this.transporter.sendMail({
        from: `"TimeSheet Pro" <${process.env.EMAIL_FROM || 'noreply@timesheet.com'}>`,
        to: toList.join(','),
        subject,
        html
      });
    } catch (err) {
      console.error('Failed to send invoice generated email', err);
    }
  }

  async sendInvoiceToClient(toEmail, context, pdfFullPath) {
    try {
      if (!toEmail) return;
      const subject = `Invoice for ${context.project_name || 'your project'}`;
      const html = `
        <p>Hello,</p>
        <p>Please find attached the invoice for project <strong>${context.project_name || ''}</strong>.</p>
        <p>Regards,<br/>TimeSheet Pro</p>
      `;
      await this.transporter.sendMail({
        from: `"TimeSheet Pro" <${process.env.EMAIL_FROM || 'noreply@timesheet.com'}>`,
        to: toEmail,
        subject,
        html,
        attachments: [
          {
            filename: (pdfFullPath.split(/[\\/]/).pop()) || 'invoice.pdf',
            path: pdfFullPath,
            contentType: 'application/pdf'
          }
        ]
      });
    } catch (err) {
      console.error('Failed to send invoice to client', err);
      throw err;
    }
  }
}

module.exports = new EmailService();
