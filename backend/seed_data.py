import asyncio
import uuid
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.enums import TableStatus, UserRole
from app.models.menu import Category, Product, ProductAddon
from app.models.restaurant import Branch, Restaurant
from app.models.settings import RestaurantSettings
from app.models.table import Table
from app.models.user import User
from app.core.security import get_password_hash

async def seed():
    async with AsyncSessionLocal() as session:
        # 1. Create or get Demo Owner
        owner_email = "owner@pulseorder.io"
        res = await session.execute(select(User).where(User.email == owner_email))
        owner = res.scalar_one_or_none()
        if not owner:
            owner = User(
                email=owner_email,
                hashed_password=get_password_hash("SecurePassword123!"),
                full_name="Master Chef Owner",
                role=UserRole.RESTAURANT_OWNER,
                is_active=True,
            )
            session.add(owner)
            await session.flush()

        # 2. Create or get Restaurant
        rest_slug = "pulse-bistro"
        r_res = await session.execute(select(Restaurant).where(Restaurant.slug == rest_slug))
        restaurant = r_res.scalar_one_or_none()
        if not restaurant:
            restaurant = Restaurant(
                owner_id=owner.id,
                name="Pulse Bistro & Grill",
                slug=rest_slug,
                currency="USD",
                is_active=True,
            )
            session.add(restaurant)
            await session.flush()

            # Settings
            settings = RestaurantSettings(
                restaurant_id=restaurant.id,
                tax_percentage=5.0,
                service_charge_percentage=0.0,
                opening_time="09:00",
                closing_time="23:00",
                is_ordering_enabled=True,
            )
            session.add(settings)

            # Branch
            branch = Branch(
                restaurant_id=restaurant.id,
                name="Downtown Flagship",
                address="742 Evergreen Terrace",
                phone="555-0199",
                is_active=True,
            )
            session.add(branch)
            await session.flush()

            # Tables
            t1 = Table(
                branch_id=branch.id,
                table_number="T-01",
                capacity=2,
                qr_code_token="demo_table_token",
                status=TableStatus.AVAILABLE,
                is_active=True,
            )
            t2 = Table(
                branch_id=branch.id,
                table_number="T-02",
                capacity=4,
                qr_code_token="table_02_vip",
                status=TableStatus.AVAILABLE,
                is_active=True,
            )
            session.add_all([t1, t2])

            # Categories & Products
            cat_burgers = Category(restaurant_id=restaurant.id, name="Artisan Burgers", sort_order=1, is_active=True)
            cat_pasta = Category(restaurant_id=restaurant.id, name="Handmade Pasta", sort_order=2, is_active=True)
            cat_drinks = Category(restaurant_id=restaurant.id, name="Craft Beverages", sort_order=3, is_active=True)
            session.add_all([cat_burgers, cat_pasta, cat_drinks])
            await session.flush()

            # Products under Burgers
            p1 = Product(
                restaurant_id=restaurant.id,
                category_id=cat_burgers.id,
                name="Truffle Wagyu Burger",
                description="Brioche bun, prime Wagyu beef patty, black truffle aioli, aged cheddar & caramelized onions.",
                base_price=18.50,
                is_veg=False,
                is_available=True,
                sort_order=1,
            )
            p2 = Product(
                restaurant_id=restaurant.id,
                category_id=cat_burgers.id,
                name="Crispy Portobello Veg Burger",
                description="Panko-crusted whole portobello mushroom, smoked gouda, avocado mash & spicy chipotle slaw.",
                base_price=15.00,
                is_veg=True,
                is_available=True,
                sort_order=2,
            )
            session.add_all([p1, p2])
            await session.flush()

            # Addons
            a1 = ProductAddon(product_id=p1.id, name="Extra Bacon", price=3.00, is_available=True)
            a2 = ProductAddon(product_id=p1.id, name="Double Truffle Sauce", price=2.00, is_available=True)
            a3 = ProductAddon(product_id=p2.id, name="Extra Avocado", price=2.50, is_available=True)
            session.add_all([a1, a2, a3])

            # Products under Pasta
            p3 = Product(
                restaurant_id=restaurant.id,
                category_id=cat_pasta.id,
                name="Wild Mushroom Tagliatelle",
                description="Fresh tagliatelle with creamy forest mushroom ragù, roasted garlic & shaved parmigiano.",
                base_price=19.00,
                is_veg=True,
                is_available=True,
                sort_order=1,
            )
            p4 = Product(
                restaurant_id=restaurant.id,
                category_id=cat_pasta.id,
                name="Spicy Lobster Linguine",
                description="Sautéed Atlantic lobster tail, San Marzano tomato broth, chili flakes & sweet basil.",
                base_price=27.50,
                is_veg=False,
                is_available=True,
                sort_order=2,
            )
            session.add_all([p3, p4])

            # Products under Drinks
            p5 = Product(
                restaurant_id=restaurant.id,
                category_id=cat_drinks.id,
                name="Sparkling Hibiscus Lemonade",
                description="Freshly squeezed lemons infused with organic hibiscus tea and crushed mint.",
                base_price=6.50,
                is_veg=True,
                is_available=True,
                sort_order=1,
            )
            session.add(p5)

            await session.commit()
            print("Successfully seeded Pulse Bistro demo data!")
            print(f"Restaurant ID: {restaurant.id}")
            print(f"Branch ID: {branch.id}")
            print(f"Table 1 QR Token: demo_table_token")
        else:
            print("Pulse Bistro already exists in database.")

if __name__ == "__main__":
    asyncio.run(seed())

