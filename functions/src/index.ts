import { appFirestore, firestoreNameSpace, LOGGER } from './firebaseAdmin';
import { getCurrentTime } from './utils/utils';
import { firebaseFunctions as functions } from './firebaseAdmin';
import { determineSubscriptionState } from './subscriptions';
import {
  Bet,
  Scorecard,
  UserPrivateData,
  UserPublicData,
} from 'golf-gamblers-model';
import { processBet } from './utils/process-bets';

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
  const publicAccountData: UserPublicData = {
    name: user.displayName,
  };

  const privateAccountData: UserPrivateData = {
    email: user.email,
    createdTime: getCurrentTime(),
    subscriptionState: 'None',
  };

  // run atomicly
  const batch = appFirestore.batch();

  // set public account data will just set on the user document
  const publicRef = appFirestore.collection('users').doc(user.uid);

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

interface LeaderboardScorecardInfo {
  [scorecardId: string]: {
    scorecardId: string;
    userId: string;
    eventId: string;
    runningTotal: number;
  };
}

/**
 * Updates anything the scorecard is associated with
 */
export const scorecardCreateListener = functions.firestore
  .document('scorecards/{scorecardId}')
  .onCreate((scorecardDoc, context) => {
    // get parameters
    const scorecardId: string = context.params.scorecardId;

    const scorecard = scorecardDoc.data() as Scorecard;
    if (scorecard.eventId) {
      let runningTotal: number = 0;
      Object.values(scorecard.holes).forEach(
        (hole) => (runningTotal += hole.strokes)
      );
      // convert scorecard to summary data
      const leadboardInfo: LeaderboardScorecardInfo = {
        [scorecardId]: {
          scorecardId: scorecardId,
          userId: scorecard.userId,
          eventId: scorecard.eventId,
          runningTotal: runningTotal,
        },
      };
      appFirestore
        .collection('event-leaderboards')
        .doc(scorecard.eventId)
        .collection('leaderboards')
        .doc('scorecards')
        .set({ scorecards: leadboardInfo }, { merge: true });
    }
    return 200;
  });

/**
 * Updates anything the scorecard is associated with
 */
export const scorecardUpdateListener = functions.firestore
  .document('scorecards/{scorecardId}')
  .onUpdate(async (scorecardDocChanges, context) => {
    // get parameters
    const scorecardId: string = context.params.scorecardId;

    // detect changes
    const scorecardDocBefore = scorecardDocChanges.before;
    const scorecardDocAfter = scorecardDocChanges.after;
    const scorecardBefore = scorecardDocBefore.data() as Scorecard;
    const scorecardAfter = scorecardDocAfter.data() as Scorecard;

    // removed event from scorecard
    if (scorecardBefore.eventId && !scorecardAfter.eventId) {
      removeScorecardFromEvent(scorecardId, scorecardBefore.eventId);
    } else {
      if (scorecardAfter.eventId) {
        let runningTotal: number = 0;
        Object.values(scorecardAfter.holes).forEach(
          (hole) => (runningTotal += hole.strokes)
        );
        // convert scorecard to summary data
        const leadboardInfo: LeaderboardScorecardInfo = {
          [scorecardId]: {
            scorecardId: scorecardId,
            userId: scorecardAfter.userId,
            eventId: scorecardAfter.eventId,
            runningTotal: runningTotal,
          },
        };
        appFirestore
          .collection('event-leaderboards')
          .doc(scorecardAfter.eventId)
          .collection('leaderboards')
          .doc('scorecards')
          .set({ scorecards: leadboardInfo }, { merge: true });
      }
    }
    // look for associated bets
    const associatedBetDocs = await appFirestore
      .collection('bets')
      .where('scorecardIds', 'array-contains', scorecardAfter.scorecardId)
      .get();
    for (let i = 0; i < associatedBetDocs.docs.length; i++) {
      const associatedBet = associatedBetDocs.docs[i].data() as Bet;
      processBet(associatedBet);
    }
    return 200;
  });

/**
 * Cleans up any thing the scorecard is associated with
 */
export const scorecardDeleteListener = functions.firestore
  .document('scorecards/{scorecardId}')
  .onDelete(async (scorecardDoc, context) => {
    // get parameters
    const scorecardId: string = context.params.scorecardId;

    const scorecard = scorecardDoc.data() as Scorecard;

    // clean up event
    if (scorecard.eventId) {
      removeScorecardFromEvent(scorecardId, scorecard.eventId);
    }
    return 200;
  });

export const betCreateListener = functions.firestore
  .document('bets/{betId}')
  .onCreate((betDoc) => {
    const bet = betDoc.data() as Bet;
    processBet(bet);
    return 200;
  });

/**
 * Resusable method for unassociating a scorecard from an event
 *
 * @param scorecardId
 * @param eventId
 */
async function removeScorecardFromEvent(scorecardId: string, eventId: string) {
  const leaderboardDoc = await appFirestore
    .collection('event-leaderboards')
    .doc(eventId)
    .collection('leaderboards')
    .doc('scorecards')
    .get();
  if (leaderboardDoc.exists) {
    const deleteNestedField = 'scorecards.' + scorecardId;
    appFirestore
      .collection('event-leaderboards')
      .doc(eventId)
      .collection('leaderboards')
      .doc('scorecards')
      .update({ [deleteNestedField]: firestoreNameSpace.FieldValue.delete() });
  }
}
