async function runTests() {
    const PANDASCROW_TOKEN = 'sk_live_cd4490b89626dd9091c6bdb0c882110a1ad3466863ff4afb43d7e618e40ba7fe';
    const PANDASCROW_UUID = '439b7696-642b-4d20-9cca-abdcf37c6f89';

    const basePayload = {
        escrow_type: 'onetime',
        initiator_role: 'buyer',
        title: `Campaign Gig: Test Gig`,
        currency: 'NGN',
        description: `Escrow for creator gig: Test Gig`,
        acceptance_criteria: 'Gig report approved by brand.',
        inspection_period: '3',
        delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        how_dispute_is_handled: 'platform',
        who_pay_fees: 'buyer',
        amount: 5000,
        dispute_window: '5',
        callback_url: 'https://campus-spark-3a55d.web.app/api/escrow/webhook',
        partner_escrow_fee: '5',
        buyer_details: {
            name: 'Brand Partner Test',
            email: 'olathetechboy@gmail.com',
            phone: '+2340000000000',
        },
        seller_details: {
            name: 'Campus Creator Test',
            email: 'creator_test@campus-spark.com',
            phone: '+2340000000000',
        },
        payout: {
            payout_type: 'bank',
        },
    };

    const variations = [
        {
            name: "Without uuid and initiator_id",
            payload: { ...basePayload }
        },
        {
            name: "With dummy uuid and initiator_id",
            payload: {
                ...basePayload,
                uuid: "dummy-uuid",
                initiator_id: "dummy-uuid"
            }
        },
        {
            name: "Only Token in headers, no UUID in payload",
            payload: {
                ...basePayload
            }
        }
    ];

    for (const test of variations) {
        console.log(`\n--- Running test: ${test.name} ---`);
        try {
            const res = await fetch('https://api.pandascrow.io/escrow/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': PANDASCROW_TOKEN
                },
                body: JSON.stringify(test.payload),
            });
            console.log('Status:', res.status);
            const body = await res.text();
            console.log('Response:', body);
        } catch (err) {
            console.error('Error:', err.message);
        }
    }
}

runTests();
