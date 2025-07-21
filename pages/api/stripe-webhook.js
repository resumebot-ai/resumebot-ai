import { buffer } from 'micro';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw request body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// Example placeholder function - replace with your DB update logic
async function handleSubscriptionEvent(subscription) {
  console.log(`Subscription event for user ${subscription.customer}, status: ${subscription.status}`);
  // TODO: Update your user database subscription status here
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`Checkout session completed: ${session.id}`);
      // TODO: Mark subscription active or create user in DB
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object;
      await handleSubscriptionEvent(subscription);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionEvent(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log(`Subscription deleted: ${subscription.id}`);
      // TODO: Mark subscription cancelled in DB
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log(`Invoice payment succeeded: ${invoice.id}`);
      // TODO: Update payment status in DB
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`Invoice payment failed: ${invoice.id}`);
      // TODO: Handle failed payment (notify user etc)
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
