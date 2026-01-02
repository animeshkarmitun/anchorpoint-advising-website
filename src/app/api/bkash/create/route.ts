import { NextRequest, NextResponse } from 'next/server';

// bKash Sandbox Credentials (Demo)
const BKASH_CONFIG = {
    baseURL: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    appKey: 'your_app_key_here', // Replace with actual sandbox credentials
    appSecret: 'your_app_secret_here',
    username: 'your_username_here',
    password: 'your_password_here',
};

// In-memory token storage (use Redis/Database in production)
let authToken: string | null = null;
let tokenExpiry: number = 0;

// Get bKash auth token
async function getAuthToken() {
    // Check if token is still valid
    if (authToken && Date.now() < tokenExpiry) {
        return authToken;
    }

    try {
        const response = await fetch(`${BKASH_CONFIG.baseURL}/tokenized/checkout/token/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'username': BKASH_CONFIG.username,
                'password': BKASH_CONFIG.password,
            },
            body: JSON.stringify({
                app_key: BKASH_CONFIG.appKey,
                app_secret: BKASH_CONFIG.appSecret,
            }),
        });

        const data = await response.json();

        if (data.id_token) {
            authToken = data.id_token;
            // Token expires in 1 hour, refresh 5 minutes before
            tokenExpiry = Date.now() + (55 * 60 * 1000);
            return authToken;
        }

        throw new Error('Failed to get auth token');
    } catch (error) {
        console.error('Auth token error:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, packageType, customerInfo } = body;

        // Get auth token
        const token = await getAuthToken();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Failed to get authentication token' },
                { status: 500 }
            );
        }

        // Save customer data to Google Sheets before payment
        try {
            const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/save-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...customerInfo,
                    amount,
                    packageType,
                    status: 'Pending Payment'
                }),
            });

            const saveData = await saveResponse.json();
            console.log('✅ Customer data saved:', saveData.synced ? 'Synced to Google Sheets' : 'Save attempted');
        } catch (saveError) {
            console.error('⚠️ Failed to save customer data:', saveError);
            // Continue with payment even if save fails
        }

        // Create payment
        const paymentResponse = await fetch(`${BKASH_CONFIG.baseURL}/tokenized/checkout/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token,
                'X-APP-Key': BKASH_CONFIG.appKey,
            },
            body: JSON.stringify({
                mode: '0011', // Checkout mode
                payerReference: customerInfo.phone,
                callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bkash/callback`,
                amount: amount.toString(),
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: `INV${Date.now()}`,
            }),
        });

        const paymentData = await paymentResponse.json();

        if (paymentData.paymentID && paymentData.bkashURL) {
            return NextResponse.json({
                success: true,
                paymentID: paymentData.paymentID,
                bkashURL: paymentData.bkashURL,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Payment creation failed', details: paymentData },
            { status: 400 }
        );
    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
