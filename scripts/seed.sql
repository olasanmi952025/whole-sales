-- Sample data for testing

-- Sample pricing rule for a product
INSERT INTO pricing_rules (shop, target_type, target_id, rule_name, priority, active)
VALUES ('example-store.myshopify.com', 'product', 'gid://shopify/Product/1234567890', 'Wholesale T-Shirts', 10, 1);

-- Get the last inserted rule ID
-- Replace 1 with actual ID after running above INSERT

-- Tiers for the sample rule
INSERT INTO pricing_tiers (rule_id, min_quantity, price, currency)
VALUES 
  (1, 1, 20.00, 'USD'),
  (1, 5, 15.00, 'USD'),
  (1, 10, 12.00, 'USD'),
  (1, 25, 10.00, 'USD'),
  (1, 50, 8.00, 'USD');

-- Sample pricing rule for a collection
INSERT INTO pricing_rules (shop, target_type, target_id, rule_name, priority, active)
VALUES ('example-store.myshopify.com', 'collection', 'gid://shopify/Collection/9876543210', 'Bulk Accessories', 5, 1);

INSERT INTO pricing_tiers (rule_id, min_quantity, price, currency)
VALUES 
  (2, 10, 5.00, 'USD'),
  (2, 20, 4.00, 'USD'),
  (2, 50, 3.00, 'USD');

-- Sample log entry
INSERT INTO rule_logs (shop, order_id, rule_id, tier_applied, quantity, original_price, adjusted_price)
VALUES (
  'example-store.myshopify.com',
  'gid://shopify/Order/1111111111',
  1,
  '10 units → $12.00',
  10,
  20.00,
  12.00
);

-- Verify
SELECT 'Pricing Rules:' as section;
SELECT * FROM pricing_rules;

SELECT 'Pricing Tiers:' as section;
SELECT * FROM pricing_tiers;

SELECT 'Logs:' as section;
SELECT * FROM rule_logs;

