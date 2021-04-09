import { StripeConfig } from '../config/stripe.config';
import { app, getCurrentTime } from '../firebaseAdmin';

import { Event, Course, ScoreCard, EventMetaData } from 'golf-gamblers-model';

const appFirestore = app.firestore();

/**
 * Inputs data into the firestore database to reflect that a user is subscribed
 */
export const subscribeTestUser = async (userId: string) => {
  const productId = StripeConfig.subscription_product_key.basic;
  await createBasicProduct(productId);
  await subscribeUserToProduct(userId, productId);
  return true;
};

/////////////////////////////////////////////////////////////////////////////
///////////////////////Helper Methods Below//////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

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
export const createBasicProduct = async (productId: string) => {
  await appFirestore.collection('products').doc(productId).set({
    status: 'active',
    name: 'Basic',
  });
};

/**
 * Creates an event with users
 */
export async function createEvent(
  eventId: string,
  creatorId: string,
  courseId: string
) {
  // create references
  const courseRef = appFirestore.collection('courses').doc(courseId);
  const creatorRef = appFirestore.collection('users').doc(creatorId);

  // create event
  const event: Event = {
    name: 'testEvent',
    private: false,
    createdBy: creatorRef,
    createdAt: getCurrentTime(),
    userRefs: {
      [creatorId]: creatorRef,
    },
    courseRef: courseRef,
  };

  await appFirestore.collection('events').doc(eventId).set(event);

  // create private metadata
  const eventPrivateMetadata: EventMetaData = {
    numberOfHoles: 18,
    maxBet: 5,
    tees: 'I',
  };

  await appFirestore
    .collection('events')
    .doc(eventId)
    .collection('private')
    .doc('metadata')
    .set(eventPrivateMetadata);
}

/**
 * Creates a course for events to be held at
 */
export async function createCourse(courseId: string) {
  const course: Course = {
    name: 'testCourse',
    public: false,
    location: {
      city: 'Birmingham',
      state: 'Alabama',
      country: 'United States',
    },
    createdAt: getCurrentTime(),
  };
  await appFirestore.collection('courses').doc(courseId).set(course);
}

/**
 * Creates a course for events to be held at
 */
export async function createScorecard(scorecardId: string, userId: string) {
  const userRef = appFirestore.collection('users').doc(userId);

  const scorecard: ScoreCard = {
    userRef: userRef,
    createdAt: getCurrentTime(),
  };
  await appFirestore.collection('scorecards').doc(scorecardId).set(scorecard);
}

// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });
