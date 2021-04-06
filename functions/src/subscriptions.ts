import { StripeConfig } from './config/stripe.config';

/**
 * Given a users subscription object from the database,
 * determine the state and level of that subscription
 *
 * @param subscription Subscription object from Firestore
 * @returns "None" | "Basic"
 */
export function determineSubscriptionState(
  subscription: FirebaseFirestore.DocumentData | undefined
) {
  const status = subscription?.status;
  const product = subscription?.product;
  let subscriptionState = 'None';
  if (status === 'active') {
    // make sure this product id is the Basic subscription
    if (product?.id === StripeConfig.subscription_product_key.basic) {
      subscriptionState = 'Basic';
    }
  }

  return subscriptionState;
}
