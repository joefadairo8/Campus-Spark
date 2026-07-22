/**
 * emailNotifier.ts
 * 
 * Frontend utility that calls the ABC-Rally server's email endpoints.
 * Set SERVER_BASE_URL to the deployed server address (or localhost for development).
 */

import { APP_NAME, BACKEND_URL } from './constants';

const SERVER_BASE_URL = BACKEND_URL;

async function notifyServer(payload: Record<string, unknown>): Promise<void> {
    try {
        await fetch(`${SERVER_BASE_URL}/api/email/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        // Email is non-critical — never block the user flow
        console.warn('[emailNotifier] Could not reach email server:', err);
    }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Send welcome email to a newly registered user */
export function notifyWelcome(email: string, name: string, role: string): void {
    notifyServer({ type: 'welcome', to: email, name, role });
}

/** Notify user + admin of a wallet top-up (call after Paystack success callback) */
export function notifyTopUp(email: string, name: string, amount: number, reference: string): void {
    notifyServer({ type: 'topup', to: email, name, amount, reference });
}

/** Notify user + admin of a withdrawal request */
export function notifyWithdrawal(email: string, name: string, amount: number, bankDetails: object): void {
    notifyServer({ type: 'withdrawal_request', to: email, name, amount, bankDetails });
}

/** Generic notification (title + message body) */
export function notifyGeneric(email: string, subject: string, title: string, body: string): void {
    notifyServer({ type: 'generic', to: email, subject, title, body });
}

export function notifyProposalReceived(email: string, recipientName: string, senderName: string, message: string): void {
    notifyServer({ type: 'proposal_received', to: email, recipientName, name: senderName, body: message });
}

export function notifyProposalStatus(email: string, senderName: string, recipientName: string, status: string): void {
    notifyServer({ type: 'proposal_status', to: email, name: senderName, recipientName, status });
}

export function notifyNewApplication(brandEmail: string, brandName: string, creatorName: string, gigTitle: string, pitch: string): void {
    notifyServer({ type: 'new_application', to: brandEmail, name: brandName, creatorName, title: gigTitle, body: pitch });
}

export function notifyApplicationDecision(creatorEmail: string, creatorName: string, gigTitle: string, brandName: string, status: string): void {
    notifyServer({ type: 'application_decision', to: creatorEmail, name: creatorName, title: gigTitle, brandName, status });
}

export function notifyReportSubmitted(brandEmail: string, brandName: string, creatorName: string, gigTitle: string): void {
    notifyServer({ type: 'report_submitted', to: brandEmail, name: brandName, creatorName, title: gigTitle });
}

export function notifyReportApproved(creatorEmail: string, creatorName: string, gigTitle: string, brandName: string): void {
    notifyServer({ type: 'report_approved', to: creatorEmail, name: creatorName, title: gigTitle, brandName });
}

export function notifyReportRejected(creatorEmail: string, creatorName: string, gigTitle: string, brandName: string): void {
    notifyServer({ type: 'report_rejected', to: creatorEmail, name: creatorName, title: gigTitle, brandName });
}

export function notifyRatingRequest(brandEmail: string, brandName: string, creatorName: string, gigTitle: string): void {
    notifyServer({ type: 'rating_request', to: brandEmail, name: brandName, creatorName, title: gigTitle });
}

export function notifyGigAssigned(creatorEmail: string, creatorName: string, gigTitle: string, brandName: string, amount?: number): void {
    notifyServer({ type: 'gig_assigned', to: creatorEmail, name: creatorName, title: gigTitle, brandName, amount });
}

export function notifyFundsReleased(creatorEmail: string, creatorName: string, amount: number, gigTitle: string, brandName: string, brandEmail?: string): void {
    notifyServer({ type: 'funds_released', to: creatorEmail, name: creatorName, amount, title: gigTitle, brandName, brandEmail });
}

export function notifyWithdrawalCompleted(userEmail: string, userName: string, amount: number, bankDetails?: object): void {
    notifyServer({ type: 'withdrawal_completed', to: userEmail, name: userName, amount, bankDetails });
}

