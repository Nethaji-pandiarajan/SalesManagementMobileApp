-- 1. Organizations (The Master Tenant)
CREATE TABLE organizations (
    org_id SERIAL PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    owner_mobile VARCHAR(20),
    description TEXT,
    address TEXT,
    email VARCHAR(100),
    phone VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    org_id INT REFERENCES organizations(org_id),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(role_id),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    address TEXT,
    state VARCHAR(100),
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categories
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products
CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,
    sku_code VARCHAR(50),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT REFERENCES category(category_id),
    unit VARCHAR(20), -- e.g., 'Litre', '500ml'
    rate DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Vehicles
CREATE TABLE vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    vehicle_no VARCHAR(50) UNIQUE NOT NULL,
    vehicle_name VARCHAR(100),
    vehicle_owner VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Shops
CREATE TABLE shops (
    shop_id SERIAL PRIMARY KEY,
    shop_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    area_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Driver
CREATE TABLE driver (
    driver_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    driver_name VARCHAR(255) NOT NULL,
    id_proof VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Supply Management (Daily Load Sheet)
CREATE TABLE supply_management (
    supply_id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organizations(org_id),
    date DATE NOT NULL,
    vehicle_id INT REFERENCES vehicle(vehicle_id),
    driver_id INT REFERENCES driver(driver_id),
    product_id INT REFERENCES product(product_id),
    quantity_loaded DECIMAL(12, 2),
    areas_covered TEXT,
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Sales Transactions (The Header/Invoice)
CREATE TABLE sales_transactions (
    sales_id SERIAL PRIMARY KEY,
    supply_id INT REFERENCES supply_management(supply_id),
    shop_id INT REFERENCES shops(shop_id),
    total_amount DECIMAL(12, 2) DEFAULT 0,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    pending_amount DECIMAL(12, 2) DEFAULT 0,
    payment_type VARCHAR(50), -- CASH, UPI, CREDIT
    description TEXT,
    org_id INT REFERENCES organizations(org_id),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Sales Items (Individual Products in an Invoice)
CREATE TABLE sales_items (
    item_id SERIAL PRIMARY KEY,
    sales_id INT REFERENCES sales_transactions(sales_id),
    product_id INT REFERENCES product(product_id),
    quantity_sold DECIMAL(12, 2) NOT NULL,
    remaining_quantity DECIMAL(12, 2), -- Stock left in van AFTER this item sale
    rate_at_sale DECIMAL(12, 2),
    total_amount DECIMAL(12, 2), -- quantity_sold * rate_at_sale
    org_id INT REFERENCES organizations(org_id),
    created_by INT,
    updated_by INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Collection/Payments (For separate debt clearance)
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shops(shop_id),
    sales_id INT REFERENCES sales_transactions(sales_id), -- Optional link to specific bill
    amount_paid DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    driver_id INT REFERENCES driver(driver_id),
    org_id INT REFERENCES organizations(org_id)
);

-- 13. Preorders (For shop-centric advance orders)
CREATE TABLE preorders (
    preorder_id SERIAL PRIMARY KEY,
    shop_id INT NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    sales_executive VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    preorder_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    org_id INT REFERENCES organizations(org_id)
);

-- 14. Preorder Items (For multiple items within a single preorder)
CREATE TABLE preorder_items (
    preorder_item_id SERIAL PRIMARY KEY,
    preorder_id INT NOT NULL REFERENCES preorders(preorder_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    org_id INT REFERENCES organizations(org_id)
);

