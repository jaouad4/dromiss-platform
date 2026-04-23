# Dromiss Website

Marketing site for **Dromiss by SMODU** — Odoo ERP/CRM solutions for Moroccan businesses.

## Stack

- Static HTML/CSS/JS (no build step)
- Python FastAPI backend (`api/`) for form submissions → Odoo CRM
- Odoo 18 instance via Docker Compose
- Nginx reverse proxy (see `infra/nginx/`)

## Local development

Open any `.html` file directly in a browser, or serve the `website/` directory with any static server:

```bash
npx serve .
# or
python -m http.server 8080
```

The contact form requires the API backend. See `api/README` or `DEPLOYMENT.md` for full stack setup.

## Project structure

```
website/
├── index.html          # Homepage
├── contact.html        # Contact / demo request form
├── blog.html           # Blog listing
├── 404.html            # Custom 404 page
├── assets/
│   ├── css/            # tokens → base → components → pages/*
│   ├── js/             # ES modules (theme, form, components, …)
│   └── components/     # Shared navbar.html / footer.html
├── domaines/           # Industry pages (santé, hôtellerie, …)
├── solutions/          # Solution pages (ERP, CRM, BI)
├── services/           # Service pages (consulting, marketing, …)
└── api/                # FastAPI form proxy
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for VPS setup instructions.
