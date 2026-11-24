import os
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_supported_languages_includes_all_14(client):
    res = client.get("/languages")
    assert res.status_code == 200
    codes = {item["language_code"] for item in res.json()}
    expected = {"en", "kn", "ta", "hi", "te", "ml", "mr", "ur", "bn", "gu", "pa", "or", "as", "kok"}
    assert expected.issubset(codes)


def test_auth_lifecycle_and_language_persistence(client):
    payload = {
        "full_name": "Aarav Gowda",
        "email": "aarav.test@credvani.in",
        "mobile_number": "9876543210",
        "password": "StrongPassword123",
        "confirm_password": "StrongPassword123",
        "preferred_language": "kn",
        "consent_accepted": True,
    }
    reg = client.post("/auth/register", json=payload)
    assert reg.status_code in (201, 409)

    dup = client.post("/auth/register", json=payload)
    assert dup.status_code == 409

    bad_login = client.post("/auth/login", json={"identifier": payload["email"], "password": "WrongPassword1"})
    assert bad_login.status_code == 401

    good_login = client.post("/auth/login", json={"identifier": payload["email"], "password": payload["password"], "remember_me": True})
    assert good_login.status_code == 200
    tokens = good_login.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    lang_res = client.put("/users/me/language", json={"preferred_language": "ur"}, headers=headers)
    assert lang_res.status_code == 200
    assert lang_res.json()["preferred_language"] == "ur"

    me_res = client.get("/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["preferred_language"] == "ur"

    logout_res = client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]})
    assert logout_res.status_code == 200
