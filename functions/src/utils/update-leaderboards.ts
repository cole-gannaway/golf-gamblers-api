import {
  Bet,
  BetsLeaderBoard,
  MatchPlayBetResults,
  Scorecard,
  setBetResultToBetsLeaderboard,
  SkinsBetResults,
} from 'golf-gamblers-model';
import { appFirestore } from '../firebaseAdmin';

/**
 * Updates the database with information based on the results, assumes 1v1 match play, will expand to teams later
 *
 * @param betId
 * @param eventId
 * @param scorecards
 * @param matchResults
 * @param wager
 */
export async function updateBetLeaderBoardWithMatchPlayResults(
  betId: string,
  eventId: string,
  scorecards: Scorecard[],
  matchResults: MatchPlayBetResults,
  wager: number
) {
  const batch = appFirestore.batch();

  // update bet
  const betRef = appFirestore.collection('bets').doc(betId);
  const updatedBet: Partial<Bet> = {
    betResults: matchResults,
  };
  batch.set(betRef, updatedBet, { merge: true });

  // update leader board
  const betsLeaderboardRef = appFirestore
    .collection('bet-leaderboards')
    .doc(eventId);

  const betsLeaderboard: Partial<BetsLeaderBoard> = {
    eventId: eventId,
    betSummary: {},
  };

  // assume only 2 scorecards, and default to 0
  const player1Scorecard = scorecards[0];
  const player2Scorecard = scorecards[1];
  const player1Wins = matchResults.scorecardIdToTotalHolesWon[
    player1Scorecard.scorecardId
  ]
    ? matchResults.scorecardIdToTotalHolesWon[player1Scorecard.scorecardId]
    : 0;
  const player2Wins = matchResults.scorecardIdToTotalHolesWon[
    player2Scorecard.scorecardId
  ]
    ? matchResults.scorecardIdToTotalHolesWon[player2Scorecard.scorecardId]
    : 0;

  // tie
  if (player1Wins === player2Wins) {
    setBetResultToBetsLeaderboard(
      betsLeaderboard,
      player1Scorecard.userId,
      betId,
      0
    );
    setBetResultToBetsLeaderboard(
      betsLeaderboard,
      player2Scorecard.userId,
      betId,
      0
    );
  } else if (player1Wins > player2Wins) {
    setBetResultToBetsLeaderboard(
      betsLeaderboard,
      player1Scorecard.userId,
      betId,
      wager
    );
    setBetResultToBetsLeaderboard(
      betsLeaderboard,
      player2Scorecard.userId,
      betId,
      -1 * wager
    );
  } else {
    setBetResultToBetsLeaderboard(
      betsLeaderboard,
      player1Scorecard.userId,
      betId,
      -1 * wager
    );
    setBetResultToBetsLeaderboard(
      betsLeaderboard,
      player2Scorecard.userId,
      betId,
      wager
    );
  }

  batch.set(betsLeaderboardRef, betsLeaderboard, { merge: true });
  batch.commit();
}

/**
 * Updates the database with information based on the results
 *
 * @param betId
 * @param eventId
 * @param scorecards
 * @param skinsResults
 * @param wager
 */
export async function updateBetLeaderBoardWithSkinsResults(
  betId: string,
  eventId: string,
  scorecards: Scorecard[],
  skinsResults: SkinsBetResults,
  wager: number
) {
  const batch = appFirestore.batch();
  // update bet
  const betRef = appFirestore.collection('bets').doc(betId);
  const updatedBet: Partial<Bet> = {
    betResults: skinsResults,
  };
  batch.set(betRef, updatedBet, { merge: true });

  // look up map
  const scorecardIdToUserIdMap = new Map<string, string>();
  for (let i = 0; i < scorecards.length; i++) {
    const scorecard = scorecards[i];
    scorecardIdToUserIdMap.set(scorecard.scorecardId, scorecard.userId);
  }

  // update leaderboard
  const betsLeaderboard: BetsLeaderBoard = {
    eventId: eventId,
    betSummary: {},
  };
  const betsLeaderboardRef = appFirestore
    .collection('bet-leaderboards')
    .doc(eventId);

  // calculate skins
  const totalSkins = Object.keys(skinsResults.resultsPerHole).length;
  const userIds = scorecards.map((scorecard) => scorecard.userId);
  // no skins
  if (totalSkins === 0) {
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      setBetResultToBetsLeaderboard(betsLeaderboard, userId, betId, 0);
    }
  } else {
    const skinsPot = scorecards.length * wager;
    // update winners
    const winnerScorcardIds = Object.keys(skinsResults.scorecardIdToTotalSkins);
    for (let i = 0; i < winnerScorcardIds.length; i++) {
      const scorecardId = winnerScorcardIds[i];
      const skinsWon = skinsResults.scorecardIdToTotalSkins[scorecardId];
      const userId = scorecardIdToUserIdMap.get(scorecardId);
      if (userId) {
        const winnings = (skinsWon / totalSkins) * skinsPot;
        setBetResultToBetsLeaderboard(
          betsLeaderboard,
          userId,
          betId,
          winnings - wager
        );
      }
    }
    // update losers
    for (let i = 0; i < scorecards.length; i++) {
      const scorecard = scorecards[i];
      const scorecardId = scorecard.scorecardId;
      if (!skinsResults.scorecardIdToTotalSkins[scorecardId]) {
        const userId = scorecardIdToUserIdMap.get(scorecardId);
        if (userId) {
          setBetResultToBetsLeaderboard(
            betsLeaderboard,
            userId,
            betId,
            -1 * wager
          );
        }
      }
    }
  }

  batch.set(betsLeaderboardRef, betsLeaderboard, { merge: true });
  batch.commit();
}
