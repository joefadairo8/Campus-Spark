import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const APP_NAME = 'ABC-Rally';

// ─── Resend Client ────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_NAME = APP_NAME;
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@abc-rally.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@abc-rally.com';
const APP_URL = process.env.APP_URL || 'https://abc-rally.com';

// ─── Core Send Helper ────────────────────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not configured — skipping email send.');
        return;
    }
    try {
        const { error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject,
            html,
        });
        if (error) {
            console.error(`[Email] Resend error sending "${subject}" → ${to}:`, error.message);
        } else {
            console.log(`[Email] Sent "${subject}" → ${to}`);
        }
    } catch (err: any) {
        console.error(`[Email] Failed to send "${subject}" → ${to}:`, err.message);
    }
}

function layout(content: string): string {
    return `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:#111111;padding:24px 40px;text-align:center;">
        <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">⚡ ABC-<span style="color:#e53e3e;">Rally</span></span>
      </td></tr>
      <tr><td style="padding:40px;">${content}</td></tr>
      <tr><td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999999;">&copy; ${new Date().getFullYear()} ABC-Rally &middot; 42, Olowu Street, Ikeja, Lagos, Nigeria</p>
        <p style="margin:6px 0 0;font-size:11px;color:#bbbbbb;">You are receiving this because you have an account on ABC-Rally.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(text: string, url: string): string {
    return `<a href="${url}" style="display:inline-block;padding:13px 28px;background:#e53e3e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-top:20px;letter-spacing:0.3px;">${text}</a>`;
}

function tag(text: string, color = '#e53e3e'): string {
    return `<span style="display:inline-block;padding:3px 12px;background:${color}18;color:${color};border-radius:20px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">${text}</span>`;
}

function heading(text: string): string {
    return `<h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#111111;">${text}</h2>`;
}

function para(text: string): string {
    return `<p style="margin:12px 0;font-size:15px;color:#444444;line-height:1.7;">${text}</p>`;
}

function divider(): string {
    return `<hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />`;
}

function infoRow(label: string, value: string): string {
    return `<tr>
      <td style="padding:8px 0;font-size:13px;color:#888888;font-weight:600;width:140px;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#111111;font-weight:700;">${value}</td>
    </tr>`;
}

// ─── Email Templates ─────────────────────────────────────────────────────────

