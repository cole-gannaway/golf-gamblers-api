import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FirebaseConfig } from './config/firebase.config';
import { updateSubscriptionState } from './subscriptions';

const app = admin.initializeApp(FirebaseConfig);
const appFirestore = app.firestore();
const LOGGER = functions.logger;

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
    updateSubscriptionState(LOGGER, appFirestore, userId, subscription);

    // return okay
    return 200;
  });

// Development Code below

/**
 * WARNING: This function should not actually be deployed, it is a fail safe if the
 * database gets out of sync
 *
 * This method runs a batch job on all users and updates their subscription states
 * to be reflective of Stripe's active subscriptions
 */
// export const updateSubscriptionStateManually = functions.https.onRequest(
//   async (request, response) => {
//     const customersSnap = await appFirestore.collection('customers').get();
//     customersSnap.forEach(async (customerSnap) => {
//       const userId = customerSnap.id;
//       const subscriptionsSnap = await customerSnap.ref
//         .collection('subscriptions')
//         .get();
//       subscriptionsSnap.forEach((subscriptionSnap) => {
//         const subscription = subscriptionSnap.data();
//         updateSubscriptionState(LOGGER, appFirestore, userId, subscription);
//       });
//     });
//     response.send('Succesful');
//   }
// );

// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });
