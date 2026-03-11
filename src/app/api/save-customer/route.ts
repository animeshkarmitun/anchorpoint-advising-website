import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/save-customer
 *
 * Receives manual bKash payment data from PackagePurchaseModal
 * and persists it to Supabase PostgreSQL via the NestJS backend.
 *
 * Replaces the previous Google Sheets (SheetDB) integration.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            amount,
            packageType,
            status = 'Pending Verification',
            bkashNumber,
            transactionId,
        } = body;

        // ── Validation ──────────────────────────────────────────
        if (!name?.trim() || !phone?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: name and phone' },
                { status: 400 }
            );
        }

        if (!transactionId?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        // ── Forward to NestJS Backend ───────────────────────────
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3012';

        const payload = {
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone.trim(),
            amount: Number(amount) || 0,
            packageType: packageType || 'unknown',
            status,
            bkashNumber: bkashNumber?.trim() || phone.trim(),
            transactionId: transactionId.trim().toUpperCase(),
        };

        console.log('📤 Forwarding payment to backend:', {
            ...payload,
            // Don't log sensitive fields in production
        });

        const backendResponse = await fetch(`${backendUrl}/api/v1/public/payments/manual-bkash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const backendData = await backendResponse.json();

        if (!backendResponse.ok) {
            console.error('❌ Backend error:', backendData);

            // If duplicate transaction ID
            if (backendResponse.status === 409) {
                return NextResponse.json(
                    { success: false, error: 'This Transaction ID has already been submitted.' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { success: false, error: backendData.message || 'Failed to save payment' },
                { status: backendResponse.status }
            );
        }

        console.log('✅ Payment saved to database:', backendData?.data?.id);

        return NextResponse.json({
            success: true,
            message: 'Payment recorded successfully',
            id: backendData?.data?.id,
        });

    } catch (error) {
        console.error('❌ save-customer route error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
