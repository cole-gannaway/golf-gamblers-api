import * as functions from 'firebase-functions';
import { StripeConfig } from './config/stripe.config';

/**
 * This method updates subscriptionState in the path "/users/{userId}/user_only/account_data/"
 * to be reflective of the subscription state in Stripe.
 *
 * @param userId is the firebase user id
 * @param subscription is the subscription object retrieved from firestore
 */
export const updateSubscriptionState = async (
  LOGGER: typeof functions.logger,
  appFirestore: FirebaseFirestore.Firestore,
  userId: string,
  subscription: any
) => {
  // determine subscription level from product
  const subscriptionState = determineSubscriptionState(
    subscription?.product,
    subscription?.status
  );

  const user = await appFirestore
    .collection('users')
    .doc(userId)
    .collection('user_only')
    .doc('account_data')
    .get();
  const userData = user.data();

  // update database if changes occured
  if (userData?.subscriptionState !== subscriptionState) {
    LOGGER.info(
      'Updating subscription state state to ' +
        subscriptionState +
        ' for user ' +
        userId
    );
    appFirestore
      .collection('users')
      .doc(userId)
      .collection('user_only')
      .doc('account_data')
      .set({ subscriptionState: subscriptionState });
  } else {
    // log
    LOGGER.info('Subscription state remained the same');
  }
};

/**
 * This method determines an app specific subscription state by determining
 * which product the subscription is associated with, and if it is active or not
 *
 * @param product is the reference object retrieved from firestore
 * @param status is the string value set by Stripe in firestore
 */
const determineSubscriptionState = (product: any, status: string) => {
  let subscriptionState = 'none';

  if (status === 'active') {
    if (product?.id === StripeConfig.subscription_product_key.basic) {
      subscriptionState = 'basic';
    }
  }

  return subscriptionState;
};
