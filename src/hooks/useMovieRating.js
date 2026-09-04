import { useState, useEffect, useCallback } from 'react';

const INITIAL_VOTES = {
  '0.5': 0,
  '1': 0,
  '1.5': 0,
  '2': 0,
  '2.5': 0,
  '3': 0,
  '3.5': 0,
  '4': 0,
  '4.5': 0,
  '5': 0,
};

const TIERS = ['5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1', '0.5'];

export const getStorageKey = movieId => `critics_score_${movieId}`;

export const getMovieRatingData = movieId => {
  if (!movieId) return { votes: { ...INITIAL_VOTES } };
  try {
    const raw = localStorage.getItem(getStorageKey(movieId));
    if (!raw) return { votes: { ...INITIAL_VOTES } };
    const parsed = JSON.parse(raw);
    return {
      votes: {
        ...INITIAL_VOTES,
        ...(parsed.votes || {}),
      },
    };
  } catch (error) {
    console.error('Failed to read rating from localStorage:', error);
    return { votes: { ...INITIAL_VOTES } };
  }
};

export const getMovieRatingSummary = movieId => {
  const { votes } = getMovieRatingData(movieId);
  let totalVotes = 0;
  let weightedSum = 0;

  Object.entries(votes).forEach(([starStr, count]) => {
    const numVotes = Number(count) || 0;
    totalVotes += numVotes;
    weightedSum += parseFloat(starStr) * numVotes;
  });

  const averageRating = totalVotes > 0 ? weightedSum / totalVotes : 0;
  return {
    totalVotes,
    averageRating: totalVotes > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
    hasVotes: totalVotes > 0,
  };
};

export const useMovieRating = movieId => {
  const [votes, setVotes] = useState(() => getMovieRatingData(movieId).votes);

  const reloadData = useCallback(() => {
    setVotes(getMovieRatingData(movieId).votes);
  }, [movieId]);

  useEffect(() => {
    reloadData();

    const handleRatingUpdate = event => {
      if (
        !event.detail ||
        event.detail.all ||
        String(event.detail.movieId) === String(movieId)
      ) {
        reloadData();
      }
    };

    const handleStorageChange = event => {
      if (
        !event.key ||
        event.key === getStorageKey(movieId) ||
        event.key.startsWith('critics_score_')
      ) {
        reloadData();
      }
    };

    window.addEventListener('critics_score_updated', handleRatingUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('critics_score_updated', handleRatingUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [movieId, reloadData]);

  const submitRating = useCallback(
    starValue => {
      const key = String(starValue);
      const currentData = getMovieRatingData(movieId);
      const newVotes = {
        ...currentData.votes,
        [key]: (currentData.votes[key] || 0) + 1,
      };

      try {
        localStorage.setItem(
          getStorageKey(movieId),
          JSON.stringify({ votes: newVotes })
        );
        setVotes(newVotes);
        window.dispatchEvent(
          new CustomEvent('critics_score_updated', {
            detail: { movieId },
          })
        );
      } catch (error) {
        console.error('Failed to save rating to localStorage:', error);
      }
    },
    [movieId]
  );

  const resetRating = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(movieId));
      setVotes({ ...INITIAL_VOTES });
      window.dispatchEvent(
        new CustomEvent('critics_score_updated', {
          detail: { movieId },
        })
      );
    } catch (error) {
      console.error('Failed to reset rating in localStorage:', error);
    }
  }, [movieId]);

  // Calculations
  let totalVotes = 0;
  let weightedSum = 0;
  let positiveVotes = 0; // votes >= 4.0

  Object.entries(votes).forEach(([starStr, count]) => {
    const numVotes = Number(count) || 0;
    const starNum = parseFloat(starStr);
    totalVotes += numVotes;
    weightedSum += starNum * numVotes;
    if (starNum >= 4.0) {
      positiveVotes += numVotes;
    }
  });

  const averageRating = totalVotes > 0 ? weightedSum / totalVotes : 0;
  const formattedAverage = totalVotes > 0 ? averageRating.toFixed(1) : '0.0';

  const satisfactionScore =
    totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0;

  let satisfactionBadge = 'Low';
  let satisfactionColor = '#f43f5e';
  if (satisfactionScore >= 70) {
    satisfactionBadge = 'Excellent';
    satisfactionColor = '#10b981';
  } else if (satisfactionScore >= 40) {
    satisfactionBadge = 'Average';
    satisfactionColor = '#f59e0b';
  }

  let starColor = 'var(--color-star-empty)';
  if (totalVotes > 0) {
    if (averageRating < 3.0) {
      starColor = 'var(--color-star-bad)'; // #f43f5e
    } else if (averageRating <= 3.5) {
      starColor = 'var(--color-star-avg)'; // #f59e0b
    } else {
      starColor = 'var(--color-star-good)'; // #10b981
    }
  }

  const distribution = TIERS.map(tier => {
    const count = votes[tier] || 0;
    const percentage =
      totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return {
      stars: tier,
      numericStars: parseFloat(tier),
      count,
      percentage,
    };
  });

  return {
    votes,
    totalVotes,
    averageRating: parseFloat(formattedAverage),
    formattedAverage,
    satisfactionScore,
    satisfactionBadge,
    satisfactionColor,
    starColor,
    distribution,
    submitRating,
    resetRating,
  };
};

export default useMovieRating;
