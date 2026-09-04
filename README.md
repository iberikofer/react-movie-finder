# 🎬 React Movie Finder

A modern, responsive web application for exploring trending films, searching movies, and browsing details, cast, and user reviews, powered by [The Movie Database (TMDB) API](https://www.themoviedb.org/).

---

## ✨ Features

- **Dedicated Home & Feature Showcase**: Landing page presenting project architecture, capabilities, and live metrics.
- **Trending Movies**: Discover what's popular today on the big screen at `/trending`.
- **Critics Score & Rating Analytics**: Custom 5-star evaluation system with 0.5-star precision, satisfaction score metrics, and cross-tab persistence (inspired by [react-feedback-page](https://github.com/iberikofer/react-feedback-page)).
- **Instant Search**: Search films with live debounced input and auto-updating query parameters.
- **Rich Movie Details**: High-resolution movie posters, user ratings, synopsis, and genres.
- **Cast & Dynamic Reviews**: Nested views exploring cast members and community reviews with dynamic soft-accent palettes.
- **Cinematic Clapperboard Loader**: Bespoke vector clapperboard loader with snap-shut and hold animation.
- **Ambient Iridescent Background**: Continuous 50/50 emerald-and-cherry animated gradient flowing seamlessly across routes without reload reset.
- **Navigation & UX**: Seamless client-side routing, "Go back" history restoration, and frosted "Scroll to top" button.
- **Responsive Layout**: Optimized experience across mobile, tablet, and desktop screens.

---

## 💡 Acknowledgements & Inspiration

The interactive movie rating engine and feedback analytics architecture was inspired by and adapted from my other repository:
👉 **[iberikofer/react-feedback-page](https://github.com/iberikofer/react-feedback-page)** — Interactive feedback collection and customer satisfaction scoring application.

---

## 🛠️ Tech Stack

- **React 18** (Functional components, Hooks, Suspense & React.lazy)
- **React Router DOM v6** (Nested routes, dynamic parameters, URL search params)
- **CSS Modules & Pure CSS** (Modular, scoped styles with responsive flexbox and grid)
- **The Movie Database (TMDB) API v3**
- **GitHub Actions** (Automated CI/CD deployment to GitHub Pages)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18 or newer) and **npm** installed.

### 1. Clone the repository

```bash
git clone https://github.com/iberikofer/react-movie-finder.git
cd react-movie-finder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```bash
REACT_APP_TMDB_TOKEN=your_tmdb_bearer_token_here
```

> Get a free API Read Access Token (v4 auth) from your [TMDB Account Settings](https://www.themoviedb.org/settings/api).

### 4. Start development server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm start` — Runs the app in development mode with hot reload.
- `npm run build` — Builds the optimized production bundle to the `build/` folder.
- `npm run lint:js` — Checks source files with ESLint for syntax and style errors.

---

## 🌐 Deployment

The project automatically builds and deploys to GitHub Pages on every push to the `main` branch via GitHub Actions (`.github/workflows/deploy.yml`).
