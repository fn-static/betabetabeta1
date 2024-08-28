// server.js
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')('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'); // Zamień na swój klucz tajny Stripe

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Amount is in cents
            currency: 'pln',
            payment_method_types: ['card'],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
