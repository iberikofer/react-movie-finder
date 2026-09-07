export type AgeRating = 'all' | '0+' | '6+' | '12+' | '16+' | '18+';

export type MediaTypeFilter = 'all' | 'movie' | 'tv';

export type SortByOption =
  | 'popularity.desc'
  | 'popularity.asc'
  | 'vote_average.desc'
  | 'vote_average.asc'
  | 'primary_release_date.desc'
  | 'primary_release_date.asc'
  | 'title.asc'
  | 'title.desc'
  | string;

export interface DiscoverParams {
  type?: MediaTypeFilter;
  genreIds?: number[];
  age?: string;
  sortBy?: SortByOption;
  page?: number;
  primaryReleaseYear?: string | number;
  voteCountGte?: number;
}
