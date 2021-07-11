import { appFirestore } from '../firebaseAdmin';
import {
  calculateSkinsResults,
  calculateMatchPlayResults,
} from './calculate-bets';
import {
  updateBetLeaderBoardWithSkinsResults,
  updateBetLeaderBoardWithMatchPlayResults,
} from './update-leaderboards';
import { Bet, Scorecard } from 'golf-gamblers-model';

export async function processBet(bet: Bet) {
  console.log('processing bet!');
  const scorecards = await getScorecardsByIds(bet.scorecardIds);
  switch (bet.betType) {
    case 'Skins':
      const skins = await calculateSkinsResults(scorecards);
      await updateBetLeaderBoardWithSkinsResults(
        bet.betId,
        bet.eventId,
        scorecards,
        skins,
        bet.wager
      );
      break;
    case 'MatchPlay':
      const matchResults = await calculateMatchPlayResults(scorecards);
      await updateBetLeaderBoardWithMatchPlayResults(
        bet.betId,
        bet.eventId,
        scorecards,
        matchResults,
        bet.wager
      );
      break;
    default:
      break;
  }
}

async function getScorecardsByIds(scorecardIds: string[]) {
  const scorecards: Scorecard[] = [];
  for (let i = 0; i < scorecardIds.length; i++) {
    const scorecardId = scorecardIds[i];
    const scorecardDoc = await appFirestore
      .collection('scorecards')
      .doc(scorecardId)
      .get();
    const scorecard = scorecardDoc.data() as Scorecard;
    scorecards.push(scorecard);
  }
  return scorecards;
}
