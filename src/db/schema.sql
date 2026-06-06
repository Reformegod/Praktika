DROP TABLE IF EXISTS inventory_checks;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cell VARCHAR(50) NOT NULL,
    batch VARCHAR(50) NOT NULL,
    expiration_date DATE,
    min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    operation_type VARCHAR(30) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    from_cell VARCHAR(50),
    to_cell VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    customer VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_checks (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO products (sku, name, category, unit, quantity, cell, batch, expiration_date, min_quantity, status) VALUES
('SKU-1001', 'Молоко 1л', 'Продукты', 'шт', 120, 'A-01', 'B-2026-01', '2026-08-15', 20, 'active'),
('SKU-2001', 'Бумага А4', 'Канцтовары', 'уп', 55, 'B-03', 'PAPER-05', NULL, 10, 'active'),
('SKU-3001', 'Картридж HP', 'Техника', 'шт', 8, 'C-02', 'HP-77', NULL, 5, 'active');
