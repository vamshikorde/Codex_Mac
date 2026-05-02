# Weather Atlas

A simple static weather app built for GitHub Pages.

## Stack

- Plain HTML, CSS, and JavaScript
- Open-Meteo geocoding API for location search
- Open-Meteo forecast API for current weather and daily forecast

## Local preview

From this folder, run:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## GitHub Pages

This folder already includes a GitHub Actions workflow for Pages.

1. Create a new GitHub repository with these files at the repo root.
2. Push to the `main` branch.
3. In the repository settings, make sure GitHub Pages is enabled and set to use GitHub Actions.
4. After the workflow runs, the site will be available at your Pages URL.
