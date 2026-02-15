# Copyright 2026 Abdulrehman Qureshi
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
Firebase authentication helpers.
"""
import os
import json
from functools import lru_cache
from pathlib import Path

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials
from fastapi import HTTPException, Header, Depends


def _resolve_credential_path() -> str:
    """
    Locate service account JSON path.
    Priority:
    1) FIREBASE_CREDENTIALS env var
    2) Default file bundled alongside the project (if present)
    """
    env_path = os.getenv("FIREBASE_CREDENTIALS")
    if env_path:
        return env_path

    default_path = Path(__file__).parent.parent / "rag-v2-542e1-firebase-adminsdk-fbsvc-676af31624.json"
    return str(default_path)


@lru_cache(maxsize=1)
def get_firebase_app():
    # Priority 1: Try to load from FIREBASE_CREDENTIALS_JSON env var (for Railway/cloud deployment)
    json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if json_str:
        try:
            cred_dict = json.loads(json_str)
            cred = credentials.Certificate(cred_dict)
            return firebase_admin.initialize_app(cred)
        except Exception as exc:
            raise RuntimeError(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {exc}") from exc
    
    # Priority 2: Try to load from file path
    cred_path = _resolve_credential_path()
    if not Path(cred_path).exists():
        raise RuntimeError(
            "Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON (JSON string) or FIREBASE_CREDENTIALS (file path)."
        )
    cred = credentials.Certificate(cred_path)
    return firebase_admin.initialize_app(cred)


def verify_token(authorization: str = Header(None)):
    """FastAPI dependency to validate Firebase ID token and return user info."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = authorization.split(" ", 1)[1]

    try:
        app = get_firebase_app()
        decoded = fb_auth.verify_id_token(token, app=app, check_revoked=True)
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc

    return {
        "uid": decoded.get("uid"),
        "email": decoded.get("email"),
        "name": decoded.get("name", decoded.get("email", ""))
    }


def get_current_user(user=Depends(verify_token)):
    """Shim for FastAPI dependency naming."""
    return user