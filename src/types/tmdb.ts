export interface Genre {
  id: number;
  name: string;
}

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv' | 'all';
  genre_ids?: number[];
  genres?: Genre[];
  popularity?: number;
  ageRating?: string;
  [key: string]: any;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface MovieDetails extends MediaItem {
  budget?: number;
  revenue?: number;
  runtime?: number;
  status?: string;
  tagline?: string;
  homepage?: string;
  imdb_id?: string;
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  spoken_languages?: SpokenLanguage[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface CastMember {
  id: number;
  name: string;
  original_name?: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
  cast_id?: number;
  credit_id?: string;
  gender?: number;
  known_for_department?: string;
}

export interface ReviewAuthorDetails {
  name?: string;
  username?: string;
  avatar_path?: string | null;
  rating?: number | null;
}

export interface Review {
  id: string;
  author: string;
  author_details?: ReviewAuthorDetails;
  content: string;
  created_at: string;
  updated_at?: string;
  url?: string;
}

export interface VideoTrailer {
  id: string;
  key: string;
  name: string;
  site: string;
  size?: number;
  type: string;
  official?: boolean;
  published_at?: string;
  iso_639_1?: string;
  iso_3166_1?: string;
}

export interface ImageItem {
  file_path: string;
  aspect_ratio?: number;
  height?: number;
  width?: number;
  vote_average?: number;
  vote_count?: number;
}

export interface MediaImages {
  backdrops: ImageItem[];
  posters: ImageItem[];
  logos?: ImageItem[];
}

export interface TMDBResponse<T = MediaItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
