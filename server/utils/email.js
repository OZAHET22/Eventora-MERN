
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Check if SMTP credentials are provided
 * Supports both EMAIL_PASS and EMAIL_PASSWORD
 */
const hasEmailCredentials = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    return !!(user && pass && user.trim() !== '' && pass.trim() !== '' && user !== '@gmail.com');
};

const getTransporter = () => {
    if (!hasEmailCredentials()) return null;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
        }
    });
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    if (!hasEmailCredentials()) {
        console.log(`\n======================================================`);
        console.log(`📧 [EMAIL SIMULATION] Booking Confirmation`);
        console.log(`To:      ${userEmail} (${userName})`);
        console.log(`Event:   ${eventTitle}`);
        console.log(`Status:  Confirmed`);
        console.log(`Note:    Configure EMAIL_USER and EMAIL_PASS to send real emails.`);
        console.log(`======================================================\n`);
        return true;
    }

    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle} | Eventora`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #111;">Hi ${userName}!</h2>
                    <p style="color: #444; font-size: 16px;">Your booking for <strong>${eventTitle}</strong> is successfully confirmed.</p>
                    <p style="color: #666; font-size: 14px;">Thank you for using Eventora. Please show your confirmed booking in your dashboard upon arrival.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">Eventora &copy; 2026</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending booking email:', error.message);
        return false;
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    const isVerification = type === 'account_verification';
    const title = isVerification ? 'Verify your Eventora Account' : 'Eventora Booking Verification';
    const actionText = isVerification ? 'verify your new account' : 'confirm your event booking';

    if (!hasEmailCredentials()) {
        console.log(`\n======================================================`);
        console.log(`🔐 [EMAIL SIMULATION] OTP Generation`);
        console.log(`To:      ${userEmail}`);
        console.log(`Type:    ${type}`);
        console.log(`OTP:     >>> ${otp} <<<`);
        console.log(`Expires: 5 minutes`);
        console.log(`Note:    Configure EMAIL_USER and EMAIL_PASS to send real emails.`);
        console.log(`======================================================\n`);
        return true;
    }

    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `${title} - [${otp}]`,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #111827; margin-bottom: 8px;">${title}</h2>
                    <p style="color: #4b5563; font-size: 15px;">Use the verification code below to ${actionText}:</p>
                    <div style="margin: 24px auto; padding: 16px 24px; font-size: 32px; font-weight: 800; background: #f3f4f6; width: max-content; letter-spacing: 8px; border-radius: 8px; color: #111827;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 13px;">This code is valid for <strong>5 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email successfully sent to ${userEmail} [${type}]`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending OTP email to ${userEmail}:`, error.message);
        console.log(`⚠️ [FALLBACK LOG] Generated OTP for ${userEmail}: ${otp}`);
        return false;
    }
};

module.exports = { sendBookingEmail, sendOTPEmail };
