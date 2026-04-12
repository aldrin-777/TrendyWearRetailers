'use server'

type LineItems = {
    name: string;
    amount: number;
    quantity: number;
    description: string;
    //image: string;
}

export async function createCheckout(items: LineItems[]) {
    const payrexSecretApiKey = process.env.PAYREX_SECRET_KEY;

    if (!payrexSecretApiKey) {
        throw new Error("Missing PAYREX_SECRET_KEY");
    }

    const Payrex = require('payrex-node');
    const payrex = Payrex(payrexSecretApiKey);

    try {
        const checkoutSession = await payrex.checkoutSessions.create({
            currency: 'PHP',
            success_url: 'http://localhost:3000/check-out-success',
            cancel_url: 'http://localhost:3000/',
            payment_methods: ['gcash', 'card', 'maya', 'qrph'], 
            line_items: items
        });
        return checkoutSession?.url ?? null;
    } catch (err: any) {
        throw new Error(`Failed to create checkout session: ${err?.message || 'Unknown error'}`);
    }
}