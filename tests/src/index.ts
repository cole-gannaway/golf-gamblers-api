/**
 * This test suite should dynamically populate our firestore emulator with all the necessary data
 */
import { populateDatabase } from './setup/setUpEmulators';

// main method
(async () => {
  try {
    await populateDatabase();
    process.exit();
  } catch (e) {
    console.error('Something went wrong!');
    console.error(e);
    process.exit(-1);
  }
})();
