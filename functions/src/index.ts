import { app, LOGGER } from './firebaseAdmin';
import { firebaseFunctions as functions } from './firebaseAdmin';

import { determineSubscriptionState } from './subscriptions';

const appFirestore = app.firestore();

/**
 * This method listens for created, updated, and deleted subscriptions from the Stripe extension.
 * It will then update the users private data to reflect the new subscription state
 */
export const subscriptionStateListener = functions.firestore
  .document('customers/{userId}/subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    // get parameters
    const userId = context.params.userId;

    // call update on create, update, and delete
    const after = change.after;
    const subscription = after.data();

    // determine subscription level from product
    const subscriptionState = determineSubscriptionState(subscription);

    // call update
    appFirestore
      .collection('users')
      .doc(userId)
      .collection('private')
      .doc('account-data')
      .set({ subscriptionState: subscriptionState });
    return 200;
  });

/**
 * This method listens for new users to be created and stores both
 * public and private data under the users document.
 */
export const newUserListener = functions.auth.user().onCreate(async (user) => {
  // create data
  const publicAccountData = {
    name: user.displayName,
  };

  const privateAccountData = {
    subscriptionState: 'None',
    email: user.email,
  };

  // run atomicly
  const batch = appFirestore.batch();

  // set public account data
  const publicRef = appFirestore
    .collection('users')
    .doc(user.uid)
    .collection('public')
    .doc('account-data');

  batch.set(publicRef, publicAccountData);

  // set private account data
  const privateRef = appFirestore
    .collection('users')
    .doc(user.uid)
    .collection('private')
    .doc('account-data');

  batch.set(privateRef, privateAccountData);

  // commit batch
  batch.commit();

  return 200;
});

/**
 * This method listens for users to be deleted and removes any data stored
 * under the users document
 */
export const deleteUserListener = functions.auth.user().onDelete((user) => {
  appFirestore
    .collection('users')
    .doc(user.uid)
    .delete()
    .catch((error) => LOGGER.error(error));
  return 200;
});
