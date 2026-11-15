import os
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DECIMAL, Enum
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from jose import JWTError, jwt

# --- 1. CONFIG & ENV ---
load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
SECRET_KEY = os.getenv("JWT_SECRET", "fallback_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"ssl": {}})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. DATABASE MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    message = Column(String(500), nullable=True)
    user_roles = relationship("UserRole", back_populates="user")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True)
    role_permissions = relationship("RolePermission", back_populates="role")

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True)
    description = Column(String(255))

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), primary_key=True)
    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    price = Column(DECIMAL(10, 2), default=0)
    stock_quantity = Column(Integer)
    image_url = Column(String(255))

# --- 3. PYDANTIC SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role_id: int

class ProductCreate(BaseModel):
    name: str
    stock_quantity: int
    image_url: str

class PriceUpdate(BaseModel):
    price: float

class DispatchRequest(BaseModel):
    product_id: int
    quantity: int

class BroadcastRequest(BaseModel):
    role_id: int
    message: str

# --- 4. APP SETUP & SECURITY ---
app = FastAPI(title="FiveForge Industries ERP")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. AUTHENTICATION & RBAC LOGIC ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def require_permission(permission_code: str):
    def permission_checker(token: str, db: Session = Depends(get_db)):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_permissions = payload.get("permissions", [])
            if permission_code not in user_permissions:
                raise HTTPException(status_code=403, detail="Access Denied: Missing Permission")
            return True
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid Token")
    return permission_checker

# --- 6. ENDPOINTS ---

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_role = user.user_roles[0].role.name if user.user_roles else "No Role"
    permissions = []
    if user.user_roles:
        role_perms = db.query(RolePermission).filter(RolePermission.role_id == user.user_roles[0].role_id).all()
        permissions = [db.query(Permission).get(rp.permission_id).code for rp in role_perms]

    token_data = {"sub": user.email, "role": user_role, "permissions": permissions}
    token = create_access_token(token_data)

    display_name = "Admin" if user.full_name == "Super Admin" else user.full_name

    return {
        "access_token": token, 
        "user": {
            "id": user.id, "name": display_name, "email": user.email, "role": user_role, 
            "permissions": permissions, "message": user.message
        }
    }

