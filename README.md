# 🎬 React Movie Finder

A modern, responsive web application for exploring trending films, searching movies, and browsing details, cast, and user reviews, powered by [The Movie Database (TMDB) API](https://www.themoviedb.org/).

---

## ✨ Features

- **Trending Movies**: Discover what's popular today on the big screen.
- **Instant Search**: Search films with live debounced input and auto-updating query parameters.
- **Rich Movie Details**: High-resolution movie posters, user ratings, synopsis, and genres.
- **Cast & Reviews**: Nested views exploring the cast members with photos and authentic viewer reviews.
- **Navigation & UX**: Seamless client-side routing, "Go back" history restoration, and smooth "Scroll to top".
- **Responsive Layout**: Optimized experience across mobile, tablet, and desktop screens.

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
