import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_registration_and_login(client: AsyncClient):
    random_suffix = uuid.uuid4().hex[:6]
    owner_email = f"owner_{random_suffix}@pulseorder.io"
    password = "SecurePassword123!"

    # 1. Register Owner
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": owner_email,
        "password": password,
        "full_name": "John Owner",
        "phone_number": "1234567890",
        "role": "RESTAURANT_OWNER"
    })
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == owner_email

    # 2. Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": owner_email,
        "password": password
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "RESTAURANT_OWNER"
    token = token_data["access_token"]

    # 3. Authenticated /me
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == owner_email

    # 4. Unauthenticated check
    unauth_res = await client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

@pytest.mark.asyncio
async def test_restaurant_creation_and_isolation(client: AsyncClient):
    random_suffix = uuid.uuid4().hex[:6]
    owner1_email = f"owner1_{random_suffix}@pulseorder.io"
    owner2_email = f"owner2_{random_suffix}@pulseorder.io"
    password = "SecurePassword123!"

    # Register Owner 1
    await client.post("/api/v1/auth/register", json={
        "email": owner1_email,
        "password": password,
        "full_name": "Owner One",
        "role": "RESTAURANT_OWNER"
    })
    l1 = await client.post("/api/v1/auth/login", json={"email": owner1_email, "password": password})
    token1 = l1.json()["access_token"]

    # Register Owner 2
    await client.post("/api/v1/auth/register", json={
        "email": owner2_email,
        "password": password,
        "full_name": "Owner Two",
        "role": "RESTAURANT_OWNER"
    })
    l2 = await client.post("/api/v1/auth/login", json={"email": owner2_email, "password": password})
    token2 = l2.json()["access_token"]

    # Owner 1 creates Restaurant
    rest_res = await client.post(
        "/api/v1/restaurants/",
        json={"name": f"Bistro {random_suffix}", "slug": f"bistro-{random_suffix}", "currency": "USD"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert rest_res.status_code == 201
    rest_id = rest_res.json()["id"]

    # Owner 1 can access restaurant
    res1 = await client.get(f"/api/v1/restaurants/{rest_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res1.status_code == 200

    # Owner 2 CANNOT access Owner 1's restaurant (Isolation check)
    res2 = await client.get(f"/api/v1/restaurants/{rest_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 403

