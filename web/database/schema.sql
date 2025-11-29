CREATE TABLE IF NOT EXISTS pricing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('product', 'collection', 'variant')),
    target_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1 CHECK(active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL,
    min_quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES pricing_rules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rule_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop TEXT NOT NULL,
    order_id TEXT,
    rule_id INTEGER,
    tier_applied TEXT,
    quantity INTEGER,
    original_price REAL,
    adjusted_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES pricing_rules(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_shop ON pricing_rules(shop);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_target ON pricing_rules(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_rule ON pricing_tiers(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_logs_shop ON rule_logs(shop);
CREATE INDEX IF NOT EXISTS idx_rule_logs_order ON rule_logs(order_id);

