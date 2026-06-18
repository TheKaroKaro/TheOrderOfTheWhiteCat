export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'System architecture protocol violation.' });
    }

    const payload = req.body;
    let paymentData = null;

    // 1. EVALUATE SOURCE: Midtrans Protocol Verification
    if (payload.transaction_status && payload.order_id) {
        if (payload.transaction_status === 'settlement' || payload.transaction_status === 'capture') {
            
            // Reconstruct payload object from Midtrans custom fields parsing
            paymentData = {
                email: payload.custom_field1, 
                clientName: payload.custom_field2,
                birthDate: payload.custom_field3,
                productType: payload.custom_field4, 
                userQuestion: payload.custom_field5,
                transactionId: payload.order_id,
                gatewayVendorId: 'Midtrans_Gateway_Node',
                amountPaidString: `Rp ${parseInt(payload.gross_amount).toLocaleString('id-ID')}`,
                timeCoordinate: payload.custom_field6 || 'Unknown',
                additionalCoordinates: payload.custom_field7 || 'Unknown',
                identityString: payload.custom_field2 || '',
                partnerBName: payload.custom_field8 || '',
                partnerBBirthDate: payload.custom_field9 || ''
            };
        } else {
            return res.status(200).json({ status: `Ignored Midtrans array modifier status: ${payload.transaction_status}` });
        }
    } 
    
    // 2. EVALUATE SOURCE: PayPal Notification Protocol Verification
    else if (payload.event_type) {
        if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = payload.resource;
            
            let customMetadata = {};
            try {
                if (resource.custom_id) {
                    customMetadata = JSON.parse(resource.custom_id);
                }
            } catch (e) {
                console.error("Critical failure tracking PayPal internal metadata injection parsing block.");
            }

            paymentData = {
                email: customMetadata.email,
                clientName: customMetadata.clientName,
                birthDate: customMetadata.birthDate,
                productType: customMetadata.productType,
                userQuestion: customMetadata.userQuestion,
                transactionId: resource.id || payload.id,
                gatewayVendorId: 'PayPal_Global_Node',
                amountPaidString: `$${resource.amount.value} USD`,
                timeCoordinate: customMetadata.timeCoordinate || 'Unknown',
                additionalCoordinates: customMetadata.additionalCoordinates || 'Unknown',
                identityString: customMetadata.identityString || '',
                partnerBName: customMetadata.partnerBName || '',
                partnerBBirthDate: customMetadata.partnerBBirthDate || ''
            };
        } else {
            return res.status(200).json({ status: `Ignored PayPal telemetry status matrix link: ${payload.event_type}` });
        }
    }

    // 3. SECURE FORWARD ROUTING TO COMPILER
    if (paymentData) {
        try {
            const host = req.headers.host;
            const protocol = host.includes('localhost') ? 'http' : 'https';
            
            // Dispatches internal secure POST payload down to compile-oracle-report.js
            const internalPipelineCall = await fetch(`${protocol}://${host}/api/compile-oracle-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            const processingResult = await internalPipelineCall.json();
            return res.status(200).json({ success: true, log: processingResult });
        } catch (error) {
            console.error("Internal loop redirection crash tracking logs:", error);
            return res.status(500).json({ error: 'System execution redirection failure.' });
        }
    }

    return res.status(400).json({ error: 'Unrecognized transaction payload signature.' });
}