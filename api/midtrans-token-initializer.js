export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId, product, amount, metadata } = req.body;

    const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
    const authString = btoa(MIDTRANS_SERVER_KEY + ":");

    try {
        const midtransCall = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                transaction_details: {
                    order_id: "CAT-ORD-" + sessionId,
                    gross_amount: parseInt(amount)
                },
                // Pack your user metadata variables safely inside the Midtrans array hooks
                custom_field1: metadata.email,
                custom_field2: metadata.clientName,
                custom_field3: metadata.birthDate,
                custom_field4: metadata.productType,
                custom_field5: metadata.userQuestion,
                custom_field6: metadata.timeCoordinate || 'Unknown',
                custom_field7: metadata.additionalCoordinates || 'Unknown',
                custom_field8: metadata.partnerBName || '',
                custom_field9: metadata.partnerBBirthDate || ''
            })
        });

        const tokenData = await midtransCall.json();
        return res.status(200).json({ token: tokenData.token });
    } catch (error) {
        return res.status(500).json({ error: 'Midtrans configuration initialization fail.' });
    }
}