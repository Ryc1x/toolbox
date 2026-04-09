# /toolbox

Simple, free browser-based tools that run entirely on your device. No uploads, no sign-ups, no tracking.

## Tools

- **[Passport Photo](tools/passport-photo/)** — Crop your photo to any passport standard (US, China, EU, etc.), tile onto print paper (4×6, A4, Letter), and download at 300 DPI.

## Development

This is a static site — pure HTML, CSS, and vanilla JavaScript. No build step required.

```
toolbox/
├── index.html                  # Landing page
├── css/style.css               # Shared design system
└── tools/
    └── passport-photo/         # Each tool gets its own folder
        ├── index.html
        ├── style.css
        └── app.js
```

### Adding a new tool

1. Create `tools/<tool-name>/` with `index.html`, `style.css`, and JS
2. Add a tool card to the root `index.html`

### External libraries

- [Cropper.js](https://fengyuanchen.github.io/cropperjs/) (CDN) — image cropping in the passport photo tool

## Deployment

Static files served via GitHub Pages from the `main` branch root.
