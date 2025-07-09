import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.setupTransporter();
  }

  setupTransporter() {
    // Gmail SMTP configuration
    this.config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || '',
      },
    };

    if (this.config.auth.user && this.config.auth.pass) {
      this.transporter = nodemailer.createTransporter(this.config);
    } else {
      console.warn('Gmail credentials not configured. Email service disabled.');
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Delivery Express" <${this.config?.auth.user}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperação de Senha - Delivery Express</h2>
        
        <p>Olá ${name},</p>
        
        <p>Você solicitou a recuperação de senha para sua conta no Delivery Express.</p>
        
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        
        <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Redefinir Senha
        </a>
        
        <p>Ou copie e cole o link abaixo no seu navegador:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p><strong>Este link é válido por 1 hora.</strong></p>
        
        <p>Se você não solicitou esta recuperação de senha, ignore este email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Este é um email automático do sistema Delivery Express.<br>
          Por favor, não responda este email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Delivery Express',
      html,
    });
  }

  async sendNewPasswordEmail(email: string, tempPassword: string, name: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nova Senha - Delivery Express</h2>
        
        <p>Olá ${name},</p>
        
        <p>Sua senha foi redefinida com sucesso no Delivery Express.</p>
        
        <p>Sua nova senha temporária é:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <code style="font-size: 18px; font-weight: bold; color: #333;">${tempPassword}</code>
        </div>
        
        <p><strong>Por segurança, recomendamos que você altere esta senha assim que fizer login.</strong></p>
        
        <p>Para fazer login:</p>
        <ol>
          <li>Acesse o painel administrativo</li>
          <li>Use seu nome de usuário e esta senha temporária</li>
          <li>Vá em configurações para alterar sua senha</li>
        </ol>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Este é um email automático do sistema Delivery Express.<br>
          Por favor, não responda este email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Nova Senha - Delivery Express',
      html,
    });
  }

  generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}

export const emailService = new EmailService();