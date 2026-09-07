import { useState, useEffect, useCallback } from 'react';

export type RatingVotes = Record<string, number>;

export interface MovieRatingData {
  votes: RatingVotes;
}

export interface RatingTierDistribution {
  stars: string;
  numericStars: number;
  count: number;
  percentage: number;
}

export interface UseMovieRatingReturn {
  votes: RatingVotes;
  totalVotes: number;
  averageRating: number;
  formattedAverage: string;
  satisfactionScore: number;
  satisfactionBadge: string;
  satisfactionColor: string;
  starColor: string;
  distribution: RatingTierDistribution[];
  submitRating: (starValue: number | string) => void;
  resetRating: () => void;
}

const INITIAL_VOTES: RatingVotes = {
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

export const getStorageKey = (movieId: string | number): string => `critics_score_${movieId}`;

export const getMovieRatingData = (movieId?: string | number): MovieRatingData => {
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

export const getMovieRatingSummary = (
  movieId?: string | number
): { totalVotes: number; averageRating: number; hasVotes: boolean } => {
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

export const useMovieRating = (movieId?: string | number): UseMovieRatingReturn => {
  const [votes, setVotes] = useState<RatingVotes>(() => getMovieRatingData(movieId).votes);

  const reloadData = useCallback(() => {
    setVotes(getMovieRatingData(movieId).votes);
  }, [movieId]);

  useEffect(() => {
    reloadData();

    const handleRatingUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (
        !customEvent.detail ||
        customEvent.detail.all ||
        String(customEvent.detail.movieId) === String(movieId)
      ) {
        reloadData();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (
        !event.key ||
        (movieId && event.key === getStorageKey(movieId)) ||
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
    (starValue: number | string) => {
      if (!movieId) return;
      const key = String(starValue);
      const currentData = getMovieRatingData(movieId);
      const newVotes: RatingVotes = {
        ...currentData.votes,
        [key]: (currentData.votes[key] || 0) + 1,
      };

      try {
        localStorage.setItem(getStorageKey(movieId), JSON.stringify({ votes: newVotes }));
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
    if (!movieId) return;
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

  Object.entries(votes).forEach(([starStr, count]) => {
    const numVotes = Number(count) || 0;
    const starNum = parseFloat(starStr);
    totalVotes += numVotes;
    weightedSum += starNum * numVotes;
  });

  const averageRating = totalVotes > 0 ? weightedSum / totalVotes : 0;
  const formattedAverage = totalVotes > 0 ? averageRating.toFixed(1) : '0.0';

  const satisfactionScore = totalVotes > 0 ? Math.round((averageRating / 5) * 100) : 0;

  let satisfactionBadge = 'Low';
  let satisfactionColor = '#f43f5e';
  if (satisfactionScore >= 70) {
    satisfactionBadge = 'Excellent';
    satisfactionColor = '#10b981';
  } else if (satisfactionScore >= 50) {
    satisfactionBadge = 'Average';
    satisfactionColor = '#f59e0b';
  }

  let starColor = 'var(--color-star-empty)';
  if (totalVotes > 0) {
    if (averageRating < 3.0) {
      starColor = 'var(--color-star-bad)';
    } else if (averageRating <= 3.5) {
      starColor = 'var(--color-star-avg)';
    } else {
      starColor = 'var(--color-star-good)';
    }
  }

  const distribution: RatingTierDistribution[] = TIERS.map(tier => {
    const count = votes[tier] || 0;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
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
