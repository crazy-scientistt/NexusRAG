# Copyright 2026 Abdulrehman Qureshi & NexusRAG Contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Authentication helpers supporting both Firebase and Studio Guest / Developer mode.
"""
import os
import json
from functools import lru_cache
from pathlib import Path

from typing import Optional

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials
from fastapi import HTTPException, Header, Depends


def _resolve_credential_path() -> Optional[str]:
    """Locate service account JSON path."""
    env_path = os.getenv("FIREBASE_CREDENTIALS")
    if env_path and Path(env_path).exists():
        return env_path

    default_path = Path(__file__).parent.parent / "rag-v2-542e1-firebase-adminsdk-fbsvc-676af31624.json"
    if default_path.exists():
        return str(default_path)
    return None


@lru_cache(maxsize=1)
def get_firebase_app():
    """Initialize Firebase Admin instance if credentials exist."""
    # Priority 1: JSON credentials string in env
    json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if json_str:
        try:
            cred_dict = json.loads(json_str)
            cred = credentials.Certificate(cred_dict)
            return firebase_admin.initialize_app(cred)
        except Exception as exc:
            print(f"⚠️ Failed to parse FIREBASE_CREDENTIALS_JSON: {exc}")

    # Priority 2: File path
    cred_path = _resolve_credential_path()
    if cred_path:
        try:
            cred = credentials.Certificate(cred_path)
            return firebase_admin.initialize_app(cred)
        except Exception as exc:
            print(f"⚠️ Failed to load Firebase credentials from {cred_path}: {exc}")

    return None


def verify_token(authorization: str = Header(None)):
    """FastAPI dependency to validate Firebase ID token or handle developer/guest access."""
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"

    if not authorization or not authorization.startswith("Bearer "):
        if dev_mode:
            return {
                "uid": "guest-studio-user",
                "email": "guest@nexusrag.studio",
                "name": "Studio Guest",
            }
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = authorization.split(" ", 1)[1]

    # Handle Guest / Demo tokens directly
    if token.startswith("guest-") or token in ("dev-token", "null", "undefined", "guest"):
        return {
            "uid": "guest-studio-user",
            "email": "guest@nexusrag.studio",
            "name": "Studio Guest",
        }

    try:
        app = get_firebase_app()
        if app is None:
            if dev_mode:
                return {
                    "uid": "guest-studio-user",
                    "email": "guest@nexusrag.studio",
                    "name": "Studio Guest",
                }
            raise HTTPException(status_code=500, detail="Firebase Admin not configured")

        decoded = fb_auth.verify_id_token(token, app=app, check_revoked=True)
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "name": decoded.get("name", decoded.get("email", ""))
        }
    except Exception as exc:
        if dev_mode:
            return {
                "uid": "guest-studio-user",
                "email": "guest@nexusrag.studio",
                "name": "Studio Guest",
            }
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc


def get_current_user(user=Depends(verify_token)):
    """Shim for FastAPI dependency naming."""
    return user