import { db, firestoreArrayUnion } from '../firebaseAdmin';
import { Event, EventConfiguration, EventUsers } from 'golf-gamblers-model';
import StripeConfig from '../../config/stripe.config.json';

export async function getAllUserIds() {
  const users = await db.collection('users').get();
  const userIds: string[] = [];
  for (let i = 0; i < users.size; i++) {
    const user = users.docs[i];
    userIds.push(user.id);
  }
  return userIds;
}

/**
 * Subscribes a user to the product
 *
 * @param userId
 */
async function subscribeUser(userId: string) {
  const productRef = db
    .collection('products')
    .doc(StripeConfig.subscription_product_key.basic);
  await db
    .collection('customers')
    .doc(userId)
    .collection('subscriptions')
    .doc('testSubscriptionId')
    .set({
      status: 'active',
      product: productRef,
    });
}

/**
 * Creates an event with users
 *
 * @param event
 * @param eventConfig
 * @returns
 */
export async function createEvent(
  event: Event,
  eventConfig: EventConfiguration
) {
  // create an event ref
  const eventRef = db.collection('events').doc();

  // set event
  await eventRef.set(event);

  // set the events configuration
  await eventRef.collection('private').doc('configuration').set(eventConfig);

  // create eventUsers
  const eventUsers: EventUsers = {
    eventId: eventRef.id,
    userIds: [event.creatorId],
  };

  // set the event user as a user
  const eventUsersRef = db.collection('event-users').doc(eventRef.id);
  await eventUsersRef.set(eventUsers);

  // create eventAdmins
  const eventAdmins: any = {
    eventId: eventRef.id,
    userIds: firestoreArrayUnion(event.creatorId),
  };

  // set the event user as an admin
  const eventAdminsRef = db.collection('event-admins').doc(eventRef.id);
  await eventAdminsRef.set(eventAdmins);

  return eventRef.id;
}
