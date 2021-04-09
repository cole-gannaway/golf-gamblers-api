import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FirebaseConfig } from './config/firebase.config';
import * as FirebaseFirestore from '@google-cloud/firestore';

/**
 * This file wraps the initializing of the Firebase application,
 * that way initializeApp is not called multiple times when separating
 * functions into different files.
 */

export const app = admin.initializeApp(FirebaseConfig);

export const firebaseFunctions = functions;
export const LOGGER = functions.logger;

export function getCurrentTime() {
  return FirebaseFirestore.Timestamp.now();
}
