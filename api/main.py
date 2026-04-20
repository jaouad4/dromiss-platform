# =============================================================================
# Dromiss FastAPI Proxy — Secure Odoo CRM Lead Submission
#
# Required environment variables (set in /etc/dromiss/api.env on the VPS):
#   ODOO_URL     — Base URL of the Odoo instance, e.g. https://odoo.dromiss.com
#   ODOO_API_KEY — API key generated in Odoo: Settings → Technical → API Keys
#   ODOO_DB      — Odoo database name, e.g. odoo
#
# Run with: gunicorn main:app -c gunicorn.conf.py
# =============================================================================

import os
import time
from collections import defaultdict

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator

# ---------------------------------------------------------------------------
# Config — fail fast at startup if any required env var is missing
# ---------------------------------------------------------------------------
ODOO_URL = os.environ.get("ODOO_URL", "")
ODOO_API_KEY = os.environ.get("ODOO_API_KEY", "")
ODOO_DB = os.environ.get("ODOO_DB", "")

if not all([ODOO_URL, ODOO_API_KEY, ODOO_DB]):
    raise RuntimeError(
        "Missing required environment variables: ODOO_URL, ODOO_API_KEY, ODOO_DB. "
        "Set them in /etc/dromiss/api.env."
    )

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dromiss.com", "https://www.dromiss.com"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# ---------------------------------------------------------------------------
# Rate limiting — 1 request per 60 seconds per IP (in-memory)
# ---------------------------------------------------------------------------
_rate_limit: dict[str, float] = defaultdict(float)
RATE_LIMIT_SECONDS = 60


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    if now - _rate_limit[ip] < RATE_LIMIT_SECONDS:
        raise HTTPException(
            status_code=429,
            detail={"success": False, "error": "Trop de requêtes. Veuillez patienter."},
        )
    _rate_limit[ip] = now


# ---------------------------------------------------------------------------
# Input model
# ---------------------------------------------------------------------------
ALLOWED_SECTEURS = {"sante", "hotellerie", "immobilier", "distribution", "industrie", "services", ""}


def _sanitize(value: str) -> str:
    return value.replace("<", "").replace(">", "").strip()


class LeadForm(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    message: str = ""
    secteur: str = ""

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = _sanitize(v)
        if not v:
            raise ValueError("Le nom est requis.")
        if len(v) > 100:
            raise ValueError("Le nom ne peut pas dépasser 100 caractères.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = _sanitize(v)
        if len(v) > 30:
            raise ValueError("Le téléphone ne peut pas dépasser 30 caractères.")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = _sanitize(v)
        if len(v) > 2000:
            raise ValueError("Le message ne peut pas dépasser 2000 caractères.")
        return v

    @field_validator("secteur")
    @classmethod
    def validate_secteur(cls, v: str) -> str:
        v = _sanitize(v)
        if v not in ALLOWED_SECTEURS:
            raise ValueError("Secteur non reconnu.")
        return v


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/submit-lead")
async def submit_lead(request: Request, form: LeadForm) -> dict:
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    payload = {
        "jsonrpc": "2.0",
        "method": "call",
        "id": 1,
        "params": {
            "model": "crm.lead",
            "method": "create",
            "args": [
                {
                    "name": f"{form.name} — Demande Dromiss",
                    "contact_name": form.name,
                    "email_from": form.email,
                    "phone": form.phone,
                    "description": form.message,
                    "tag_ids": [],
                }
            ],
            "kwargs": {
                "context": {"lang": "fr_FR", "tracking_disable": True}
            },
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{ODOO_URL}/web/dataset/call_kw",
                json=payload,
                headers={"Authorization": f"Bearer {ODOO_API_KEY}"},
            )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail={"success": False, "error": "Le serveur met trop de temps à répondre."},
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail={"success": False, "error": "Impossible de contacter le serveur Odoo."},
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail={"success": False, "error": "Erreur lors de la création du lead."},
        )

    data = response.json()
    if "error" in data:
        raise HTTPException(
            status_code=502,
            detail={"success": False, "error": "Erreur lors de la création du lead."},
        )

    return {"success": True, "message": "Votre demande a bien été envoyée."}
