-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: sari_store
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `sari_store`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `sari_store` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `sari_store`;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `store_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  KEY `store_id` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Beverages',NULL,1),(2,'Snacks',NULL,1),(3,'Canned Goods',NULL,1),(4,'Household',NULL,1),(5,'Household',NULL,9),(6,'Canned Goods',NULL,9),(7,'Snacks',NULL,9),(8,'Beverages',NULL,9),(9,'Household',NULL,8),(10,'Canned Goods',NULL,8),(11,'Snacks',NULL,8),(12,'Beverages',NULL,8),(13,'Household',NULL,2),(14,'Canned Goods',NULL,2),(15,'Snacks',NULL,2),(16,'Beverages',NULL,2),(70,'Beverages',NULL,21),(71,'Snacks',NULL,21),(72,'Canned Goods',NULL,21),(73,'Household',NULL,21),(74,'Beverages',NULL,22),(75,'Snacks',NULL,22),(76,'Canned Goods',NULL,22),(77,'Household',NULL,22),(78,'Beverages',NULL,23),(79,'Snacks',NULL,23),(80,'Canned Goods',NULL,23),(81,'Household',NULL,23),(82,'Beverages',NULL,24),(83,'Snacks',NULL,24),(84,'Canned Goods',NULL,24),(85,'Household',NULL,24);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verifications`
--

