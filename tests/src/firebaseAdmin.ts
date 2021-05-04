import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';

import FireBaseConfig from '../config/firebase.config.json';

export const app = !firebase.apps.length
  ? firebase.initializeApp(FireBaseConfig)
  : firebase.app();
export const db = app.firestore();
export const auth = app.auth();
auth.useEmulator('http://localhost:9099/');
db.useEmulator('localhost', 8080);
// functions.useEmulator("localhost", 5001);

// firestore methods
export function firestoreArrayUnion(...elements: any[]) {
  return firebase.firestore.FieldValue.arrayUnion(...elements);
}
export function firestoreArrayRemove(...elements: any[]) {
  return firebase.firestore.FieldValue.arrayRemove(...elements);
}
