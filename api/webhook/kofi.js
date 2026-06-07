// api/webhook/kofi.js
// This endpoint receives payment notifications from Ko-fi

export default async function handler(req, res) {
    // Only accept POST requests from Ko-fi
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('Received webhook from Ko-fi');

    // Parse the incoming data
    let paymentData;
    try {
        // Ko-fi sends data as JSON
        paymentData = req.body;
        console.log('Webhook data:', JSON.stringify(paymentData, null, 2));
    } catch (e) {
        console.error('Failed to parse webhook data:', e);
        return res.status(400).json({ error: 'Invalid data format' });
    }

    // 🔒 VERIFICATION: Check the verification token
    const KOFI_VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;
    
    if (!KOFI_VERIFICATION_TOKEN) {
        console.error('KOFI_VERIFICATION_TOKEN not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Ko-fi sends verification_token in the payload
    if (paymentData.verification_token !== KOFI_VERIFICATION_TOKEN) {
        console.error('Invalid verification token — possible unauthorized request');
        console.error(`Expected: ${KOFI_VERIFICATION_TOKEN}`);
        console.error(`Received: ${paymentData.verification_token}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Determine payment type
    const paymentType = paymentData.type; // 'Donation', 'Subscription', or 'Shop Order'
    
    console.log(`Payment type: ${paymentType}`);
    
    // Only process donations and shop orders (subscriptions are recurring)
    if (paymentType !== 'Donation' && paymentType !== 'Shop Order') {
        console.log(`Skipping ${paymentType} event — not a one-time donation`);
        return res.status(200).json({ received: true, skipped: true });
    }

    // Extract data from Ko-fi payload
    const transactionId = paymentData.kofi_transaction_id;
    const email = paymentData.email;
    const fromName = paymentData.from_name;
    const amount = paymentData.amount;
    const currency = paymentData.currency;
    const message = paymentData.message || '';
    const timestamp = paymentData.timestamp;

    console.log(`Processing ${paymentType} from ${fromName} (${email}): ${amount} ${currency}`);
    console.log(`Message: ${message}`);

    // Extract session ID from the message
    // Message format: "Reading for user@example.com Session:abc-123-xyz"
    let sessionId = null;
    const sessionMatch = message.match(/Session:([a-f0-9-]+)/i);
    if (sessionMatch) {
        sessionId = sessionMatch[1];
        console.log(`Extracted session ID: ${sessionId}`);
    }

    // Extract email from message as fallback
    let donorEmail = email;
    const emailMatch = message.match(/for\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch && !donorEmail) {
        donorEmail = emailMatch[1];
        console.log(`Extracted email from message: ${donorEmail}`);
    }

    if (!sessionId) {
        console.warn('No session ID found in message — cannot retrieve reading data');
        console.log('Returning success to Ko-fi but not processing further');
        return res.status(200).json({ 
            received: true, 
            message: 'Payment recorded, but no session ID found' 
        });
    }

    // Retrieve the stored reading data from localStorage
    // IMPORTANT: In a serverless environment like Vercel, you cannot access localStorage.
    // You need a database like Upstash Redis (free tier).
    
    // For now, we'll acknowledge receipt and rely on the user's browser to trigger the report.
    // The thank-you page will handle the actual report generation.
    
    // If you want full automation, set up Upstash Redis:
    // 1. Sign up at upstash.com (free tier: 10,000 commands/day)
    // 2. Get your Redis URL and token
    // 3. Store pending data with session ID as key
    // 4. Retrieve here and generate report automatically
    
    console.log(`Payment confirmed for session ${sessionId}. Waiting for browser to trigger report.`);

    // Return 200 OK to acknowledge receipt
    res.status(200).json({ 
        received: true, 
        type: paymentType,
        transaction_id: transactionId,
        session_id: sessionId,
        message: 'Payment recorded. User will generate report via thank-you page.'
    });
}