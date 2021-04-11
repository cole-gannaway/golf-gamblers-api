import { StripeConfig } from '../config/stripe.config';
import { app } from '../firebaseAdmin';
import { getCurrentTime } from '../utils/utils';
import {
  Event,
  Course,
  ScoreCard,
  EventConfiguration,
} from 'golf-gamblers-model';
import { EventUser } from 'golf-gamblers-model/dist/event';

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

/**
 * Creates an event with users
 */
export async function createEvent(
  eventId: string,
  creatorId: string,
  courseId: string
) {
  const batch = appFirestore.batch();

  // create event
  const event: Event = {
    name: 'testEvent',
    creatorId: creatorId,
    createdTime: getCurrentTime(),
  };

  // set event
  batch.set(appFirestore.collection('events').doc(eventId), event);

  // configure event
  const eventConfig: EventConfiguration = {
    private: false,
    state: 'IN_PROGRESS',
    courseId: courseId,
    numberOfHoles: 18,
    maxBet: 5,
    tees: 'I',
  };

  // set event configuration
  batch.set(
    appFirestore
      .collection('events')
      .doc(eventId)
      .collection('private')
      .doc('configuration'),
    eventConfig
  );

  // create eventUser
  const eventUser: EventUser = {
    userId: creatorId,
    eventId: eventId,
    isAdmin: true,
  };

  const eventUserRef = appFirestore
    .collection('event-users')
    .doc(eventId + '-' + creatorId);
  batch.set(eventUserRef, eventUser);

  // commit all changes
  await batch.commit();
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
    createdTime: getCurrentTime(),
  };
  await appFirestore.collection('courses').doc(courseId).set(course);
}

/**
 * Creates a course for events to be held at
 */
export async function createScorecard(scorecardId: string, userId: string) {
  const scorecard: ScoreCard = {
    userId: userId,
    createdTime: getCurrentTime(),
  };
  await appFirestore.collection('scorecards').doc(scorecardId).set(scorecard);
}

/////////////////////////////////////////////////////////////////////////////
///////////////////////Helper Methods Below//////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

/**
 * Creates a user subscription to the product
 */
const subscribeUserToProduct = async (userId: string, productId: string) => {
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
const createBasicProduct = async (productId: string) => {
  await appFirestore.collection('products').doc(productId).set({
    status: 'active',
    name: 'Basic',
  });
};

// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });
