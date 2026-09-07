export interface PageSessionData<T = any> {
  filterKey?: string;
  scrollY?: number;
  page?: number;
  totalPages?: number;
  moviesArr?: T[];
  movies?: T[];
  totalItems?: number;
  timestamp?: number;
  [key: string]: any;
}
