import { NextRequest, NextResponse } from 'next/server';

// bKash Sandbox Credentials (Demo)
const BKASH_CONFIG = {
    baseURL: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    appKey: 'your_app_key_here',
    appSecret: 'your_app_secret_here',
    username: 'your_username_here',
    password: 'your_password_here',
};

// Get auth token (same as create route)
async function getAuthToken() {
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
        return data.id_token;
    } catch (error) {
        console.error('Auth token error:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentID } = body;

        if (!paymentID) {
            return NextResponse.json(
                { success: false, error: 'Payment ID is required' },
                { status: 400 }
            );
        }

        // Get auth token
        const token = await getAuthToken();

        // Execute payment
        const executeResponse = await fetch(`${BKASH_CONFIG.baseURL}/tokenized/checkout/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token,
                'X-APP-Key': BKASH_CONFIG.appKey,
            },
            body: JSON.stringify({
                paymentID,
            }),
        });

        const executeData = await executeResponse.json();

        if (executeData.transactionStatus === 'Completed') {
            // Payment successful
            return NextResponse.json({
                success: true,
                transactionID: executeData.trxID,
                paymentID: executeData.paymentID,
                amount: executeData.amount,
                customerMsisdn: executeData.customerMsisdn,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Payment execution failed', details: executeData },
            { status: 400 }
        );
    } catch (error) {
        console.error('Payment execution error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle GET requests (callback from bKash)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    if (status === 'success' && paymentID) {
        // Redirect to success page
        return NextResponse.redirect(
            new URL(`/payment/success?paymentID=${paymentID}`, request.url)
        );
    } else if (status === 'failure') {
        // Redirect to failure page
        return NextResponse.redirect(
            new URL('/payment/failure', request.url)
        );
    } else if (status === 'cancel') {
        // Redirect to cancel page
        return NextResponse.redirect(
            new URL('/payment/cancel', request.url)
        );
    }

    return NextResponse.redirect(new URL('/', request.url));
}
