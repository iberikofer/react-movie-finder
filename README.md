# 🎬 React Movie Finder

A modern, responsive web application for exploring trending movies and series, searching titles, managing a personal watchlist, and viewing rich filmography details with an interactive photo lightbox, official trailers, and custom community analytics. Powered by [The Movie Database (TMDB) API](https://www.themoviedb.org/).

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v6-ca4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![TMDB API](https://img.shields.io/badge/TMDB_API-v3-01b4e4?logo=themoviedatabase&logoColor=white)](https://developer.themoviedb.org/docs)
[![CSS Modules](https://img.shields.io/badge/CSS-Modules-blue?logo=css3&logoColor=white)](https://github.com/css-modules/css-modules)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features & Key Highlights

### 🏠 1. Interactive Landing Page (`/`)
- Comprehensive project showcase highlighting core architecture, metrics, and technology stack.
- Real-time project statistics and quick-access navigation to Trending, Search, and Watchlist.

### 🔖 2. Personal Saved Watchlist (`/saved`)
- **One-Click Bookmarking**: Circular glassmorphism bookmark buttons (`SaveMovieButton`) available on every card poster in grids and directly beside the title in the Movie Details header.
- **Live Navbar Badge**: Reactive counter badge in the main navigation showing the total count of saved titles in real time.
- **Smart Category Filtering**: Seamlessly filter saved items by `All`, `🎬 Movies`, or `📺 Series`.
- **Safe Clear Watchlist**: Two-step confirmation state (`Confirm Clear All`) to prevent accidental deletions.
- **Clean Empty State**: Centered zero-state screen with direct calls-to-action to Trending and Search.

### 🔥 3. Trending Feed & Media Type Badges (`/trending`)
- Discover what millions are watching today with real-time TMDB trending feeds.
- **Format Identification Badges**: Dedicated visual badges for `🎬 MOVIE` (emerald) vs `📺 SERIES` (violet) across card posters and details.
- Smooth pagination with interactive **"Load More Titles"** controls.

### 🔍 4. Instant Search & Multi-Genre Discovery (`/movies`)
- **Live Debounced Search**: 1500ms debounced input to prevent redundant API queries while typing.
- **Multi-Genre Filter**: Discover titles by genre (Action, Comedy, Drama, Sci-Fi, Animation, etc.) with multi-selection support.
- **Shareable URL Parameters**: Search state and active genres are synchronized to the URL (`?query=...&genres=...`) for instant sharing and bookmarking.
- **Jitter-Free Loading**: Guaranteed 500ms minimum threshold prevents fast network requests from flashing micro-loaders.

### ⭐ 5. Precision Critics Score & Rating Analytics
- **Dual Scoring Architecture**: Toggle between TMDB's global 10-point score and a bespoke 5-star community analytics engine.
- **0.5-Star Precision Input**: Rate movies with fine-grained half-star increments (`StarRatingInput`).
- **Dynamic Color Feedback**: Emerald (high praise), Amber (average), and Rose (critique).
- **Rating Distribution Analytics**: Visual distribution chart of user ratings inside the Movie Details sub-navigation.
- **Global & Individual Reset**: Reset ratings on specific titles or perform a full global wipe with safe confirmation.

### 📸 6. Cinematic Media Hub & Photo Lightbox (`/movies/:movieId`)
- **Fullscreen Photo Lightbox (`MovieGallery`)**: Interactive backdrop and production stills gallery with a modal viewer supporting keyboard navigation (`Esc` to close, `←` / `→` arrows to navigate) and an image counter.
- **Official YouTube Trailers**: Embedded video player for official trailers and teasers.
- **Cast & Crew Directory**: Full cast list with character names and actor profile portraits.
- **Community Reviews & Similar Titles**: Read viewer critiques and explore algorithmic recommendations with quick-save buttons.

### 🎬 7. Custom Clapperboard Loader
- Handcrafted CSS vector clapperboard animation with realistic snap-shut and hold cycles in emerald and cherry tones.
- 0.5s initial stabilization threshold ensures page loads and reloads never stutter with jagged layout shifts.

### 🌊 8. Persistent Ambient Atmosphere
- Continuous 50/50 emerald-and-cherry animated gradient wave composited with GPU acceleration.
- Synchronized to wall-clock Unix epoch time (`Date.now()`), so the ambient wave flows uninterrupted across route transitions and page refreshes.

### 🔄 9. Zero-Latency Cross-Tab Synchronization
- Integrated DOM `CustomEvent` bus paired with window `storage` listeners.
- Rating a movie or adding to your watchlist in one window instantaneously updates open tabs without extra server requests.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Functional architecture, Hooks, Context, Suspense, and client-side lifecycle management |
| **React Router v6** | Client-side routing, nested routes, dynamic parameters, and URL search param sync |
| **Vanilla CSS Modules** | Scoped, zero-runtime CSS with modern variables, flexbox, CSS Grid, and glassmorphism |
| **TMDB REST API v3** | Real-time movie/show metadata, backdrops, posters, cast, reviews, and trailers |
| **LocalStorage Event Bus** | Persistent local data layer with cross-tab reactive synchronization |
| **Epoch Wall-Clock Sync** | Epoch-synchronized mathematical ambient wave animation immune to page reloads |
| **HTML5 Modal Lightbox** | Keyboard-accessible modal image viewer with backdrop-filter blur |
| **GitHub Actions** | Automated CI/CD build, linting, and deployment pipeline to GitHub Pages |

---

## 📁 Project Structure

```text
react-movie-finder/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions automated deployment
├── public/
│   ├── index.html                  # Root HTML template
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── App.jsx                 # Main application router and shell
│   │   ├── Header/                 # Navigation bar, logo, saved badge, clear ratings
│   │   ├── CriticsScore/           # 5-star scoring engine, rating distribution, badge
│   │   ├── GenreFilter/            # Multi-genre pill selector with URL sync
│   │   ├── Loader/                 # Cinematic animated clapperboard loader
│   │   ├── MediaTypeBadge/         # Film / Series format badges
│   │   ├── MovieDetails/           # Movie details layout, hero banner, sub-nav
│   │   ├── MovieGallery/           # Photo gallery with modal lightbox viewer
│   │   ├── MovieInfo/              # Detailed production and release metadata
│   │   ├── SaveMovieButton/        # Circular bookmark button with SVG icons
│   │   ├── SimilarMovies/          # Algorithmic similar titles recommendations
│   │   ├── ScrollToTop/            # Frosted floating scroll-to-top button
│   │   ├── Trailer/                # Embedded YouTube trailer player
│   │   ├── Cast/                   # Actor profile cards with character names
│   │   └── Reviews/                # Viewer reviews with dynamic palettes
│   ├── hooks/
│   │   └── useSavedMovies.js       # Watchlist hook with localStorage & event bus
│   ├── pages/
│   │   ├── Home.jsx                # Landing page with architecture & stats
│   │   ├── Trending.jsx            # Trending movies/shows feed with genre filters
│   │   ├── Movies.jsx              # Debounced search & genre exploration
│   │   ├── Saved.jsx               # Personal watchlist with category filtering
│   │   └── NotFound.jsx            # Custom 404 page
│   ├── fetch.js                    # TMDB API wrapper functions & endpoints
│   ├── index.css                   # Global tokens, typography & ambient wave
│   └── index.js                    # Application entry point
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or newer)
- **npm** (v9 or newer)

### 1. Clone the repository
```bash
git clone https://github.com/iberikofer/react-movie-finder.git
cd react-movie-finder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
REACT_APP_TMDB_TOKEN=your_tmdb_bearer_token_here
```
> **Tip:** You can obtain a free API Read Access Token (v4 auth) directly from your [TMDB Account Settings](https://www.themoviedb.org/settings/api).

### 4. Run the Development Server
```bash
npm start
```
Open [http://localhost:3000/react-movie-finder/](http://localhost:3000/react-movie-finder/) in your browser.

---

## 📜 Available Scripts

- `npm start` — Runs the application in development mode with hot reloading.
- `npm run build` — Compiles the optimized production bundle into the `build/` folder.
- `npm run lint:js` — Runs ESLint across all JavaScript/JSX source files.

---

## 💡 Acknowledgements & Inspiration

The interactive critics scoring engine and customer satisfaction analytics architecture was inspired by and adapted from:
👉 **[iberikofer/react-feedback-page](https://github.com/iberikofer/react-feedback-page)** — Customer satisfaction scoring and interactive feedback application.

---

## 🌐 Deployment

This application automatically builds, optimizes, and deploys to **GitHub Pages** on every commit pushed to the `main` branch via GitHub Actions (`.github/workflows/deploy.yml`).
