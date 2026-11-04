USE sari_store;
-- Sales need a user (orders.user_id). This creates user #1.
INSERT INTO users (name, email, password_hash, role) VALUES ('Store Owner', 'owner@saristore.local', 'not-used-yet', 'admin');
