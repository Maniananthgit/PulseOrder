import asyncio
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.menu import Category, Product, ProductAddon
from app.models.restaurant import Restaurant

async def enrich():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Restaurant).where(Restaurant.slug == "pulse-bistro"))
        restaurant = res.scalar_one_or_none()
        if not restaurant:
            print("Restaurant not found")
            return

        # Update existing products with images
        images_map = {
            "Truffle Wagyu Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
            "Crispy Portobello Veg Burger": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&auto=format&fit=crop&q=80",
            "Wild Mushroom Tagliatelle": "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=600&auto=format&fit=crop&q=80",
            "Spicy Lobster Linguine": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
            "Sparkling Hibiscus Lemonade": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
        }

        prod_res = await session.execute(select(Product).where(Product.restaurant_id == restaurant.id))
        for p in prod_res.scalars().all():
            if p.name in images_map:
                p.image_url = images_map[p.name]

        # Add Appetizers Category
        cat_app_res = await session.execute(select(Category).where(Category.restaurant_id == restaurant.id, Category.name == "Appetizers & Starters"))
        cat_app = cat_app_res.scalar_one_or_none()
        if not cat_app:
            cat_app = Category(
                restaurant_id=restaurant.id,
                name="Appetizers & Starters",
                sort_order=0,
                is_active=True
            )
            session.add(cat_app)
            await session.flush()

            p_fries = Product(
                restaurant_id=restaurant.id,
                category_id=cat_app.id,
                name="Truffle Parmesan Fries",
                description="Crispy hand-cut russet potatoes tossed with white truffle oil, shaved aged parmigiano & roasted rosemary aioli.",
                base_price=9.50,
                is_veg=True,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
                sort_order=1
            )
            p_burrata = Product(
                restaurant_id=restaurant.id,
                category_id=cat_app.id,
                name="Burrata & Heirloom Tomatoes",
                description="Imported Puglia burrata, balsamic reduction, basil oil, toasted pine nuts & grilled sourdough crostini.",
                base_price=14.50,
                is_veg=True,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=600&auto=format&fit=crop&q=80",
                sort_order=2
            )
            session.add_all([p_fries, p_burrata])

        # Add Desserts Category
        cat_des_res = await session.execute(select(Category).where(Category.restaurant_id == restaurant.id, Category.name == "Decadent Desserts"))
        cat_des = cat_des_res.scalar_one_or_none()
        if not cat_des:
            cat_des = Category(
                restaurant_id=restaurant.id,
                name="Decadent Desserts",
                sort_order=4,
                is_active=True
            )
            session.add(cat_des)
            await session.flush()

            p_lava = Product(
                restaurant_id=restaurant.id,
                category_id=cat_des.id,
                name="Valrhona Chocolate Lava Cake",
                description="Warm molten center dark chocolate cake served with Madagascar vanilla bean gelato & berry coulis.",
                base_price=12.00,
                is_veg=True,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
                sort_order=1
            )
            session.add(p_lava)

        await session.commit()
        print("Enriched database with high-resolution culinary photography and dishes!")

if __name__ == "__main__":
    asyncio.run(enrich())

