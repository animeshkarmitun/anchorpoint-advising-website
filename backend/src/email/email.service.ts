import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendTransactionalEmailDto } from './dto';
import { EmailTemplates } from './templates/email-templates';

/**
 * Brevo API response for sendTransacEmail
 */
interface BrevoSendResponse {
  messageId: string;
}

/**
 * Brevo API error response
 */
interface BrevoErrorResponse {
  code: string;
  message: string;
}

/**
 * Internal sender configuration
 */
interface SenderConfig {
  name: string;
  email: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  private readonly BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
  private apiKey: string;
  private defaultSender: SenderConfig;
  private isEnabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.apiKey = this.config.get<string>('BREVO_API_KEY', '');
    this.defaultSender = {
      name: this.config.get<string>(
        'EMAIL_SENDER_NAME',
        'Anchor Point Advising',
      ),
      email: this.config.get<string>(
        'EMAIL_SENDER_EMAIL',
        'contact@anchorpointadvising.com',
      ),
    };

    if (this.apiKey) {
      this.isEnabled = true;
      this.logger.log('✅ Brevo email service initialized');
    } else {
      this.logger.warn(
        '⚠️  BREVO_API_KEY not set — email sending is DISABLED. Emails will be logged to console.',
      );
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Core: Send via Brevo API
  // ═══════════════════════════════════════════════════════

  /**
   * Send a transactional email via the Brevo API.
   * Falls back to console logging if BREVO_API_KEY is not configured.
   */
  async sendTransactionalEmail(dto: SendTransactionalEmailDto): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Build the Brevo API payload
    const payload: Record<string, any> = {
      sender: {
        name: this.defaultSender.name,
        email: this.defaultSender.email,
      },
      to: dto.to,
      subject: dto.subject,
    };

    // Content: htmlContent OR textContent OR templateId (mutually exclusive)
    if (dto.templateId) {
      payload.templateId = dto.templateId;
    } else if (dto.htmlContent) {
      payload.htmlContent = dto.htmlContent;
    } else if (dto.textContent) {
      payload.textContent = dto.textContent;
    }

    if (dto.params) payload.params = dto.params;
    if (dto.cc) payload.cc = dto.cc;
    if (dto.bcc) payload.bcc = dto.bcc;
    if (dto.replyTo) payload.replyTo = dto.replyTo;
    if (dto.attachment) payload.attachment = dto.attachment;
    if (dto.tags) payload.tags = dto.tags;

    // ─── Dev mode: log instead of sending ──────────────
    if (!this.isEnabled) {
      this.logger.debug(
        `📧 [DEV] Email would be sent:\n` +
          `   To: ${dto.to.map((r) => r.email).join(', ')}\n` +
          `   Subject: ${dto.subject}\n` +
          `   Template: ${dto.templateId || 'inline'}\n` +
          `   Tags: ${dto.tags?.join(', ') || 'none'}`,
      );
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    // ─── Production: call Brevo API ────────────────────
    try {
      const response = await fetch(this.BREVO_API_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => ({}))) as BrevoErrorResponse;
        this.logger.error(
          `Brevo API error [${response.status}]: ${errorBody.message || response.statusText}`,
          { to: dto.to.map((r) => r.email), subject: dto.subject },
        );
        return {
          success: false,
          error: errorBody.message || `HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as BrevoSendResponse;
      this.logger.log(
        `📧 Email sent: ${dto.to.map((r) => r.email).join(', ')} | Subject: "${dto.subject}" | MessageId: ${data.messageId}`,
      );
      return { success: true, messageId: data.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Convenience Methods (use branded templates)
  // ═══════════════════════════════════════════════════════

  /**
   * Send email verification link
   */
  async sendEmailVerification(
    to: { email: string; name: string },
    verificationUrl: string,
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: 'Verify Your Email — Anchor Point Advising',
      htmlContent: EmailTemplates.emailVerification({
        name: to.name,
        verificationUrl,
      }),
      tags: ['verification'],
    });
  }

  /**
   * Send password reset link
   */
  async sendPasswordReset(
    to: { email: string; name: string },
    resetUrl: string,
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: 'Reset Your Password — Anchor Point Advising',
      htmlContent: EmailTemplates.passwordReset({
        name: to.name,
        resetUrl,
      }),
      tags: ['password-reset'],
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChanged(to: { email: string; name: string }) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: 'Password Changed — Anchor Point Advising',
      htmlContent: EmailTemplates.passwordChanged({ name: to.name }),
      tags: ['password-changed'],
    });
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(
    to: { email: string; name: string },
    dashboardUrl: string,
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: 'Welcome to Anchor Point Advising! 🎉',
      htmlContent: EmailTemplates.welcome({
        name: to.name,
        dashboardUrl,
      }),
      tags: ['welcome'],
    });
  }

  /**
   * Send filing status update notification
   */
  async sendFilingStatusUpdate(
    to: { email: string; name: string },
    data: {
      assessmentYear: string;
      oldStatus: string;
      newStatus: string;
      dashboardUrl: string;
      note?: string;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `Filing Update: ${data.newStatus.replace(/_/g, ' ')} — ${data.assessmentYear}`,
      htmlContent: EmailTemplates.filingStatusUpdate({
        name: to.name,
        ...data,
      }),
      tags: ['filing-update'],
    });
  }

  /**
   * Send document status update notification
   */
  async sendDocumentStatusUpdate(
    to: { email: string; name: string },
    data: {
      documentCategory: string;
      status: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REUPLOAD';
      reason?: string;
      dashboardUrl: string;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `Document ${data.status === 'ACCEPTED' ? 'Approved' : data.status === 'REJECTED' ? 'Rejected' : 'Needs Re-upload'} — ${data.documentCategory}`,
      htmlContent: EmailTemplates.documentStatusUpdate({
        name: to.name,
        ...data,
      }),
      tags: ['document-update'],
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    to: { email: string; name: string },
    data: {
      serviceName: string;
      amount: string;
      paymentMethod: string;
      invoiceNumber: string;
      invoiceUrl: string;
      date: string;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `Payment Confirmed — ${data.invoiceNumber}`,
      htmlContent: EmailTemplates.paymentConfirmation({
        name: to.name,
        ...data,
      }),
      tags: ['payment'],
    });
  }

  /**
   * Send consultation confirmation
   */
  async sendConsultationConfirmation(
    to: { email: string; name: string },
    data: {
      advisorName: string;
      date: string;
      time: string;
      medium: string;
      meetingLink?: string;
      dashboardUrl: string;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `Consultation Booked — ${data.date} at ${data.time}`,
      htmlContent: EmailTemplates.consultationConfirmation({
        name: to.name,
        ...data,
      }),
      tags: ['consultation'],
    });
  }

  /**
   * Send consultation reminder
   */
  async sendConsultationReminder(
    to: { email: string; name: string },
    data: {
      advisorName: string;
      date: string;
      time: string;
      medium: string;
      meetingLink?: string;
      hoursUntil: number;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `Reminder: Consultation in ${data.hoursUntil}h — ${data.date}`,
      htmlContent: EmailTemplates.consultationReminder({
        name: to.name,
        ...data,
      }),
      tags: ['consultation-reminder'],
    });
  }

  /**
   * Send deadline reminder
   */
  async sendDeadlineReminder(
    to: { email: string; name: string },
    data: {
      assessmentYear: string;
      deadline: string;
      daysRemaining: number;
      dashboardUrl: string;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `⚠ ${data.daysRemaining} Days Left — Tax Filing Deadline`,
      htmlContent: EmailTemplates.deadlineReminder({
        name: to.name,
        ...data,
      }),
      tags: ['deadline-reminder'],
    });
  }

  /**
   * Send refund status notification
   */
  async sendRefundProcessed(
    to: { email: string; name: string },
    data: {
      amount: string;
      paymentMethod: string;
      status: 'APPROVED' | 'REJECTED';
      reason?: string;
    },
  ) {
    return this.sendTransactionalEmail({
      to: [to],
      subject: `Refund ${data.status === 'APPROVED' ? 'Processed' : 'Update'} — BDT ${data.amount}`,
      htmlContent: EmailTemplates.refundProcessed({
        name: to.name,
        ...data,
      }),
      tags: ['refund'],
    });
  }

  /**
   * Send a generic email with custom content
   */
  async sendGenericEmail(
    to: { email: string; name?: string }[],
    subject: string,
    data: {
      title: string;
      body: string;
      ctaText?: string;
      ctaUrl?: string;
    },
    tags?: string[],
  ) {
    return this.sendTransactionalEmail({
      to,
      subject,
      htmlContent: EmailTemplates.generic(data),
      tags: tags || ['generic'],
    });
  }
}
