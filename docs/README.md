# PrairieGNAT Documentation Site

This folder contains the GitHub Pages website for PrairieGNAT.

## Structure

- `index.html` - Home page with features, roadmap, and installation guide
- `getting-started.html` - Step-by-step getting started guide
- `styles.css` - Shared CSS styling for the documentation site
- `_config.yml` - GitHub Pages configuration
- `.nojekyll` - Disables Jekyll processing to serve custom HTML directly

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch:

```
Repository: wrhalpin/PrairieGNAT
Branch: main
Source: /docs folder
URL: https://prairiegnat.pages.dev (or https://wrhalpin.github.io/PrairieGNAT)
```

## Design

The site uses a modern, minimalist design inspired by GNAT's security-focused aesthetic:

- **Color Scheme**: Dark blue/slate with blue accent colors
- **Typography**: System fonts for optimal performance
- **Layout**: Responsive grid layouts that work on mobile and desktop
- **Theme**: STIX/Security analysis focused with clear, professional styling

## Editing Pages

Each HTML page is self-contained with inline CSS. To edit:

1. Edit the HTML file directly
2. Update the content sections
3. Commit and push to trigger deployment
4. Changes appear at the URL within seconds

## Assets

The site uses:
- **Logo**: Custom SVG icon (embedded in HTML)
- **Icons**: Emoji icons for features
- **No external dependencies**: All CSS is inline for performance

## Configuration

GitHub Pages is configured to:
- Serve from the `/docs` folder on the main branch
- Disable Jekyll processing (via `.nojekyll`)
- Use custom domain (configured in repository settings)

## Performance

- **No build step**: HTML served directly
- **No external assets**: All CSS and icons embedded
- **Fast load times**: Minimal dependencies
- **Mobile optimized**: Responsive design works on all devices
