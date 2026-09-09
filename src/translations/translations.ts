export type Language = 'en' | 'uk';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    uk: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  'nav.home': {
    en: 'Home',
    uk: 'Головна',
  },
  'nav.search': {
    en: 'Search',
    uk: 'Пошук',
  },
  'nav.trending': {
    en: 'Trending',
    uk: 'Трендові',
  },
  'nav.saved': {
    en: 'Saved',
    uk: 'Збережені',
  },

  // Header
  'header.clearAllRatings': {
    en: 'Clear ALL Ratings',
    uk: 'Очистити всі оцінки',
  },
  'header.confirmClearAll': {
    en: 'Confirm Clearing ALL Ratings',
    uk: 'Підтвердити очищення оцінок',
  },
  'header.ratingsDeleted': {
    en: 'All ratings deleted',
    uk: 'Усі оцінки видалено',
  },
  'header.offlineMode': {
    en: 'Offline Mode',
    uk: 'Офлайн режим',
  },
  'header.navAria': {
    en: 'Main navigation',
    uk: 'Головна навігація',
  },

  // Home Page
  'home.heroTitle': {
    en: 'Discover Movies with Precision Critics Scoring & Cinematic Elegance',
    uk: 'Відкрийте світ кіно з точною системою оцінювання та кінематографічною елегантністю',
  },
  'home.heroSubtitle': {
    en: 'MovieFinder combines real-time TMDB film intelligence with a bespoke 5-star community analytics engine, smooth animations, and an uninterrupted emerald-and-cherry ambient experience.',
    uk: 'MovieFinder поєднує аналітику фільмів TMDB у реальному часі, фірмову 5-зіркову систему глядацьких оцінок, плавні анімації та атмосферний інтерфейс.',
  },
  'home.loading': {
    en: 'Loading home...',
    uk: 'Завантаження головної сторінки...',
  },
  'home.statMovies': {
    en: 'TMDB Movies & Series',
    uk: 'Фільмів та серіалів TMDB',
  },
  'home.statScoring': {
    en: 'Half-Star Scoring Engine',
    uk: '5-зіркова система оцінювання',
  },
  'home.statGenres': {
    en: 'Curated Genre Filters',
    uk: 'Фільтрів за жанрами',
  },
  'home.statSync': {
    en: 'Cross-Tab Synced',
    uk: 'Синхронізація вкладок',
  },
  'home.featuresCategory': {
    en: 'Next-Gen Architecture',
    uk: 'Сучасна архітектура',
  },
  'home.featuresTitle': {
    en: 'Engineered for Cinephiles',
    uk: 'Створено для кіноманів',
  },
  'home.featuresSubtitle': {
    en: 'Every interaction is tuned for rapid exploration, deep filmography analysis, and seamless cross-tab synchronization.',
    uk: 'Кожна деталь оптимізована для швидкого пошуку, глибокого аналізу фільмографії та миттєвої синхронізації між вкладками.',
  },
  'home.f1Title': {
    en: 'Dual Scoring Analytics',
    uk: 'Аналітика подвійного оцінювання',
  },
  'home.f1Text': {
    en: 'Toggle between TMDB\'s global 10-point scale and our 5-star precision critic engine with granular 0.5-star half-step resolution.',
    uk: 'Перемикайтеся між глобальною 10-бальною шкалою TMDB та нашою 5-зірковою системою оцінок із точністю до півзірки (0.5).',
  },
  'home.f1i1': {
    en: 'Instant mathematical mapping between systems',
    uk: 'Миттєве математичне перетворення оцінок',
  },
  'home.f1i2': {
    en: 'Interactive star-rating input for personal ratings',
    uk: 'Інтерактивне виставлення власних оцінок',
  },
  'home.f1i3': {
    en: 'Dynamic rating distribution breakdown tab',
    uk: 'Динамічний графік розподілу оцінок спільноти',
  },
  'home.f2Title': {
    en: 'Personal Saved Watchlist',
    uk: 'Персональний список збережених',
  },
  'home.f2Text': {
    en: 'Bookmark movies & TV series with a single click directly from poster cards or right beside the title in details view.',
    uk: 'Додавайте фільми та серіали до збережених в один клік прямо з карток або на сторінці деталей.',
  },
  'home.f2i1': {
    en: 'Live header counter badge updated instantly',
    uk: 'Лічильник у шапці оновлюється миттєво',
  },
  'home.f2i2': {
    en: 'Category filtering (All, Movies, TV Series)',
    uk: 'Фільтрація за форматом (Усі, Фільми, Серіали)',
  },
  'home.f2i3': {
    en: '2-step safe clear confirmation protection',
    uk: 'Двоетапне безпечне підтвердження очищення',
  },
  'home.f3Title': {
    en: 'Unified Multi-Filter Suite',
    uk: 'Універсальний набір мульти-фільтрів',
  },
  'home.f3Text': {
    en: 'Discover movies and series with interactive filter dropdowns, multi-genre picking, and age certifications.',
    uk: 'Знаходьте фільми за допомогою інтерактивних фільтрів, вибору кількох жанрів та вікових категорій.',
  },
  'home.f3i1': {
    en: 'Format selector (Movies / Series / All) with badge badges',
    uk: 'Вибір формату (Фільми / Серіали / Усі) з бейджами',
  },
  'home.f3i2': {
    en: 'Multi-genre modal with quick Done confirmation and search',
    uk: 'Зручний вибір декількох жанрів з підтвердженням',
  },
  'home.f3i3': {
    en: 'Age certifications (0+, 6+, 12+, 16+, 18+) & multi-order sorting',
    uk: 'Вікові рейтинги (0+, 6+, 12+, 16+, 18+) та сортування',
  },
  'home.f4Title': {
    en: 'Cinematic Lightbox & Media Hub',
    uk: 'Кінематографічна галерея та медіа-хаб',
  },
  'home.f4Text': {
    en: 'Deep-dive into each title with high-definition backdrop galleries, multi-clip video hub, streaming providers, and comprehensive crew information.',
    uk: 'Занурюйтеся у фільми завдяки галереї фотографій високої якості, відеоплеєру трейлерів та кліпів, сервісам перегляду та знімальній групі.',
  },
  'home.f4i1': {
    en: 'Keyboard-navigable (Esc / Arrows) modal photo lightbox',
    uk: 'Зручний повноекранний перегляд фотографій (Esc / Стрілки)',
  },
  'home.f4i2': {
    en: 'Embedded YouTube video hub with multi-clip selector (trailers, teasers, featurettes)',
    uk: 'Вбудований відеоплеєр YouTube з вибором роликів (трейлери, тизери, бекстейдж)',
  },
  'home.f4i3': {
    en: 'Where to Watch streaming providers, cast directory & community reviews',
    uk: 'Сервіси перегляду (де дивитися), акторський склад та відгуки спільноти',
  },
  'home.f5Title': {
    en: 'Zero-Latency Sync Bus',
    uk: 'Миттєва міжвкладкова синхронізація',
  },
  'home.f5Text': {
    en: 'Rate a film or bookmark a title in one window and watch your dashboard update instantaneously across all other browser tabs.',
    uk: 'Оцініть фільм або збережіть його в одній вкладці — і список оновиться в усіх відкритих вкладках браузера без затримок.',
  },
  'home.f5i1': {
    en: 'Cross-window DOM event dispatching',
    uk: 'Синхронізація DOM-подій між вікнами',
  },
  'home.f5i2': {
    en: 'Resilient LocalStorage fallback with automatic re-indexing',
    uk: 'Надійне збереження у LocalStorage з автоматичною індексацією',
  },
  'home.f5i3': {
    en: 'Zero network overhead for local state changes',
    uk: 'Нульове навантаження на мережу для локальних змін',
  },
  'home.f6Title': {
    en: 'Session Restoration & Atmosphere',
    uk: 'Збереження сесії та позиції скролу',
  },
  'home.f6Text': {
    en: 'Seamless session persistence remembers accumulated pagination, movie lists, and exact scroll position when returning from details.',
    uk: 'Система запам\'ятовує завантажені сторінки, список фільмів і точну позицію скролу при поверненні з деталей фільму.',
  },
  'home.f6i1': {
    en: 'Automatic scroll restoration for Trending & Search',
    uk: 'Автоматичне відновлення скролу для Трендів і Пошуку',
  },
  'home.f6i2': {
    en: 'Synchronized to real-world epoch time (never resets on F5)',
    uk: 'Синхронізація з реальними часовими мітками (не скидається при F5)',
  },
  'home.f6i3': {
    en: 'Anti-jitter clapperboard loader with 0.5s stabilization',
    uk: 'Плавний кіно-лоадер зі стабілізацією відображення',
  },
  'home.dbNoticeTitle': {
    en: 'Database & Metadata Completeness',
    uk: 'Повнота даних та особливості бази TMDB',
  },
  'home.dbNoticeText': {
    en: 'Movie and series information is sourced dynamically in real time from the open community database The Movie Database (TMDB). Due to the crowdsourced nature and varying coverage of upstream records, details for certain specific titles (such as synopsis translations, complete cast rosters, production budgets, trailers, or age certifications) may occasionally be incomplete or partially unavailable.',
    uk: 'Інформація про фільми та серіали завантажується в реальному часі з відкритої спільної бази The Movie Database (TMDB). Через особливості глобального наповнення бази, відомості про окремі тайтли (зокрема наявність українського опису, повного акторського складу, бюджету, трейлерів або вікових рейтингів) можуть бути неповними або тимчасово відсутніми.',
  },
  'home.dbNoticeSorting': {
    en: '⚠️ Alphabetical Sorting Note: Because many catalog entries in TMDB lack complete Ukrainian title localization (frequently retaining English or original-language titles, causing mixed-alphabet ordering), alphabetical sorting (\'A–Z\' / \'Z–A\') is intentionally disabled in Ukrainian to prevent inconsistent results. Both sorting modes remain fully active in the English interface.',
    uk: '⚠️ Сортування за алфавітом («А–Я» / «Я–А»): через те, що значна частина фільмів у базі TMDB не має повної української локалізації (назви залишаються англійською або мовою оригіналу, що спричиняє змішування мов), сортування за алфавітом в українській версії навмисно вимкнено для запобігання плутанині та некоректному порядку видачі. В англійській локалізації обидва режими доступні повноцінно.',
  },
  'home.techTitle': {
    en: 'Built with Modern Web Technologies',
    uk: 'Створено з використанням сучасних веб-технологій',
  },
  'home.ctaTitle': {
    en: 'Ready to Find Your Next Movie?',
    uk: 'Готові знайти свій наступний фільм?',
  },
  'home.ctaDesc': {
    en: 'Explore the latest trending films, search across TMDB\'s massive library, or organize your personal watchlist.',
    uk: 'Переглядайте свіжі трендові фільми, шукайте серед величезної бібліотеки TMDB або формуйте персональний список для перегляду.',
  },
  'home.exploreTrending': {
    en: '🔥 Explore Trending Now',
    uk: '🔥 Переглянути трендові',
  },
  'home.searchTitles': {
    en: '🔍 Search Titles',
    uk: '🔍 Знайти тайтли',
  },
  'home.myWatchlist': {
    en: '🔖 My Saved Watchlist',
    uk: '🔖 Мій список збережених',
  },

  // Search & Filters
  'search.title': {
    en: 'Search Movies & TV Shows',
    uk: 'Пошук фільмів та серіалів',
  },
  'search.subtitle': {
    en: 'Explore hundreds of thousands of titles from TMDB library.',
    uk: 'Досліджуйте сотні тисяч фільмів та серіалів з бібліотеки TMDB.',
  },
  'search.placeholder': {
    en: 'Search movies, TV shows, actors...',
    uk: 'Шукайте фільми, серіали, акторів...',
  },
  'search.searching': {
    en: 'Searching...',
    uk: 'Шукаємо...',
  },
  'search.all': {
    en: 'All',
    uk: 'Усі',
  },
  'search.movies': {
    en: 'Movies',
    uk: 'Фільми',
  },
  'search.tvShows': {
    en: 'TV Shows',
    uk: 'Серіали',
  },
  'search.people': {
    en: 'People',
    uk: 'Актори',
  },
  'search.loadMore': {
    en: 'Load More Titles',
    uk: 'Завантажити ще',
  },
  'search.noResults': {
    en: 'No results found',
    uk: 'Нічого не знайдено',
  },
  'search.noResultsDesc': {
    en: 'Try adjusting your search query, format, genres, or age filters.',
    uk: 'Спробуйте змінити пошуковий запит, формат, жанри або вікові фільтри.',
  },
  'search.loading': {
    en: 'Loading search...',
    uk: 'Завантаження пошуку...',
  },
  'search.searchingFor': {
    en: 'Searching for "{query}"...',
    uk: 'Пошук за запитом "{query}"...',
  },
  'search.filteringTitles': {
    en: 'Loading titles matching filters...',
    uk: 'Завантаження фільмів за фільтрами...',
  },
  'search.clearSearch': {
    en: 'Clear search',
    uk: 'Очистити пошук',
  },
  'search.clearSearchInput': {
    en: 'Clear search input',
    uk: 'Очистити поле пошуку',
  },

  // Trending
  'trending.title': {
    en: 'Today’s Trending',
    uk: 'Сьогодні в трендах',
  },
  'trending.subtitle': {
    en: 'The hottest movies and series captivating audiences worldwide right now.',
    uk: 'Найгарячіші фільми та серіали, які дивляться у всьому світі просто зараз.',
  },
  'trending.loadMore': {
    en: 'Load More Trending',
    uk: 'Завантажити ще тренди',
  },
  'trending.loading': {
    en: 'Loading trending titles...',
    uk: 'Завантаження трендових тайтлів...',
  },
  'trending.filtering': {
    en: 'Filtering trending titles...',
    uk: 'Фільтрація трендових тайтлів...',
  },

  // Filter Bar Options & Labels
  'filter.format': {
    en: 'Format',
    uk: 'Формат',
  },
  'filter.allTypes': {
    en: 'All Types',
    uk: 'Усі формати',
  },
  'filter.genres': {
    en: 'Genres',
    uk: 'Жанри',
  },
  'filter.sortBy': {
    en: 'Sort By',
    uk: 'Сортування',
  },
  'filter.age': {
    en: 'Age',
    uk: 'Вік',
  },
  'filter.allAges': {
    en: 'All Ages',
    uk: 'Будь-який вік',
  },
  'filter.clearFilters': {
    en: 'Clear Filters',
    uk: 'Скинути фільтри',
  },
  'filter.done': {
    en: 'Done',
    uk: 'Готово',
  },
  'filter.selectGenres': {
    en: 'Select Genres',
    uk: 'Вибір жанрів',
  },
  'filter.allGenres': {
    en: 'All genres',
    uk: 'Усі жанри',
  },
  'filter.nSelected': {
    en: '{n} selected',
    uk: 'Обрано: {n}',
  },
  'filter.clearGenres': {
    en: 'Clear genres',
    uk: 'Очистити жанри',
  },
  'filter.genreSelectionAria': {
    en: 'Genre Selection',
    uk: 'Вибір жанрів',
  },
  'filter.closeGenresAria': {
    en: 'Close genres popup',
    uk: 'Закрити вибір жанрів',
  },
  'filter.resetActiveTitle': {
    en: 'Click to reset all filters',
    uk: 'Натисніть, щоб скинути всі фільтри',
  },
  'filter.resetDefaultTitle': {
    en: 'Reset filters to default',
    uk: 'Скинути фільтри до початкових',
  },
  'filter.resetAria': {
    en: 'Reset all filters',
    uk: 'Скинути всі фільтри',
  },
  'filter.ariaMediaType': {
    en: 'Filter by media type',
    uk: 'Фільтрувати за типом медіа',
  },
  'filter.ariaGenres': {
    en: 'Filter by genres',
    uk: 'Фільтрувати за жанрами',
  },
  'filter.ariaAgeRating': {
    en: 'Filter by age rating',
    uk: 'Фільтрувати за віковим рейтингом',
  },
  'filter.ariaSort': {
    en: 'Sort movies',
    uk: 'Сортувати фільми',
  },
  'filter.resetAllGenresTitle': {
    en: 'Reset all genre filters',
    uk: 'Скинути всі фільтри жанрів',
  },
  'filter.removeGenreTitle': {
    en: 'Remove {genre} filter',
    uk: 'Прибрати фільтр {genre}',
  },
  'filter.addGenreTitle': {
    en: 'Add {genre} to filter',
    uk: 'Додати {genre} до фільтра',
  },
  'filter.ariaGenreToolbar': {
    en: 'Filter movies by genre',
    uk: 'Панель вибору жанрів',
  },
  'filter.popularityDesc': {
    en: 'Most Popular',
    uk: 'Найпопулярніші',
  },
  'filter.ratingDesc': {
    en: 'Highest Rated',
    uk: 'Найвищий рейтинг',
  },
  'filter.releaseDesc': {
    en: 'Newest First',
    uk: 'Найновіші',
  },
  'filter.titleAZ': {
    en: 'Title (A-Z)',
    uk: 'Назва (А-Я)',
  },
  'filter.titleZA': {
    en: 'Title (Z-A)',
    uk: 'Назва (Я-А)',
  },
  'filter.dateAddedNewest': {
    en: 'Date Added (Newest)',
    uk: 'Спочатку нові',
  },
  'filter.dateAddedOldest': {
    en: 'Date Added (Oldest)',
    uk: 'Спочатку давні',
  },
  'filter.releaseDate': {
    en: 'Release Date',
    uk: 'Дата виходу',
  },

  // Movie Details
  'movie.goBack': {
    en: 'Go back',
    uk: 'Назад',
  },
  'movie.translating': {
    en: 'Translating movie details...',
    uk: 'Оновлення перекладу фільму...',
  },
  'movie.translatingSlate': {
    en: 'TRANSLATE',
    uk: 'ПЕРЕКЛАД',
  },
  'movie.overview': {
    en: 'Overview',
    uk: 'Опис',
  },
  'movie.genres': {
    en: 'Genres',
    uk: 'Жанри',
  },
  'movie.noOverview': {
    en: 'No overview available.',
    uk: 'Опис наразі відсутній.',
  },
  'movie.noGenres': {
    en: 'No genres specified',
    uk: 'Жанри не вказані',
  },
  'movie.criticsRating': {
    en: 'Critics Rating',
    uk: 'Рейтинг критиків',
  },
  'movie.viewCriticsRating': {
    en: 'View Critics Rating breakdown ↗',
    uk: 'Переглянути деталі рейтингу критиків ↗',
  },
  'movie.movieInfo': {
    en: 'Movie Info',
    uk: 'Про фільм',
  },
  'movie.showInfo': {
    en: 'Show Info',
    uk: 'Про серіал',
  },
  'movie.officialTrailer': {
    en: 'Trailers & Videos',
    uk: 'Трейлери та відео',
  },
  'movie.castAndCrew': {
    en: 'Cast & Crew',
    uk: 'Актори та творці',
  },
  'movie.communityReviews': {
    en: 'Community Reviews',
    uk: 'Відгуки глядачів',
  },
  'movie.similarMovies': {
    en: 'Similar Movies',
    uk: 'Схожі фільми',
  },
  'movie.similarShows': {
    en: 'Similar Shows',
    uk: 'Схожі серіали',
  },
  'movie.resetRating': {
    en: 'Reset Rating',
    uk: 'Скинути оцінку',
  },
  'movie.firstToRate': {
    en: 'Be the first to rate!',
    uk: 'Будьте першим, хто оцінить!',
  },
  'movie.ratings': {
    en: 'ratings',
    uk: 'оцінок',
  },
  'movie.ratingOne': {
    en: 'rating',
    uk: 'оцінка',
  },
  'movie.satisfactionScore': {
    en: 'Satisfaction Score',
    uk: 'Індекс задоволеності',
  },
  'movie.satisfactionExcellent': {
    en: 'EXCELLENT',
    uk: 'ВІДМІННО',
  },
  'movie.satisfactionAverage': {
    en: 'AVERAGE',
    uk: 'СЕРЕДНЬО',
  },
  'movie.satisfactionLow': {
    en: 'LOW',
    uk: 'НИЗЬКО',
  },
  'movie.emptyRatingTitle': {
    en: 'No community ratings yet for this title.',
    uk: 'Для цього тайтлу ще немає оцінок глядачів.',
  },
  'movie.emptyRatingDesc': {
    en: 'Rate this title above to start the Critics Score distribution!',
    uk: 'Оцініть тайтл вище, щоб розпочати розподіл оцінок критиків!',
  },
  'movie.warningRuTitle': {
    en: 'Warning: russian-produced content!',
    uk: 'Увага: контент країни-агресора!',
  },
  'movie.warningRuText': {
    en: 'This title was produced in the terrorist state of russia. Do not support sponsors of war and terrorism — boycott russian media.',
    uk: 'Цей фільм чи серіал створено в державі-терористі росії. Не підтримуйте спонсорів війни та тероризму — бойкотуйте російський медіапростір.',
  },

  // Movie Info Tab
  'movieInfo.aboutMovieTitle': {
    en: 'Movie Info & Where to Watch',
    uk: 'Про фільм та де дивитися',
  },
  'movieInfo.aboutSeriesTitle': {
    en: 'Show Info & Where to Watch',
    uk: 'Про серіал та де дивитися',
  },
  'movieInfo.quickFacts': {
    en: 'Quick Facts',
    uk: 'Основні факти',
  },
  'movieInfo.tagline': {
    en: 'Tagline',
    uk: 'Слоган',
  },
  'movieInfo.ageRestriction': {
    en: 'Age Restriction',
    uk: 'Вікове обмеження',
  },
  'movieInfo.ageUnavailable': {
    en: 'Age rating currently unavailable',
    uk: 'Віковий рейтинг наразі недоступний',
  },
  'movieInfo.runtime': {
    en: 'Runtime',
    uk: 'Тривалість',
  },
  'movieInfo.variesByEpisode': {
    en: 'Varies by episode',
    uk: 'Залежить від епізоду',
  },
  'movieInfo.budget': {
    en: 'Budget',
    uk: 'Бюджет',
  },
  'movieInfo.tvBudget': {
    en: 'TV Series budget',
    uk: 'Бюджет серіалу',
  },
  'movieInfo.boxOffice': {
    en: 'Box Office Revenue',
    uk: 'Касові збори',
  },
  'movieInfo.tvRevenue': {
    en: 'Broadcast / Streaming',
    uk: 'Ефір / Стрімінг',
  },
  'movieInfo.status': {
    en: 'Status',
    uk: 'Статус',
  },
  'movieInfo.releaseDate': {
    en: 'Release Date',
    uk: 'Дата виходу',
  },
  'movieInfo.profitability': {
    en: 'Profitability & ROI',
    uk: 'Прибутковість та окупність',
  },
  'movieInfo.seasonsAndEpisodes': {
    en: 'Seasons & Episodes',
    uk: 'Сезони та серії',
  },
  'movieInfo.seasonOne': {
    en: 'Season',
    uk: 'сезон',
  },
  'movieInfo.seasonsFew': {
    en: 'Seasons',
    uk: 'сезони',
  },
  'movieInfo.seasonsMany': {
    en: 'Seasons',
    uk: 'сезонів',
  },
  'movieInfo.episodes': {
    en: 'Episodes',
    uk: 'серій',
  },
  'movieInfo.networks': {
    en: 'Original Networks',
    uk: 'Оригінальні телемережі',
  },
  'movieInfo.companies': {
    en: 'Production Companies',
    uk: 'Кінокомпанії',
  },
  'movieInfo.countries': {
    en: 'Production Countries',
    uk: 'Країни виробництва',
  },
  'movieInfo.language': {
    en: 'Original Language',
    uk: 'Мова оригіналу',
  },
  'movieInfo.homepage': {
    en: 'Official Website',
    uk: 'Офіційний сайт',
  },
  'movieInfo.visitWebsite': {
    en: 'Visit Site ↗',
    uk: 'Відвідати сайт ↗',
  },
  'movieInfo.noWebsite': {
    en: 'Not available',
    uk: 'Немає сайту',
  },
  'movieInfo.whereToWatch': {
    en: 'Where to Watch',
    uk: 'Де дивитися',
  },
  'movieInfo.region': {
    en: 'Region:',
    uk: 'Регіон:',
  },
  'movieInfo.stream': {
    en: 'Stream (Subscription)',
    uk: 'Стрімінг (підписка)',
  },
  'movieInfo.rent': {
    en: 'Rent',
    uk: 'Оренда',
  },
  'movieInfo.buy': {
    en: 'Buy',
    uk: 'Купівля',
  },
  'movieInfo.noProviders': {
    en: 'No streaming options currently reported for this region.',
    uk: 'Для цього регіону наразі немає відомостей про стрімінгові сервіси.',
  },
  'movieInfo.viewOnJustWatch': {
    en: 'View streaming options on JustWatch / TMDB',
    uk: 'Переглянути варіанти перегляду на JustWatch / TMDB',
  },
  'movieInfo.uaRegionNote': {
    en: '',
    uk: '* Україна тут з\'являється рідко, тому шукайте, будь ласка, самі =)',
  },
  'movieInfo.loading': {
    en: 'Loading movie facts & streaming providers...',
    uk: 'Завантаження інформації та сервісів перегляду...',
  },
  'movieInfo.unavailable': {
    en: 'Movie information is currently unavailable.',
    uk: 'Інформація про фільм наразі недоступна.',
  },
  'movieInfo.notDisclosed': {
    en: 'Not disclosed',
    uk: 'Не розголошується',
  },
  'movieInfo.unknown': {
    en: 'Unknown',
    uk: 'Невідомо',
  },
  'movieInfo.openProviderWebsite': {
    en: 'Open {provider} official website (opens in new tab)',
    uk: 'Відкрити офіційний сайт {provider} (у новій вкладці)',
  },
  'status.returningSeries': {
    en: 'Returning Series',
    uk: 'Триває',
  },
  'status.ended': {
    en: 'Ended',
    uk: 'Завершено',
  },
  'status.released': {
    en: 'Released',
    uk: 'Випущено',
  },
  'status.inProduction': {
    en: 'In Production',
    uk: 'У виробництві',
  },
  'status.postProduction': {
    en: 'Post Production',
    uk: 'Пост-продакшн',
  },
  'status.planned': {
    en: 'Planned',
    uk: 'Заплановано',
  },
  'status.canceled': {
    en: 'Canceled',
    uk: 'Скасовано',
  },
  'status.pilot': {
    en: 'Pilot',
    uk: 'Пілотний випуск',
  },

  // Trailer
  'trailer.loading': {
    en: 'Loading videos...',
    uk: 'Завантаження відеоматеріалів...',
  },
  'trailer.empty': {
    en: 'No videos available for this title yet.',
    uk: 'Відеоматеріали для цього тайтлу наразі відсутні.',
  },
  'trailer.selectVideo': {
    en: 'Available Videos:',
    uk: 'Доступні відео:',
  },
  'trailer.noTrailerAria': {
    en: 'No trailer',
    uk: 'Немає трейлера',
  },

  // Cast
  'cast.character': {
    en: 'Character:',
    uk: 'Роль:',
  },
  'cast.loading': {
    en: 'Loading cast & crew...',
    uk: 'Завантаження акторів та творців...',
  },
  'cast.noCast': {
    en: 'No information about the cast.',
    uk: 'Інформація про акторів наразі відсутня.',
  },

  // Reviews
  'reviews.author': {
    en: 'Author:',
    uk: 'Автор:',
  },
  'reviews.loading': {
    en: 'Loading reviews...',
    uk: 'Завантаження відгуків...',
  },
  'reviews.noReviews': {
    en: 'No reviews for this movie yet.',
    uk: 'Для цього тайтлу ще немає відгуків.',
  },

  // Similar
  'similar.loading': {
    en: 'Finding similar movies & series...',
    uk: 'Пошук схожих фільмів та серіалів...',
  },
  'similar.empty': {
    en: 'No similar titles found.',
    uk: 'Схожих фільмів чи серіалів не знайдено.',
  },
  'similar.recommended': {
    en: 'recommended',
    uk: 'рекомендованих',
  },

  // Saved Page
  'saved.title': {
    en: 'Saved Watchlist',
    uk: 'Збережені фільми',
  },
  'saved.subtitle': {
    en: 'Your personal collection of saved movies and series stored directly in your browser.',
    uk: 'Ваша персональна колекція збережених фільмів і серіалів у браузері.',
  },
  'saved.loading': {
    en: 'Loading saved watchlist...',
    uk: 'Завантаження збережених фільмів...',
  },
  'saved.clearWatchlist': {
    en: 'Clear Watchlist',
    uk: 'Очистити список',
  },
  'saved.confirmClear': {
    en: 'Confirm Clear All',
    uk: 'Підтвердити очищення',
  },
  'saved.searchPlaceholder': {
    en: 'Search saved movies & series...',
    uk: 'Шукати серед збережених...',
  },
  'saved.emptyTitle': {
    en: 'Your watchlist is empty',
    uk: 'Ваш список збережених порожній',
  },
  'saved.emptyDesc': {
    en: 'Explore trending movies and series or use the search bar to find titles you want to watch later.',
    uk: 'Досліджуйте трендові фільми чи скористайтеся пошуком, щоб зберегти цікаві тайтли.',
  },
  'saved.noMatchTitle': {
    en: 'No saved titles match your filters',
    uk: 'Жоден збережений фільм не відповідає фільтрам',
  },
  'saved.exploreTrending': {
    en: '🔥 Explore Trending Now',
    uk: '🔥 Переглянути трендові',
  },
  'saved.searchFilmTitles': {
    en: '🔍 Search Titles',
    uk: '🔍 Знайти тайтли',
  },
  'saved.resetFilters': {
    en: 'Reset Filters',
    uk: 'Скинути фільтри',
  },
  'saved.titles': {
    en: 'titles',
    uk: 'тайтлів',
  },
  'saved.titleOne': {
    en: 'title',
    uk: 'тайтл',
  },

  // Common UI
  'common.loading': {
    en: 'Loading...',
    uk: 'Завантаження...',
  },
  'common.viewDetails': {
    en: 'View Details',
    uk: 'Детальніше',
  },
  'common.scrollToTop': {
    en: 'Scroll to top',
    uk: 'Вгору сторінки',
  },
  'common.warning': {
    en: 'Warning',
    uk: 'Попередження',
  },
  'movie.sectionsAria': {
    en: 'Movie sections',
    uk: 'Розділи фільму',
  },

  // Media Type Badges
  'badge.movie': {
    en: 'MOVIE',
    uk: 'ФІЛЬМ',
  },
  'badge.series': {
    en: 'SERIES',
    uk: 'СЕРІАЛ',
  },
  'badge.filterMovie': {
    en: 'Filter by Feature Movie (Click to apply)',
    uk: 'Фільтрувати за фільмами (натисніть)',
  },
  'badge.filterSeries': {
    en: 'Filter by TV Series (Click to apply)',
    uk: 'Фільтрувати за серіалами (натисніть)',
  },
  'badge.tooltipMovie': {
    en: 'Feature Movie',
    uk: 'Фільм',
  },
  'badge.tooltipSeries': {
    en: 'TV Series',
    uk: 'Серіал',
  },

  // Photo Gallery
  'gallery.title': {
    en: 'Photo Gallery',
    uk: 'Галерея фото',
  },
  'gallery.photos': {
    en: 'photos',
    uk: 'фото',
  },
  'gallery.photoOne': {
    en: 'photo',
    uk: 'фото',
  },
  'gallery.prevPhotos': {
    en: 'Previous photos',
    uk: 'Попередні фото',
  },
  'gallery.nextPhotos': {
    en: 'Next photos',
    uk: 'Наступні фото',
  },
  'gallery.prevImage': {
    en: 'Previous (←)',
    uk: 'Попереднє (←)',
  },
  'gallery.nextImage': {
    en: 'Next (→)',
    uk: 'Наступне (→)',
  },
  'gallery.close': {
    en: 'Close (Esc)',
    uk: 'Закрити (Esc)',
  },
  'gallery.closeAria': {
    en: 'Close fullscreen gallery',
    uk: 'Закрити галерею на весь екран',
  },
  'gallery.tipMultiple': {
    en: 'Use ← / → arrows or Esc to close',
    uk: 'Використовуйте стрілки ← / → або Esc щоб закрити',
  },
  'gallery.tipSingle': {
    en: 'Press Esc or click outside to close',
    uk: 'Натисніть Esc або клікніть ззовні щоб закрити',
  },
  'gallery.loading': {
    en: 'Loading photo gallery...',
    uk: 'Завантаження галереї фото...',
  },
  'gallery.loadingImage': {
    en: 'Loading image...',
    uk: 'Завантаження зображення...',
  },
  'gallery.noImages': {
    en: 'No images available for this title',
    uk: 'Зображення для цього тайтлу відсутні',
  },
  'gallery.clickFullscreen': {
    en: 'Click to view full screen',
    uk: 'Натисніть для перегляду на весь екран',
  },
  'gallery.ariaLabel': {
    en: 'Movie photo gallery',
    uk: 'Галерея кадрів фільму',
  },
  'gallery.maxZoom': {
    en: 'Max',
    uk: 'Макс',
  },
  'gallery.resetZoom': {
    en: 'Click to reset zoom',
    uk: 'Клікніть щоб скинути наближення',
  },

  // Bookmark / Save
  'bookmark.add': {
    en: 'Add to saved watchlist',
    uk: 'Додати до збережених',
  },
  'bookmark.remove': {
    en: 'Remove from saved watchlist',
    uk: 'Видалити зі збережених',
  },

  // Age Rating Badge
  'age.filterBy': {
    en: 'Filter by',
    uk: 'Фільтрувати за',
  },
  'age.clickToApply': {
    en: '(Click to apply)',
    uk: '(Натисніть щоб застосувати)',
  },
  'age.rating': {
    en: 'Age rating:',
    uk: 'Віковий рейтинг:',
  },
  'age.unavailable': {
    en: 'Age rating unavailable (N/A — Not Available)',
    uk: 'Віковий рейтинг недоступний (N/A)',
  },

  // Star Rating Adjectives & Tooltips
  'critics.yourRating': {
    en: 'Your Rating',
    uk: 'Ваша оцінка',
  },
  'critics.awful': {
    en: 'Awful',
    uk: 'Жахливо',
  },
  'critics.meh': {
    en: 'Meh',
    uk: 'Посередньо',
  },
  'critics.decent': {
    en: 'Decent',
    uk: 'Непогано',
  },
  'critics.great': {
    en: 'Great',
    uk: 'Чудово',
  },
  'critics.masterpiece': {
    en: 'Masterpiece',
    uk: 'Шедевр',
  },
  'critics.rateStars': {
    en: 'Rate',
    uk: 'Оцінити на',
  },
  'critics.stars': {
    en: 'stars',
    uk: 'зірок',
  },
  'critics.cardTooltip': {
    en: 'Critics Score',
    uk: 'Оцінка критиків',
  },
  'critics.votes': {
    en: 'votes',
    uk: 'голосів',
  },
  'critics.voteOne': {
    en: 'vote',
    uk: 'голос',
  },
  'critics.votesFew': {
    en: 'votes',
    uk: 'голоси',
  },
  'critics.viewJustWatch': {
    en: 'View title on JustWatch / TMDB ↗',
    uk: 'Дивитися тайтл на JustWatch / TMDB ↗',
  },
  'critics.viewImdb': {
    en: 'View title on IMDb ↗',
    uk: 'Дивитися тайтл на IMDb ↗',
  },
  'critics.ratings': {
    en: 'Ratings',
    uk: 'Рейтинги',
  },
  'critics.movieRatingsAria': {
    en: 'Movie ratings',
    uk: 'Рейтинги фільму',
  },

  // PWA Prompt
  'pwa.offlineMode': {
    en: 'Offline Mode',
    uk: 'Офлайн режим',
  },
  'pwa.offlineTooltip': {
    en: 'Offline mode: viewing cached watchlist and movies',
    uk: 'Офлайн режим: перегляд збереженого списку та фільмів',
  },

  // Movie Details & Fallbacks
  'movie.loadingMovie': {
    en: 'Loading movie details...',
    uk: 'Завантаження деталей фільму...',
  },
  'movie.loadingShow': {
    en: 'Loading show details...',
    uk: 'Завантаження деталей серіалу...',
  },
  'movie.loadingSection': {
    en: 'Loading section...',
    uk: 'Завантаження секції...',
  },
  'movie.ageRestrictionTitle': {
    en: 'Age Restriction (Europe | USA)',
    uk: 'Вікове обмеження (Європа | США)',
  },
  'movie.ageUnavailable': {
    en: 'Age rating currently unavailable',
    uk: 'Віковий рейтинг наразі недоступний',
  },
  'movie.browseGenre': {
    en: 'Browse {genre} on Search',
    uk: 'Шукати {genre} в Пошуку',
  },
  'movie.errorTitle': {
    en: 'This movie information is temporarily unavailable',
    uk: 'Інформація про цей фільм тимчасово недоступна',
  },
  'movie.errorDesc': {
    en: 'The server could not retrieve details for this title at this time. Please check back later or explore other movies.',
    uk: 'Сервер наразі не може надати інформацію для цього тайтлу. Будь ласка, спробуйте пізніше або перегляньте інші фільми.',
  },
  'movie.tryAgain': {
    en: 'Try Again',
    uk: 'Спробувати знову',
  },

  // Saved Page Extra
  'saved.clearSearch': {
    en: 'Clear search',
    uk: 'Очистити пошук',
  },

  // General Loader Defaults
  'loader.default': {
    en: 'Loading scene...',
    uk: 'Завантаження сцени...',
  },
  'critics.loadingImdb': {
    en: 'Loading IMDb...',
    uk: 'Завантаження IMDb...',
  },
  // 404 Not Found Page
  'notFound.title': {
    en: '404',
    uk: '404',
  },
  'notFound.message': {
    en: 'Oops, this page is not found =(',
    uk: 'Ой, цю сторінку не знайдено =(',
  },
  'notFound.description': {
    en: 'The movie or page you are looking for might have been moved or deleted.',
    uk: 'Фільм або сторінку, яку ви шукаєте, можливо переміщено або видалено.',
  },
  'notFound.goHome': {
    en: 'Go back to Home page',
    uk: 'Повернутися на Головну',
  },

  // Search Debounce Notice
  'search.debounceNotice': {
    en: 'Searching in 1.5s... or press',
    uk: 'Пошук за 1.5с... або натисніть',
  },
  'search.debounceNoticeEnd': {
    en: 'to search now',
    uk: 'для миттєвого пошуку',
  },
  'search.searchNow': {
    en: 'Search now',
    uk: 'Шукати зараз',
  },

  // Movie Details Error/Skeleton
  'movie.unavailableTitle': {
    en: 'Movie Title Unavailable',
    uk: 'Назва тайтлу недоступна',
  },
  'movie.unavailable': {
    en: 'Unavailable',
    uk: 'Недоступно',
  },

  // Filter Bar Age Full Labels
  'filter.age0': {
    en: '🟢 0+ (General / G)',
    uk: '🟢 0+ (Для всіх / G)',
  },
  'filter.age6': {
    en: '🟡 6+ (Kids / PG)',
    uk: '🟡 6+ (Для дітей / PG)',
  },
  'filter.age12': {
    en: '🟠 12+ (Teens / PG-13)',
    uk: '🟠 12+ (Підлітки / PG-13)',
  },
  'filter.age16': {
    en: '🔴 16+ (Mature / TV-14)',
    uk: '🔴 16+ (Старші підлітки / TV-14)',
  },
  'filter.age18': {
    en: '⛔ 18+ (Adults / R)',
    uk: '⛔ 18+ (Дорослі / R)',
  },
};

export const getTranslation = (key: string, lang: Language, fallback?: string): string => {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return fallback || key;
};
