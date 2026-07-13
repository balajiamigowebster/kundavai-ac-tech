-- MariaDB dump 10.17  Distrib 10.4.10-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ranga_agency_db
-- ------------------------------------------------------
-- Server version	10.4.10-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id_seq` varchar(20) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `assigned_lead` varchar(100) DEFAULT 'Arjun Sharma',
  `project_brief` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_id_seq` (`customer_id_seq`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'C-101','Karan Johar','9876543210','karan@dharma.com',NULL,'Mumbai',NULL,'Arjun Sharma','E-commerce platform with Stripe payment gateway integration.','2026-06-20 17:01:05'),(2,'C-102','Simran Kaur','8765432109','simran@bakery.com',NULL,'Delhi',NULL,'Priya Patel','SEO audit and Google search rankings optimization campaign.','2026-06-20 17:01:05'),(3,'C-103','Rahul Sharma','7654321098','rahul@sharmatech.com',NULL,'Bangalore',NULL,'Rajesh Varma','Full social media marketing handling and weekly PPC ad ads.','2026-06-20 17:01:05'),(4,'C-104','balaji','9442332233','1988.balaji@gmail.com','600117','chennai','chennai','Rajesh Varma','chennai','2026-06-20 17:34:25');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(20) NOT NULL,
  `customer_id_seq` varchar(20) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `items` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `advance_paid` decimal(10,2) DEFAULT 0.00,
  `gst_rate` decimal(5,2) DEFAULT 18.00,
  `status` varchar(20) DEFAULT 'Paid',
  `invoice_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'INV-1001','C-101','Karan Johar','E-commerce Website Development','[{\"title\":\"E-commerce Website Development\",\"description\":\"Complete shop setup, cart integration, and custom checkout flow\",\"rate\":85000,\"qty\":1,\"amount\":85000}]',85000.00,0.00,18.00,'Paid','2026-06-21'),(2,'INV-1002','C-102','Simran Kaur','SEO Audit & Optimization','[{\"title\":\"SEO Audit & Optimization\",\"description\":\"Technical site health check, keywords mapping, and speed optimization\",\"rate\":25000,\"qty\":1,\"amount\":25000}]',25000.00,0.00,18.00,'Unpaid','2026-06-21'),(3,'INV-1003','C-103','Rahul Sharma','Social Media Marketing Campaign','[{\"title\":\"Social Media Marketing Campaign\",\"description\":\"Facebook and Instagram monthly ad spend and posts scheduling management\",\"rate\":35000,\"qty\":1,\"amount\":35000}]',35000.00,0.00,18.00,'Pending','2026-06-21');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_name` varchar(100) NOT NULL,
  `role` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES (1,'Arjun Sharma','Project Manager'),(2,'Priya Patel','Tech Lead Developer'),(3,'Rajesh Varma','Digital Marketing Director');
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `meeting_date` date NOT NULL,
  `meeting_time` varchar(20) NOT NULL,
  `agenda` varchar(255) NOT NULL,
  `lead_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
INSERT INTO `meetings` VALUES (1,1,'2026-06-20','10:00 AM','Initial design brief & payment terms setup','Arjun Sharma'),(2,2,'2026-06-20','11:30 AM','Review keyword reports and site indexing blockers','Priya Patel'),(3,3,'2026-06-20','02:00 PM','Consultation on Instagram ads and campaign ROI','Rajesh Varma');
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_code` varchar(20) NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `timeline` varchar(30) DEFAULT '2 weeks',
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_code` (`service_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'S-101','E-commerce Website Development',85000.00,'4 weeks'),(2,'S-102','SEO Audit & Optimization',25000.00,'2 weeks'),(3,'S-103','Social Media Marketing Campaign',35000.00,'4 weeks'),(4,'S-104','Pay-Per-Click (PPC) Advertising',45000.00,'3 weeks'),(5,'S-105','Custom UI/UX Mobile Design',30000.00,'2 weeks'),(6,'S-106','Corporate Website Redesign',50000.00,'3 weeks');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-21  9:45:24