/** Welcome email sent to every new user on registration */
export function sendWelcomeEmail(to: string, name: string, role: string): Promise<void> {
    const roleLabel = role.replace('_', ' ');
    const html = layout(`
        ${tag('Welcome to ABC-Rally! 🎉')}
        <div style="margin-top:16px;">
            ${heading(`Hey ${name}, you're in! 🎉`)}
            ${para(`Welcome to <strong>ABC-Rally</strong> — Nigeria's leading campus marketing platform. Your account has been created successfully as a <strong>${roleLabel}</strong>.`)}
            ${divider()}
            ${para(`Here's what you can do next:`)}
            <ul style="font-size:14px;color:#444;line-height:2;">
                <li>Complete your profile to stand out</li>
                <li>Explore active campaigns and opportunities</li>
                <li>Connect with brands and student organizations</li>
            </ul>
            ${btn('Go to Dashboard', APP_URL)}
        </div>
    `);
    return sendEmail(to, '🎉 Welcome to ABC-Rally!', html);
}

/** Admin alert when a new user registers */
export function sendAdminNewUserAlert(userName: string, userEmail: string, role: string): Promise<void> {
    const html = layout(`
        ${tag('Admin Alert', '#6366f1')}
        <div style="margin-top:16px;">
            ${heading('New User Registered')}
            ${para('A new user has just created an account on ABC-Rally.')}
            ${divider()}
            <table cellpadding="0" cellspacing="0" style="width:100%;">
                ${infoRow('Name', userName)}
                ${infoRow('Email', userEmail)}
                ${infoRow('Role', role)}
                ${infoRow('Registered', new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }))}
            </table>
            ${btn('View in Admin Dashboard', APP_URL)}
        </div>
    `);
    return sendEmail(ADMIN_EMAIL, `[Admin] New ${role} Registered: ${userName}`, html);
}

/** Sent to the recipient when a new proposal arrives */
export function sendProposalReceivedEmail(to: string, recipientName: string, senderName: string, message: string): Promise<void> {
    const preview = message.length > 200 ? message.slice(0, 200) + '…' : message;
    const html = layout(`
        ${tag('New Proposal')}
        <div style="margin-top:16px;">
            ${heading(`You have a new proposal from ${senderName}`)}
            ${para(`<strong>${senderName}</strong> has sent you a partnership proposal on ABC-Rally.`)}
            ${divider()}
            <div style="background:#f9f9f9;border-left:4px solid #e53e3e;padding:16px 20px;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-size:14px;color:#555555;font-style:italic;line-height:1.7;">"${preview}"</p>
            </div>
            ${btn('View & Respond', APP_URL)}
            ${para('Log in to your dashboard to review the full proposal and respond.')}
        </div>
    `);
    return sendEmail(to, `📩 New Proposal from ${senderName}`, html);
}

/** Sent to the sender when the recipient updates the proposal status */
export function sendProposalStatusEmail(to: string, senderName: string, recipientName: string, status: string): Promise<void> {
    const statusMap: Record<string, { label: string; color: string; message: string }> = {
        accepted: { label: 'Accepted ✅', color: '#22c55e', message: 'Great news! Your proposal has been accepted. Log in to proceed with the partnership.' },
        rejected: { label: 'Declined ❌', color: '#ef4444', message: 'Your proposal was not accepted this time. Don\'t be discouraged — keep exploring other opportunities on ABC-Rally.' },
        reviewing: { label: 'Under Review 👀', color: '#f59e0b', message: 'Your proposal is currently under review. We\'ll notify you when there\'s an update.' },
    };
    const s = statusMap[status] || { label: status, color: '#6366f1', message: 'Your proposal status has been updated.' };
    const html = layout(`
        ${tag(s.label, s.color)}
        <div style="margin-top:16px;">
            ${heading(`Proposal Update from ${recipientName}`)}
            ${para(s.message)}
            ${btn('View Proposal', APP_URL)}
        </div>
    `);
    return sendEmail(to, `📋 Proposal ${s.label}: Response from ${recipientName}`, html);
}

/** Sent to a brand when a creator applies to their gig */
export function sendNewApplicationEmail(to: string, brandName: string, creatorName: string, gigTitle: string, pitch: string): Promise<void> {
    const preview = pitch.length > 250 ? pitch.slice(0, 250) + '…' : pitch;
    const html = layout(`
        ${tag('New Application')}
        <div style="margin-top:16px;">
            ${heading(`${creatorName} applied to your campaign`)}
            ${para(`<strong>${creatorName}</strong> has applied to your campaign <strong>"${gigTitle}"</strong>.`)}
            ${divider()}
            <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:1px;">Their Pitch</p>
            <div style="background:#f9f9f9;border-left:4px solid #e53e3e;padding:16px 20px;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-size:14px;color:#555555;font-style:italic;line-height:1.7;">"${preview}"</p>
            </div>
            ${btn('Review Application', APP_URL)}
        </div>
    `);
    return sendEmail(to, `🎯 New Application: ${creatorName} → "${gigTitle}"`, html);
}

/** Sent to the creator when their application is accepted or rejected */
export function sendApplicationDecisionEmail(to: string, creatorName: string, gigTitle: string, brandName: string, status: 'accepted' | 'rejected'): Promise<void> {
    const accepted = status === 'accepted';
    const html = layout(`
        ${tag(accepted ? 'Application Accepted ✅' : 'Application Declined ❌', accepted ? '#22c55e' : '#ef4444')}
        <div style="margin-top:16px;">
            ${heading(accepted ? `Congratulations, ${creatorName}!` : `Update on your application`)}
            ${accepted
                ? para(`Your application for <strong>"${gigTitle}"</strong> by <strong>${brandName}</strong> has been <strong style="color:#22c55e;">accepted</strong>! Log in to your dashboard to get started and review your campaign brief.`)
                : para(`Unfortunately, your application for <strong>"${gigTitle}"</strong> by <strong>${brandName}</strong> was not selected this time. Keep building your portfolio and applying — your next opportunity is just around the corner.`)
            }
            ${btn('Go to Dashboard', APP_URL)}
        </div>
    `);
    return sendEmail(to, accepted ? `✅ You're In! Application Accepted for "${gigTitle}"` : `Application Update for "${gigTitle}"`, html);
}

/** Sent to the brand + admin when a creator submits a campaign report */
export function sendReportSubmittedEmail(to: string, brandName: string, creatorName: string, gigTitle: string): Promise<void> {
    const html = layout(`
        ${tag('Report Submitted', '#f59e0b')}
        <div style="margin-top:16px;">
            ${heading(`${creatorName} submitted a campaign report`)}
            ${para(`<strong>${creatorName}</strong> has submitted their execution report for <strong>"${gigTitle}"</strong>. Please review and approve (or request revisions) in your dashboard.`)}
            ${btn('Review Report', APP_URL)}
        </div>
    `);
    return sendEmail(to, `📊 Report Submitted: "${gigTitle}" by ${creatorName}`, html);
}

/** Sent to the creator when their report is approved */
export function sendReportApprovedEmail(to: string, creatorName: string, gigTitle: string, brandName: string): Promise<void> {
    const html = layout(`
        ${tag('Report Approved ✅', '#22c55e')}
        <div style="margin-top:16px;">
            ${heading(`Your report was approved, ${creatorName}!`)}
            ${para(`<strong>${brandName}</strong> has reviewed and approved your execution report for <strong>"${gigTitle}"</strong>. Your payment will be processed shortly — check your wallet.`)}
            ${btn('Check My Wallet', APP_URL)}
        </div>
    `);
    return sendEmail(to, `✅ Report Approved & Payment Processing for "${gigTitle}"`, html);
}

