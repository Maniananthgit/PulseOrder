import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_menu_and_table_management(client: AsyncClient):
    suffix = uuid.uuid4().hex[:6]
    email = f"chef_{suffix}@pulseorder.io"
    password = "ChefPassword123!"

    # 1. Register & Login Owner
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Chef Owner",
        "role": "RESTAURANT_OWNER"
    })
    login_res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Restaurant
    rest_res = await client.post(
        "/api/v1/restaurants/",
        json={"name": "Pasta Paradise", "slug": f"pasta-{suffix}", "currency": "USD"},
        headers=headers
    )
    assert rest_res.status_code == 201
    rest_id = rest_res.json()["id"]

    # Get Default Branch
    branches_res = await client.get(f"/api/v1/restaurants/{rest_id}/branches", headers=headers)
    assert branches_res.status_code == 200
    branch_id = branches_res.json()[0]["id"]

    # 3. Create Category
    cat_res = await client.post(
        f"/api/v1/restaurants/{rest_id}/categories",
        json={"name": "Main Courses", "description": "Delicious hot meals", "sort_order": 1, "restaurant_id": rest_id},
        headers=headers
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 4. Create Product with Addons
    prod_res = await client.post(
        f"/api/v1/restaurants/{rest_id}/products",
        json={
            "name": "Truffle Fettuccine",
            "description": "Handmade pasta with black truffle",
            "base_price": 24.50,
            "is_veg": True,
            "is_available": True,
            "category_id": cat_id,
            "addons": [
                {"name": "Extra Truffle Oil", "price": 3.00, "is_available": True},
                {"name": "Parmigiano Reggiano", "price": 2.00, "is_available": True}
            ]
        },
        headers=headers
    )
    assert prod_res.status_code == 201
    prod_data = prod_res.json()
    assert prod_data["name"] == "Truffle Fettuccine"
    assert len(prod_data["addons"]) == 2

    # 5. List Products & Search
    search_res = await client.get(f"/api/v1/restaurants/{rest_id}/products?search=Truffle")
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1

    # 6. Create Table & Verify QR Token
    table_res = await client.post(
        f"/api/v1/restaurants/{rest_id}/branches/{branch_id}/tables",
        json={"branch_id": branch_id, "table_number": "Table 05", "capacity": 4, "status": "AVAILABLE"},
        headers=headers
    )
    assert table_res.status_code == 201
    qr_token = table_res.json()["qr_code_token"]
    assert qr_token is not None

    # Verify Table via Public Endpoint (Kiosk scan simulation)
    verify_res = await client.get(f"/api/v1/tables/verify/{qr_token}")
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True
    assert verify_data["table_number"] == "Table 05"
    assert verify_data["restaurant_name"] == "Pasta Paradise"