DROP TABLE IF EXISTS `email_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verifications` (
  `user_id` int NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `sent_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `email_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verifications`
--

LOCK TABLES `email_verifications` WRITE;
/*!40000 ALTER TABLE `email_verifications` DISABLE KEYS */;
INSERT INTO `email_verifications` VALUES (27,'$2y$12$gd57eVe74zBTlk/Wrkv/7e.CruCgW/kr1xmIVnBKOhFo9YRePJAGy','2026-11-06 11:07:20',0,'2026-11-06 10:52:20');
/*!40000 ALTER TABLE `email_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2026_11_03_150313_add_pricing_to_products_and_order_items',1),(2,'2026_11_02_163602_create_personal_access_tokens_table',2);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,64,4,13.00,52.00,0.00),(2,1,58,12,35.00,420.00,0.00),(3,1,56,15,32.00,480.00,0.00),(4,2,54,1,15.00,15.00,0.00),(5,3,65,10,15.00,150.00,10.00),(6,4,62,7,28.00,196.00,0.00),(7,5,68,3,25.00,75.00,21.00),(8,6,67,3,10.00,30.00,7.00),(9,7,54,1,15.00,15.00,0.00),(10,7,1,1,75.00,75.00,0.00),(11,8,69,1,3.00,3.00,2.00),(12,9,69,1,3.00,3.00,2.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `store_id` int unsigned DEFAULT NULL,
  `payment_method` varchar(20) NOT NULL DEFAULT 'cash',
  `amount_paid` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `store_id` (`store_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'2026-11-03 22:51:56','completed',952.00,'2026-11-03 14:51:56',1,'cash',NULL),(2,1,'2026-11-03 22:57:53','cancelled',15.00,'2026-11-03 14:57:53',1,'cash',NULL),(3,1,'2026-11-04 12:52:34','completed',150.00,'2026-11-04 04:52:34',1,'cash',NULL),(4,2,'2026-11-04 14:45:40','completed',196.00,'2026-11-04 06:45:40',1,'cash',NULL),(5,7,'2026-11-04 17:31:07','completed',75.00,'2026-11-04 09:31:07',9,'cash',NULL),(6,2,'2026-11-04 22:30:28','cancelled',30.00,'2026-11-04 14:30:28',1,'cash',NULL),(7,2,'2026-11-04 22:47:00','completed',90.00,'2026-11-04 14:47:00',1,'cash',NULL),(8,4,'2026-11-05 20:25:10','completed',3.00,'2026-11-05 12:25:10',2,'cash',3.00),(9,4,'2026-11-05 20:25:44','completed',3.00,'2026-11-05 12:25:44',2,'gcash',3.00);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `user_id` int NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `sent_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (46,'App\\Models\\User',4,'web','925728aa5a3f4a5d39f48256cc937efc3e38e0f4ef33add9a3f587ed04666255','[\"*\"]','2026-11-05 07:12:39',NULL,'2026-11-05 07:12:29','2026-11-05 07:12:39'),(52,'App\\Models\\User',2,'web','c408cd22b469ed7ebf432b1026ff4f4db8a2e708b7d809b5a502ce22310f3c66','[\"*\"]','2026-11-06 03:06:04',NULL,'2026-11-06 03:03:23','2026-11-06 03:06:04');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_suppliers`
--

DROP TABLE IF EXISTS `product_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_suppliers` (
  `product_supplier_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_supplier_id`),
  KEY `product_id` (`product_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `product_suppliers_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_suppliers_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_suppliers`
--

LOCK TABLES `product_suppliers` WRITE;
/*!40000 ALTER TABLE `product_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `description` text,
  `category_id` int DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cost_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `store_id` int unsigned DEFAULT NULL,
  `low_stock` int NOT NULL DEFAULT '10',
  PRIMARY KEY (`product_id`),
  KEY `category_id` (`category_id`),
  KEY `store_id` (`store_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Coca-Cola 1.5L',NULL,1,75.00,23,1,'2026-11-02 15:35:53',0.00,1,10),(2,'Lucky Me Pancit Canton',NULL,3,16.00,60,1,'2026-11-02 15:35:53',0.00,1,10),(3,'Safeguard Soap',NULL,4,38.00,8,1,'2026-11-02 15:35:53',0.00,1,10),(48,'Pepsi 1.5L',NULL,1,78.00,20,1,'2026-11-02 16:51:08',0.00,1,10),(49,'Mountain Dew 500ml',NULL,1,25.00,30,1,'2026-11-02 16:51:08',0.00,1,10),(50,'Chuckie Chocolate Milk',NULL,1,18.00,25,1,'2026-11-02 16:51:08',0.00,1,10),(51,'Nature Spring 1L',NULL,1,20.00,40,1,'2026-11-02 16:51:08',0.00,1,10),(52,'Chippy BBQ',NULL,2,12.00,35,0,'2026-11-02 16:51:08',0.00,1,10),(53,'Piattos Sour Cream',NULL,2,20.00,25,1,'2026-11-02 16:51:08',0.00,1,10),(54,'Cloud 9 Chocolate',NULL,2,15.00,29,1,'2026-11-02 16:51:08',0.00,1,10),(55,'Fita Crackers',NULL,2,8.00,40,1,'2026-11-02 16:51:08',0.00,1,10),(56,'CDO Karne Norte',NULL,3,32.00,0,0,'2026-11-02 16:51:08',0.00,1,10),(57,'Mega Sardines',NULL,3,25.00,20,1,'2026-11-02 16:51:08',0.00,1,10),(58,'555 Tuna Flakes',NULL,3,35.00,6,0,'2026-11-02 16:51:08',0.00,1,10),(59,'Libbys Vienna Sausage',NULL,3,38.00,12,1,'2026-11-02 16:51:08',0.00,1,10),(60,'Joy Dishwashing Liquid',NULL,4,15.00,25,1,'2026-11-02 16:51:08',0.00,1,10),(61,'Surf Detergent Powder',NULL,4,12.00,30,1,'2026-11-02 16:51:08',0.00,1,10),(62,'Zonrox Bleach',NULL,4,28.00,8,1,'2026-11-02 16:51:08',0.00,1,10),(63,'Scotch-Brite Sponge',NULL,4,20.00,20,1,'2026-11-02 16:51:08',0.00,1,10),(64,'test prioduct',NULL,1,13.00,19,1,'2026-11-03 14:43:50',0.00,1,10),(65,'test',NULL,2,15.00,17,1,'2026-11-04 04:52:07',10.00,1,10),(66,'test',NULL,2,15.00,20,1,'2026-11-04 04:52:07',10.00,1,10),(67,'chippy',NULL,2,10.00,17,1,'2026-11-04 06:44:48',7.00,1,10),(68,'pancit canton',NULL,4,25.00,7,1,'2026-11-04 09:30:37',21.00,9,10),(69,'as','Warn me when stock is at or below',16,3.00,3,1,'2026-11-05 12:04:17',2.00,2,5),(76,'presto',NULL,2,10.00,14,1,'2026-11-06 05:11:35',7.00,1,10),(77,'posporo',NULL,4,4.00,17,1,'2026-11-06 05:12:41',2.00,1,10);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `profile_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES (1,2,'09123456789',NULL,NULL,NULL,'2026-11-04 14:36:45');
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `movement_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
  `quantity` int NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(40) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `store_id` int unsigned DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`movement_id`),
  KEY `product_id` (`product_id`),
  KEY `store_id` (`store_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,64,'IN',12,NULL,NULL,'Opening stock','2026-11-03 14:43:50',1,NULL),(2,64,'OUT',4,1,'order','Sale #1','2026-11-03 14:51:56',1,NULL),(3,58,'OUT',12,1,'order','Sale #1','2026-11-03 14:51:56',1,NULL),(4,56,'OUT',15,1,'order','Sale #1','2026-11-03 14:51:56',1,NULL),(5,54,'OUT',1,2,'order','Sale #2','2026-11-03 14:57:53',1,NULL),(6,65,'IN',20,NULL,NULL,'Opening stock','2026-11-04 04:52:07',1,NULL),(7,66,'IN',20,NULL,NULL,'Opening stock','2026-11-04 04:52:07',1,NULL),(8,65,'OUT',10,3,'order','Sale #3','2026-11-04 04:52:34',1,NULL),(9,67,'IN',17,NULL,NULL,'Opening stock','2026-11-04 06:44:48',1,NULL),(10,62,'OUT',7,4,'order','Sale #4','2026-11-04 06:45:40',1,NULL),(11,68,'IN',10,NULL,NULL,'Opening stock','2026-11-04 09:30:37',9,NULL),(12,68,'OUT',3,5,'order','Sale #5','2026-11-04 09:31:07',9,NULL),(13,54,'IN',1,2,'order','Voided sale #2','2026-11-04 14:30:15',1,NULL),(14,67,'OUT',3,6,'order','Sale #6','2026-11-04 14:30:28',1,NULL),(15,67,'IN',3,6,'order','Voided sale #6','2026-11-04 14:31:28',1,NULL),(16,54,'OUT',1,7,'order','Sale #7','2026-11-04 14:47:00',1,NULL),(17,1,'OUT',1,7,'order','Sale #7','2026-11-04 14:47:00',1,NULL),(18,69,'IN',2,NULL,NULL,'Opening stock','2026-11-05 12:04:17',2,NULL),(19,69,'IN',1,NULL,NULL,'expired','2026-11-05 12:14:34',2,4),(20,69,'IN',3,NULL,NULL,'Restock','2026-11-05 12:15:07',2,4),(21,69,'OUT',1,NULL,'removal','Damaged','2026-11-05 12:15:30',2,4),(22,69,'OUT',1,8,'order','Sale #8','2026-11-05 12:25:10',2,4),(23,69,'OUT',1,9,'order','Sale #9','2026-11-05 12:25:44',2,4),(77,77,'IN',9,NULL,NULL,'Restock','2026-11-06 05:26:55',1,2),(78,77,'IN',8,NULL,NULL,'Restock','2026-11-06 05:27:11',1,2),(79,76,'IN',14,NULL,NULL,'Restock','2026-11-06 05:27:27',1,2),(80,65,'IN',7,NULL,NULL,'Restock','2026-11-06 05:27:53',1,2),(81,64,'IN',11,NULL,NULL,'Restock','2026-11-06 05:28:02',1,2);
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `store_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `join_code` varchar(12) NOT NULL,
  `owner_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `store_type` varchar(30) NOT NULL DEFAULT 'sari_sari',
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `join_code` (`join_code`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'My Sari-Sari Store','64ZF3YNG',2,'2026-11-04 07:01:15','sari_sari'),(2,'aristore','N4UM8EBV',4,'2026-11-04 07:07:03','sari_sari'),(8,'1212','F9RSY5NX',6,'2026-11-04 08:50:20','sari_sari'),(9,'sunny','CVESRMAF',7,'2026-11-04 09:29:00','sari_sari'),(21,'nice','K2EGFUW5',25,'2026-11-06 10:43:56','small_business'),(22,'erer','F23CMH67',26,'2026-11-06 10:48:49','sari_sari'),(23,'wewe','HQCKJ83Z',27,'2026-11-06 10:52:20','sari_sari'),(24,'erer','2UYAGRM6',28,'2026-11-06 10:56:05','sari_sari');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `store_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`supplier_id`),
  KEY `store_id` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Davao Wholesale Trading','Aling Rosa','09171234567',NULL,NULL,'2026-11-02 15:35:53',1);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(60) DEFAULT NULL,
  `middle_name` varchar(60) DEFAULT NULL,
  `last_name` varchar(60) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `birthdate` date NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL DEFAULT 'cashier',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `store_id` int unsigned DEFAULT NULL,
  `terms_accepted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `store_id` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Store',NULL,'Owner','Store Owner','owner@saristore.local','2026-11-06 10:34:56','2000-01-01','not-used-yet','viewer','2026-11-02 16:43:39',NULL,NULL),(2,'rudolf','dee','aris','rudolf dee aris','owner@sari.test','2026-11-06 10:34:56','2003-01-10','$2y$12$Ndrh3zfro6R9zMbMy4ZTvevqZK8Ge7/fBgLAvcO5tAGCxR.BV0Q3W','owner','2026-11-03 21:03:33',1,NULL),(3,'rudolf',NULL,NULL,'rudolf','dolfdee@gmail.com','2026-11-06 10:34:56','2000-01-01','$2y$12$mF9ORurrRcFPA9p2wGcmde.3n8bHi4JNQy18Y9qWrgsQR0FEk4lIS','cashier','2026-11-03 22:55:12',1,NULL),(4,'aris',NULL,NULL,'aris','ty202500742@wmsu.edu.ph','2026-11-06 10:34:56','2000-01-01','$2y$12$QMOVi.Sylhg3SlO5Gu4o4ezgpOrcoGjT5HeUqogMa9923Q4Nlfgf.','owner','2026-11-03 23:07:03',2,NULL),(5,'rudolf',NULL,NULL,'rudolf','aris@gmail.com','2026-11-06 10:34:56','2000-01-01','$2y$12$CPMQ3o5S7hLmDIjcgGWc.eY2Ywo4uCex.w1RpIC/QPxmuz8oxcwKq','inventory','2026-11-03 23:08:14',2,NULL),(6,'Rudolf',NULL,'Ariston','Rudolf Ariston','rudolfdee13@gmail.com','2026-11-06 10:34:56','2003-12-12','$2y$12$PoGga17XAx4qQDXtbC92IusRdjhPY7pM1hB/uBseOQlvT/pHAPNn2','owner','2026-11-04 00:50:21',8,NULL),(7,'summer',NULL,'Boni','summer Boni','summermer002@gmail.com','2026-11-06 10:34:56','2003-06-02','$2y$12$KX94eqPTUDTU6jZpXbRpH.hQE3hvEtYVpkLcxvi3eCkIGhoIfXg/2','owner','2026-11-04 01:29:01',9,NULL),(27,'Rudolf',NULL,'Ariston','Rudolf Ariston','nice@gmail.com',NULL,'2008-12-12','$2y$12$uXY7riXgczkKSScEfJy88u.oTL.PB8P/QoWb5DtJtFT/7jndTelga','owner','2026-11-06 02:52:20',23,'2026-11-06 10:52:20'),(28,'Rud',NULL,'Ariston','Rud Ariston','dol@sari.test','2026-11-06 02:56:32','2009-12-12','$2y$12$bHoqqqHG0vT9ZQEktZkmCeP.t7jJNjM2n4j0vwibXmbuGnFp6J1Lu','owner','2026-11-06 02:56:05',24,'2026-11-06 10:56:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-06 19:09:00
