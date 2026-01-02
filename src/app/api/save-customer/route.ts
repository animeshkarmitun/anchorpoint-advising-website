import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, age, occupation, phone, amount, packageType, status = 'Pending Payment', bkashNumber, transactionId } = body;

        console.log('📝 Received customer data:', { name, email, age, occupation, phone, amount, packageType, status, bkashNumber, transactionId });

        // Validate required fields
        if (!name || !phone) {
            console.error('❌ Validation failed: Missing required fields');
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // SheetDB API URL
        const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

        if (!SHEETDB_API_URL || SHEETDB_API_URL === 'YOUR_SHEETDB_API_URL_HERE') {
            console.error('❌ SheetDB API URL not configured in .env.local');
            return NextResponse.json(
                { success: false, error: 'SheetDB API URL not configured' },
                { status: 500 }
            );
        }

        console.log('🔗 SheetDB API URL:', SHEETDB_API_URL);

        // Prepare data for Google Sheets (SheetDB expects direct object)
        const sheetData = {
            timestamp: new Date().toISOString(),
            name,
            email,
            age: age || '',
            occupation: occupation || '',
            phone,
            amount: amount || '',
            package: packageType || '',

            status,
            bkash_number: bkashNumber || '',
            transaction_id: transactionId || ''
        };

        console.log('📤 Sending to SheetDB:', sheetData);

        // Save to Google Sheets via SheetDB
        const response = await fetch(SHEETDB_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData), // SheetDB accepts direct object, not wrapped in 'data'
        });

        const responseText = await response.text();
        console.log('📥 SheetDB response status:', response.status);
        console.log('📥 SheetDB response:', responseText);

        if (!response.ok) {
            console.error('❌ SheetDB error:', responseText);
            // Don't fail the request if Google Sheets fails
            return NextResponse.json({
                success: true,
                message: 'Data saved locally but failed to sync with Google Sheets',
                synced: false,
                error: responseText
            });
        }

        console.log('✅ Successfully saved to Google Sheets!');

        return NextResponse.json({
            success: true,
            message: 'Customer data saved successfully',
            synced: true
        });

    } catch (error) {
        console.error('❌ Save customer data error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save customer data', details: String(error) },
            { status: 500 }
        );
    }
}
