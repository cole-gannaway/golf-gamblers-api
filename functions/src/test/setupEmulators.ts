import { StripeConfig } from '../config/stripe.config';
import { app } from '../firebaseAdmin';

const appFirestore = app.firestore();

/**
 * Inputs data into the firestore database to reflect that a user is subscribed
 */
export const subscribeTestUser = async (userId: string) => {
  const productId = StripeConfig.subscription_product_key.basic;
  await createBasicProduct(appFirestore, productId);
  await subscribeUserToProduct(userId, productId);
  return true;
};

/**
 * Creates a user subscription to the product
 */
export const subscribeUserToProduct = async (
  userId: string,
  productId: string
) => {
  const productRef = appFirestore.collection('products').doc(productId);
  appFirestore
    .collection('customers')
    .doc(userId)
    .collection('subscriptions')
    .doc('testsubcribed-' + userId)
    .set({
      status: 'active',
      product: productRef,
    });
};

/**
 * Creates a product for users to subscribe to
 */
export const createBasicProduct = async (
  appFirestore: FirebaseFirestore.Firestore,
  productId: string
) => {
  await appFirestore.collection('products').doc(productId).set({
    status: 'active',
    name: 'Basic',
  });
};

// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });
