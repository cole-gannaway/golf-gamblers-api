import {
  MatchPlayBetResults,
  Scorecard,
  SkinsBetResults,
} from 'golf-gamblers-model';

/** Used to for comparison, an absurdly high amount of strokes per hole*/
const MAX_STROKES_PER_HOLE = 1000;

export async function calculateSkinsResults(scorecards: Scorecard[]) {
  // skins is the lowest bet per hole
  const skinsResults: SkinsBetResults = {
    resultsPerHole: {},
    scorecardIdToTotalSkins: {},
  };

  // calculate results per hole
  for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
    let minStrokes = MAX_STROKES_PER_HOLE;
    for (let j = 0; j < scorecards.length; j++) {
      // get hole
      const scorecard = scorecards[j];
      const hole = scorecard.holes[holeNumber];
      if (hole) {
        // compare strokes to lowest strokes
        const strokes = hole.strokes;
        if (strokes < minStrokes) {
          minStrokes = strokes;
          skinsResults.resultsPerHole[holeNumber] = {
            scorecardId: scorecard.scorecardId,
          };
        }
        // no ties allowed in skins
        else if (strokes === minStrokes) {
          // remove skin from results
          delete skinsResults.resultsPerHole[holeNumber];
        }
      }
    }
  }

  // sum up winners based on the results per hole
  for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
    const result = skinsResults.resultsPerHole[holeNumber];
    if (result) {
      const total = skinsResults.scorecardIdToTotalSkins[result.scorecardId];
      if (!total) skinsResults.scorecardIdToTotalSkins[result.scorecardId] = 1;
      else skinsResults.scorecardIdToTotalSkins[result.scorecardId] = total + 1;
    }
  }

  return skinsResults;
}

export async function calculateMatchPlayResults(scorecards: Scorecard[]) {
  // match play is the lowest score per hole
  const matchResults: MatchPlayBetResults = {
    resultsPerHole: {},
    scorecardIdToTotalHolesWon: {},
  };
  for (let holeIndex = 0; holeIndex < 18; holeIndex++) {
    let minStrokes = MAX_STROKES_PER_HOLE;
    // who is lowest
    for (let j = 0; j < scorecards.length; j++) {
      const scorecard = scorecards[j];
      const holeNumber = holeIndex + 1;
      const hole = scorecard.holes[holeNumber];
      if (hole) {
        const strokes = hole.strokes;
        if (strokes < minStrokes) {
          minStrokes = strokes;
          matchResults.resultsPerHole[holeNumber] = {
            scorecardId: scorecard.scorecardId,
          };
        }
        // no ties allowed in match play
        else if (strokes === minStrokes) {
          delete matchResults.resultsPerHole[holeNumber];
        }
      }
    }
  }

  // sum up winners based on the results per hole
  for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
    const result = matchResults.resultsPerHole[holeNumber];
    if (result) {
      const total = matchResults.scorecardIdToTotalHolesWon[result.scorecardId];
      if (!total)
        matchResults.scorecardIdToTotalHolesWon[result.scorecardId] = 1;
      else
        matchResults.scorecardIdToTotalHolesWon[result.scorecardId] = total + 1;
    }
  }

  return matchResults;
}