/** Sent to the creator when their report is rejected/revision requested */
export function sendReportRejectedEmail(to: string, creatorName: string, gigTitle: string, brandName: string): Promise<void> {
    const html = layout(`
        ${tag('Revision Requested', '#f59e0b')}
        <div style="margin-top:16px;">
            ${heading(`Revision needed for "${gigTitle}"`)}
            ${para(`<strong>${brandName}</strong> has reviewed your report for <strong>"${gigTitle}"</strong> and has requested revisions. Please log in to your dashboard, update your submission, and resubmit.`)}
            ${btn('Update Report', APP_URL)}
        </div>
    `);
    return sendEmail(to, `📝 Revision Requested for "${gigTitle}"`, html);
}

/** Sent to admin when a withdrawal is requested (wallet event from frontend) */
export function sendWithdrawalRequestEmail(userEmail: string, userName: string, amount: number, bankDetails: any): Promise<void> {
    const html = layout(`
        ${tag('Withdrawal Request', '#6366f1')}
        <div style="margin-top:16px;">
            ${heading('New Withdrawal Request')}
            ${para('A user has requested a withdrawal. Please process it in the admin panel.')}
            ${divider()}
            <table cellpadding="0" cellspacing="0" style="width:100%;">
                ${infoRow('User', userName)}
                ${infoRow('Email', userEmail)}
                ${infoRow('Amount', `₦${amount.toLocaleString()}`)}
                ${infoRow('Bank', bankDetails?.bank || 'N/A')}
                ${infoRow('Account', bankDetails?.account || 'N/A')}
                ${infoRow('Account Name', bankDetails?.name || 'N/A')}
                ${infoRow('Requested', new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }))}
            </table>
            ${btn('View in Admin Panel', APP_URL)}
        </div>
    `);
    return sendEmail(ADMIN_EMAIL, `[Admin] 💸 Withdrawal Request: ₦${amount.toLocaleString()} from ${userName}`, html);
}

/** Sent to user confirming their withdrawal was submitted */
export function sendWithdrawalConfirmationEmail(to: string, userName: string, amount: number): Promise<void> {
    const html = layout(`
        ${tag('Withdrawal Submitted', '#6366f1')}
        <div style="margin-top:16px;">
            ${heading(`Withdrawal request received, ${userName}!`)}
            ${para(`Your withdrawal request of <strong>₦${amount.toLocaleString()}</strong> has been received and is being processed. This typically takes 1–3 business days.`)}
            ${para('You will receive a notification once the transfer is complete.')}
            ${btn('View My Wallet', APP_URL)}
        </div>
    `);
    return sendEmail(to, `💸 Withdrawal of ₦${amount.toLocaleString()} is Being Processed`, html);
}

/** Sent to user confirming a wallet top-up */
export function sendTopUpConfirmationEmail(to: string, userName: string, amount: number, reference: string): Promise<void> {
    const html = layout(`
        ${tag('Payment Confirmed ✅', '#22c55e')}
        <div style="margin-top:16px;">
            ${heading(`Wallet funded successfully!`)}
            ${para(`Hi <strong>${userName}</strong>, your wallet has been topped up with <strong>₦${amount.toLocaleString()}</strong>.`)}
            ${divider()}
            <table cellpadding="0" cellspacing="0" style="width:100%;">
                ${infoRow('Amount', `₦${amount.toLocaleString()}`)}
                ${infoRow('Reference', reference)}
                ${infoRow('Date', new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }))}
            </table>
            ${btn('Go to Dashboard', APP_URL)}
        </div>
    `);
    return sendEmail(to, `✅ ₦${amount.toLocaleString()} Added to Your ABC-Rally Wallet`, html);
}

/** Generic notification email (for custom messages) */
export function sendGenericNotificationEmail(to: string, subject: string, title: string, body: string): Promise<void> {
    const html = layout(`
        ${heading(title)}
        ${para(body)}
        ${btn('Open Dashboard', APP_URL)}
    `);
    return sendEmail(to, subject, html);
}

/** Sent to brand manager when a creator requests a review/rating */
export function sendRatingRequestEmail(to: string, brandName: string, creatorName: string, gigTitle: string): Promise<void> {
    const html = layout(`
        ${tag('Review Request ⭐', '#f59e0b')}
        <div style="margin-top:16px;">
            ${heading(`${creatorName} is requesting a review`)}
            ${para(`<strong>${creatorName}</strong> has requested that you rate and write a recommendation for their work on the campaign <strong>"${gigTitle}"</strong>.`)}
            ${para('Please visit your dashboard to leave a star rating and a short testimonial that will appear on their ABC-Rally creator profile.')}
            ${btn('Write a Review', APP_URL)}
        </div>
    `);
    return sendEmail(to, `⭐ ${creatorName} Requests a Rating for "${gigTitle}"`, html);
}