@app.post("/api/users/acknowledge-message")
def acknowledge_message(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.message = None
        db.commit()
    return {"status": "cleared"}

@app.get("/api/roles")
def get_roles(db: Session = Depends(get_db)):
    return [{"id": r.id, "name": r.name} for r in db.query(Role).all()]

@app.post("/api/admin/users")
def create_user(req: UserCreate, db: Session = Depends(get_db), authorized: bool = Depends(require_permission("MANAGE_USERS"))):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(full_name=req.full_name, email=req.email, password_hash=pwd_context.hash(req.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db.add(UserRole(user_id=new_user.id, role_id=req.role_id))
    db.commit()
    
    return {"message": f"User {req.full_name} created successfully"}

@app.post("/api/admin/broadcast")
def send_broadcast(req: BroadcastRequest, db: Session = Depends(get_db), authorized: bool = Depends(require_permission("MANAGE_USERS"))):
    users = db.query(User).join(UserRole).filter(UserRole.role_id == req.role_id).all()
    for u in users:
        u.message = req.message
    db.commit()
    return {"message": f"Message sent to {len(users)} users."}

@app.get("/api/hr/employees")
def get_hr_data(db: Session = Depends(get_db), authorized: bool = Depends(require_permission("VIEW_HR"))):
    employees = [
        {"name": "Bello Christiana", "role": "HR Staff", "department": "Human Resources"},
        {"name": "Yusuf Bashir", "role": "Senior Engineer", "department": "Production"},
        {"name": "Obed Destiny", "role": "Logistics Lead", "department": "Sales & Logistics"},
        {"name": "Abdulrafiu Abdul Malik", "role": "Financial Analyst", "department": "Finance"},
        {"name": "Yusuf Fawaz Nuhu", "role": "System Administrator", "department": "IT"}
    ]
    return {"module": "HR", "data": employees}

@app.get("/api/finance/records")
def get_finance_data(db: Session = Depends(get_db), authorized: bool = Depends(require_permission("VIEW_FINANCE"))):
    # ... (Finance Data logic remains exactly the same as before)
    data_2025 = [
        {"month": "Jan", "revenue": 35000000, "expenses": 20000000, "payroll": 5500000},
        {"month": "Feb", "revenue": 36000000, "expenses": 21000000, "payroll": 5500000},
        {"month": "Mar", "revenue": 38000000, "expenses": 22000000, "payroll": 5500000},
        {"month": "Apr", "revenue": 37000000, "expenses": 21000000, "payroll": 5500000},
        {"month": "May", "revenue": 39000000, "expenses": 23000000, "payroll": 5500000},
        {"month": "Jun", "revenue": 38000000, "expenses": 22000000, "payroll": 5500000},
        {"month": "Jul", "revenue": 40000000, "expenses": 24000000, "payroll": 5500000},
        {"month": "Aug", "revenue": 38000000, "expenses": 22000000, "payroll": 5500000},
        {"month": "Sep", "revenue": 36000000, "expenses": 21000000, "payroll": 5500000},
        {"month": "Oct", "revenue": 37000000, "expenses": 20000000, "payroll": 5500000},
        {"month": "Nov", "revenue": 39000000, "expenses": 22000000, "payroll": 5500000},
        {"month": "Dec", "revenue": 40000000, "expenses": 23000000, "payroll": 5500000}
    ]
    data_2026 = [
        {"month": "Jan", "revenue": 38000000, "expenses": 24000000, "payroll": 6000000},
        {"month": "Feb", "revenue": 41000000, "expenses": 25000000, "payroll": 6000000},
        {"month": "Mar", "revenue": 45000000, "expenses": 28000000, "payroll": 6000000},
        {"month": "Apr", "revenue": 42000000, "expenses": 26000000, "payroll": 6000000},
        {"month": "May", "revenue": 39000000, "expenses": 25000000, "payroll": 6000000},
        {"month": "Jun", "revenue": 44000000, "expenses": 27000000, "payroll": 6000000},
        {"month": "Jul", "revenue": 48000000, "expenses": 29000000, "payroll": 6000000},
        {"month": "Aug", "revenue": 43000000, "expenses": 26000000, "payroll": 6000000},
        {"month": "Sep", "revenue": 41000000, "expenses": 25000000, "payroll": 6000000},
        {"month": "Oct", "revenue": 40000000, "expenses": 24000000, "payroll": 6000000},
        {"month": "Nov", "revenue": 39000000, "expenses": 23000000, "payroll": 6000000}
    ]
    def calc_totals(data):
        rev = sum(m["revenue"] for m in data)
        exp = sum(m["expenses"] for m in data)
        pay = sum(m["payroll"] for m in data)
        return {"revenue": rev, "expenses": exp, "payroll": pay, "net_profit": rev - (exp + pay)}
    
    return {
        "data_2025": data_2025, "totals_2025": calc_totals(data_2025),
        "data_2026": data_2026, "totals_2026": calc_totals(data_2026)
    }

@app.get("/api/production/products")
def get_production_data(db: Session = Depends(get_db), authorized: bool = Depends(require_permission("VIEW_PRODUCTION"))):
    return {"module": "Production", "products": db.query(Product).all()}

@app.post("/api/production/products")
def add_product(req: ProductCreate, db: Session = Depends(get_db), authorized: bool = Depends(require_permission("EDIT_PRODUCTION"))):
    # Price defaults to 0 when Production adds it
    new_product = Product(name=req.name, price=0, stock_quantity=req.stock_quantity, image_url=req.image_url)
    db.add(new_product)
    db.commit()

    # Automatically notify Sales
    sales_role = db.query(Role).filter(Role.name == "Sales Officer").first()
    if sales_role:
        sales_users = db.query(User).join(UserRole).filter(UserRole.role_id == sales_role.id).all()
        for su in sales_users:
            su.message = f"New product '{req.name}' has been added to inventory. Please assign a price immediately."
        db.commit()

    return {"message": "Product added successfully and Sales notified."}

@app.patch("/api/sales/products/{product_id}")
def update_price(product_id: int, req: PriceUpdate, db: Session = Depends(get_db), authorized: bool = Depends(require_permission("EDIT_SALES"))):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.price = req.price
    db.commit()
    return {"message": "Price updated successfully"}

@app.get("/api/sales/products")
def get_sales_data(db: Session = Depends(get_db), authorized: bool = Depends(require_permission("VIEW_SALES"))):
    return {"module": "Sales", "products": db.query(Product).all()}

@app.post("/api/sales/dispatch")
def dispatch_order(req: DispatchRequest, db: Session = Depends(get_db), authorized: bool = Depends(require_permission("EDIT_SALES"))):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock_quantity < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    product.stock_quantity -= req.quantity
    db.commit()
    
    msg = f"Successfully dispatched {req.quantity} units of {product.name}."
    if product.stock_quantity == 0:
        msg += f" WARNING: {product.name} is now out of stock! Please contact Production to delete it."
        
    return {"message": msg}

@app.on_event("startup")
def seed_users():
    db = SessionLocal()
    if db.query(User).count() == 0:
        users_to_create = [
            {"name": "Super Admin", "email": "admin@gmail.com", "role_id": 1},
            {"name": "HR Manager", "email": "hr@gmail.com", "role_id": 2},
            {"name": "Finance Officer", "email": "finance@gmail.com", "role_id": 3},
            {"name": "Production Manager", "email": "productmanager@gmail.com", "role_id": 4},
            {"name": "Sales Officer", "email": "sales@gmail.com", "role_id": 5},
        ]
        for u in users_to_create:
            new_user = User(full_name=u["name"], email=u["email"], password_hash=pwd_context.hash("password123"))
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            db.add(UserRole(user_id=new_user.id, role_id=u["role_id"]))
            db.commit()
    db.close()

@app.get("/")
def root():
    return {"status": "FiveForge ERP Backend is running!"}