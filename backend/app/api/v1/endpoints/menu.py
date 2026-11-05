import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.dependencies.auth import get_current_user, require_roles, verify_restaurant_access
from app.models.enums import UserRole
from app.models.menu import Category, Product, ProductAddon
from app.models.user import User
from app.schemas.menu import (
    AddonCreate,
    AddonResponse,
    CategoryCreate,
    CategoryResponse,
    CategoryWithProductsResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter()

# ----------------- CATEGORIES -----------------

@router.get("/{restaurant_id}/categories", response_model=List[CategoryWithProductsResponse], tags=["Menu"])
async def list_categories(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Category)
        .where(Category.restaurant_id == restaurant_id, Category.is_active == True)
        .options(selectinload(Category.products).selectinload(Product.addons))
        .order_by(Category.sort_order.asc(), Category.name.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.post("/{restaurant_id}/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, tags=["Menu"])
async def create_category(
    restaurant_id: uuid.UUID,
    cat_in: CategoryCreate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    category = Category(
        restaurant_id=restaurant_id,
        name=cat_in.name,
        description=cat_in.description,
        sort_order=cat_in.sort_order,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{restaurant_id}/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Menu"])
async def delete_category(
    restaurant_id: uuid.UUID,
    category_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stmt = select(Category).where(Category.id == category_id, Category.restaurant_id == restaurant_id)
    res = await db.execute(stmt)
    category = res.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    category.is_active = False
    await db.commit()

# ----------------- PRODUCTS -----------------

@router.get("/{restaurant_id}/products", response_model=List[ProductResponse], tags=["Menu"])
async def list_products(
    restaurant_id: uuid.UUID,
    category_id: Optional[uuid.UUID] = Query(None),
    is_veg: Optional[bool] = Query(None),
    is_available: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Product)
        .where(Product.restaurant_id == restaurant_id)
        .options(selectinload(Product.addons))
    )

    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if is_veg is not None:
        stmt = stmt.where(Product.is_veg == is_veg)
    if is_available is not None:
        stmt = stmt.where(Product.is_available == is_available)
    if search:
        stmt = stmt.where(Product.name.ilike(f"%{search}%"))

    stmt = stmt.order_by(Product.sort_order.asc(), Product.name.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.post("/{restaurant_id}/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Menu"])
async def create_product(
    restaurant_id: uuid.UUID,
    prod_in: ProductCreate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    product = Product(
        restaurant_id=restaurant_id,
        category_id=prod_in.category_id,
        name=prod_in.name,
        description=prod_in.description,
        base_price=prod_in.base_price,
        is_veg=prod_in.is_veg,
        is_available=prod_in.is_available,
        image_url=prod_in.image_url,
        sort_order=prod_in.sort_order
    )
    db.add(product)
    await db.flush()

    if prod_in.addons:
        for a in prod_in.addons:
            addon = ProductAddon(
                product_id=product.id,
                name=a.name,
                price=a.price,
                is_available=a.is_available
            )
            db.add(addon)

    await db.commit()
    
    # Reload with addons
    reload_stmt = select(Product).where(Product.id == product.id).options(selectinload(Product.addons))
    reloaded = await db.execute(reload_stmt)
    return reloaded.scalar_one()

@router.get("/{restaurant_id}/products/{product_id}", response_model=ProductResponse, tags=["Menu"])
async def get_product(
    restaurant_id: uuid.UUID,
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Product)
        .where(Product.id == product_id, Product.restaurant_id == restaurant_id)
        .options(selectinload(Product.addons))
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.put("/{restaurant_id}/products/{product_id}", response_model=ProductResponse, tags=["Menu"])
async def update_product(
    restaurant_id: uuid.UUID,
    product_id: uuid.UUID,
    prod_in: ProductUpdate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stmt = select(Product).where(Product.id == product_id, Product.restaurant_id == restaurant_id).options(selectinload(Product.addons))
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    if prod_in.name is not None:
        product.name = prod_in.name
    if prod_in.description is not None:
        product.description = prod_in.description
    if prod_in.base_price is not None:
        product.base_price = prod_in.base_price
    if prod_in.is_veg is not None:
        product.is_veg = prod_in.is_veg
    if prod_in.is_available is not None:
        product.is_available = prod_in.is_available
    if prod_in.image_url is not None:
        product.image_url = prod_in.image_url
    if prod_in.sort_order is not None:
        product.sort_order = prod_in.sort_order

    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/{restaurant_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Menu"])
async def delete_product(
    restaurant_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stmt = select(Product).where(Product.id == product_id, Product.restaurant_id == restaurant_id)
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    await db.delete(product)
    await db.commit()
