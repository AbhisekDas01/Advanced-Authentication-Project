import nodemailer from 'nodemailer';
import { EMAIL_FROM, EMAIL_PASSWORD, EMAIL_USER } from '../configs/env.config.js';

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
});

export const sendVerificationEmail = async ({ to, name, verificationLink }) => {
    const mailOptions = {
        from: EMAIL_FROM,
        to: to,
        subject: 'Verify Your Email Address',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Auth App!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${name},</h2>
                        <p>Thank you for signing up! Please verify your email address to activate your account.</p>
                        <p>Click the button below to verify your email:</p>
                        <a href="${verificationLink}" class="button">Verify Email</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
                        <p><strong>This link will expire in 24 hours.</strong></p>
                        <p>If you didn't create this account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 Auth App. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent to:', to);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};