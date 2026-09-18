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
Open-access identity helpers.

NexusRAG has no login: every caller is served as the Studio Guest. This module
keeps the FastAPI dependency shape the routes already expect so callers stay
unchanged, and deliberately pulls in no auth SDK -- keeping the serverless
bundle small enough for Vercel's function size limit.
"""
from fastapi import Depends, Header

from typing import Optional

GUEST_USER = {
    "uid": "guest-studio-user",
    "email": "guest@nexusrag.studio",
    "name": "Studio Guest",
}


def verify_token(authorization: Optional[str] = Header(None)):
    """Resolve the caller. Always the shared guest identity -- no auth required."""
    return dict(GUEST_USER)


def get_current_user(user=Depends(verify_token)):
    """Shim for FastAPI dependency naming."""
    return user
