/**
 * Anchor Point Advising — Branded Email Templates
 *
 * All transactional emails share a consistent branded layout
 * with the company logo, colors, and footer.
 */

// ─── Brand Constants ───────────────────────────────────────

const BRAND = {
  name: 'Anchor Point Advising',
  tagline: 'Your trusted tax advisory partner',
  primaryColor: '#1A365D', // Deep navy
  accentColor: '#2B6CB0', // Bright blue
  successColor: '#38A169', // Green
  warningColor: '#D69E2E', // Amber
  dangerColor: '#E53E3E', // Red
  textColor: '#2D3748',
  mutedColor: '#718096',
  bgColor: '#F7FAFC',
  cardBg: '#FFFFFF',
  borderColor: '#E2E8F0',
  fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

// ─── Base Layout ───────────────────────────────────────────

function baseLayout(content: string, preheaderText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${BRAND.name}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND.bgColor}; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; display: block; }
    .wrapper { width: 100%; table-layout: fixed; background-color: ${BRAND.bgColor}; padding: 40px 0; }
    .main { max-width: 600px; margin: 0 auto; background-color: ${BRAND.cardBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, ${BRAND.primaryColor} 0%, ${BRAND.accentColor} 100%); padding: 32px 40px; text-align: center; }
    .header h1 { color: #FFFFFF; font-family: ${BRAND.fontFamily}; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-family: ${BRAND.fontFamily}; font-size: 13px; margin: 8px 0 0; }
    .content { padding: 40px; font-family: ${BRAND.fontFamily}; font-size: 15px; line-height: 1.7; color: ${BRAND.textColor}; }
    .content h2 { font-size: 20px; color: ${BRAND.primaryColor}; margin: 0 0 16px; font-weight: 600; }
    .content p { margin: 0 0 16px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, ${BRAND.primaryColor} 0%, ${BRAND.accentColor} 100%); color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: ${BRAND.fontFamily}; }
    .btn:hover { opacity: 0.9; }
    .footer { padding: 24px 40px; background-color: ${BRAND.bgColor}; text-align: center; border-top: 1px solid ${BRAND.borderColor}; }
    .footer p { font-family: ${BRAND.fontFamily}; font-size: 12px; color: ${BRAND.mutedColor}; margin: 0 0 8px; line-height: 1.6; }
    .footer a { color: ${BRAND.accentColor}; text-decoration: none; }
    .info-box { background-color: #EBF8FF; border-left: 4px solid ${BRAND.accentColor}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .info-box p { margin: 0; font-size: 14px; color: ${BRAND.primaryColor}; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: ${BRAND.fontFamily}; }
    .status-success { background-color: #F0FFF4; color: ${BRAND.successColor}; }
    .status-warning { background-color: #FFFFF0; color: ${BRAND.warningColor}; }
    .status-danger { background-color: #FFF5F5; color: ${BRAND.dangerColor}; }
    .status-info { background-color: #EBF8FF; color: ${BRAND.accentColor}; }
    .divider { height: 1px; background-color: ${BRAND.borderColor}; margin: 24px 0; }
    @media only screen and (max-width: 620px) {
      .wrapper { padding: 16px 0; }
      .content { padding: 24px 20px; }
      .header { padding: 24px 20px; }
      .footer { padding: 20px; }
    }
  </style>
</head>
<body>
  ${preheaderText ? `<div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheaderText}</div>` : ''}
  <div class="wrapper">
    <table class="main" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          <h1>⚓ ${BRAND.name}</h1>
          <p>${BRAND.tagline}</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
          <p>
            Have questions? <a href="mailto:support@anchorpointadvising.com">Contact our support team</a>
          </p>
          <p style="margin-top: 12px;">
            <a href="{{unsubscribe_url}}" style="color: ${BRAND.mutedColor}; font-size: 11px;">Unsubscribe from these emails</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

// ─── Template Helpers ──────────────────────────────────────

function ctaButton(text: string, url: string): string {
  return `<div style="text-align: center; margin: 28px 0;">
    <a href="${url}" class="btn">${text}</a>
  </div>`;
}

function statusBadge(
  status: string,
  variant: 'success' | 'warning' | 'danger' | 'info' = 'info',
): string {
  return `<span class="status-badge status-${variant}">${status}</span>`;
}

function infoBox(text: string): string {
  return `<div class="info-box"><p>${text}</p></div>`;
}

function divider(): string {
  return '<div class="divider"></div>';
}

// ─── Email Templates ──────────────────────────────────────

export const EmailTemplates = {
  // ── Email Verification ─────────────────────────────────
  emailVerification(data: { name: string; verificationUrl: string }): string {
    return baseLayout(
      `
      <h2>Verify Your Email Address</h2>
      <p>Hi ${data.name},</p>
      <p>Welcome to Anchor Point Advising! To get started with your tax filing journey, please verify your email address by clicking the button below.</p>
      ${ctaButton('Verify Email Address', data.verificationUrl)}
      ${infoBox("This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.")}
      <p>Thanks,<br><strong>The Anchor Point Team</strong></p>
    `,
      'Verify your email to get started with Anchor Point Advising',
    );
  },

  // ── Password Reset ─────────────────────────────────────
  passwordReset(data: { name: string; resetUrl: string }): string {
    return baseLayout(
      `
      <h2>Reset Your Password</h2>
      <p>Hi ${data.name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password for your account.</p>
      ${ctaButton('Reset Password', data.resetUrl)}
      ${infoBox("This link will expire in 1 hour and can only be used once. If you didn't request a password reset, please ignore this email or contact support.")}
      <p>Stay secure,<br><strong>The Anchor Point Team</strong></p>
    `,
      'Reset your Anchor Point Advising password',
    );
  },

  // ── Password Changed Confirmation ──────────────────────
  passwordChanged(data: { name: string }): string {
    return baseLayout(
      `
      <h2>Password Changed Successfully</h2>
      <p>Hi ${data.name},</p>
      <p>Your password has been successfully changed. All other active sessions have been logged out for your security.</p>
      ${infoBox('If you did not make this change, please contact our support team immediately.')}
      <p>Stay safe,<br><strong>The Anchor Point Team</strong></p>
    `,
      'Your password was changed',
    );
  },

  // ── Filing Status Update ───────────────────────────────
  filingStatusUpdate(data: {
    name: string;
    assessmentYear: string;
    oldStatus: string;
    newStatus: string;
    dashboardUrl: string;
    note?: string;
  }): string {
    const variant =
      data.newStatus === 'COMPLETED'
        ? 'success'
        : data.newStatus === 'ON_HOLD'
          ? 'warning'
          : 'info';
    return baseLayout(
      `
      <h2>Filing Status Update</h2>
      <p>Hi ${data.name},</p>
      <p>Your tax filing for assessment year <strong>${data.assessmentYear}</strong> has been updated:</p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #F7FAFC; border-radius: 8px; margin: 16px 0;">
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor};">Previous Status</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${statusBadge(data.oldStatus.replace(/_/g, ' '), 'info')}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">New Status</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right; border-top: 1px solid ${BRAND.borderColor};">${statusBadge(data.newStatus.replace(/_/g, ' '), variant)}</td>
        </tr>
      </table>
      ${data.note ? infoBox(data.note) : ''}
      ${ctaButton('View Filing Details', data.dashboardUrl)}
      <p>Best regards,<br><strong>The Anchor Point Team</strong></p>
    `,
      `Your filing status changed to ${data.newStatus.replace(/_/g, ' ')}`,
    );
  },

  // ── Document Status Update ─────────────────────────────
  documentStatusUpdate(data: {
    name: string;
    documentCategory: string;
    status: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REUPLOAD';
    reason?: string;
    dashboardUrl: string;
  }): string {
    const variant =
      data.status === 'ACCEPTED'
        ? 'success'
        : data.status === 'REJECTED'
          ? 'danger'
          : 'warning';

    const statusLabel =
      data.status === 'NEEDS_REUPLOAD' ? 'Needs Re-upload' : data.status;

    return baseLayout(
      `
      <h2>Document Review Update</h2>
      <p>Hi ${data.name},</p>
      <p>Your <strong>${data.documentCategory}</strong> document has been reviewed:</p>
      <div style="text-align: center; margin: 24px 0;">
        ${statusBadge(statusLabel, variant)}
      </div>
      ${data.reason ? infoBox(`<strong>Reviewer Note:</strong> ${data.reason}`) : ''}
      ${data.status !== 'ACCEPTED' ? ctaButton('Upload Updated Document', data.dashboardUrl) : ctaButton('View Documents', data.dashboardUrl)}
      <p>Best regards,<br><strong>The Anchor Point Team</strong></p>
    `,
      `Your ${data.documentCategory} document was ${statusLabel.toLowerCase()}`,
    );
  },

  // ── Payment Confirmation ───────────────────────────────
  paymentConfirmation(data: {
    name: string;
    serviceName: string;
    amount: string;
    paymentMethod: string;
    invoiceNumber: string;
    invoiceUrl: string;
    date: string;
  }): string {
    return baseLayout(
      `
      <h2>Payment Confirmed ✓</h2>
      <p>Hi ${data.name},</p>
      <p>Thank you! Your payment has been successfully processed.</p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #F7FAFC; border-radius: 8px; margin: 16px 0;">
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor};">Service</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right; font-weight: 600;">${data.serviceName}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Amount</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right; font-weight: 600; color: ${BRAND.successColor};">BDT ${data.amount}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Payment Method</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Invoice #</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Date</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.date}</td>
        </tr>
      </table>
      ${ctaButton('Download Invoice', data.invoiceUrl)}
      <p>Best regards,<br><strong>The Anchor Point Team</strong></p>
    `,
      `Payment of BDT ${data.amount} confirmed — Invoice ${data.invoiceNumber}`,
    );
  },

  // ── Consultation Confirmation ──────────────────────────
  consultationConfirmation(data: {
    name: string;
    advisorName: string;
    date: string;
    time: string;
    medium: string;
    meetingLink?: string;
    dashboardUrl: string;
  }): string {
    return baseLayout(
      `
      <h2>Consultation Booked ✓</h2>
      <p>Hi ${data.name},</p>
      <p>Your consultation has been successfully scheduled!</p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #F7FAFC; border-radius: 8px; margin: 16px 0;">
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor};">Advisor</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right; font-weight: 600;">${data.advisorName}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Date</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.date}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Time</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.time}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Medium</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${statusBadge(data.medium, 'info')}</td>
        </tr>
      </table>
      ${data.meetingLink ? infoBox(`<strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: ${BRAND.accentColor};">${data.meetingLink}</a>`) : ''}
      ${ctaButton('View Consultation', data.dashboardUrl)}
      <p>Best regards,<br><strong>The Anchor Point Team</strong></p>
    `,
      `Consultation booked for ${data.date} at ${data.time}`,
    );
  },

  // ── Consultation Reminder ──────────────────────────────
  consultationReminder(data: {
    name: string;
    advisorName: string;
    date: string;
    time: string;
    medium: string;
    meetingLink?: string;
    hoursUntil: number;
  }): string {
    return baseLayout(
      `
      <h2>Consultation Reminder ⏰</h2>
      <p>Hi ${data.name},</p>
      <p>This is a friendly reminder that your consultation is coming up in <strong>${data.hoursUntil} hour${data.hoursUntil > 1 ? 's' : ''}</strong>.</p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #F7FAFC; border-radius: 8px; margin: 16px 0;">
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor};">Advisor</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.advisorName}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Date & Time</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.date} at ${data.time}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Medium</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.medium}</td>
        </tr>
      </table>
      ${data.meetingLink ? infoBox(`<strong>Join here:</strong> <a href="${data.meetingLink}" style="color: ${BRAND.accentColor};">${data.meetingLink}</a>`) : ''}
      <p>See you soon!<br><strong>The Anchor Point Team</strong></p>
    `,
      `Reminder: Your consultation is in ${data.hoursUntil} hour(s)`,
    );
  },

  // ── Deadline Reminder ──────────────────────────────────
  deadlineReminder(data: {
    name: string;
    assessmentYear: string;
    deadline: string;
    daysRemaining: number;
    dashboardUrl: string;
  }): string {
    const urgency =
      data.daysRemaining <= 3
        ? 'danger'
        : data.daysRemaining <= 7
          ? 'warning'
          : 'info';
    return baseLayout(
      `
      <h2>Filing Deadline Approaching</h2>
      <p>Hi ${data.name},</p>
      <p>Your tax filing for assessment year <strong>${data.assessmentYear}</strong> has a deadline approaching:</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; padding: 20px 32px; background-color: #F7FAFC; border-radius: 12px; border: 2px solid ${BRAND.borderColor};">
          <div style="font-family: ${BRAND.fontFamily}; font-size: 36px; font-weight: 700; color: ${data.daysRemaining <= 3 ? BRAND.dangerColor : data.daysRemaining <= 7 ? BRAND.warningColor : BRAND.primaryColor};">${data.daysRemaining}</div>
          <div style="font-family: ${BRAND.fontFamily}; font-size: 13px; color: ${BRAND.mutedColor}; text-transform: uppercase; letter-spacing: 1px;">Days Remaining</div>
        </div>
      </div>
      ${infoBox(`<strong>Deadline:</strong> ${data.deadline}`)}
      ${ctaButton('Complete Your Filing', data.dashboardUrl)}
      <p>Don't miss the deadline!<br><strong>The Anchor Point Team</strong></p>
    `,
      `⚠ ${data.daysRemaining} days left for your ${data.assessmentYear} tax filing`,
    );
  },

  // ── Welcome Email ──────────────────────────────────────
  welcome(data: { name: string; dashboardUrl: string }): string {
    return baseLayout(
      `
      <h2>Welcome to Anchor Point Advising! 🎉</h2>
      <p>Hi ${data.name},</p>
      <p>Thank you for joining Anchor Point Advising. We're excited to help you with your tax filing needs.</p>
      <p>Here's what you can do next:</p>
      <ul style="list-style: none; padding: 0; margin: 16px 0;">
        <li style="padding: 8px 0; font-size: 15px;">✅ Complete your profile with your TIN and NID</li>
        <li style="padding: 8px 0; font-size: 15px;">📄 Upload your documents for the current tax year</li>
        <li style="padding: 8px 0; font-size: 15px;">📞 Book a consultation with our tax advisors</li>
        <li style="padding: 8px 0; font-size: 15px;">💡 Explore our services and guides</li>
      </ul>
      ${ctaButton('Go to Dashboard', data.dashboardUrl)}
      <p>If you have any questions, our support team is always here to help.</p>
      <p>Welcome aboard!<br><strong>The Anchor Point Team</strong></p>
    `,
      "Welcome to Anchor Point Advising — Let's get started!",
    );
  },

  // ── Refund Processed ───────────────────────────────────
  refundProcessed(data: {
    name: string;
    amount: string;
    paymentMethod: string;
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
  }): string {
    const isApproved = data.status === 'APPROVED';
    return baseLayout(
      `
      <h2>Refund ${isApproved ? 'Processed' : 'Request Update'}</h2>
      <p>Hi ${data.name},</p>
      <p>Your refund request has been ${isApproved ? 'approved and processed' : 'reviewed'}.</p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #F7FAFC; border-radius: 8px; margin: 16px 0;">
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor};">Status</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${statusBadge(data.status, isApproved ? 'success' : 'danger')}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Amount</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right; font-weight: 600;">BDT ${data.amount}</td>
        </tr>
        <tr>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; color: ${BRAND.mutedColor}; border-top: 1px solid ${BRAND.borderColor};">Refund To</td>
          <td style="font-family: ${BRAND.fontFamily}; font-size: 14px; text-align: right;">${data.paymentMethod}</td>
        </tr>
      </table>
      ${data.reason ? infoBox(`<strong>Note:</strong> ${data.reason}`) : ''}
      ${isApproved ? '<p>The refund will be reflected in your account within 5-7 business days.</p>' : ''}
      <p>Best regards,<br><strong>The Anchor Point Team</strong></p>
    `,
      `Refund ${data.status.toLowerCase()} — BDT ${data.amount}`,
    );
  },

  // ── Generic / Custom Email ─────────────────────────────
  generic(data: {
    title: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
  }): string {
    return baseLayout(`
      <h2>${data.title}</h2>
      ${data.body}
      ${data.ctaText && data.ctaUrl ? ctaButton(data.ctaText, data.ctaUrl) : ''}
      <p>Best regards,<br><strong>The Anchor Point Team</strong></p>
    `);
  },
};
