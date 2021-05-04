import { db } from '../firebaseAdmin';
import { getCurrentTime } from '../utils/utils';
import StripeConfig from '../../config/stripe.config.json';
import { Course, Event, EventConfiguration } from 'golf-gamblers-model';
import { createEvent, getAllUserIds } from './database-utils';

/**
 * Main method for populating the database with data for testing
 */
export async function populateDatabase() {
  await populateProducts();
  await subscribeAllUsers();
  await populateCourses();
  await populateEvents();

  console.log('Finished populating the database!');
}

/**
 * Creates a product(s) for users to subscribe to
 */
async function populateProducts() {
  await db
    .collection('products')
    .doc(StripeConfig.subscription_product_key.basic)
    .set({
      status: 'active',
      name: 'Basic',
    });
}
/**
 * Subscribes all users to the product
 */
async function subscribeAllUsers() {
  const userIds = await getAllUserIds();
  for (let i = 0; i < userIds.length; i++) {
    await subscribeUser(userIds[i]);
  }
}

/**
 * Populates fake course data for events to be held at
 */
async function populateCourses() {
  for (let i = 0; i < 10; i++) {
    const course: Course = {
      name: 'Course ' + (i + 1).toString(),
      public: false,
      location: {
        city: 'Birmingham',
        state: 'Alabama',
        country: 'United States',
      },
      createdTime: getCurrentTime(),
    };
    await db.collection('courses').doc().set(course);
  }
}

/**
 * Creates an event for each user
 */
async function populateEvents() {
  const eventsPerUser = 2;
  const userIds = await getAllUserIds();
  const randomCourseQuery = await db.collection('courses').limit(1).get();
  const randomCourse = randomCourseQuery.docs[0];
  for (let i = 0; i < userIds.length; i++) {
    for (let j = 0; j < eventsPerUser; j++) {
      const userId = userIds[i];
      // create event
      const event: Event = {
        name: 'Fake Event ' + (i + j + 1).toString(),
        creatorId: userId,
        createdTime: getCurrentTime(),
      };
      // configure event
      const eventConfig: EventConfiguration = {
        private: false,
        state: 'IN_PROGRESS',
        courseId: randomCourse.id,
        numberOfHoles: 18,
        maxBet: 5,
        tees: 'I',
      };
      await createEvent(event, eventConfig);
    }
  }
}
function subscribeUser(arg0: string) {
  throw new Error('Function not implemented.');
}
