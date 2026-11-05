import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_order_creation_kitchen_and_reporting(client: AsyncClient):
    suffix = uuid.uuid4().hex[:6]
    email = f"manager_{suffix}@pulseorder.io"
    password = "ManagerPass123!"

    # 1. Register & Login Owner
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Restaurant Boss",
        "role": "RESTAURANT_OWNER"
    })
    l_res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = l_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Restaurant
    rest_res = await client.post(
        "/api/v1/restaurants/",
        json={"name": "Burger Craft", "slug": f"burger-{suffix}", "currency": "USD"},
        headers=headers
    )
    rest_id = rest_res.json()["id"]

    # Get Branch
    branches_res = await client.get(f"/api/v1/restaurants/{rest_id}/branches", headers=headers)
    branch_id = branches_res.json()[0]["id"]

    # 3. Create Table
    table_res = await client.post(
        f"/api/v1/restaurants/{rest_id}/branches/{branch_id}/tables",
        json={"branch_id": branch_id, "table_number": "Table 01", "capacity": 2, "status": "AVAILABLE"},
        headers=headers
    )
    table_id = table_res.json()["id"]

    # 4. Create Category & Product with Addon
    cat_res = await client.post(
        f"/api/v1/restaurants/{rest_id}/categories",
        json={"name": "Burgers", "sort_order": 1, "restaurant_id": rest_id},
        headers=headers
    )
    cat_id = cat_res.json()["id"]

    prod_res = await client.post(
        f"/api/v1/restaurants/{rest_id}/products",
        json={
            "name": "Smoked Bacon Cheeseburger",
            "base_price": 10.00,
            "is_veg": False,
            "category_id": cat_id,
            "addons": [
                {"name": "Extra Cheddar", "price": 2.00, "is_available": True}
            ]
        },
        headers=headers
    )
    prod_data = prod_res.json()
    prod_id = prod_data["id"]
    addon_id = prod_data["addons"][0]["id"]

    # 5. Place Customer Order with Addon:
    # 2 burgers @ $10.00 + $2.00 addon = $12.00 each -> Subtotal = $24.00
    # 5% tax = $1.20 -> Total = $25.20
    order_create_payload = {
        "restaurant_id": rest_id,
        "branch_id": branch_id,
        "table_id": table_id,
        "order_type": "DINE_IN",
        "notes": "Crispy bacon please",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 2,
                "addon_ids": [addon_id],
                "special_instructions": "Well done"
            }
        ]
    }
    order_res = await client.post("/api/v1/orders/", json=order_create_payload)
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]

    assert order_data["subtotal"] == 24.00
    assert order_data["tax_amount"] == 1.20
    assert order_data["total_amount"] == 25.20
    assert order_data["status"] == "PLACED"

    # 6. Kitchen Display fetches active tickets
    kitchen_tickets = await client.get(f"/api/v1/kitchen/{branch_id}/tickets")
    assert kitchen_tickets.status_code == 200
    tickets = kitchen_tickets.json()
    assert any(t["id"] == order_id for t in tickets)

    # 7. Kitchen Advances ticket through life cycle:
    # PLACED -> CONFIRMED -> PREPARING -> READY -> COMPLETED
    adv1 = await client.post(f"/api/v1/kitchen/{branch_id}/tickets/{order_id}/advance")
    assert adv1.json()["status"] == "CONFIRMED"

    adv2 = await client.post(f"/api/v1/kitchen/{branch_id}/tickets/{order_id}/advance")
    assert adv2.json()["status"] == "PREPARING"

    adv3 = await client.post(f"/api/v1/kitchen/{branch_id}/tickets/{order_id}/advance")
    assert adv3.json()["status"] == "READY"

    adv4 = await client.post(f"/api/v1/kitchen/{branch_id}/tickets/{order_id}/advance")
    assert adv4.json()["status"] == "COMPLETED"

    # Completed order should no longer appear on Kitchen active tickets
    kitchen_tickets_after = await client.get(f"/api/v1/kitchen/{branch_id}/tickets")
    assert all(t["id"] != order_id for t in kitchen_tickets_after.json())

    # 8. Check Dashboard Summary & Sales Report
    summary_res = await client.get(f"/api/v1/reports/{rest_id}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_sales"] == 25.20
    assert summary["completed_orders"] == 1
    assert len(summary["top_selling_products"]) == 1
    assert summary["top_selling_products"][0]["product_name"] == "Smoked Bacon Cheeseburger"
    assert summary["top_selling_products"][0]["total_quantity"] == 2

