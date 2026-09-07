export interface RatingDistribution {
  [star: number]: number;
}

export interface CriticRatingData {
  score: number;
  count: number;
  userRating?: number | null;
  distribution?: RatingDistribution;
}
