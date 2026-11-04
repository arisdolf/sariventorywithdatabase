CREATE TABLE IF NOT EXISTS `categories` (
	`category_id` INTEGER NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(80) NOT NULL,
	`description` VARCHAR(255) NOT NULL,
	PRIMARY KEY(`category_id`)
);


CREATE TABLE IF NOT EXISTS `stores` (
	`store_id` INTEGER NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(120) NOT NULL,
	`join_code` VARCHAR(12) NOT NULL,
	`owner_id` INTEGER NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`store_id`),
	CONSTRAINT `stores_unique_0` UNIQUE (`join_code`)
);


CREATE TABLE IF NOT EXISTS `users` (
	`user_id` INTEGER NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(100) NOT NULL,
	`email` VARCHAR(120) NOT NULL,
	`password_hash` VARCHAR(255) NOT NULL,
	`role` VARCHAR(30) NOT NULL DEFAULT 'cashier',
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`store_id` INTEGER NOT NULL,
	`age` TINYINT,
	PRIMARY KEY(`user_id`),
	CONSTRAINT `users_unique_0` UNIQUE (`email`)
);


CREATE TABLE IF NOT EXISTS `profiles` (
	`profile_id` INTEGER NOT NULL AUTO_INCREMENT,
	`user_id` INTEGER NOT NULL,
	`phone` VARCHAR(30) NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`profile_id`),
	CONSTRAINT `profiles_unique_0` UNIQUE (`user_id`)
);


CREATE TABLE IF NOT EXISTS `products` (
	`product_id` INTEGER NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(120) NOT NULL,
	`description` TEXT NOT NULL,
	`category_id` INTEGER NOT NULL,
	`unit_price` DECIMAL(10,2) NOT NULL,
	`stock_quantity` INTEGER NOT NULL DEFAULT 0,
	`is_active` TINYINT NOT NULL DEFAULT 1,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`cost_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
	`store_id` INTEGER NOT NULL,
	PRIMARY KEY(`product_id`)
);


CREATE TABLE IF NOT EXISTS `suppliers` (
	`supplier_id` INTEGER NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(120) NOT NULL,
	`contact_person` VARCHAR(100) NOT NULL,
	`phone` VARCHAR(30) NOT NULL,
	`email` VARCHAR(120) NOT NULL,
	`address` VARCHAR(255) NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`store_id` INTEGER NOT NULL,
	PRIMARY KEY(`supplier_id`)
);


CREATE TABLE IF NOT EXISTS `product_suppliers` (
	`product_supplier_id` INTEGER NOT NULL AUTO_INCREMENT,
	`product_id` INTEGER NOT NULL,
	`supplier_id` INTEGER NOT NULL,
	`purchase_price` DECIMAL(10,2) NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`product_supplier_id`)
);


CREATE TABLE IF NOT EXISTS `orders` (
	`order_id` INTEGER NOT NULL AUTO_INCREMENT,
	`user_id` INTEGER NOT NULL,
	`order_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'completed',
	`total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`store_id` INTEGER NOT NULL,
	PRIMARY KEY(`order_id`)
);


CREATE TABLE IF NOT EXISTS `order_items` (
	`order_item_id` INTEGER NOT NULL AUTO_INCREMENT,
	`order_id` INTEGER NOT NULL,
	`product_id` INTEGER NOT NULL,
	`quantity` INTEGER NOT NULL,
	`unit_price` DECIMAL(10,2) NOT NULL,
	`subtotal` DECIMAL(10,2) NOT NULL,
	`unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
	PRIMARY KEY(`order_item_id`)
);


CREATE TABLE IF NOT EXISTS `stock_movements` (
	`movement_id` INTEGER NOT NULL AUTO_INCREMENT,
	`product_id` INTEGER NOT NULL,
	`type` ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
	`quantity` INTEGER NOT NULL,
	`reference_id` INTEGER NOT NULL,
	`reference_type` VARCHAR(40) NOT NULL,
	`remarks` VARCHAR(255) NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`store_id` INTEGER NOT NULL,
	PRIMARY KEY(`movement_id`)
);


ALTER TABLE `users`
ADD FOREIGN KEY(`store_id`) REFERENCES `stores`(`store_id`)
ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE `profiles`
ADD FOREIGN KEY(`user_id`) REFERENCES `users`(`user_id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `products`
ADD FOREIGN KEY(`category_id`) REFERENCES `categories`(`category_id`)
ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE `products`
ADD FOREIGN KEY(`store_id`) REFERENCES `stores`(`store_id`)
ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE `suppliers`
ADD FOREIGN KEY(`store_id`) REFERENCES `stores`(`store_id`)
ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE `product_suppliers`
ADD FOREIGN KEY(`product_id`) REFERENCES `products`(`product_id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `product_suppliers`
ADD FOREIGN KEY(`supplier_id`) REFERENCES `suppliers`(`supplier_id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `orders`
ADD FOREIGN KEY(`user_id`) REFERENCES `users`(`user_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `orders`
ADD FOREIGN KEY(`store_id`) REFERENCES `stores`(`store_id`)
ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE `order_items`
ADD FOREIGN KEY(`order_id`) REFERENCES `orders`(`order_id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `order_items`
ADD FOREIGN KEY(`product_id`) REFERENCES `products`(`product_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `stock_movements`
ADD FOREIGN KEY(`product_id`) REFERENCES `products`(`product_id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `stock_movements`
ADD FOREIGN KEY(`store_id`) REFERENCES `stores`(`store_id`)
ON UPDATE NO ACTION ON DELETE SET NULL;