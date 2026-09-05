-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 05, 2026 at 06:08 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shs_kpis_claude`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_program`
--

CREATE TABLE `academic_program` (
  `code` varchar(20) NOT NULL,
  `label_th` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `academic_program`
--

INSERT INTO `academic_program` (`code`, `label_th`, `sort_order`, `created_at`, `updated_at`) VALUES
('BM', 'สาขาวิชาเทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ', 5, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('EnvH', 'สาขาวิชาอนามัยสิ่งแวดล้อม', 4, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('OHS', 'สาขาวิชาอาชีวอนามัยและความปลอดภัย', 3, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('PH', 'สาขาวิชาสาธารณสุขศาสตร์', 1, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('SHS', 'สาขาวิชาวิทยาศาสตร์การกีฬาและสุขภาพ', 2, '2026-07-25 11:45:17', '2026-07-25 11:45:17');

-- --------------------------------------------------------

--
-- Table structure for table `committees`
--

CREATE TABLE `committees` (
  `id` varchar(30) NOT NULL,
  `name` varchar(255) NOT NULL,
  `faculty` varchar(255) NOT NULL,
  `status` enum('active','inactive','draft') NOT NULL DEFAULT 'active',
  `head_id` varchar(20) DEFAULT NULL,
  `key_metric` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `committees`
--

INSERT INTO `committees` (`id`, `name`, `faculty`, `status`, `head_id`, `key_metric`, `created_at`, `updated_at`) VALUES
('cmt-academic-service', 'คณะกรรมการบริการวิชาการแบบมีรายได้', 'School of Health Science', 'active', NULL, 'Service Projects', '2026-07-01 07:49:52', '2026-08-05 01:30:22'),
('cmt-arts-culture', 'คณะกรรมการทำนุบำรุงศิลปวัฒนธรรม', 'School of Health Science', 'active', 'fac-053', 'Activities Held', '2026-07-01 07:49:52', '2026-08-05 01:35:01'),
('cmt-bcz3u0c', 'คณะกรรมการบริการวิชาการแบบไม่มีรายได้', 'School of Health Science', 'active', NULL, 'Total income', '2026-08-05 01:30:49', '2026-08-05 01:30:49'),
('cmt-corp-comm', 'คณะกรรมการสื่อสารองค์กร', 'School of Health Science', 'active', NULL, 'Media Reach', '2026-07-01 07:49:52', '2026-08-05 01:35:25'),
('cmt-curriculum', 'คณะกรรมการการเรียนการสอนและคุณภาพหลักสูตร', 'School of Health Science', 'active', 'fac-022', 'Curriculum Quality', '2026-07-01 07:49:52', '2026-08-05 01:32:44'),
('cmt-edpex', 'คณะกรรมการ EdPEx', 'School of Health Science', 'active', NULL, 'EdPEx Score', '2026-07-01 07:49:52', '2026-08-05 01:35:40'),
('cmt-equipment', 'คณะกรรมการวัสดุครุภัณฑ์', 'School of Health Science', 'active', 'fac-036', 'Asset Utilization', '2026-07-01 07:49:52', '2026-08-05 01:36:10'),
('cmt-finance', 'คณะกรรมการการเงินและงบประมาณ', 'School of Health Science', 'active', 'fac-004', 'Budget Disbursement', '2026-07-01 07:49:52', '2026-08-05 01:38:49'),
('cmt-foreign-affairs', 'คณะกรรมการวิเทศสัมพันธ์', 'School of Health Science', 'active', 'fac-063', 'MOU Partnerships', '2026-07-01 07:49:52', '2026-08-05 01:36:32'),
('cmt-graduate', 'คณะกรรมการบัณฑิตศึกษา', 'School of Health Science', 'active', 'fac-022', 'Graduate Completion', '2026-07-01 07:49:52', '2026-08-05 01:39:10'),
('cmt-green-office', 'คณะกรรมการ Green Office', 'School of Health Science', 'active', 'fac-003', 'Green Office Level', '2026-07-01 07:49:52', '2026-08-05 01:39:33'),
('cmt-info-decision', 'คณะกรรมการสารสนเทศเพื่อการตัดสินใจ', 'School of Health Science', 'active', 'fac-022', 'Data Timeliness', '2026-07-01 07:49:52', '2026-08-05 01:37:08'),
('cmt-km', 'คณะกรรมการ KM', 'School of Health Science', 'active', 'fac-043', 'KM Practices', '2026-07-01 07:49:52', '2026-08-05 01:40:31'),
('cmt-personnel', 'คณะกรรมการบุคลากร', 'School of Health Science', 'active', 'fac-004', 'Staff Development', '2026-07-01 07:49:52', '2026-08-05 01:39:54'),
('cmt-policy-planning', 'คณะกรรมการนโยบายและแผน', 'School of Health Science', 'active', 'fac-003', 'Plan Achievement', '2026-07-01 07:49:52', '2026-08-05 01:37:31'),
('cmt-research-ethics', 'คณะกรรมการวิจัย นวัตกรรม และจริธรรมการวิจัย', 'School of Health Science', 'active', 'fac-006', 'Research Output', '2026-07-01 07:49:52', '2026-08-05 01:33:46'),
('cmt-risk', 'คณะกรรมการบริหารความเสี่ยง', 'School of Health Science', 'active', 'fac-003', 'Risks Mitigated', '2026-07-01 07:49:52', '2026-08-05 01:38:01'),
('cmt-student-alumni', 'คณะกรรมการกิจการนักศึกษาและศิษย์เก่า', 'School of Health Science', 'active', 'fac-062', 'Student Satisfaction', '2026-07-01 07:49:52', '2026-08-05 01:38:26');

-- --------------------------------------------------------

--
-- Table structure for table `committee_memberships`
--

CREATE TABLE `committee_memberships` (
  `faculty_id` varchar(20) NOT NULL,
  `committee_id` varchar(30) NOT NULL,
  `position` enum('Counselor','Committee Lead','Committee','Committee and Secretary','Counselor and Committee Lead') NOT NULL,
  `kpi_focus` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `committee_memberships`
--

INSERT INTO `committee_memberships` (`faculty_id`, `committee_id`, `position`, `kpi_focus`, `created_at`, `updated_at`) VALUES
('fac-002', 'cmt-curriculum', 'Committee', 'N', '2026-07-01 11:57:14', '2026-07-01 11:57:14'),
('fac-004', 'cmt-research-ethics', 'Counselor', 'Pending Assign', '2026-07-19 05:59:48', '2026-07-19 05:59:48'),
('fac-006', 'cmt-curriculum', 'Committee', 'N', '2026-07-01 11:57:14', '2026-07-01 11:57:14'),
('fac-006', 'cmt-research-ethics', 'Committee Lead', 'Pending Assign', '2026-07-19 05:59:48', '2026-07-19 05:59:48'),
('fac-007', 'cmt-curriculum', 'Committee', 'N', '2026-07-01 11:57:14', '2026-07-01 11:57:14'),
('fac-009', 'cmt-curriculum', 'Committee', 'N', '2026-07-01 11:57:14', '2026-07-01 11:57:14'),
('fac-010', 'cmt-curriculum', 'Committee', 'N', '2026-07-30 03:09:01', '2026-07-30 03:09:01'),
('fac-012', 'cmt-curriculum', 'Committee', 'N', '2026-07-01 11:57:14', '2026-07-01 11:57:14'),
('fac-017', 'cmt-research-ethics', 'Committee', 'Pending Assign', '2026-07-19 05:59:48', '2026-07-19 05:59:48'),
('fac-018', 'cmt-curriculum', 'Committee', 'N', '2026-07-30 03:09:01', '2026-07-30 03:09:01'),
('fac-018', 'cmt-research-ethics', 'Committee', 'Pending Assign', '2026-07-19 05:59:48', '2026-07-19 05:59:48'),
('fac-022', 'cmt-curriculum', 'Counselor and Committee Lead', 'N / All', '2026-08-04 15:11:37', '2026-08-04 15:17:58'),
('fac-030', 'cmt-curriculum', 'Committee', 'N', '2026-07-30 03:09:01', '2026-07-30 03:09:01'),
('fac-032', 'cmt-curriculum', 'Committee', 'N', '2026-07-30 03:09:01', '2026-08-13 09:15:08'),
('fac-042', 'cmt-curriculum', 'Committee and Secretary', 'All', '2026-07-30 03:09:01', '2026-07-30 03:09:01'),
('fac-045', 'cmt-research-ethics', 'Committee and Secretary', 'Pending Assign', '2026-07-19 05:59:48', '2026-07-19 05:59:48'),
('fac-052', 'cmt-curriculum', 'Committee', 'N', '2026-07-30 03:09:01', '2026-07-30 03:09:01');

-- --------------------------------------------------------

--
-- Table structure for table `curriculum`
--

CREATE TABLE `curriculum` (
  `code` varchar(20) NOT NULL,
  `program_code` varchar(20) NOT NULL,
  `label_th` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `curriculum`
--

INSERT INTO `curriculum` (`code`, `program_code`, `label_th`, `sort_order`, `created_at`, `updated_at`) VALUES
('BMM', 'BM', 'เทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ', 9, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('EnvHB', 'EnvH', 'อนามัยสิ่งแวดล้อม', 7, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('EnvHM', 'EnvH', 'เทคโนโลยีการจัดการสิ่งแวดล้อมอย่างยั่งยืน', 8, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('OHSB', 'OHS', 'อาชีวอนามัยและความปลอดภัย', 6, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('PHB', 'PH', 'สาธารณสุขศาสตร์', 1, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('PHD', 'PH', 'ระบาดและวัคซีนวิทยา', 3, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('PHM', 'PH', 'การจัดการสุขภาพชายแดน', 2, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('SHSB', 'SHS', 'วิทยาศาสตร์การกีฬาและสุขภาพ', 4, '2026-07-25 11:45:17', '2026-07-25 11:45:17'),
('SHSM', 'SHS', 'วิทยาศาสตร์และเทคโนโลยีการกีฬาประยุกต์', 5, '2026-07-25 11:45:17', '2026-07-25 11:45:17');

-- --------------------------------------------------------

--
-- Table structure for table `data_source`
--

CREATE TABLE `data_source` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `committee_id` varchar(30) NOT NULL,
  `period_grain` enum('quarterly','annual') NOT NULL DEFAULT 'quarterly',
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `created_by` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `data_source`
--

INSERT INTO `data_source` (`id`, `name`, `description`, `committee_id`, `period_grain`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'Research manuscripts and articles', 'Research manuscripts and articles', 'cmt-research-ethics', 'quarterly', 'active', NULL, '2026-07-18 13:43:54', '2026-07-18 13:43:54'),
(3, 'Intellectual Property', 'Intellectual Property includes innovation, petty patent, patent, and invention', 'cmt-research-ethics', 'quarterly', 'active', NULL, '2026-07-18 14:07:41', '2026-07-18 14:07:41'),
(5, 'Research units, groups, and centers.', 'List of research units, groups, and centers.', 'cmt-research-ethics', 'quarterly', 'active', NULL, '2026-07-18 14:29:04', '2026-07-18 14:29:04'),
(7, 'Admission Statistic', 'Admission Statistic from 2565 to present, every level and admission rounds.', 'cmt-curriculum', 'quarterly', 'active', NULL, '2026-07-28 04:26:30', '2026-07-28 04:26:30'),
(8, 'Graduate Statistic', 'ข้อมูลบัณฑิ จำนวนจบ ภาวะการได้งาน และ ทักษาะแห่งอนาคต', 'cmt-curriculum', 'quarterly', 'active', NULL, '2026-07-30 05:08:45', '2026-07-30 05:21:34');

-- --------------------------------------------------------

--
-- Table structure for table `data_source_column`
--

CREATE TABLE `data_source_column` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `data_source_id` bigint(20) UNSIGNED NOT NULL,
  `col_key` varchar(40) NOT NULL,
  `label` varchar(255) NOT NULL,
  `data_type` enum('text','url','number','date','select','boolean','faculty','program','curriculum') NOT NULL DEFAULT 'text',
  `unit` varchar(50) DEFAULT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `data_source_column`
--

INSERT INTO `data_source_column` (`id`, `data_source_id`, `col_key`, `label`, `data_type`, `unit`, `options`, `is_required`, `sort_order`, `created_at`, `updated_at`) VALUES
(4, 2, 'title', 'Title', 'text', NULL, NULL, 1, 0, '2026-07-18 13:54:57', '2026-07-18 13:54:57'),
(5, 2, 'status', 'Status', 'select', NULL, '[\"Manuscript\",\"Submitted\",\"Accepted\",\"Published\"]', 1, 1, '2026-07-18 13:54:57', '2026-07-18 13:54:57'),
(6, 2, 'status_s_date', 'Status’s date', 'date', NULL, NULL, 1, 2, '2026-07-18 13:54:57', '2026-07-19 08:22:31'),
(8, 2, 'journal_name', 'Journal name', 'text', NULL, NULL, 1, 4, '2026-07-18 13:54:57', '2026-07-19 08:22:31'),
(9, 2, 'quartile', 'Quartile', 'select', NULL, '[\"Q1-Tier\",\"Q1\",\"Q2\",\"Q3\",\"Q4\",\"TCI1\",\"TCI2\",\"TCI3\"]', 0, 5, '2026-07-18 13:54:57', '2026-07-19 08:22:31'),
(10, 2, 'first_author', 'First author', 'faculty', NULL, NULL, 1, 6, '2026-07-18 13:54:57', '2026-07-19 08:22:31'),
(11, 2, 'corresponding_author', 'Corresponding author', 'faculty', NULL, NULL, 1, 7, '2026-07-18 13:54:57', '2026-07-19 08:22:31'),
(12, 2, 'citation_count', 'Citation count', 'number', NULL, NULL, 0, 8, '2026-07-18 13:54:57', '2026-07-19 08:22:31'),
(13, 3, 'title', 'Title', 'text', NULL, NULL, 1, 0, '2026-07-18 14:11:47', '2026-07-18 14:11:47'),
(14, 3, 'ip_s_type', 'IP\'s type', 'select', NULL, '[\"Innovation\",\"Petty patent\",\"Patent\",\"Invention\",\"Copyright\",\"Trademark\"]', 1, 1, '2026-07-18 14:11:47', '2026-07-18 14:11:47'),
(15, 3, 'published_date', 'Published date', 'date', NULL, NULL, 1, 2, '2026-07-18 14:11:47', '2026-07-18 14:11:47'),
(16, 3, 'end_date', 'End date', 'date', NULL, NULL, 0, 3, '2026-07-18 14:11:47', '2026-07-18 14:11:47'),
(17, 3, 'owner', 'Owner', 'faculty', NULL, NULL, 1, 4, '2026-07-18 14:11:48', '2026-07-18 14:22:10'),
(18, 3, 'link', 'Link', 'url', NULL, NULL, 1, 5, '2026-07-18 14:11:48', '2026-07-19 08:47:52'),
(22, 5, 'name_of_research_unit_group_center', 'Name of research unit/group/center', 'text', NULL, NULL, 1, 0, '2026-07-18 14:32:44', '2026-07-18 14:32:44'),
(23, 5, 'type', 'Type', 'select', NULL, '[\"Unit\",\"Group\",\"Center\"]', 1, 1, '2026-07-18 14:32:44', '2026-07-18 14:32:44'),
(24, 5, 'chair_person', 'Chair person', 'faculty', NULL, NULL, 1, 2, '2026-07-18 14:32:44', '2026-07-18 14:32:44'),
(25, 5, 'establishing_date', 'Establishing date', 'date', NULL, NULL, 1, 3, '2026-07-18 14:32:44', '2026-07-18 14:32:44'),
(26, 5, 'purposes', 'Purposes', 'text', NULL, NULL, 1, 4, '2026-07-18 14:32:44', '2026-07-18 14:32:44'),
(31, 3, 'usage_count', 'Usage count', 'number', 'Time', NULL, 0, 6, '2026-07-19 06:02:50', '2026-07-19 06:02:50'),
(32, 2, 'doi_link', 'DOI link', 'url', NULL, NULL, 0, 3, '2026-07-19 08:22:31', '2026-07-19 08:22:31'),
(34, 2, 'curriculum', 'Curriculum', 'curriculum', NULL, NULL, 0, 9, '2026-07-25 11:16:15', '2026-07-25 11:16:15'),
(36, 7, 'academic_year', 'Academic Year', 'number', NULL, NULL, 1, 0, '2026-07-28 04:28:07', '2026-07-28 04:28:07'),
(37, 7, 'semester', 'Semester', 'select', NULL, '[\"1\",\"2\",\"3\"]', 1, 1, '2026-07-28 04:28:07', '2026-07-28 04:35:03'),
(38, 7, 'degree_level', 'Degree level', 'select', NULL, '[\"Bachelor\'s\",\"Master\'s\",\"Doctoral\"]', 1, 2, '2026-07-28 04:35:03', '2026-07-28 04:35:03'),
(39, 7, 'department_name', 'Department name', 'program', NULL, NULL, 1, 3, '2026-07-28 04:35:03', '2026-07-28 04:35:03'),
(40, 7, 'tcas_round', 'TCAS round', 'select', NULL, '[\"1\",\"2\",\"3\",\"4\",\"5\"]', 1, 5, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(41, 7, 'tcas_group_name', 'TCAS group name', 'text', NULL, NULL, 0, 6, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(42, 7, 'planned_quota', 'Planned quota', 'number', 'Persons', NULL, 1, 7, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(43, 7, 'total_applicants', 'Total applicants', 'number', 'Persons', NULL, 1, 8, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(44, 7, 'completed_documents', 'Completed documents', 'number', 'Persons', NULL, 1, 9, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(45, 7, 'passed_selection', 'Passed selection', 'number', 'Persons', NULL, 1, 10, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(46, 7, 'confirmed_enrollment', 'Confirmed enrollment', 'number', 'Persons', NULL, 1, 11, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(47, 7, 'new_students', 'New students', 'number', 'Persons', NULL, 1, 12, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(48, 7, 'unregistered_students', 'Unregistered students', 'number', 'Persons', NULL, 1, 13, '2026-07-28 04:35:03', '2026-07-28 05:20:12'),
(49, 7, 'curriculum_name', 'Curriculum name', 'curriculum', NULL, NULL, 1, 4, '2026-07-28 05:20:12', '2026-07-28 05:20:12'),
(50, 8, 'curriculum', 'Curriculum', 'curriculum', NULL, NULL, 1, 0, '2026-07-30 05:14:58', '2026-07-30 05:21:59'),
(51, 8, 'grad_year', 'GRAD_Year', 'number', NULL, NULL, 1, 1, '2026-07-30 05:14:58', '2026-07-30 05:21:59'),
(52, 8, 'total_grad', 'Total_GRAD', 'number', 'Persons', NULL, 1, 2, '2026-07-30 05:14:58', '2026-07-30 05:21:59'),
(53, 8, 'grad_in', 'GRAD_IN', 'number', 'Persons', NULL, 1, 3, '2026-07-30 05:14:58', '2026-07-30 05:21:59'),
(54, 8, 'grad_over', 'GRAD_OVER', 'number', 'Persons', NULL, 1, 4, '2026-07-30 05:14:58', '2026-07-30 05:21:59'),
(55, 8, 'in_1year_employed', 'IN_1Year_Employed', 'number', 'Persons', NULL, 1, 5, '2026-07-30 05:15:44', '2026-07-30 05:21:59'),
(56, 8, 'thai_comp', 'THAI_Comp', 'number', 'Persons', NULL, 1, 6, '2026-07-30 05:15:44', '2026-07-30 05:21:59'),
(57, 8, 'inter_comp', 'INTER_Comp', 'number', 'Persons', NULL, 1, 7, '2026-07-30 05:15:44', '2026-07-30 05:21:59'),
(58, 8, 'study', 'Study', 'number', 'Persons', NULL, 0, 8, '2026-07-30 05:16:26', '2026-07-30 05:21:59'),
(59, 8, 'entrepreneur', 'Entrepreneur', 'number', 'Persons', NULL, 0, 9, '2026-07-30 05:16:26', '2026-07-30 05:21:59'),
(60, 8, 'others', 'Others', 'number', 'Persons', NULL, 1, 10, '2026-07-30 05:16:26', '2026-07-30 05:21:59'),
(61, 8, 'c_21st_century_goodup', '21st_Century_GoodUp', 'number', 'Persons', NULL, 0, 11, '2026-07-30 05:16:58', '2026-07-30 05:21:59'),
(62, 8, 'c_21st_century_avg', '21st_Century_Avg', 'number', NULL, NULL, 0, 12, '2026-07-30 05:16:58', '2026-07-30 05:21:59');

-- --------------------------------------------------------

--
-- Table structure for table `data_source_entry`
--

CREATE TABLE `data_source_entry` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `data_source_id` bigint(20) UNSIGNED NOT NULL,
  `year` smallint(6) NOT NULL,
  `quarter` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`quarter` is null or `quarter` between 1 and 4),
  `values_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`values_json`)),
  `note` text DEFAULT NULL,
  `recorded_by` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `data_source_entry`
--

INSERT INTO `data_source_entry` (`id`, `data_source_id`, `year`, `quarter`, `values_json`, `note`, `recorded_by`, `created_at`, `updated_at`) VALUES
(12, 3, 2566, 1, '{\"title\": \"Portable UV-C Cabinet for Clinical Instruments\", \"ip_s_type\": \"Innovation\", \"published_date\": \"2566-01-18\", \"end_date\": \"2569-01-17\", \"owner\": \"fac-001\", \"link\": \"https://example.com/intellectual-property/ip-01\", \"usage_count\": 17}', 'Seed: Intellectual Property demo row 01', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(13, 3, 2566, 1, '{\"title\": \"Low-Cost Respiratory Exercise Monitor\", \"ip_s_type\": \"Petty patent\", \"published_date\": \"2566-02-06\", \"end_date\": \"2576-02-05\", \"owner\": \"fac-002\", \"link\": \"https://example.com/intellectual-property/ip-02\", \"usage_count\": 15}', 'Seed: Intellectual Property demo row 02', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(14, 3, 2566, 2, '{\"title\": \"Herbal Hand Sanitizer Formulation for Sensitive Skin\", \"ip_s_type\": \"Patent\", \"published_date\": \"2566-04-22\", \"end_date\": \"2586-04-21\", \"owner\": \"fac-003\", \"link\": \"https://example.com/intellectual-property/ip-03\", \"usage_count\": 33}', 'Seed: Intellectual Property demo row 03', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(15, 3, 2566, 2, '{\"title\": \"Smart Pill Organizer with Adherence Alerts\", \"ip_s_type\": \"Invention\", \"published_date\": \"2566-05-11\", \"end_date\": null, \"owner\": \"fac-004\", \"link\": \"https://example.com/intellectual-property/ip-04\", \"usage_count\": 20}', 'Seed: Intellectual Property demo row 04', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(16, 3, 2566, 3, '{\"title\": \"Nurse Handover Checklist and Audit Toolkit\", \"ip_s_type\": \"Copyright\", \"published_date\": \"2566-07-15\", \"end_date\": null, \"owner\": \"fac-005\", \"link\": \"https://example.com/intellectual-property/ip-05\", \"usage_count\": 3}', 'Seed: Intellectual Property demo row 05', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(17, 3, 2566, 3, '{\"title\": \"Healthy Campus Communities\", \"ip_s_type\": \"Trademark\", \"published_date\": \"2566-08-02\", \"end_date\": \"2576-08-01\", \"owner\": \"fac-006\", \"link\": \"https://example.com/intellectual-property/ip-06\", \"usage_count\": 9}', 'Seed: Intellectual Property demo row 06', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(18, 3, 2566, 4, '{\"title\": \"Solar-Powered Vaccine Transport Box\", \"ip_s_type\": \"Innovation\", \"published_date\": \"2566-10-09\", \"end_date\": \"2569-10-08\", \"owner\": \"fac-007\", \"link\": \"https://example.com/intellectual-property/ip-07\", \"usage_count\": 7}', 'Seed: Intellectual Property demo row 07', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(19, 3, 2566, 4, '{\"title\": \"Adaptive Grip for Home Rehabilitation Tools\", \"ip_s_type\": \"Petty patent\", \"published_date\": \"2566-11-18\", \"end_date\": \"2576-11-17\", \"owner\": \"fac-008\", \"link\": \"https://example.com/intellectual-property/ip-08\", \"usage_count\": 12}', 'Seed: Intellectual Property demo row 08', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(20, 3, 2566, 4, '{\"title\": \"Rapid Colorimetric Water Quality Test Strip\", \"ip_s_type\": \"Patent\", \"published_date\": \"2566-12-04\", \"end_date\": \"2586-12-03\", \"owner\": \"fac-009\", \"link\": \"https://example.com/intellectual-property/ip-09\", \"usage_count\": 23}', 'Seed: Intellectual Property demo row 09', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(21, 3, 2566, 1, '{\"title\": \"Community Nutrition Screening Workbook\", \"ip_s_type\": \"Copyright\", \"published_date\": \"2566-01-29\", \"end_date\": null, \"owner\": \"fac-010\", \"link\": \"https://example.com/intellectual-property/ip-10\", \"usage_count\": 8}', 'Seed: Intellectual Property demo row 10', NULL, '2026-07-18 15:59:58', '2026-07-19 06:12:19'),
(22, 3, 2566, 1, '{\"title\": \"Digital Triage Dashboard for Primary Care Clinics\", \"ip_s_type\": \"Innovation\", \"published_date\": \"2567-01-12\", \"end_date\": null, \"owner\": \"fac-011\", \"link\": \"https://example.com/intellectual-property/ip-11\", \"usage_count\": 11}', 'Seed: Intellectual Property demo row 11', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(23, 3, 2566, 1, '{\"title\": \"Ergonomic Transfer Board for Older Adults\", \"ip_s_type\": \"Petty patent\", \"published_date\": \"2567-02-21\", \"end_date\": \"2577-02-20\", \"owner\": \"fac-012\", \"link\": \"https://example.com/intellectual-property/ip-12\", \"usage_count\": 13}', 'Seed: Intellectual Property demo row 12', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(24, 3, 2566, 2, '{\"title\": \"Plant-Based Antimicrobial Wound Dressing\", \"ip_s_type\": \"Patent\", \"published_date\": \"2567-04-17\", \"end_date\": \"2587-04-16\", \"owner\": \"fac-013\", \"link\": \"https://example.com/intellectual-property/ip-13\", \"usage_count\": 50}', 'Seed: Intellectual Property demo row 13', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(25, 3, 2566, 2, '{\"title\": \"Interactive Anatomy Learning Model\", \"ip_s_type\": \"Invention\", \"published_date\": \"2567-05-08\", \"end_date\": null, \"owner\": \"fac-014\", \"link\": \"https://example.com/intellectual-property/ip-14\", \"usage_count\": 14}', 'Seed: Intellectual Property demo row 14', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(26, 3, 2566, 2, '{\"title\": \"Medication Reconciliation Training Cards\", \"ip_s_type\": \"Copyright\", \"published_date\": \"2567-06-03\", \"end_date\": null, \"owner\": \"fac-015\", \"link\": \"https://example.com/intellectual-property/ip-15\", \"usage_count\": 9}', 'Seed: Intellectual Property demo row 15', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(27, 3, 2566, 3, '{\"title\": \"Move More MFU\", \"ip_s_type\": \"Trademark\", \"published_date\": \"2567-07-19\", \"end_date\": \"2577-07-18\", \"owner\": \"fac-016\", \"link\": \"https://example.com/intellectual-property/ip-16\", \"usage_count\": 8}', 'Seed: Intellectual Property demo row 16', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(28, 3, 2566, 3, '{\"title\": \"Portable Neonatal Temperature Sensor\", \"ip_s_type\": \"Innovation\", \"published_date\": \"2567-08-14\", \"end_date\": \"2570-08-13\", \"owner\": \"fac-017\", \"link\": \"https://example.com/intellectual-property/ip-17\", \"usage_count\": 17}', 'Seed: Intellectual Property demo row 17', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(29, 3, 2566, 3, '{\"title\": \"Adjustable Wheelchair Foot Support\", \"ip_s_type\": \"Petty patent\", \"published_date\": \"2567-09-07\", \"end_date\": \"2577-09-06\", \"owner\": \"fac-018\", \"link\": \"https://example.com/intellectual-property/ip-18\", \"usage_count\": 10}', 'Seed: Intellectual Property demo row 18', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(30, 3, 2566, 4, '{\"title\": \"Machine Learning Model for Fall Risk Screening\", \"ip_s_type\": \"Patent\", \"published_date\": \"2567-10-26\", \"end_date\": \"2587-10-25\", \"owner\": \"fac-019\", \"link\": \"https://example.com/intellectual-property/ip-19\", \"usage_count\": 40}', 'Seed: Intellectual Property demo row 19', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(31, 3, 2566, 4, '{\"title\": \"Telehealth Consent and Privacy Guide\", \"ip_s_type\": \"Copyright\", \"published_date\": \"2567-11-15\", \"end_date\": null, \"owner\": \"fac-020\", \"link\": \"https://example.com/intellectual-property/ip-20\", \"usage_count\": 3}', 'Seed: Intellectual Property demo row 20', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(32, 3, 2566, 1, '{\"title\": \"Airflow-Safe Classroom Design Toolkit\", \"ip_s_type\": \"Innovation\", \"published_date\": \"2568-01-10\", \"end_date\": null, \"owner\": \"fac-021\", \"link\": \"https://example.com/intellectual-property/ip-21\", \"usage_count\": 5}', 'Seed: Intellectual Property demo row 21', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(33, 3, 2566, 1, '{\"title\": \"Hands-Free Soap Dispenser Mount\", \"ip_s_type\": \"Petty patent\", \"published_date\": \"2568-02-02\", \"end_date\": \"2578-02-01\", \"owner\": \"fac-022\", \"link\": \"https://example.com/intellectual-property/ip-22\", \"usage_count\": 11}', 'Seed: Intellectual Property demo row 22', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(34, 3, 2566, 2, '{\"title\": \"Bioactive Film for Fresh-Cut Produce\", \"ip_s_type\": \"Patent\", \"published_date\": \"2568-04-18\", \"end_date\": \"2588-04-17\", \"owner\": \"fac-023\", \"link\": \"https://example.com/intellectual-property/ip-23\", \"usage_count\": 32}', 'Seed: Intellectual Property demo row 23', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(35, 3, 2566, 2, '{\"title\": \"Wearable Hydration Reminder for Field Workers\", \"ip_s_type\": \"Invention\", \"published_date\": \"2568-05-13\", \"end_date\": null, \"owner\": \"fac-024\", \"link\": \"https://example.com/intellectual-property/ip-24\", \"usage_count\": 8}', 'Seed: Intellectual Property demo row 24', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(36, 3, 2566, 2, '{\"title\": \"Research Ethics Casebook for Health Sciences\", \"ip_s_type\": \"Copyright\", \"published_date\": \"2568-06-06\", \"end_date\": null, \"owner\": \"fac-025\", \"link\": \"https://example.com/intellectual-property/ip-25\", \"usage_count\": 8}', 'Seed: Intellectual Property demo row 25', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(37, 3, 2566, 3, '{\"title\": \"Health Sciences Innovation Hub\", \"ip_s_type\": \"Trademark\", \"published_date\": \"2568-07-03\", \"end_date\": \"2578-07-02\", \"owner\": \"fac-026\", \"link\": \"https://example.com/intellectual-property/ip-26\", \"usage_count\": 7}', 'Seed: Intellectual Property demo row 26', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(38, 3, 2566, 3, '{\"title\": \"Low-Noise Mobility Aid for Hospital Corridors\", \"ip_s_type\": \"Innovation\", \"published_date\": \"2568-08-22\", \"end_date\": \"2571-08-21\", \"owner\": \"fac-027\", \"link\": \"https://example.com/intellectual-property/ip-27\", \"usage_count\": 11}', 'Seed: Intellectual Property demo row 27', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(39, 3, 2566, 3, '{\"title\": \"Modular Splint for Pediatric Rehabilitation\", \"ip_s_type\": \"Petty patent\", \"published_date\": \"2568-09-16\", \"end_date\": \"2578-09-15\", \"owner\": \"fac-028\", \"link\": \"https://example.com/intellectual-property/ip-28\", \"usage_count\": 25}', 'Seed: Intellectual Property demo row 28', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(40, 3, 2566, 4, '{\"title\": \"Point-of-Care Dengue Screening Cartridge\", \"ip_s_type\": \"Patent\", \"published_date\": \"2568-10-28\", \"end_date\": \"2588-10-27\", \"owner\": \"fac-029\", \"link\": \"https://example.com/intellectual-property/ip-29\", \"usage_count\": 26}', 'Seed: Intellectual Property demo row 29', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(41, 3, 2566, 4, '{\"title\": \"Community Health Data Storytelling Guide\", \"ip_s_type\": \"Copyright\", \"published_date\": \"2568-11-19\", \"end_date\": null, \"owner\": \"fac-030\", \"link\": \"https://example.com/intellectual-property/ip-30\", \"usage_count\": 2}', 'Seed: Intellectual Property demo row 30', NULL, '2026-07-18 15:59:58', '2026-07-23 16:32:12'),
(42, 2, 2566, 1, '{\"title\":\"Community-Based Screening for Hypertension Risk\",\"status\":\"Published\",\"status_s_date\":\"2566-01-12\",\"doi_link\":\"https://example.com/doi/mfu-shs-2566-01\",\"journal_name\":\"Journal of Community Health Practice\",\"quartile\":\"Q2\",\"first_author\":\"fac-001\",\"corresponding_author\":\"fac-031\",\"citation_count\":18,\"curriculum\":null}', 'Seed: Research manuscript demo row 01', NULL, '2026-07-18 16:09:56', '2026-07-30 06:25:55'),
(43, 2, 2566, 1, '{\"title\":\"Nutrition Literacy Among First-Year University Students\",\"status\":\"Published\",\"status_s_date\":\"2566-02-03\",\"doi_link\":\"https://example.com/doi/mfu-shs-2566-02\",\"journal_name\":\"Asian Journal of Public Health\",\"quartile\":\"Q1\",\"first_author\":\"fac-002\",\"corresponding_author\":\"fac-032\",\"citation_count\":24}', 'Seed: Research manuscript demo row 02', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(44, 2, 2566, 2, '{\"title\":\"Ergonomic Risk Assessment in Community Health Workers\",\"status\":\"Accepted\",\"status_s_date\":\"2566-04-19\",\"doi_link\":\"https://example.com/doi/mfu-shs-2566-03\",\"journal_name\":\"International Journal of Occupational Safety\",\"quartile\":\"Q1-Tier\",\"first_author\":\"fac-003\",\"corresponding_author\":\"fac-033\",\"citation_count\":7}', 'Seed: Research manuscript demo row 03', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(45, 2, 2566, 2, '{\"title\":\"Mobile Reminders for Medication Adherence in Older Adults\",\"status\":\"Submitted\",\"status_s_date\":\"2566-05-08\",\"doi_link\":null,\"journal_name\":\"Digital Health and Care\",\"quartile\":\"Q2\",\"first_author\":\"fac-004\",\"corresponding_author\":\"fac-034\",\"citation_count\":0}', 'Seed: Research manuscript demo row 04', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(46, 2, 2566, 2, '{\"title\":\"Air Quality Perceptions Around University Campuses\",\"status\":\"Manuscript\",\"status_s_date\":\"2566-06-01\",\"doi_link\":null,\"journal_name\":\"Environmental Health Review\",\"quartile\":\"Q3\",\"first_author\":\"fac-005\",\"corresponding_author\":\"fac-035\",\"citation_count\":0}', 'Seed: Research manuscript demo row 05', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(47, 2, 2566, 3, '{\"title\":\"Simulation Training for Nursing Handover Communication\",\"status\":\"Published\",\"status_s_date\":\"2566-07-14\",\"doi_link\":\"https://example.com/doi/mfu-shs-2566-06\",\"journal_name\":\"Nursing Education Perspectives\",\"quartile\":\"Q1\",\"first_author\":\"fac-006\",\"corresponding_author\":\"fac-036\",\"citation_count\":31}', 'Seed: Research manuscript demo row 06', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(48, 2, 2566, 3, '{\"title\":\"Herbal Compress Use for Musculoskeletal Discomfort\",\"status\":\"Accepted\",\"status_s_date\":\"2566-08-10\",\"doi_link\":\"https://example.com/doi/mfu-shs-2566-07\",\"journal_name\":\"Thai Journal of Integrative Medicine\",\"quartile\":\"TCI1\",\"first_author\":\"fac-007\",\"corresponding_author\":\"fac-037\",\"citation_count\":5}', 'Seed: Research manuscript demo row 07', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(49, 2, 2566, 3, '{\"title\":\"Predictors of Sleep Quality in Shift-Working Staff\",\"status\":\"Submitted\",\"status_s_date\":\"2566-09-05\",\"doi_link\":null,\"journal_name\":\"Occupational Wellbeing Journal\",\"quartile\":\"Q2\",\"first_author\":\"fac-008\",\"corresponding_author\":\"fac-038\",\"citation_count\":0}', 'Seed: Research manuscript demo row 08', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(50, 2, 2566, 4, '{\"title\":\"Food Safety Practices of Small Community Vendors\",\"status\":\"Published\",\"status_s_date\":\"2566-10-11\",\"doi_link\":\"https://example.com/doi/mfu-shs-2566-09\",\"journal_name\":\"Food Protection Research\",\"quartile\":\"Q3\",\"first_author\":\"fac-009\",\"corresponding_author\":\"fac-039\",\"citation_count\":12}', 'Seed: Research manuscript demo row 09', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(51, 2, 2566, 4, '{\"title\":\"Health Promotion Needs of Borderland Adolescents\",\"status\":\"Manuscript\",\"status_s_date\":\"2566-11-22\",\"doi_link\":null,\"journal_name\":\"Regional Health Studies\",\"quartile\":\"TCI2\",\"first_author\":\"fac-010\",\"corresponding_author\":\"fac-040\",\"citation_count\":0}', 'Seed: Research manuscript demo row 10', NULL, '2026-07-18 16:09:56', '2026-07-18 16:09:56'),
(52, 2, 2566, 1, '{\"title\":\"Teleconsultation Readiness in Rural Primary Care\",\"status\":\"Published\",\"status_s_date\":\"2567-01-09\",\"doi_link\":\"https://example.com/doi/mfu-shs-2567-01\",\"journal_name\":\"Primary Care Innovation\",\"quartile\":\"Q1\",\"first_author\":\"fac-011\",\"corresponding_author\":\"fac-041\",\"citation_count\":21}', 'Seed: Research manuscript demo row 11', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(53, 2, 2566, 1, '{\"title\":\"Water Sanitation Knowledge in Remote Villages\",\"status\":\"Accepted\",\"status_s_date\":\"2567-02-15\",\"doi_link\":\"https://example.com/doi/mfu-shs-2567-02\",\"journal_name\":\"Journal of Water and Health\",\"quartile\":\"Q2\",\"first_author\":\"fac-012\",\"corresponding_author\":\"fac-042\",\"citation_count\":4}', 'Seed: Research manuscript demo row 12', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(54, 2, 2566, 2, '{\"title\":\"Physical Activity Patterns of Health Sciences Students\",\"status\":\"Submitted\",\"status_s_date\":\"2567-04-04\",\"doi_link\":null,\"journal_name\":\"University Health Journal\",\"quartile\":\"TCI1\",\"first_author\":\"fac-013\",\"corresponding_author\":\"fac-043\",\"citation_count\":0}', 'Seed: Research manuscript demo row 13', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(55, 2, 2566, 2, '{\"title\":\"Waste Segregation Compliance in Clinical Laboratories\",\"status\":\"Published\",\"status_s_date\":\"2567-05-17\",\"doi_link\":\"https://example.com/doi/mfu-shs-2567-04\",\"journal_name\":\"Laboratory Safety Science\",\"quartile\":\"Q2\",\"first_author\":\"fac-014\",\"corresponding_author\":\"fac-044\",\"citation_count\":16}', 'Seed: Research manuscript demo row 14', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(56, 2, 2566, 2, '{\"title\":\"Developing a Culturally Adapted Mental Health Toolkit\",\"status\":\"Manuscript\",\"status_s_date\":\"2567-06-12\",\"doi_link\":null,\"journal_name\":\"Mental Health Promotion Review\",\"quartile\":\"Q3\",\"first_author\":\"fac-015\",\"corresponding_author\":\"fac-045\",\"citation_count\":0}', 'Seed: Research manuscript demo row 15', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(57, 2, 2566, 3, '{\"title\":\"Outcomes of Peer-Led First Aid Education\",\"status\":\"Accepted\",\"status_s_date\":\"2567-07-08\",\"doi_link\":\"https://example.com/doi/mfu-shs-2567-06\",\"journal_name\":\"Emergency Care Education\",\"quartile\":\"Q4\",\"first_author\":\"fac-016\",\"corresponding_author\":\"fac-046\",\"citation_count\":2}', 'Seed: Research manuscript demo row 16', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(58, 2, 2566, 3, '{\"title\":\"Health Literacy and Dengue Prevention Behavior\",\"status\":\"Published\",\"status_s_date\":\"2567-08-23\",\"doi_link\":\"https://example.com/doi/mfu-shs-2567-07\",\"journal_name\":\"Tropical Public Health\",\"quartile\":\"Q1\",\"first_author\":\"fac-017\",\"corresponding_author\":\"fac-047\",\"citation_count\":27}', 'Seed: Research manuscript demo row 17', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(59, 2, 2566, 3, '{\"title\":\"Occupational Stress in University Support Personnel\",\"status\":\"Submitted\",\"status_s_date\":\"2567-09-18\",\"doi_link\":null,\"journal_name\":\"Workplace Health Review\",\"quartile\":\"TCI2\",\"first_author\":\"fac-018\",\"corresponding_author\":\"fac-048\",\"citation_count\":0}', 'Seed: Research manuscript demo row 18', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(60, 2, 2566, 4, '{\"title\":\"Digital Storytelling for Community Health Volunteers\",\"status\":\"Published\",\"status_s_date\":\"2567-10-03\",\"doi_link\":\"https://example.com/doi/mfu-shs-2567-09\",\"journal_name\":\"Health Communication Quarterly\",\"quartile\":\"Q2\",\"first_author\":\"fac-019\",\"corresponding_author\":\"fac-049\",\"citation_count\":9}', 'Seed: Research manuscript demo row 19', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(61, 2, 2566, 4, '{\"title\":\"Assessment of Emergency Preparedness in Schools\",\"status\":\"Manuscript\",\"status_s_date\":\"2567-11-27\",\"doi_link\":null,\"journal_name\":\"School Health Management\",\"quartile\":\"TCI3\",\"first_author\":\"fac-020\",\"corresponding_author\":\"fac-050\",\"citation_count\":0}', 'Seed: Research manuscript demo row 20', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(62, 2, 2566, 1, '{\"title\":\"Climate Resilience Practices in Local Food Systems\",\"status\":\"Accepted\",\"status_s_date\":\"2568-01-16\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-01\",\"journal_name\":\"Sustainable Food Systems\",\"quartile\":\"Q1-Tier\",\"first_author\":\"fac-021\",\"corresponding_author\":\"fac-051\",\"citation_count\":3}', 'Seed: Research manuscript demo row 21', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(63, 2, 2566, 1, '{\"title\":\"Usability of a Bilingual Patient Education Portal\",\"status\":\"Published\",\"status_s_date\":\"2568-02-11\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-02\",\"journal_name\":\"Journal of Digital Patient Care\",\"quartile\":\"Q1\",\"first_author\":\"fac-022\",\"corresponding_author\":\"fac-052\",\"citation_count\":14}', 'Seed: Research manuscript demo row 22', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(64, 2, 2566, 2, '{\"title\":\"Community Mapping of Heat-Related Health Risks\",\"status\":\"Submitted\",\"status_s_date\":\"2568-04-07\",\"doi_link\":null,\"journal_name\":\"Climate and Health Research\",\"quartile\":\"Q2\",\"first_author\":\"fac-023\",\"corresponding_author\":\"fac-053\",\"citation_count\":0}', 'Seed: Research manuscript demo row 23', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(65, 2, 2566, 2, '{\"title\":\"Family Caregiver Burden After Stroke Rehabilitation\",\"status\":\"Published\",\"status_s_date\":\"2568-05-20\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-04\",\"journal_name\":\"Rehabilitation Science Today\",\"quartile\":\"Q2\",\"first_author\":\"fac-024\",\"corresponding_author\":\"fac-054\",\"citation_count\":11}', 'Seed: Research manuscript demo row 24', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(66, 2, 2566, 2, '{\"title\":\"Validation of a Thai Food Label Reading Scale\",\"status\":\"Accepted\",\"status_s_date\":\"2568-06-14\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-05\",\"journal_name\":\"Nutrition Measurement Journal\",\"quartile\":\"Q3\",\"first_author\":\"fac-025\",\"corresponding_author\":\"fac-055\",\"citation_count\":1}', 'Seed: Research manuscript demo row 25', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(67, 2, 2566, 3, '{\"title\":\"Cross-Border Health Referral Experiences\",\"status\":\"Manuscript\",\"status_s_date\":\"2568-07-02\",\"doi_link\":null,\"journal_name\":\"International Border Health\",\"quartile\":\"TCI2\",\"first_author\":\"fac-026\",\"corresponding_author\":\"fac-056\",\"citation_count\":0}', 'Seed: Research manuscript demo row 26', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(68, 2, 2566, 3, '{\"title\":\"Safety Culture in Student-Led Health Clinics\",\"status\":\"Published\",\"status_s_date\":\"2568-08-18\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-07\",\"journal_name\":\"Clinical Education and Safety\",\"quartile\":\"Q1\",\"first_author\":\"fac-027\",\"corresponding_author\":\"fac-057\",\"citation_count\":6}', 'Seed: Research manuscript demo row 27', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(69, 2, 2566, 3, '{\"title\":\"Social Support and Wellbeing of Graduate Students\",\"status\":\"Submitted\",\"status_s_date\":\"2568-09-09\",\"doi_link\":null,\"journal_name\":\"Higher Education Wellbeing\",\"quartile\":\"Q4\",\"first_author\":\"fac-028\",\"corresponding_author\":\"fac-058\",\"citation_count\":0}', 'Seed: Research manuscript demo row 28', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(70, 2, 2566, 4, '{\"title\":\"Antimicrobial Stewardship Knowledge in Clinics\",\"status\":\"Accepted\",\"status_s_date\":\"2568-10-21\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-09\",\"journal_name\":\"Infection Prevention Journal\",\"quartile\":\"Q2\",\"first_author\":\"fac-029\",\"corresponding_author\":\"fac-059\",\"citation_count\":2}', 'Seed: Research manuscript demo row 29', NULL, '2026-07-18 16:09:56', '2026-07-23 16:32:12'),
(71, 2, 2566, 4, '{\"title\":\"Public Trust in Community Health Messaging\",\"status\":\"Published\",\"status_s_date\":\"2568-11-13\",\"doi_link\":\"https://example.com/doi/mfu-shs-2568-10\",\"journal_name\":\"Public Health Communication\",\"quartile\":\"TCI1\",\"first_author\":\"fac-030\",\"corresponding_author\":\"fac-060\",\"citation_count\":8,\"curriculum\":\"PHB\"}', 'Seed: Research manuscript demo row 30', NULL, '2026-07-18 16:09:56', '2026-07-27 15:24:07'),
(72, 5, 2566, 1, '{\"name_of_research_unit_group_center\":\"Community Health Innovation Unit\",\"type\":\"Unit\",\"chair_person\":\"fac-061\",\"establishing_date\":\"2566-02-14\",\"purposes\":\"Develop practical prevention and health-promotion tools with community partners.\"}', 'Seed: Research unit demo row 01', NULL, '2026-07-18 16:10:03', '2026-07-18 16:10:03'),
(73, 5, 2566, 3, '{\"name_of_research_unit_group_center\":\"Environmental Exposure Research Group\",\"type\":\"Group\",\"chair_person\":\"fac-062\",\"establishing_date\":\"2566-08-07\",\"purposes\":\"Study environmental risks and translate findings into local health-protection action.\"}', 'Seed: Research unit demo row 02', NULL, '2026-07-18 16:10:03', '2026-07-18 16:10:03'),
(74, 5, 2567, 2, '{\"name_of_research_unit_group_center\":\"Digital Health and Analytics Center\",\"type\":\"Center\",\"chair_person\":\"fac-063\",\"establishing_date\":\"2567-05-18\",\"purposes\":\"Advance responsible digital-health research, data analysis, and service innovation.\"}', 'Seed: Research unit demo row 03', NULL, '2026-07-18 16:10:03', '2026-07-18 16:10:03'),
(75, 5, 2567, 4, '{\"name_of_research_unit_group_center\":\"Healthy Aging Research Group\",\"type\":\"Group\",\"chair_person\":\"fac-064\",\"establishing_date\":\"2567-11-09\",\"purposes\":\"Improve healthy-aging outcomes through interdisciplinary research and community engagement.\"}', 'Seed: Research unit demo row 04', NULL, '2026-07-18 16:10:03', '2026-07-18 16:10:03'),
(76, 5, 2568, 2, '{\"name_of_research_unit_group_center\":\"Borderland Health Systems Unit\",\"type\":\"Unit\",\"chair_person\":\"fac-065\",\"establishing_date\":\"2568-06-21\",\"purposes\":\"Strengthen evidence on equitable care and referral systems in borderland communities.\"}', 'Seed: Research unit demo row 05', NULL, '2026-07-18 16:10:03', '2026-07-18 16:10:03'),
(80, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาต้น ปีการศึกษา 2565 รอบที่ 1\",\"planned_quota\":10,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(81, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(82, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":0,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(83, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(84, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาต้น ปีการศึกษา 2565 รอบที่ 2\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(85, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2565\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(86, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(87, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาต้น ปีการศึกษา 2565 รอบที่ 1\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(88, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":0,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(89, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":0,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(90, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(91, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาต้น ปีการศึกษา 2565 รอบที่ 2\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(92, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":26,\"completed_documents\":19,\"passed_selection\":19,\"confirmed_enrollment\":13,\"new_students\":12,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(93, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":44,\"completed_documents\":24,\"passed_selection\":23,\"confirmed_enrollment\":5,\"new_students\":4,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(94, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(95, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":41,\"completed_documents\":27,\"passed_selection\":27,\"confirmed_enrollment\":14,\"new_students\":13,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(96, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(97, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(98, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(99, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":5,\"passed_selection\":3,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(100, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนห้องเรียนพิเศษเน้นภาษาอังกฤษ รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(101, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":39,\"completed_documents\":10,\"passed_selection\":10,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(102, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้ รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(103, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":9,\"passed_selection\":3,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(104, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":15,\"passed_selection\":12,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(105, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":27,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(106, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับนักเรียนห้องเรียนพิเศษเน้นภาษาอังกฤษ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(107, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อส่งเสริมเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":28,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":5,\"new_students\":4,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(108, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":38,\"completed_documents\":23,\"passed_selection\":23,\"confirmed_enrollment\":11,\"new_students\":10,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(109, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(110, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(111, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":61,\"completed_documents\":19,\"passed_selection\":19,\"confirmed_enrollment\":19,\"new_students\":11,\"unregistered_students\":8}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(112, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":99,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":12,\"new_students\":10,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(113, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":10,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(114, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":36,\"passed_selection\":5,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(115, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(116, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":5,\"new_students\":4,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(117, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(118, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(119, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":48,\"completed_documents\":25,\"passed_selection\":23,\"confirmed_enrollment\":9,\"new_students\":8,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(120, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":90,\"total_applicants\":16,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(121, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนห้องเรียนพิเศษเน้นภาษาอังกฤษ\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(122, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":150,\"completed_documents\":52,\"passed_selection\":35,\"confirmed_enrollment\":13,\"new_students\":13,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(123, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการสำหรับครูแนะแนว\",\"planned_quota\":90,\"total_applicants\":223,\"completed_documents\":130,\"passed_selection\":130,\"confirmed_enrollment\":38,\"new_students\":36,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(124, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":90,\"total_applicants\":23,\"completed_documents\":8,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(125, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(126, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":90,\"total_applicants\":13,\"completed_documents\":126,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(127, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":90,\"total_applicants\":10,\"completed_documents\":94,\"passed_selection\":3,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(128, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":62,\"completed_documents\":22,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(129, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อส่งเสริมเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":102,\"completed_documents\":53,\"passed_selection\":10,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10');
INSERT INTO `data_source_entry` (`id`, `data_source_id`, `year`, `quarter`, `values_json`, `note`, `recorded_by`, `created_at`, `updated_at`) VALUES
(130, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":90,\"total_applicants\":41,\"completed_documents\":17,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(131, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(132, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":90,\"total_applicants\":67,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":20,\"new_students\":14,\"unregistered_students\":6}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(133, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":90,\"total_applicants\":93,\"completed_documents\":26,\"passed_selection\":26,\"confirmed_enrollment\":26,\"new_students\":21,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(134, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":90,\"total_applicants\":33,\"completed_documents\":145,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(135, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":48,\"completed_documents\":27,\"passed_selection\":27,\"confirmed_enrollment\":27,\"new_students\":21,\"unregistered_students\":6}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(136, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(137, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษาใหม่\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(138, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(139, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":5,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(140, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":5,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":0,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(141, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาเอก ภาคการศึกษาต้น ปีการศึกษา 2565 รอบที่ 2\",\"planned_quota\":5,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(142, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาเอก ภาคการศึกษาปลาย ปีการศึกษา 2565\",\"planned_quota\":5,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(143, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":34,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":9,\"new_students\":7,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(144, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(145, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(146, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(147, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(148, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(149, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":42,\"completed_documents\":15,\"passed_selection\":15,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(150, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้ รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(151, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":10,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(152, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":7,\"passed_selection\":5,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(153, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":15,\"passed_selection\":15,\"confirmed_enrollment\":7,\"new_students\":7,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(154, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อส่งเสริมเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(155, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":34,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(156, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(157, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":50,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":20,\"new_students\":15,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(158, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":14,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":2,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(159, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":18,\"passed_selection\":12,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(160, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":59,\"passed_selection\":10,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(161, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(162, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(163, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษาใหม่\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(164, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(165, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(166, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(167, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":14,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":4,\"new_students\":3,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(168, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":32,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":7,\"new_students\":7,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(169, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(170, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(171, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนห้องเรียนพิเศษเน้นภาษาอังกฤษ รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(172, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการเด็กดีมีที่เรียน รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":51,\"completed_documents\":19,\"passed_selection\":19,\"confirmed_enrollment\":7,\"new_students\":7,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(173, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้ รอบที่ 1.2\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(174, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":15,\"passed_selection\":12,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(175, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โควตาภาคเหนือและโรงเรียนเครือข่าย ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":4,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(176, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(177, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อส่งเสริมเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(178, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":34,\"completed_documents\":21,\"passed_selection\":21,\"confirmed_enrollment\":7,\"new_students\":6,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(179, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"โครงการพิเศษเพื่อนักเรียนในเขตพัฒนาพิเศษเฉพาะกิจจังหวัดชายแดนภาคใต้\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(180, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":29,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":8,\"new_students\":6,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(181, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":33,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":11,\"new_students\":9,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(182, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนนวิชาสามัญ\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":22,\"passed_selection\":16,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(183, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission  ประเภทใช้ผลคะแนน GAT/PAT\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":86,\"passed_selection\":60,\"confirmed_enrollment\":8,\"new_students\":7,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(184, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":9,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(185, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รับตรงอิสระ Direct Admission โครงการรับผู้ที่สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(186, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษาใหม่\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(187, 7, 2565, 3, '{\"academic_year\":2565,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:01:10', '2026-07-28 09:01:10'),
(188, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":71,\"completed_documents\":28,\"passed_selection\":8,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(189, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":90,\"total_applicants\":13,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(190, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":132,\"completed_documents\":53,\"passed_selection\":7,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(191, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":90,\"total_applicants\":204,\"completed_documents\":109,\"passed_selection\":109,\"confirmed_enrollment\":25,\"new_students\":24,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(192, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(193, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":31,\"completed_documents\":14,\"passed_selection\":4,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(194, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":120,\"completed_documents\":55,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(195, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":63,\"completed_documents\":35,\"passed_selection\":5,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(196, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(197, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":5,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(198, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":8,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":5,\"new_students\":1,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(199, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Partial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(200, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":7,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":3,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(201, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Partial Scholarships)-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(202, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":63,\"completed_documents\":37,\"passed_selection\":15,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(203, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":90,\"total_applicants\":39,\"completed_documents\":30,\"passed_selection\":15,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(204, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(205, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาเอก รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(206, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":21,\"completed_documents\":21,\"passed_selection\":21,\"confirmed_enrollment\":21,\"new_students\":19,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(207, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":16,\"completed_documents\":16,\"passed_selection\":16,\"confirmed_enrollment\":16,\"new_students\":16,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(208, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา (รูปแบบ Portfolio)\",\"planned_quota\":90,\"total_applicants\":22,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":6,\"new_students\":5,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(209, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":82,\"completed_documents\":57,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(210, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":90,\"total_applicants\":72,\"completed_documents\":62,\"passed_selection\":13,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(211, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"ทุนมหาดไทย กรมการปกครอง-นักศึกษาจังหวัดชายแดนภาคใต้ที่ได้รับผลกระทบจากสถานการณ์ความไม่สงบ\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(212, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":73,\"completed_documents\":44,\"passed_selection\":24,\"confirmed_enrollment\":24,\"new_students\":12,\"unregistered_students\":12}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(213, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(214, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":18,\"completed_documents\":3,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(215, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":90,\"total_applicants\":15,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":8,\"new_students\":8,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(216, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการทุนอุดมศึกษาเพื่อการพัฒนาจังหวัดชายแดนภาคใต้\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(217, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":39,\"completed_documents\":15,\"passed_selection\":15,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(218, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":52,\"completed_documents\":28,\"passed_selection\":19,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(219, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":21,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(220, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":63,\"completed_documents\":37,\"passed_selection\":37,\"confirmed_enrollment\":16,\"new_students\":13,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(221, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(222, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":5,\"new_students\":4,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(223, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":54,\"completed_documents\":16,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(224, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(225, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":48,\"completed_documents\":35,\"passed_selection\":35,\"confirmed_enrollment\":14,\"new_students\":13,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(226, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(227, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":31,\"completed_documents\":16,\"passed_selection\":15,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(228, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":6,\"passed_selection\":5,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(229, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โครงการพิเศษรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยฯ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(230, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โครงการพิเศษรับผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(231, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":13,\"new_students\":10,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(232, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":5,\"new_students\":3,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(233, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา (รูปแบบ Portfolio)\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":8,\"passed_selection\":6,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59');
INSERT INTO `data_source_entry` (`id`, `data_source_id`, `year`, `quarter`, `values_json`, `note`, `recorded_by`, `created_at`, `updated_at`) VALUES
(234, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":16,\"completed_documents\":9,\"passed_selection\":6,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(235, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":4,\"passed_selection\":2,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(236, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 โครงการพิเศษรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยฯ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(237, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 โครงการรับตรงพิเศษสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":3,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(238, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":10,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(239, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(240, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":6,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(241, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":47,\"completed_documents\":33,\"passed_selection\":33,\"confirmed_enrollment\":10,\"new_students\":9,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(242, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(243, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(244, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":37,\"completed_documents\":25,\"passed_selection\":25,\"confirmed_enrollment\":4,\"new_students\":2,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(245, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้ถือสัญชาติไทยที่สำเร็จการศึกษาจากโรงเรียนนานาชาติในประเทศไทยหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(246, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับนักเรียนผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(247, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(248, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(249, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(250, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":41,\"completed_documents\":17,\"passed_selection\":17,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(251, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(252, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":5,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(253, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":14,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":5,\"new_students\":4,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(254, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(255, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":5,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(256, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":17,\"passed_selection\":17,\"confirmed_enrollment\":17,\"new_students\":9,\"unregistered_students\":8}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(257, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":4,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(258, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา (รูปแบบ Portfolio)\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":4,\"new_students\":2,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(259, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(260, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(261, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 โครงการรับตรงพิเศษสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(262, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":28,\"completed_documents\":27,\"passed_selection\":12,\"confirmed_enrollment\":12,\"new_students\":7,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(263, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(264, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(265, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา รอบที่ 2\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(266, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(267, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(268, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":30,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(269, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":41,\"completed_documents\":21,\"passed_selection\":21,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(270, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(271, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(272, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(273, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":47,\"completed_documents\":26,\"passed_selection\":26,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(274, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(275, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(276, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โควตาภาคเหนือและเครือข่ายการรับนักศึกษา (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(277, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":14,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":14,\"new_students\":12,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(278, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(279, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission โครงการรับตรงสำนักวิชา (รูปแบบ Portfolio)\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":4,\"new_students\":3,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(280, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":10,\"passed_selection\":10,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(281, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 รับตรงอิสระ Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":9,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(282, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 โครงการรับตรงพิเศษสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":3,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(283, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":0,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(284, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (SCHOLARSHIP)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(285, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(286, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา รอบที่ 2\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(287, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(288, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":4,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":0,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(289, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Partial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(290, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(291, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(292, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(293, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(294, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(295, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":30,\"total_applicants\":4,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":0,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(296, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(297, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":7,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(298, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":5,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(299, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาโท ภาคการศึกษาปลาย ปีการศึกษา 2566\",\"planned_quota\":5,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(300, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":42,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":9,\"new_students\":5,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(301, 7, 2566, 3, '{\"academic_year\":2566,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(302, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":74,\"completed_documents\":22,\"passed_selection\":15,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(303, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":90,\"total_applicants\":5,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(304, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":90,\"total_applicants\":118,\"completed_documents\":58,\"passed_selection\":58,\"confirmed_enrollment\":14,\"new_students\":14,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(305, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ช่วงที่ 1 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":90,\"total_applicants\":14,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(306, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":72,\"completed_documents\":26,\"passed_selection\":5,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(307, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":97,\"completed_documents\":48,\"passed_selection\":10,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(308, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":15,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(309, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":12,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":0,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(310, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":17,\"completed_documents\":12,\"passed_selection\":11,\"confirmed_enrollment\":11,\"new_students\":7,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(311, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(312, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":4,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(313, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(314, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":6,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(315, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(IIE Scholarships)-ระดับปริญญาโท\",\"planned_quota\":15,\"total_applicants\":4,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(316, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(317, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":5,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":0,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(318, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":81,\"completed_documents\":42,\"passed_selection\":20,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(319, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":90,\"total_applicants\":59,\"completed_documents\":19,\"passed_selection\":11,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(320, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":58,\"completed_documents\":17,\"passed_selection\":17,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(321, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":15,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(322, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":24,\"completed_documents\":24,\"passed_selection\":24,\"confirmed_enrollment\":24,\"new_students\":22,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(323, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":59,\"completed_documents\":26,\"passed_selection\":26,\"confirmed_enrollment\":15,\"new_students\":14,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(324, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":90,\"total_applicants\":27,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(325, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 Direct Admission (รูปแบบ Portfolio)\",\"planned_quota\":90,\"total_applicants\":40,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":13,\"new_students\":4,\"unregistered_students\":9}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(326, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"โครงการทุนอุดมศึกษาเพื่อการพัฒนาจังหวัดชายแดนภาคใต้\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(327, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":76,\"completed_documents\":25,\"passed_selection\":25,\"confirmed_enrollment\":25,\"new_students\":16,\"unregistered_students\":9}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(328, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship)-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":11,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(329, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 เทอม\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(330, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":31,\"completed_documents\":15,\"passed_selection\":15,\"confirmed_enrollment\":9,\"new_students\":9,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(331, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":26,\"completed_documents\":9,\"passed_selection\":7,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(332, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":30,\"completed_documents\":22,\"passed_selection\":22,\"confirmed_enrollment\":10,\"new_students\":10,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(333, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ช่วงที่ 1 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(334, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":25,\"completed_documents\":9,\"passed_selection\":8,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(335, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":46,\"completed_documents\":20,\"passed_selection\":16,\"confirmed_enrollment\":8,\"new_students\":7,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(336, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":42,\"completed_documents\":26,\"passed_selection\":26,\"confirmed_enrollment\":12,\"new_students\":10,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(337, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":30,\"completed_documents\":20,\"passed_selection\":15,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59');
INSERT INTO `data_source_entry` (`id`, `data_source_id`, `year`, `quarter`, `values_json`, `note`, `recorded_by`, `created_at`, `updated_at`) VALUES
(338, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":5,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(339, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":3,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(340, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(341, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":37,\"completed_documents\":22,\"passed_selection\":15,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(342, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":16,\"passed_selection\":15,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(343, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":9,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(344, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(345, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":20,\"new_students\":13,\"unregistered_students\":7}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(346, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":16,\"completed_documents\":16,\"passed_selection\":16,\"confirmed_enrollment\":16,\"new_students\":11,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(347, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":24,\"completed_documents\":12,\"passed_selection\":10,\"confirmed_enrollment\":4,\"new_students\":3,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(348, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(349, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":3,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(350, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":1,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(351, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":22,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(352, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(353, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":26,\"completed_documents\":18,\"passed_selection\":18,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(354, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ช่วงที่ 1 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(355, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ช่วงที่ 1 รับนักเรียนผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(356, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":35,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":6,\"new_students\":5,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(357, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(358, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":21,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(359, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":42,\"completed_documents\":27,\"passed_selection\":27,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(360, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(361, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(362, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(363, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(364, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":15,\"passed_selection\":14,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(365, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(366, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ช่วงที่ 2 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(367, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":21,\"completed_documents\":21,\"passed_selection\":21,\"confirmed_enrollment\":21,\"new_students\":19,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(368, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(369, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(370, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":10,\"passed_selection\":10,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(371, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 Direct Admission (รูปแบบ Portfolio)\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":8,\"new_students\":6,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(372, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":24,\"completed_documents\":10,\"passed_selection\":10,\"confirmed_enrollment\":10,\"new_students\":4,\"unregistered_students\":6}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(373, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(374, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"(เฉพาะผู้เคยเป็น/นักศึกษาเก่า มฟล. เท่านั้น) โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(375, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":24,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(376, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":28,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(377, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ช่วงที่ 1 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(378, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":38,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(379, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(380, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":31,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(381, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(382, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้คะแนน TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(383, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 รับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(384, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(385, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":5,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(386, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":33,\"completed_documents\":18,\"passed_selection\":18,\"confirmed_enrollment\":8,\"new_students\":7,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(387, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4 Direct Admission (รูปแบบใช้ผลคะแนนสอบ A-Level)\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(388, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 Direct Admission (รูปแบบ Portfolio)\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":9,\"new_students\":4,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(389, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"ช่วงที่ 3 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(390, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":5,\"new_students\":3,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(391, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 ปี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(392, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"(เฉพาะผู้เคยเป็น/นักศึกษาเก่า มฟล. เท่านั้น) โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(393, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(394, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(395, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(396, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(397, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(398, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(399, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(400, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาปลาย สถานที่เรียน เชียงราย\",\"planned_quota\":15,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(401, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาปลาย สถานที่เรียน เชียงราย\",\"planned_quota\":15,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(402, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":15,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(403, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":15,\"total_applicants\":12,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":7,\"new_students\":3,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(404, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":15,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(405, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก ภาคการศึกษาปลาย\",\"planned_quota\":10,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(406, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี ภาคการศึกษาปลาย\",\"planned_quota\":90,\"total_applicants\":4,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(407, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(408, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี ภาคการศึกษาปลาย\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(409, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(410, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี ภาคการศึกษาปลาย\",\"planned_quota\":60,\"total_applicants\":26,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":2,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(411, 7, 2567, 3, '{\"academic_year\":2567,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี ภาคการศึกษาปลาย\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(412, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":58,\"completed_documents\":31,\"passed_selection\":31,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(413, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":90,\"total_applicants\":9,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(414, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":90,\"total_applicants\":80,\"completed_documents\":49,\"passed_selection\":49,\"confirmed_enrollment\":7,\"new_students\":7,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(415, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":146,\"completed_documents\":63,\"passed_selection\":41,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(416, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(417, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการสำหรับครูแนะแนว\",\"planned_quota\":90,\"total_applicants\":133,\"completed_documents\":71,\"passed_selection\":71,\"confirmed_enrollment\":10,\"new_students\":6,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(418, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":65,\"completed_documents\":21,\"passed_selection\":18,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(419, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":90,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(420, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":98,\"completed_documents\":62,\"passed_selection\":35,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(421, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการทหารพันธุ์ดี\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(422, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(423, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":10,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(424, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(425, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":4,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(426, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(427, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":5,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(428, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาเอก รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(429, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(430, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":6,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(431, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":240,\"completed_documents\":135,\"passed_selection\":92,\"confirmed_enrollment\":21,\"new_students\":19,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(432, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":29,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(433, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.3 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":89,\"completed_documents\":60,\"passed_selection\":24,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(434, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาเอก รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(435, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":21,\"completed_documents\":21,\"passed_selection\":21,\"confirmed_enrollment\":21,\"new_students\":19,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(436, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":15,\"completed_documents\":15,\"passed_selection\":15,\"confirmed_enrollment\":15,\"new_students\":15,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(437, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"โครงการรับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ (ช่วงที่ 3)\",\"planned_quota\":90,\"total_applicants\":6,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(438, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":40,\"completed_documents\":21,\"passed_selection\":13,\"confirmed_enrollment\":4,\"new_students\":1,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(439, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":29,\"completed_documents\":15,\"passed_selection\":7,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(440, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 รับตรงอิสระ โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":14,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":5,\"new_students\":2,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(441, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"ทุนมหาดไทย กรมการปกครอง-นักศึกษาจังหวัดชายแดนภาคใต้ที่ได้รับผลกระทบจากสถานการณ์ความไม่สงบ\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59');
INSERT INTO `data_source_entry` (`id`, `data_source_id`, `year`, `quarter`, `values_json`, `note`, `recorded_by`, `created_at`, `updated_at`) VALUES
(442, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"โครงการทุนอุดมศึกษาเพื่อการพัฒนาจังหวัดชายแดนภาคใต้\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(443, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":81,\"completed_documents\":16,\"passed_selection\":16,\"confirmed_enrollment\":16,\"new_students\":12,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(444, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 ปี\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(445, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 เทอม\",\"planned_quota\":90,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(446, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship for Indian Students)-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(447, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Thailand scholarship)-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":28,\"completed_documents\":7,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(448, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":26,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(449, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":44,\"completed_documents\":30,\"passed_selection\":23,\"confirmed_enrollment\":7,\"new_students\":4,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(450, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":47,\"completed_documents\":35,\"passed_selection\":35,\"confirmed_enrollment\":7,\"new_students\":7,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(451, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":69,\"completed_documents\":35,\"passed_selection\":34,\"confirmed_enrollment\":8,\"new_students\":7,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(452, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":74,\"completed_documents\":45,\"passed_selection\":45,\"confirmed_enrollment\":12,\"new_students\":10,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(453, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":22,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(454, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":28,\"completed_documents\":14,\"passed_selection\":8,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(455, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(456, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(457, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(458, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(459, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(460, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(461, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":38,\"completed_documents\":22,\"passed_selection\":16,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(462, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":14,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(463, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(464, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.3 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":10,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(465, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(466, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":11,\"new_students\":8,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(467, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":8,\"new_students\":7,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(468, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 รับตรงอิสระ โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":8,\"new_students\":3,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(469, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(470, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship for Indian Students)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(471, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Thailand scholarship)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(472, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(473, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(474, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(475, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":36,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(476, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":24,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(477, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(478, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(479, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(480, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(481, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(482, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(483, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":9,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(484, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(485, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(486, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":21,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(487, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(488, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.3 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(489, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(490, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":13,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":13,\"new_students\":12,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(491, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(492, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(493, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(494, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 รับตรงอิสระ โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(495, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 รับตรงอิสระ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":1,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(496, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(497, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"(เฉพาะผู้เคยเป็น/นักศึกษาเก่า มฟล. เท่านั้น) โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":3,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(498, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":8,\"new_students\":5,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(499, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Thailand scholarship)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(500, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":24,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(501, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(502, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":27,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(503, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":90,\"completed_documents\":50,\"passed_selection\":50,\"confirmed_enrollment\":16,\"new_students\":16,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(504, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(505, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":41,\"completed_documents\":27,\"passed_selection\":27,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(506, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":16,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(507, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(508, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการสำหรับครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":18,\"passed_selection\":18,\"confirmed_enrollment\":7,\"new_students\":6,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(509, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการพิเศษรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(510, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":34,\"completed_documents\":17,\"passed_selection\":17,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(511, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":9,\"passed_selection\":9,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(512, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.3 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(513, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.3 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT และ A-Level\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":10,\"passed_selection\":10,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(514, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.3 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนน GPAX TGAT/TPAT และ A-Level\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":10,\"passed_selection\":10,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(515, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":7,\"new_students\":6,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(516, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":14,\"completed_documents\":14,\"passed_selection\":14,\"confirmed_enrollment\":14,\"new_students\":13,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(517, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนน GPAX TGAT/TPAT และ A-Level\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":7,\"new_students\":4,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(518, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(519, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":12,\"passed_selection\":12,\"confirmed_enrollment\":8,\"new_students\":8,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(520, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 รับตรงอิสระ โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":18,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":2,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(521, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"(เฉพาะผู้เคยเป็น/นักศึกษาเก่า มฟล. เท่านั้น) โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":3,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(522, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(523, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":6,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":1,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(524, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":3,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(525, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(MFU Patial Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":20,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(526, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":6,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(527, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(528, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(529, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(530, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก ภาคการศึกษาปลาย\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(531, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก ภาคการศึกษาปลาย\",\"planned_quota\":10,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(532, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท ภาคการศึกษาปลาย\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(533, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท ภาคการศึกษาปลาย สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":0,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(534, 7, 2568, 3, '{\"academic_year\":2568,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี ภาคการศึกษาปลาย\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":2,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(535, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":90,\"total_applicants\":172,\"completed_documents\":85,\"passed_selection\":62,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(536, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":90,\"total_applicants\":19,\"completed_documents\":7,\"passed_selection\":6,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(537, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการครูแนะแนว\",\"planned_quota\":90,\"total_applicants\":208,\"completed_documents\":141,\"passed_selection\":141,\"confirmed_enrollment\":16,\"new_students\":16,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(538, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":274,\"completed_documents\":150,\"passed_selection\":67,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(539, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.4 โครงการรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":90,\"total_applicants\":374,\"completed_documents\":125,\"passed_selection\":40,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(540, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":90,\"total_applicants\":18,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(541, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(542, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":9,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(543, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":5,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(544, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(545, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59');
INSERT INTO `data_source_entry` (`id`, `data_source_id`, `year`, `quarter`, `values_json`, `note`, `recorded_by`, `created_at`, `updated_at`) VALUES
(546, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Boon Rawd Scholarship_Myanmar)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(547, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Boon Rawd Scholarship_Myanmar)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":6,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(548, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":90,\"total_applicants\":4,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(549, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":90,\"total_applicants\":4,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(550, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":201,\"completed_documents\":76,\"passed_selection\":37,\"confirmed_enrollment\":7,\"new_students\":6,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(551, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":216,\"completed_documents\":140,\"passed_selection\":41,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(552, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":121,\"completed_documents\":83,\"passed_selection\":25,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(553, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":3,\"completed_documents\":3,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(554, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(555, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาเอก รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(556, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":21,\"completed_documents\":21,\"passed_selection\":21,\"confirmed_enrollment\":15,\"new_students\":15,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(557, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":30,\"completed_documents\":30,\"passed_selection\":30,\"confirmed_enrollment\":22,\"new_students\":19,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(558, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":90,\"total_applicants\":60,\"completed_documents\":34,\"passed_selection\":10,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(559, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":90,\"total_applicants\":35,\"completed_documents\":21,\"passed_selection\":10,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(560, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"โครงการทุนอุดมศึกษาเพื่อการพัฒนาจังหวัดชายแดนภาคใต้\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(561, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":90,\"total_applicants\":33,\"completed_documents\":9,\"passed_selection\":3,\"confirmed_enrollment\":3,\"new_students\":2,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(562, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":51,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":13,\"new_students\":9,\"unregistered_students\":4}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(563, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 ปี\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(564, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 เทอม\",\"planned_quota\":90,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(565, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship for for ASEAN students)-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":4,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(566, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"PH\",\"curriculum_name\":\"PHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Thailand scholarship)-ระดับปริญญาตรี\",\"planned_quota\":90,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(567, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":42,\"completed_documents\":18,\"passed_selection\":18,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(568, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":47,\"completed_documents\":27,\"passed_selection\":21,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(569, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":66,\"completed_documents\":43,\"passed_selection\":43,\"confirmed_enrollment\":13,\"new_students\":12,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(570, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":69,\"completed_documents\":33,\"passed_selection\":33,\"confirmed_enrollment\":8,\"new_students\":8,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(571, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":94,\"completed_documents\":52,\"passed_selection\":52,\"confirmed_enrollment\":11,\"new_students\":10,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(572, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":84,\"completed_documents\":41,\"passed_selection\":41,\"confirmed_enrollment\":14,\"new_students\":11,\"unregistered_students\":3}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(573, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.4 โครงการรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":95,\"completed_documents\":37,\"passed_selection\":34,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(574, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":6,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(575, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(576, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(577, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Boon Rawd Scholarship_Myanmar)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(578, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":41,\"completed_documents\":26,\"passed_selection\":24,\"confirmed_enrollment\":11,\"new_students\":10,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(579, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":29,\"completed_documents\":25,\"passed_selection\":25,\"confirmed_enrollment\":5,\"new_students\":5,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(580, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":19,\"completed_documents\":16,\"passed_selection\":14,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(581, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(582, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":20,\"passed_selection\":20,\"confirmed_enrollment\":14,\"new_students\":12,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(583, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":22,\"completed_documents\":22,\"passed_selection\":22,\"confirmed_enrollment\":15,\"new_students\":10,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(584, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"โครงการทุนอุดมศึกษาเพื่อการพัฒนาจังหวัดชายแดนภาคใต้\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(585, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":7,\"new_students\":6,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(586, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship for for ASEAN students)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(587, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"SHS\",\"curriculum_name\":\"SHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Thailand scholarship)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(588, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(589, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการรับผู้มีความสามารถดีเด่นด้านดนตรี นาฏศิลป์ และกีฬา\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(590, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":15,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(591, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":27,\"completed_documents\":13,\"passed_selection\":13,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(592, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":69,\"completed_documents\":26,\"passed_selection\":26,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(593, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":125,\"completed_documents\":48,\"passed_selection\":48,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(594, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.4 โครงการรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":79,\"completed_documents\":32,\"passed_selection\":32,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(595, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(596, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 1 สถานที่เรียน เชียงราย\",\"planned_quota\":20,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(597, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(598, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Boon Rawd Scholarship_Myanmar)-ระดับปริญญาโท\",\"planned_quota\":20,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(599, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":17,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(600, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":24,\"completed_documents\":19,\"passed_selection\":19,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(601, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(602, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":30,\"completed_documents\":30,\"passed_selection\":30,\"confirmed_enrollment\":25,\"new_students\":20,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(603, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":7,\"passed_selection\":7,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(604, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":10,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(605, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.1 รับตรงอิสระ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":12,\"completed_documents\":5,\"passed_selection\":5,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(606, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"4\",\"tcas_group_name\":\"รอบที่ 4.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":7,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":4,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(607, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"(เฉพาะผู้เคยเป็น/นักศึกษาเก่า มฟล. เท่านั้น) โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":8,\"completed_documents\":6,\"passed_selection\":6,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(608, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":28,\"completed_documents\":16,\"passed_selection\":16,\"confirmed_enrollment\":16,\"new_students\":11,\"unregistered_students\":5}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(609, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 เทอม\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(610, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship for for ASEAN students)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(611, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (Thailand scholarship)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(612, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการเด็กดีมีที่เรียน\",\"planned_quota\":60,\"total_applicants\":20,\"completed_documents\":8,\"passed_selection\":8,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(613, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.1 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":30,\"completed_documents\":26,\"passed_selection\":26,\"confirmed_enrollment\":8,\"new_students\":8,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(614, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":50,\"completed_documents\":27,\"passed_selection\":27,\"confirmed_enrollment\":6,\"new_students\":6,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(615, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.2 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":123,\"completed_documents\":63,\"passed_selection\":63,\"confirmed_enrollment\":11,\"new_students\":9,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(616, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.3 โครงการครูแนะแนว\",\"planned_quota\":60,\"total_applicants\":188,\"completed_documents\":91,\"passed_selection\":91,\"confirmed_enrollment\":20,\"new_students\":20,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(617, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รอบที่ 1.4 โครงการรับตรงทั่วประเทศ (รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT)\",\"planned_quota\":60,\"total_applicants\":70,\"completed_documents\":27,\"passed_selection\":13,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(618, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"โครงการรับผู้พิการเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":5,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(619, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"รับผู้สำเร็จการศึกษาจากโรงเรียนนานาชาติหรือจบจากต่างประเทศ\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(620, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.1 โครงการรับตรงสำนักวิชา\",\"planned_quota\":60,\"total_applicants\":64,\"completed_documents\":23,\"passed_selection\":23,\"confirmed_enrollment\":11,\"new_students\":10,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(621, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้คะแนน TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":48,\"completed_documents\":25,\"passed_selection\":20,\"confirmed_enrollment\":3,\"new_students\":3,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(622, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"2\",\"tcas_group_name\":\"รอบที่ 2.2 รับตรงทั่วประเทศ รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":44,\"completed_documents\":32,\"passed_selection\":27,\"confirmed_enrollment\":7,\"new_students\":7,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(623, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ TGAT/TPAT\",\"planned_quota\":60,\"total_applicants\":11,\"completed_documents\":11,\"passed_selection\":11,\"confirmed_enrollment\":11,\"new_students\":11,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(624, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"3\",\"tcas_group_name\":\"รอบที่ 3 Admission รูปแบบใช้ผลคะแนนสอบ A-Level\",\"planned_quota\":60,\"total_applicants\":30,\"completed_documents\":30,\"passed_selection\":30,\"confirmed_enrollment\":28,\"new_students\":26,\"unregistered_students\":2}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(625, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"(เฉพาะผู้เคยเป็น/นักศึกษาเก่า มฟล. เท่านั้น) โครงการรับนักศึกษามหาวิทยาลัยแม่ฟ้าหลวงกลับเข้าศึกษา\",\"planned_quota\":60,\"total_applicants\":3,\"completed_documents\":1,\"passed_selection\":1,\"confirmed_enrollment\":1,\"new_students\":1,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(626, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":1,\"unregistered_students\":1}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(627, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติแลกเปลี่ยน-ระดับปริญญาตรี 1 ปี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(628, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"OHS\",\"curriculum_name\":\"OHSB\",\"tcas_round\":\"5\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา (MFU Patial Scholarship for for ASEAN students)-ระดับปริญญาตรี\",\"planned_quota\":60,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(629, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(630, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":2,\"completed_documents\":2,\"passed_selection\":2,\"confirmed_enrollment\":2,\"new_students\":2,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(631, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Thailand Scholarships)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(632, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ ได้รับทุนการศึกษา-(Boon Rawd Scholarship_Myanmar)-ระดับปริญญาโท\",\"planned_quota\":30,\"total_applicants\":5,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(633, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Master\'s\",\"department_name\":\"BM\",\"curriculum_name\":\"BMM\",\"tcas_round\":\"2\",\"tcas_group_name\":\"ระดับปริญญาโท รอบที่ 2 สถานที่เรียน เชียงราย\",\"planned_quota\":30,\"total_applicants\":1,\"completed_documents\":1,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(634, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":1,\"completed_documents\":0,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(635, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"1\",\"degree_level\":\"Doctoral\",\"department_name\":\"PH\",\"curriculum_name\":\"PHD\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาเอก\",\"planned_quota\":10,\"total_applicants\":4,\"completed_documents\":4,\"passed_selection\":4,\"confirmed_enrollment\":4,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(636, 7, 2569, 3, '{\"academic_year\":2569,\"semester\":\"2\",\"degree_level\":\"Bachelor\'s\",\"department_name\":\"EnvH\",\"curriculum_name\":\"EnvHB\",\"tcas_round\":\"1\",\"tcas_group_name\":\"นักศึกษาต่างชาติ-ระดับปริญญาตรี ภาคการศึกษาปลาย\",\"planned_quota\":60,\"total_applicants\":4,\"completed_documents\":2,\"passed_selection\":0,\"confirmed_enrollment\":0,\"new_students\":0,\"unregistered_students\":0}', NULL, NULL, '2026-07-28 09:34:59', '2026-07-28 09:34:59'),
(637, 8, 2565, 3, '{\"curriculum\":\"EnvHB\",\"grad_year\":2564,\"total_grad\":5,\"grad_in\":1,\"grad_over\":4,\"in_1year_employed\":4,\"thai_comp\":3,\"inter_comp\":1,\"study\":null,\"entrepreneur\":null,\"others\":1,\"c_21st_century_goodup\":null,\"c_21st_century_avg\":null}', 'บัณฑิตรุ่นปี 2564', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(638, 8, 2565, 3, '{\"curriculum\":\"OHSB\",\"grad_year\":2564,\"total_grad\":40,\"grad_in\":29,\"grad_over\":11,\"in_1year_employed\":30,\"thai_comp\":11,\"inter_comp\":19,\"study\":null,\"entrepreneur\":null,\"others\":10,\"c_21st_century_goodup\":null,\"c_21st_century_avg\":null}', 'บัณฑิตรุ่นปี 2564', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(639, 8, 2565, 3, '{\"curriculum\":\"PHB\",\"grad_year\":2564,\"total_grad\":69,\"grad_in\":62,\"grad_over\":7,\"in_1year_employed\":53,\"thai_comp\":53,\"inter_comp\":0,\"study\":null,\"entrepreneur\":null,\"others\":16,\"c_21st_century_goodup\":null,\"c_21st_century_avg\":null}', 'บัณฑิตรุ่นปี 2564', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(640, 8, 2565, 3, '{\"curriculum\":\"SHSB\",\"grad_year\":2564,\"total_grad\":29,\"grad_in\":21,\"grad_over\":8,\"in_1year_employed\":22,\"thai_comp\":12,\"inter_comp\":10,\"study\":null,\"entrepreneur\":null,\"others\":7,\"c_21st_century_goodup\":null,\"c_21st_century_avg\":null}', 'บัณฑิตรุ่นปี 2564', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(641, 8, 2566, 3, '{\"curriculum\":\"EnvHB\",\"grad_year\":2565,\"total_grad\":16,\"grad_in\":7,\"grad_over\":9,\"in_1year_employed\":9,\"thai_comp\":7,\"inter_comp\":2,\"study\":null,\"entrepreneur\":null,\"others\":7,\"c_21st_century_goodup\":12,\"c_21st_century_avg\":3.95}', 'บัณฑิตรุ่นปี 2565', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(642, 8, 2566, 3, '{\"curriculum\":\"OHSB\",\"grad_year\":2565,\"total_grad\":47,\"grad_in\":37,\"grad_over\":10,\"in_1year_employed\":32,\"thai_comp\":11,\"inter_comp\":21,\"study\":null,\"entrepreneur\":null,\"others\":15,\"c_21st_century_goodup\":40,\"c_21st_century_avg\":4.37}', 'บัณฑิตรุ่นปี 2565', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(643, 8, 2566, 3, '{\"curriculum\":\"PHB\",\"grad_year\":2565,\"total_grad\":54,\"grad_in\":41,\"grad_over\":13,\"in_1year_employed\":43,\"thai_comp\":43,\"inter_comp\":0,\"study\":null,\"entrepreneur\":null,\"others\":11,\"c_21st_century_goodup\":42,\"c_21st_century_avg\":4.2}', 'บัณฑิตรุ่นปี 2565', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(644, 8, 2566, 3, '{\"curriculum\":\"SHSB\",\"grad_year\":2565,\"total_grad\":20,\"grad_in\":19,\"grad_over\":1,\"in_1year_employed\":14,\"thai_comp\":7,\"inter_comp\":7,\"study\":null,\"entrepreneur\":null,\"others\":6,\"c_21st_century_goodup\":16,\"c_21st_century_avg\":4.26}', 'บัณฑิตรุ่นปี 2565', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(645, 8, 2567, 3, '{\"curriculum\":\"EnvHB\",\"grad_year\":2566,\"total_grad\":29,\"grad_in\":25,\"grad_over\":4,\"in_1year_employed\":17,\"thai_comp\":13,\"inter_comp\":4,\"study\":1,\"entrepreneur\":null,\"others\":12,\"c_21st_century_goodup\":23,\"c_21st_century_avg\":4.2}', 'บัณฑิตรุ่นปี 2566', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(646, 8, 2567, 3, '{\"curriculum\":\"OHSB\",\"grad_year\":2566,\"total_grad\":36,\"grad_in\":33,\"grad_over\":3,\"in_1year_employed\":27,\"thai_comp\":3,\"inter_comp\":24,\"study\":null,\"entrepreneur\":null,\"others\":9,\"c_21st_century_goodup\":30,\"c_21st_century_avg\":4.34}', 'บัณฑิตรุ่นปี 2566', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(647, 8, 2567, 3, '{\"curriculum\":\"PHB\",\"grad_year\":2566,\"total_grad\":88,\"grad_in\":84,\"grad_over\":4,\"in_1year_employed\":62,\"thai_comp\":62,\"inter_comp\":0,\"study\":2,\"entrepreneur\":null,\"others\":26,\"c_21st_century_goodup\":68,\"c_21st_century_avg\":4.19}', 'บัณฑิตรุ่นปี 2566', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(648, 8, 2567, 3, '{\"curriculum\":\"SHSB\",\"grad_year\":2566,\"total_grad\":45,\"grad_in\":43,\"grad_over\":2,\"in_1year_employed\":32,\"thai_comp\":12,\"inter_comp\":20,\"study\":4,\"entrepreneur\":null,\"others\":13,\"c_21st_century_goodup\":37,\"c_21st_century_avg\":4.25}', 'บัณฑิตรุ่นปี 2566', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(649, 8, 2568, 3, '{\"curriculum\":\"EnvHB\",\"grad_year\":2567,\"total_grad\":30,\"grad_in\":16,\"grad_over\":14,\"in_1year_employed\":22,\"thai_comp\":20,\"inter_comp\":2,\"study\":null,\"entrepreneur\":null,\"others\":8,\"c_21st_century_goodup\":27,\"c_21st_century_avg\":4.34}', 'บัณฑิตรุ่นปี 2567', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(650, 8, 2568, 3, '{\"curriculum\":\"OHSB\",\"grad_year\":2567,\"total_grad\":64,\"grad_in\":54,\"grad_over\":10,\"in_1year_employed\":51,\"thai_comp\":32,\"inter_comp\":19,\"study\":null,\"entrepreneur\":null,\"others\":13,\"c_21st_century_goodup\":64,\"c_21st_century_avg\":4.44}', 'บัณฑิตรุ่นปี 2567', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(651, 8, 2568, 3, '{\"curriculum\":\"PHB\",\"grad_year\":2567,\"total_grad\":133,\"grad_in\":124,\"grad_over\":9,\"in_1year_employed\":104,\"thai_comp\":104,\"inter_comp\":0,\"study\":null,\"entrepreneur\":null,\"others\":29,\"c_21st_century_goodup\":127,\"c_21st_century_avg\":4.4}', 'บัณฑิตรุ่นปี 2567', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50'),
(652, 8, 2568, 3, '{\"curriculum\":\"SHSB\",\"grad_year\":2567,\"total_grad\":59,\"grad_in\":48,\"grad_over\":11,\"in_1year_employed\":47,\"thai_comp\":35,\"inter_comp\":12,\"study\":null,\"entrepreneur\":null,\"others\":12,\"c_21st_century_goodup\":59,\"c_21st_century_avg\":4.57}', 'บัณฑิตรุ่นปี 2567', NULL, '2026-07-30 05:24:50', '2026-07-30 05:24:50');

-- --------------------------------------------------------

--
-- Table structure for table `data_source_link`
--

CREATE TABLE `data_source_link` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `data_source_id` bigint(20) UNSIGNED NOT NULL,
  `library_kpi_id` bigint(20) UNSIGNED DEFAULT NULL,
  `library_metric_id` bigint(20) UNSIGNED DEFAULT NULL,
  `mappings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mappings`)),
  `note` varchar(1000) DEFAULT NULL,
  `target_key` varchar(32) GENERATED ALWAYS AS (concat(if(`library_kpi_id` is null,'m','k'),coalesce(`library_kpi_id`,`library_metric_id`))) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `data_source_link`
--

INSERT INTO `data_source_link` (`id`, `data_source_id`, `library_kpi_id`, `library_metric_id`, `mappings`, `note`, `created_at`, `updated_at`) VALUES
(6, 3, NULL, 3, '[{\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"ip_s_type\",\"operator\":\"eq\",\"value\":\"Innovation\"}]}]', 'Count Number of Innovation', '2026-07-19 03:51:52', '2026-07-30 15:29:47'),
(8, 3, NULL, 4, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"ip_s_type\",\"operator\":\"eq\",\"value\":\"Patent\"}]}]', 'Number of Patent', '2026-07-19 06:22:26', '2026-07-19 06:22:26'),
(9, 3, NULL, 5, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"ip_s_type\",\"operator\":\"eq\",\"value\":\"Invention\"}]}]', 'Number of Invention', '2026-07-19 06:23:05', '2026-07-19 06:23:05'),
(10, 3, NULL, 44, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"ip_s_type\",\"operator\":\"eq\",\"value\":\"Petty patent\"}]}]', 'Number of Petter Patent', '2026-07-19 06:23:50', '2026-07-19 06:23:50'),
(15, 2, NULL, 50, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q1-Tier\"}]}]', NULL, '2026-07-19 13:28:14', '2026-07-19 13:28:14'),
(16, 2, NULL, 51, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q1\"}]}]', NULL, '2026-07-19 13:28:38', '2026-07-19 13:28:38'),
(17, 2, NULL, 52, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q2\"}]}]', NULL, '2026-07-19 13:28:57', '2026-07-19 13:28:57'),
(18, 2, NULL, 53, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q3\"}]}]', NULL, '2026-07-19 13:29:21', '2026-07-21 04:45:11'),
(19, 2, NULL, 54, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q4\"}]}]', NULL, '2026-07-19 13:29:35', '2026-07-19 13:29:35'),
(21, 2, NULL, 46, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q1\"}]}]', NULL, '2026-07-19 14:41:46', '2026-07-30 11:08:49'),
(22, 2, NULL, 47, '[{\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q2\"}]}]', 'Count Q2', '2026-07-21 04:43:05', '2026-07-30 16:25:11'),
(23, 2, NULL, 48, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q3\"}]}]', NULL, '2026-07-21 04:45:34', '2026-07-30 11:09:09'),
(24, 2, NULL, 49, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q4\"}]}]', NULL, '2026-07-21 04:46:32', '2026-07-30 11:09:14'),
(25, 2, NULL, 45, '[{\"slot\":\"value\",\"aggregation\":\"count\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"eq\",\"value\":\"Q1-Tier\"}]}]', NULL, '2026-07-21 04:46:57', '2026-07-30 11:08:30'),
(30, 7, NULL, 7, '[{\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"OHSB\"}]}]', NULL, '2026-07-28 09:08:39', '2026-07-30 15:29:46'),
(31, 7, NULL, 8, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"PHB\"}]}]', NULL, '2026-07-28 09:12:35', '2026-07-28 09:12:35'),
(32, 7, NULL, 9, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"EnvHB\"}]}]', NULL, '2026-07-28 09:20:40', '2026-07-28 09:20:40'),
(33, 7, NULL, 10, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"SHSB\"}]}]', NULL, '2026-07-28 09:21:08', '2026-07-28 09:21:08'),
(39, 8, NULL, 21, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"SHSB\"}],\"numeratorColumnKey\":\"in_1year_employed\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:20:00', '2026-07-30 08:40:56'),
(40, 8, NULL, 18, '[{\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"PHB\"}],\"numeratorColumnKey\":\"in_1year_employed\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:30:38', '2026-07-31 06:40:51'),
(41, 8, NULL, 23, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"OHSB\"}],\"numeratorColumnKey\":\"in_1year_employed\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:31:09', '2026-07-30 07:31:09'),
(42, 8, NULL, 24, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"EnvHB\"}],\"numeratorColumnKey\":\"in_1year_employed\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:31:45', '2026-07-30 07:31:45'),
(43, 8, NULL, 55, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"PHB\"}],\"numeratorColumnKey\":\"inter_comp\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:42:11', '2026-07-30 07:42:11'),
(44, 8, NULL, 58, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"SHSB\"}],\"numeratorColumnKey\":\"inter_comp\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:42:41', '2026-07-30 07:42:41'),
(45, 8, NULL, 60, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"OHSB\"}],\"numeratorColumnKey\":\"inter_comp\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:43:03', '2026-07-30 07:43:03'),
(46, 8, NULL, 61, '[{\"slot\":\"value\",\"aggregation\":\"percent_of\",\"columnKey\":\"total_grad\",\"filters\":[{\"field\":\"curriculum\",\"operator\":\"eq\",\"value\":\"EnvHB\"}],\"numeratorColumnKey\":\"inter_comp\",\"numeratorFilters\":[]}]', NULL, '2026-07-30 07:43:29', '2026-07-30 07:43:29'),
(48, 7, NULL, 74, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"PHM\"}]}]', NULL, '2026-07-30 10:49:30', '2026-07-30 10:49:30'),
(49, 7, NULL, 75, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"PHD\"}]}]', NULL, '2026-07-30 10:51:29', '2026-07-30 10:51:29'),
(50, 7, NULL, 77, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"SHSM\"}]}]', NULL, '2026-07-30 10:52:38', '2026-07-30 10:52:38'),
(51, 7, NULL, 80, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"EnvHM\"}]}]', NULL, '2026-07-30 10:53:14', '2026-07-30 10:53:14'),
(52, 7, NULL, 81, '[{\"slot\":\"value\",\"aggregation\":\"sum\",\"columnKey\":\"new_students\",\"filters\":[{\"field\":\"curriculum_name\",\"operator\":\"eq\",\"value\":\"BMM\"}]}]', NULL, '2026-07-30 10:53:40', '2026-07-30 10:53:40'),
(53, 2, 11, NULL, '[{\"aggregation\":\"ratio_of\",\"columnKey\":null,\"filters\":[{\"field\":\"quartile\",\"operator\":\"in\",\"values\":[\"Q1-Tier\",\"Q1\",\"Q2\"]}],\"denominatorSource\":\"faculty\",\"facultyRanks\":[\"Professor\",\"Associate Professor\",\"Assistant Professor\",\"Lecturer\"]}]', NULL, '2026-07-30 11:13:16', '2026-07-31 00:44:32');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` enum('Professor','Associate Professor','Assistant Professor','Lecturer','Support Staff') NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name_TH` varchar(255) DEFAULT NULL,
  `program` enum('BioMed','EnvH','OHS','PH','Sport Science','SHS Office') NOT NULL,
  `status` enum('active','inactive','draft') NOT NULL DEFAULT 'active',
  `system_role` enum('admin','reviewer','committee','viewer') NOT NULL DEFAULT 'viewer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`id`, `name`, `rank`, `email`, `name_TH`, `program`, `status`, `system_role`, `created_at`, `updated_at`) VALUES
('fac-000', 'SHS KPI Administrator', 'Support Staff', 'admin@mfu.ac.th', NULL, 'SHS Office', 'active', 'admin', '2026-08-03 06:00:16', '2026-08-03 06:00:16'),
('fac-001', 'อ.ดร.นิเวศน์ กุลวงค์', 'Lecturer', 'niwed.kul@mfu.ac.th', 'อ.ดร.นิเวศน์ กุลวงค์', 'BioMed', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'Assistant Professor', 'jongkon.sai@mfu.ac.th', 'ผศ.ดร.จงกล สายสิงห์', 'BioMed', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'Assistant Professor', 'wipob.sut@mfu.ac.th', 'ผศ.ดร.วิภพ สุทธนะ', 'BioMed', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-004', 'ผศ.ดร.วุฒิชัย นาชัยเวียง', 'Assistant Professor', 'woottichai.nac@mfu.ac.th', 'ผศ.ดร.วุฒิชัย นาชัยเวียง', 'BioMed', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'Associate Professor', 'sasitorn.chu@mfu.ac.th', 'รศ.ดร.ศศิธร ชูศรี', 'BioMed', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-006', 'อ.ดร. ณหทัย ดูแก้ว', 'Lecturer', 'nahathai.duk@mfu.ac.th', 'อ.ดร. ณหทัย ดูแก้ว', 'BioMed', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-007', 'อ.ดร.ประภาพรรณ เหล็กงาม', 'Lecturer', 'prapapun.lec@mfu.ac.th', 'อ.ดร.ประภาพรรณ เหล็กงาม', 'BioMed', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-008', 'อ.ภาณุพงศ์ อุปละ', 'Lecturer', 'panupong.upa@mfu.ac.th', 'อ.ภาณุพงศ์ อุปละ', 'BioMed', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-009', 'อ.ดร.อ่อน ลายเงิน', 'Lecturer', 'onn.lai@mfu.ac.th', 'อ.ดร.อ่อน ลายเงิน', 'BioMed', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-010', 'ผศ.ดร.วิวัฒน์ แก้วดวงเล็ก', 'Assistant Professor', 'vivat.kea@mfu.ac.th', 'ผศ.ดร.วิวัฒน์ แก้วดวงเล็ก', 'EnvH', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-011', 'ผศ.อ.ดร.นพฤทธิ์ สุทธศิลป์', 'Assistant Professor', 'noppharit.sut@mfu.ac.th', 'ผศ.อ.ดร.นพฤทธิ์ สุทธศิลป์', 'EnvH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-012', 'ผศ.ดร.ไกรลักษณ์ ฟักแก้ว', 'Assistant Professor', 'krailak.fak@mfu.ac.th', 'ผศ.ดร.ไกรลักษณ์ ฟักแก้ว', 'EnvH', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-013', 'ผศ.ดร.พรรณนิภา ดอกไม้งาม', 'Assistant Professor', 'pannipha.dok@mfu.ac.th', 'ผศ.ดร.พรรณนิภา ดอกไม้งาม', 'EnvH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-014', 'ผศ.ผุสดี ละออ', 'Assistant Professor', 'pussadee.lao@mfu.ac.th', 'ผศ.ผุสดี ละออ', 'EnvH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-015', 'อ.ดร.วีรยุทธ สิริรัตน์เรืองสุข', 'Lecturer', 'weerayuth.sir@mfu.ac.th', 'อ.ดร.วีรยุทธ สิริรัตน์เรืองสุข', 'EnvH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-016', 'ผศ.ดร.อณุตรา หงษ์ทอง', 'Assistant Professor', 'anuttara.hon@mfu.ac.th', 'ผศ.ดร.อณุตรา หงษ์ทอง', 'EnvH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-017', 'อ.ดร.อนุวัต อุ่นคำ', 'Lecturer', 'anuwat.aun@mfu.ac.th', 'อ.ดร.อนุวัต อุ่นคำ', 'EnvH', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-018', 'รศ.ดร.โกวิทย์ นามบุญมี', 'Associate Professor', 'kowit.nam@mfu.ac.th', 'รศ.ดร.โกวิทย์ นามบุญมี', 'OHS', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-019', 'อ.ดร.ศิริวรรณ กันติสินธุ์', 'Lecturer', 'siriwan.kan@mfu.ac.th', 'อ.ดร.ศิริวรรณ กันติสินธุ์', 'OHS', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-020', 'ผศ.ณิชารัศม์ ปัญจโพธิวัฒน์', 'Assistant Professor', 'nicharuch.pan@mfu.ac.th', 'ผศ.ณิชารัศม์ ปัญจโพธิวัฒน์', 'OHS', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-021', 'อ.เฉลิมพันธ์ แก้วกันทะ', 'Lecturer', 'chaloemphan.kae@mfu.ac.th', 'อ.เฉลิมพันธ์ แก้วกันทะ', 'OHS', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'Lecturer', 'saharat.arr@mfu.ac.th', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'OHS', 'active', 'admin', '2026-07-01 08:40:29', '2026-07-01 08:40:29'),
('fac-023', 'อ.วีรพงษ์ ทันจังหรีด', 'Lecturer', 'weerapong.tha@mfu.ac.th', 'อ.วีรพงษ์ ทันจังหรีด', 'OHS', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-024', 'อ.สิตางค์ คงกระโทก', 'Lecturer', 'sitang.kon@mfu.ac.th', 'อ.สิตางค์ คงกระโทก', 'OHS', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-025', 'อ.อัญชลี คัตรมี', 'Lecturer', 'anchalee.kat@mfu.ac.th', 'อ.อัญชลี คัตรมี', 'OHS', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-026', 'ผศ.ดร.พีรดนย์ ศรีจันทร์', 'Assistant Professor', 'peeradone.sri@mfu.ac.th', 'ผศ.ดร.พีรดนย์ ศรีจันทร์', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-027', 'ผศ.ดร.ศิวรักษ์ กิจชนะไพบูลย์', 'Assistant Professor', 'siwarak@mfu.ac.th', 'ผศ.ดร.ศิวรักษ์ กิจชนะไพบูลย์', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-028', 'อ.ดร.สิรินันท์ สุวรรณาภรณ์', 'Lecturer', 'sirinan.suw@mfu.ac.th', 'อ.ดร.สิรินันท์ สุวรรณาภรณ์', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-029', 'ผศ.ดร.พิลาสินี วงษ์นุช', 'Assistant Professor', 'pilasinee.won@mfu.ac.th', 'ผศ.ดร.พิลาสินี วงษ์นุช', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-030', 'ผศ.ดร.ศิริญาพร ขันทะสอน', 'Assistant Professor', 'siriyaporn.khu@mfu.ac.th', 'ผศ.ดร.ศิริญาพร ขันทะสอน', 'PH', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-031', 'ผศ.ดร.กรกช จันทร์เสรีวิทยา', 'Assistant Professor', 'korakot.cha@mfu.ac.th', 'ผศ.ดร.กรกช จันทร์เสรีวิทยา', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-032', 'ผศ.ดร.พิษณุรักษ์ กันทวี', 'Assistant Professor', 'phitsanuruk.kan@mfu.ac.th', 'ผศ.ดร.พิษณุรักษ์ กันทวี', 'PH', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-033', 'ผศ.ดร.ภมรศรี อินทร์ชน', 'Assistant Professor', 'pamornsri.sri@mfu.ac.th', 'ผศ.ดร.ภมรศรี อินทร์ชน', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-034', 'ผศ.ดร.สุนทรี สุรัตน์', 'Assistant Professor', 'soontaree.sur@mfu.ac.th', 'ผศ.ดร.สุนทรี สุรัตน์', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-035', 'รศ.ดร.ธวัชชัย อภิเดชกุล', 'Associate Professor', 'tawatchai.api@mfu.ac.th', 'รศ.ดร.ธวัชชัย อภิเดชกุล', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-036', 'อ.ชลิตา ชมเชย', 'Lecturer', 'chalitar.cho@mfu.ac.th', 'อ.ชลิตา ชมเชย', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-037', 'อ.ชัญญานุช วงศ์ฟู', 'Lecturer', 'chanyanut.won@mfu.ac.th', 'อ.ชัญญานุช วงศ์ฟู', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-038', 'อ.ฐิตาพร แก้วบุญชู', 'Lecturer', 'thitaporn.kae@mfu.ac.th', 'อ.ฐิตาพร แก้วบุญชู', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-039', 'อ.ดร.ฐาปกรณ์ เรือนใจ', 'Lecturer', 'Thapakorn.rua@mfu.ac.th', 'อ.ดร.ฐาปกรณ์ เรือนใจ', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-041', 'อ.ธนัชพร มุลิกะบุตร', 'Lecturer', 'thanatchaporn.mul@mfu.ac.th', 'อ.ธนัชพร มุลิกะบุตร', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-042', 'อ.รติภาคย์ ตามรภาค', 'Lecturer', 'ratipark.tam@mfu.ac.th', 'อ.รติภาคย์ ตามรภาค', 'PH', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-043', 'ผศ.สุภาพร อุตสาหะ', 'Assistant Professor', 'suphaphorn.uts@mfu.ac.th', 'ผศ.สุภาพร อุตสาหะ', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-044', 'ผศ.อนุสรณ์ อุดปล้อง', 'Assistant Professor', 'anusorn.udp@mfu.ac.th', 'ผศ.อนุสรณ์ อุดปล้อง', 'PH', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-045', 'นางพรพิมล สุภาวรรณ์', 'Support Staff', 'pornpimon.suy@mfu.ac.th', 'นางพรพิมล สุภาวรรณ์', 'SHS Office', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-046', 'นางสาวณัฐกาญจน์ หมื่นตื้อ', 'Support Staff', 'nutthakarn.mue@mfu.ac.th', 'นางสาวณัฐกาญจน์ หมื่นตื้อ', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-047', 'นางสาวทัณฑิกา สินใจ', 'Support Staff', 'tantika.sin@mfu.ac.th', 'นางสาวทัณฑิกา สินใจ', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-048', 'นางสาวนิภา เสมอใจ', 'Support Staff', 'nipa.sam@mfu.ac.th', 'นางสาวนิภา เสมอใจ', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-049', 'นางสาวสุวพร วงศ์ปาน', 'Support Staff', 'suwaphorn.won@mfu.ac.th', 'นางสาวสุวพร วงศ์ปาน', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 10:52:00'),
('fac-050', 'นายชินโชติ ทิพยศรี', 'Support Staff', 'chinnachote.thi@mfu.ac.th', 'นายชินโชติ ทิพยศรี', 'SHS Office', 'active', 'admin', '2026-07-01 08:40:29', '2026-07-01 08:40:29'),
('fac-051', 'นางสาวณัฐธิดา มหาวงศนันท์', 'Support Staff', 'nuttida.mah@mfu.ac.th', 'นางสาวณัฐธิดา มหาวงศนันท์', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-052', 'นายอภิวัฒน์ ไชยบุญมา', 'Support Staff', 'apiwat.cha@mfu.ac.th', 'นายอภิวัฒน์ ไชยบุญมา', 'SHS Office', 'active', 'committee', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-053', 'นางสาวสุภาพร ตะติ', 'Support Staff', 'suparpon.tat@mfu.ac.th', 'นางสาวสุภาพร ตะติ', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-054', 'นางสาวพรนภัส เพ็งแก้ว', 'Support Staff', 'pornnaphat.pen@mfu.ac.th', 'นางสาวพรนภัส เพ็งแก้ว', 'SHS Office', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-055', 'อ.ดร.ชุตินันท์ สุขสอาด', 'Lecturer', 'chutinan.suk@mfu.ac.th', 'อ.ดร.ชุตินันท์ สุขสอาด', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-056', 'อ.ดร.ปวีณ วิยาภรณ์', 'Lecturer', 'paween.wiy@mfu.ac.th', 'อ.ดร.ปวีณ วิยาภรณ์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-057', 'ผศ.ดร.ธีรศักดิ์ บุญวัง', 'Assistant Professor', 'theerasak.boo@mfu.ac.th', 'ผศ.ดร.ธีรศักดิ์ บุญวัง', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-058', 'ผศ.ดร.ศศิมา พกุลานนท์', 'Assistant Professor', 'sasima.pak@mfu.ac.th', 'ผศ.ดร.ศศิมา พกุลานนท์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-059', 'อ.ดร.วรเชษฐ์ จันติยะ', 'Lecturer', 'vorachet.jun@mfu.ac.th', 'อ.ดร.วรเชษฐ์ จันติยะ', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-060', 'อ.ดร.ศราวิน เทพสถิตย์ภรณ์', 'Lecturer', 'sarawin.the@mfu.ac.th', 'อ.ดร.ศราวิน เทพสถิตย์ภรณ์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-061', 'อ.ธาม ไทยานนท์', 'Lecturer', 'tham.tha@mfu.ac.th', 'อ.ธาม ไทยานนท์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-062', 'อ.พิชชาภา คนธสิงห์', 'Lecturer', 'phitchapa.kon@mfu.ac.th', 'อ.พิชชาภา คนธสิงห์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-063', 'อ.ภานุพงศ์ ภัทรเชาว์', 'Lecturer', 'panupong.pat@mfu.ac.th', 'อ.ภานุพงศ์ ภัทรเชาว์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-064', 'อ.รฐกร เอมโกษา', 'Lecturer', 'ratakorn.aim@mfu.ac.th', 'อ.รฐกร เอมโกษา', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09'),
('fac-065', 'อ.ธันชนก ทองอินทร์', 'Lecturer', 'thunchanok.tho@mfu.ac.th', 'อ.ธันชนก ทองอินทร์', 'Sport Science', 'active', 'viewer', '2026-07-01 08:40:29', '2026-08-13 09:16:09');

-- --------------------------------------------------------

--
-- Table structure for table `formula`
--

CREATE TABLE `formula` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `expression` text NOT NULL,
  `current_version` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `formula`
--

INSERT INTO `formula` (`id`, `name`, `expression`, `current_version`, `created_at`, `updated_at`) VALUES
(1, 'Graduation Rate', '(G / E) * 100', 'v2.6', '2026-07-03 08:56:00', '2026-07-03 09:07:22'),
(2, 'Licensure Pass Rate', '(P / A) * 100', 'v1.2', '2026-07-03 08:56:00', '2026-07-03 08:56:00'),
(3, 'Research Productivity Index', '(Pub * 2 + Cit / 10 + Grant / 100000) / F', 'v3.1', '2026-07-03 08:56:00', '2026-07-03 08:56:00'),
(4, 'Post-Grad Employment Rate', '(Emp / (Grad - Cont)) * 100', 'v2.0', '2026-07-03 08:56:00', '2026-07-03 08:56:00');

-- --------------------------------------------------------

--
-- Table structure for table `formula_variable`
--

CREATE TABLE `formula_variable` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `formula_id` bigint(20) UNSIGNED NOT NULL,
  `symbol` varchar(40) NOT NULL,
  `label` varchar(255) NOT NULL,
  `source` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `formula_variable`
--

INSERT INTO `formula_variable` (`id`, `formula_id`, `symbol`, `label`, `source`) VALUES
(1, 1, 'G', 'Graduates within 150% time', 'Registrar · cohort completion'),
(2, 1, 'E', 'Entering cohort', 'Admissions · enrollment census'),
(3, 2, 'P', 'First-attempt passes', 'Licensing board feed'),
(4, 2, 'A', 'First-attempt sitters', 'Licensing board feed'),
(5, 3, 'Pub', 'Publications', 'Scopus'),
(6, 3, 'Cit', 'Citations', 'Scopus'),
(7, 3, 'Grant', 'Grant THB', 'Research office'),
(8, 3, 'F', 'FTE faculty', 'HR roster'),
(9, 4, 'Emp', 'Employed in field @6mo', 'Graduate survey'),
(10, 4, 'Grad', 'Total graduates', 'Registrar'),
(11, 4, 'Cont', 'Continuing education', 'Graduate survey');

-- --------------------------------------------------------

--
-- Table structure for table `formula_version`
--

CREATE TABLE `formula_version` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `formula_id` bigint(20) UNSIGNED NOT NULL,
  `version` varchar(20) NOT NULL,
  `expression` text NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `change_note` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `formula_version`
--

INSERT INTO `formula_version` (`id`, `formula_id`, `version`, `expression`, `author`, `change_note`, `created_at`) VALUES
(1, 1, 'v2.4', '(G / E) * 100', 'Dr. Anchali Wong', 'Aligned denominator to 150%-time entering cohort.', '2024-11-02 02:12:00'),
(2, 1, 'v2.3', '(G / E0) * 100', 'Dr. Krit Saetang', 'Switched to census-date enrollment E0.', '2024-08-15 07:03:00'),
(3, 1, 'v2.2', '(G / E) * 100', 'Dr. Anchali Wong', 'Initial standardized definition.', '2024-03-21 04:40:00'),
(4, 2, 'v1.2', '(P / A) * 100', 'Dr. Nida Phuwadol', 'Restricted to first-attempt sitters only.', '2024-09-10 03:00:00'),
(5, 2, 'v1.1', '(P / A_all) * 100', 'Dr. Nida Phuwadol', 'Included all attempts (deprecated).', '2024-05-02 03:00:00'),
(6, 3, 'v3.1', '(Pub * 2 + Cit / 10 + Grant / 100000) / F', 'Dr. Krit Saetang', 'Re-weighted publications ×2.', '2024-10-18 09:22:00'),
(7, 3, 'v3.0', '(Pub + Cit / 10 + Grant / 100000) / F', 'Dr. Krit Saetang', 'Added grant THB normalization.', '2024-06-30 09:22:00'),
(8, 4, 'v2.0', '(Emp / (Grad - Cont)) * 100', 'Dr. Anchali Wong', 'Excluded continuing-education graduates from base.', '2024-07-12 01:30:00'),
(9, 1, 'v2.5', '(G / E) * 100 + 0', 'Dr. Anchali Wong', 'API test bump', '2026-07-03 09:07:02'),
(10, 1, 'v2.6', '(G / E) * 100', 'Dr. Krit Saetang', 'Reverted to v2.4.', '2026-07-03 09:07:22');

-- --------------------------------------------------------

--
-- Table structure for table `kpi_categories`
--

CREATE TABLE `kpi_categories` (
  `id` varchar(40) NOT NULL,
  `set_id` bigint(20) UNSIGNED DEFAULT NULL,
  `kpi_type` varchar(20) NOT NULL DEFAULT 'strategic',
  `name` varchar(255) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kpi_categories`
--

INSERT INTO `kpi_categories` (`id`, `set_id`, `kpi_type`, `name`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
('36', 1, 'strategic', '3-การเพิ่มรายได้จากการบริการวิชาการ', '3-เร่งรัดการเพิ่มรายได้จากการให้บริการวิชาการ', 3, '2026-07-02 08:45:15', '2026-08-06 09:01:20'),
('academic_services', 2, 'strategic', 'Academic Services', 'Academic Services', 3, '2026-07-09 09:53:41', '2026-07-09 09:53:41'),
('community_services', 1, 'strategic', '4-ชุมชนต้นแบบสุขภาพอย่างยั่งยืน', '4-ยกระดับความเข้มแข็งทางสุขภาพของชุมชนต้นแบบอย่างยั่งยืน', 4, '2026-07-02 09:25:30', '2026-08-06 09:01:24'),
('community_services_2', 2, 'strategic', 'Community Services', NULL, 4, '2026-07-09 09:53:41', '2026-07-09 09:53:41'),
('faculty_excellence', 1, 'strategic', '5-พัฒนาศักยภาพของบุคลากร', '5-เร่งรัดการพัฒนาศักยภาพของบุคลากร', 5, '2026-07-02 08:37:06', '2026-08-06 09:01:29'),
('faculty_excellence_2', 2, 'strategic', 'Faculty Excellence', 'Faculty qualifications and development.', 5, '2026-07-09 09:53:41', '2026-07-09 09:53:41'),
('internationalized', 1, 'strategic', '6-สร้างความร่วมมือระดับนานาชาติ', '6-สร้างความเข้มแข็งความร่วมมือระดับนานาชาติในมิติต่างๆ', 6, '2026-07-02 09:26:43', '2026-08-06 09:01:31'),
('internationalized_2', 2, 'strategic', 'Internationalized', 'Internationalized organization, research, student, and events.', 7, '2026-07-09 09:53:41', '2026-07-09 09:53:41'),
('operational_efficiency', 1, 'strategic', '7-เร่งรัดการพัฒนาระบบการจัดการความรู้', '7-เร่งรัดการพัฒนาระบบการจัดการความรู้ที่มุ่งสู่องค์กรแห่งการเรียนรู้', 7, '2026-07-02 08:37:06', '2026-08-06 09:01:34'),
('operational_efficiency_2', 2, 'strategic', 'Operational Efficiency', 'Ratios and resource utilisation.', 8, '2026-07-09 09:53:41', '2026-07-09 09:53:41'),
('research_output', 1, 'strategic', '2-งานวิจัยและนวัตกรรม', '2-เร่งรัดการสร้างผลงานวิจัยในระดับนานาชาติและนวัตกรรมสู่การใช้ประโยชน์เชิงสาธารณะ', 2, '2026-07-02 08:37:06', '2026-08-05 01:48:47'),
('research_output_2', 2, 'strategic', 'Research Output', 'Publications, grants and research productivity.', 2, '2026-07-09 09:53:41', '2026-07-09 09:53:41'),
('routine_area_1', 1, 'routine', 'ด้านที่ 1-การผลิตบัณฑิต', 'ด้านที่ 1-การผลิตบัณฑิต', 8, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('routine_area_2', 1, 'routine', 'ด้านที่ 2-ด้านการวิจัยและนวัตกรรม', 'ด้านที่ 2-การเสริมสร้างความเข้มแข็งด้านการวิจัย/นวัตกรรมด้านวิทยาศาสตร์สุขภาพ', 9, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('routine_area_3', 1, 'routine', 'ด้านที่ 3-การสร้างรายได้จากบริการวิชาการ', 'ด้านที่ 3-การสร้างรายได้จากบริการวิชาการ', 10, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('routine_area_4', 1, 'routine', 'ด้านที่ 4-การบริหารจัดการสำนักวิชาฯ', 'ด้านที่ 4-การบริหารจัดการสำนักวิชาฯ', 11, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('routine_area_5', 1, 'routine', 'ด้านที่ 5-สืบสานความคงอยู่ด้านศิลปวัฒนธรรม', 'ด้านที่ 5-สืบสานความคงอยู่ด้านศิลปวัฒนธรรมและความเป็นไทย', 12, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('routine_area_6', 1, 'routine', 'ด้านที่ 6-ด้านตลาด ลูกค้าสัมพันธ์ และความเป็นนานาชาติ', 'ด้านที่ 6-ด้านตลาด ลูกค้าสัมพันธ์ และความเป็นนานาชาติ', 13, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('routine_area_7', 1, 'routine', 'ด้านที่ 7-ระบบสารสนเทศเพื่อการตัดสินใจ', 'ด้านที่ 7-การพัฒนาระบบสารสนเทศเพื่อการตัดสินใจ', 14, '2026-08-06 08:29:39', '2026-08-06 09:01:34'),
('student_success', 1, 'strategic', '1-พัฒนาและบริหารจัดการหลักสูตร', '1-เร่งรัดการพัฒนาและบริหารจัดการหลักสูตรที่มีคุณภาพระดับสากลและตอบสนองความต้องการของตลาด', 1, '2026-07-02 08:37:06', '2026-08-05 01:48:46'),
('student_success_2', 2, 'strategic', 'Student Success', 'Graduation, licensure and post-grad outcomes.', 1, '2026-07-09 09:53:41', '2026-07-09 09:53:41');

-- --------------------------------------------------------

--
-- Table structure for table `kpi_type`
--

CREATE TABLE `kpi_type` (
  `id` varchar(20) NOT NULL,
  `kpi_type_name` varchar(50) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `applies_to_categories` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kpi_type`
--

INSERT INTO `kpi_type` (`id`, `kpi_type_name`, `sort_order`, `applies_to_categories`, `created_at`, `updated_at`) VALUES
('operational', 'Operational', 2, 0, '2026-08-06 08:29:38', '2026-08-06 08:29:38'),
('routine', 'Routine', 3, 1, '2026-08-06 08:29:38', '2026-08-06 08:29:38'),
('strategic', 'Strategic', 1, 1, '2026-08-06 08:29:38', '2026-08-06 08:29:38');

-- --------------------------------------------------------

--
-- Table structure for table `library_kpi`
--

CREATE TABLE `library_kpi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `set_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(40) DEFAULT NULL,
  `routine_category_id` varchar(40) DEFAULT NULL,
  `kpi_type` varchar(20) NOT NULL,
  `data_collect_method` varchar(500) DEFAULT NULL,
  `collection_period` enum('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  `data_source_url` varchar(1000) DEFAULT NULL,
  `committee_id` varchar(30) DEFAULT NULL,
  `person_in_charge_id` varchar(20) DEFAULT NULL,
  `weight` decimal(6,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) DEFAULT NULL,
  `five_year_target` decimal(14,4) DEFAULT NULL,
  `calculation_type` enum('weighted_sum','simple_average','percent_of_total','ratio_of_total','combined_percent','combined_ratio','custom_formula') NOT NULL DEFAULT 'weighted_sum',
  `calculation_logic` text DEFAULT NULL,
  `formula_id` bigint(20) UNSIGNED DEFAULT NULL,
  `threshold_green` decimal(14,4) DEFAULT NULL,
  `threshold_amber` decimal(14,4) DEFAULT NULL,
  `quarterly_target_mode` enum('divide_equally','use_annual') NOT NULL DEFAULT 'divide_equally',
  `variable1_name` varchar(255) DEFAULT NULL,
  `variable1_unit` varchar(50) DEFAULT NULL,
  `variable2_name` varchar(255) DEFAULT NULL,
  `variable2_unit` varchar(50) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `library_kpi`
--

INSERT INTO `library_kpi` (`id`, `set_id`, `name`, `description`, `category_id`, `routine_category_id`, `kpi_type`, `data_collect_method`, `collection_period`, `data_source_url`, `committee_id`, `person_in_charge_id`, `weight`, `unit`, `five_year_target`, `calculation_type`, `calculation_logic`, `formula_id`, `threshold_green`, `threshold_amber`, `quarterly_target_mode`, `variable1_name`, `variable1_unit`, `variable2_name`, `variable2_unit`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'O2-2 จำนวนนวัตกรรม อนุสิทธิบัตร สิทธิบัตร และสิ่งประดิษฐ์', 'จำนวนนวัตกรรม อนุสิทธิบัตร สิทธิบัตร และสิ่งประดิษฐ์  Number of new Innovation patient and invention within each fiscal year. Use MFU criterions for determining innovation patient and invention.', 'research_output', NULL, 'operational', 'SYNC-TEST-METHOD', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-004', 100.00, 'Item', 40.0000, 'weighted_sum', NULL, NULL, 80.0000, 60.0000, 'divide_equally', 'จำนวนนวัตกรรม อนุสิทธิบัตร สิทธิบัตร และสิ่งประดิษฐ์ ทั้งหมด', 'Item', NULL, NULL, 1, '2026-07-03 07:42:23', '2026-08-04 07:22:07'),
(2, 2, 'Clinical Placement Rate', NULL, NULL, 'routine_area_3', 'operational', NULL, 'every_quarter', NULL, NULL, NULL, 10.00, '%', 100.0000, 'weighted_sum', NULL, NULL, 80.0000, 60.0000, 'divide_equally', 'Placements secured', 'Item', NULL, NULL, 1, '2026-07-03 07:53:02', '2026-08-06 08:32:32'),
(3, 1, 'K1-4 ร้อยละของนักศึกษารับเข้าเทียบเป้าหมาย', 'Percentage of enrolled students compared to the target ร้อยละของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', NULL, 'strategic', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-022', 100.00, 'Percent', 100.0000, 'percent_of_total', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'จำนวนนักศึกษาขึ้นทะเบียนจริง', 'Persons', 'จำนวนตามแผนรับนักศึกษา', 'Persons', 2, '2026-07-06 05:42:47', '2026-07-30 10:44:27'),
(4, 1, 'O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', NULL, 'operational', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', 'fac-022', 100.00, 'Percent', 50.0000, 'percent_of_total', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'Programs at AUN-QA L4', 'Item', 'Total 9 Curriculums', 'Item', 3, '2026-07-06 11:37:39', '2026-07-31 00:33:07'),
(5, 1, 'K1-1 ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี เก็บข้อมูลเฉพาะระดับปริญญาตรี', 'student_success', NULL, 'strategic', 'Bi report', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'combined_percent', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'จำนวนนักศึกษาที่ได้งานทำใน 1 ปี', 'Persons', 'จำนวนนักศึกษาทั้งหมดที่จบการศึกษาในปีนั้น', 'Persons', 4, '2026-07-08 12:22:54', '2026-07-30 16:55:19'),
(11, 1, 'K2-1 สัดส่วนผลงานวืจัยที่ได้รับการตีพิมพ์ในระดับนานาชาตื (Scopus Q1-Q2) ต่ออาจารย์', 'K2-1 สัดส่วนผลงานวืจัยที่ได้รับการตีพิมพ์ในระดับนานาชาตื (Scopus Q1-Q2) ต่ออาจารย์', 'research_output', NULL, 'strategic', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Ratio', 1.0000, 'ratio_of_total', NULL, NULL, 85.0000, 60.0000, 'use_annual', 'number of research articles (Scopus Q1-Q2)', 'Item', 'Total number of faculty member', 'Persons', 5, '2026-07-19 10:38:22', '2026-07-30 11:07:15'),
(12, 1, 'R2-10 Number of research publications in international journals (Scopus)', NULL, 'research_output', 'routine_area_2', 'routine', NULL, 'every_quarter', NULL, 'cmt-research-ethics', 'fac-004', 100.00, 'Item', 55.0000, 'weighted_sum', NULL, NULL, 100.0000, 60.0000, 'divide_equally', 'Variable 1', 'Item', NULL, NULL, 6, '2026-07-19 11:36:24', '2026-08-06 09:02:06'),
(13, 1, 'K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ เฉพาะระดับปริญญาตรี', 'student_success', NULL, 'strategic', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'combined_percent', NULL, NULL, 90.0000, 60.0000, 'use_annual', 'จำนวนนักศึกษาที่ทำงานในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'Persons', 'จำนวนนักศึกษาที่สำเร็จการศึกษาในปีนั้น', 'Persons', 7, '2026-07-30 03:15:45', '2026-07-30 16:55:19'),
(14, 1, 'K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูล SCOPUS', 'student_success', NULL, 'strategic', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'percent_of_total', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'ผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูล SCOPUS', 'Item', 'ผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูลทั้งหมด', 'Item', 8, '2026-07-30 07:36:22', '2026-07-30 07:38:55'),
(22, 1, 'K1-5', NULL, 'student_success', NULL, 'strategic', NULL, 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 45.0000, 'weighted_sum', NULL, NULL, 100.0000, 70.0000, 'divide_equally', 'Test', 'Item', NULL, NULL, 9, '2026-08-07 15:57:17', '2026-08-07 15:58:47'),
(23, 1, 'K1-6', NULL, 'student_success', NULL, 'strategic', NULL, 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 100.0000, 'weighted_sum', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'test', 'Item', NULL, NULL, 10, '2026-08-07 15:59:08', '2026-08-07 16:00:03'),
(24, 1, 'K1-7', NULL, 'student_success', NULL, 'strategic', NULL, 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 70.0000, 'percent_of_total', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'test1', 'Item', 'test2', 'Item', 11, '2026-08-07 16:00:27', '2026-08-07 16:01:25');

-- --------------------------------------------------------

--
-- Table structure for table `library_kpi_annual_target`
--

CREATE TABLE `library_kpi_annual_target` (
  `kpi_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `target_value` decimal(14,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `library_kpi_annual_target`
--

INSERT INTO `library_kpi_annual_target` (`kpi_id`, `year_no`, `target_value`) VALUES
(1, 1, 20.0000),
(1, 2, 25.0000),
(1, 3, 30.0000),
(1, 4, 35.0000),
(1, 5, 40.0000),
(2, 1, 15.0000),
(2, 2, 18.0000),
(2, 3, 20.0000),
(2, 4, 22.0000),
(2, 5, 25.0000),
(3, 1, 100.0000),
(3, 2, 100.0000),
(3, 3, 100.0000),
(3, 4, 100.0000),
(3, 5, 100.0000),
(4, 1, 10.0000),
(4, 2, 20.0000),
(4, 3, 30.0000),
(4, 4, 40.0000),
(4, 5, 50.0000),
(5, 1, 70.0000),
(5, 2, 75.0000),
(5, 3, 80.0000),
(5, 4, 85.0000),
(5, 5, 90.0000),
(11, 1, 0.2500),
(11, 2, 0.2500),
(11, 3, 0.5000),
(11, 4, 0.7500),
(11, 5, 1.0000),
(12, 1, 40.0000),
(12, 2, 40.0000),
(12, 3, 45.0000),
(12, 4, 50.0000),
(12, 5, 55.0000),
(13, 1, 20.0000),
(13, 2, 35.0000),
(13, 3, 30.0000),
(13, 4, 35.0000),
(13, 5, 40.0000),
(14, 1, 80.0000),
(14, 2, 85.0000),
(14, 3, 90.0000),
(14, 4, 95.0000),
(14, 5, 100.0000),
(22, 1, 25.0000),
(22, 2, 30.0000),
(22, 3, 35.0000),
(22, 4, 40.0000),
(22, 5, 45.0000),
(23, 1, 25.0000),
(23, 2, 35.0000),
(23, 3, 65.0000),
(23, 4, 85.0000),
(23, 5, 100.0000),
(24, 1, 50.0000),
(24, 2, 55.0000),
(24, 3, 60.0000),
(24, 4, 65.0000),
(24, 5, 70.0000);

-- --------------------------------------------------------

--
-- Table structure for table `library_metric`
--

CREATE TABLE `library_metric` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kpi_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(40) DEFAULT NULL,
  `data_collect_method` varchar(500) DEFAULT NULL,
  `collection_period` enum('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  `data_source_url` varchar(1000) DEFAULT NULL,
  `committee_id` varchar(30) DEFAULT NULL,
  `person_in_charge_id` varchar(20) DEFAULT NULL,
  `weight` decimal(6,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) DEFAULT NULL,
  `five_year_target` decimal(14,4) DEFAULT NULL,
  `target_mode` enum('none','inherit_parent','manual') NOT NULL DEFAULT 'manual',
  `threshold_green` decimal(14,4) DEFAULT NULL,
  `threshold_amber` decimal(14,4) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `library_metric`
--

INSERT INTO `library_metric` (`id`, `kpi_id`, `name`, `description`, `category_id`, `data_collect_method`, `collection_period`, `data_source_url`, `committee_id`, `person_in_charge_id`, `weight`, `unit`, `five_year_target`, `target_mode`, `threshold_green`, `threshold_amber`, `sort_order`, `created_at`, `updated_at`) VALUES
(2, 2, 'Placements confirmed', NULL, NULL, NULL, 'every_quarter', NULL, NULL, NULL, 10.00, '%', 50.0000, 'manual', NULL, NULL, 1, '2026-07-03 07:53:02', '2026-07-03 07:53:02'),
(3, 1, 'Number of Innovation', 'Number of Innovation, definition according to MFU', 'research_output', 'self-report from SHS staff', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 'none', 25.0000, 15.0000, 2, '2026-07-03 08:41:40', '2026-07-04 14:16:53'),
(4, 1, 'Number of Patent', 'Number of Patent, definition according to MFU', 'research_output', 'self-report from SHS staff', 'Q4', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 'none', 3.0000, 2.0000, 3, '2026-07-03 08:45:52', '2026-07-04 14:21:16'),
(5, 1, 'Number of Invention', 'Number of Invention, definition according to MFU', 'research_output', 'self-report by SHS staff', 'every_quarter', NULL, 'cmt-student-alumni', 'fac-045', 100.00, 'Item', 0.0000, 'none', 3.0000, 2.0000, 4, '2026-07-03 08:48:54', '2026-07-04 14:21:32'),
(7, 3, 'OHS-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'OHS-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU BI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-018', 100.00, 'Persons', 60.0000, 'manual', 60.0000, 40.0000, 1, '2026-07-06 05:48:52', '2026-07-30 10:42:24'),
(8, 3, 'PH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU BI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-042', 100.00, 'Persons', 90.0000, 'manual', 90.0000, 50.0000, 2, '2026-07-06 05:49:52', '2026-07-30 10:42:39'),
(9, 3, 'EnvH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'EnvH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU bi', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-010', 100.00, 'Persons', 60.0000, 'manual', 60.0000, 40.0000, 3, '2026-07-06 09:40:55', '2026-07-30 10:42:51'),
(10, 3, 'Sports-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'Sports-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU bi', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-058', 100.00, 'Persons', 90.0000, 'manual', 90.0000, 60.0000, 4, '2026-07-06 09:42:12', '2026-07-30 10:43:12'),
(18, 5, 'PHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'PHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'inherit_parent', 90.0000, 60.0000, 1, '2026-07-09 04:36:57', '2026-07-30 05:34:36'),
(21, 5, 'SHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'SHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'inherit_parent', 90.0000, 60.0000, 4, '2026-07-09 04:36:58', '2026-07-30 05:34:42'),
(23, 5, 'OHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'OHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'inherit_parent', 90.0000, 60.0000, 6, '2026-07-09 04:36:58', '2026-07-30 05:34:49'),
(24, 5, 'EnvHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'EnvHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'inherit_parent', 90.0000, 60.0000, 7, '2026-07-09 04:36:58', '2026-07-30 05:34:58'),
(44, 1, 'Number of Petty Patent', 'Number of Petty Patent', 'research_output', 'SYNC-TEST-METHOD', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 'none', 3.0000, 2.0000, 5, '2026-07-19 04:03:34', '2026-07-19 06:00:12'),
(45, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Tier-1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Tier-1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 1, '2026-07-19 11:28:29', '2026-07-30 11:01:00'),
(46, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 2, '2026-07-19 11:28:52', '2026-07-30 11:01:40'),
(47, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q2', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q2', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 3, '2026-07-19 11:29:05', '2026-07-30 11:01:53'),
(48, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q3', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q3', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 4, '2026-07-19 11:29:18', '2026-07-30 11:02:15'),
(49, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q4', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q4', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 5, '2026-07-19 11:29:48', '2026-07-30 11:02:57'),
(50, 12, 'Number of Q1-tier1', 'Number of Q1-tier1', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 1, '2026-07-19 13:25:48', '2026-07-19 13:25:48'),
(51, 12, 'Number of Q1', 'Number of Q1', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 2, '2026-07-19 13:26:14', '2026-07-19 13:26:14'),
(52, 12, 'Number of Q2', 'Number of Q2', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 3, '2026-07-19 13:26:36', '2026-07-19 13:26:36'),
(53, 12, 'Number of Q3', 'Number of Q3', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 4, '2026-07-19 13:26:56', '2026-07-19 13:26:56'),
(54, 12, 'Number of Q4', 'Number of Q4', 'research_output', 'Scopus', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, 'none', NULL, NULL, 5, '2026-07-19 13:27:09', '2026-07-19 13:27:09'),
(55, 13, 'PHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'PHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'inherit_parent', 90.0000, 60.0000, 1, '2026-07-30 03:20:33', '2026-07-30 03:21:31'),
(58, 13, 'SHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'SHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'inherit_parent', 90.0000, 60.0000, 4, '2026-07-30 03:20:34', '2026-07-30 03:21:48'),
(60, 13, 'OHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'OHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'inherit_parent', 90.0000, 60.0000, 6, '2026-07-30 03:20:34', '2026-07-30 03:22:03'),
(61, 13, 'EnvHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'EnvHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'inherit_parent', 90.0000, 60.0000, 7, '2026-07-30 03:20:34', '2026-07-30 03:22:15'),
(65, 14, 'PHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'PHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'inherit_parent', 80.0000, 50.0000, 2, '2026-07-30 07:38:59', '2026-07-30 07:40:30'),
(66, 14, 'PHD-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'PHD-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'inherit_parent', 80.0000, 50.0000, 3, '2026-07-30 07:38:59', '2026-07-30 07:40:35'),
(68, 14, 'SHSM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'inherit_parent', 80.0000, 50.0000, 5, '2026-07-30 07:38:59', '2026-07-30 07:40:39'),
(71, 14, 'EnvHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'inherit_parent', 80.0000, 50.0000, 8, '2026-07-30 07:39:00', '2026-07-30 07:40:19'),
(72, 14, 'BMM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'inherit_parent', 80.0000, 50.0000, 9, '2026-07-30 07:39:00', '2026-07-30 07:40:25'),
(74, 3, 'PHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 'manual', 20.0000, 5.0000, 6, '2026-07-30 10:44:31', '2026-07-30 10:45:59'),
(75, 3, 'PHD-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PHD-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 10.0000, 'manual', 10.0000, 5.0000, 7, '2026-07-30 10:44:31', '2026-07-30 10:46:33'),
(77, 3, 'SHSM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'SHSM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 'manual', 15.0000, 5.0000, 9, '2026-07-30 10:44:32', '2026-07-30 10:47:40'),
(80, 3, 'EnvHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'EnvHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 'manual', 20.0000, 5.0000, 12, '2026-07-30 10:44:32', '2026-07-30 10:48:04'),
(81, 3, 'BMM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'BMM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 'manual', 20.0000, 5.0000, 13, '2026-07-30 10:44:32', '2026-07-30 10:48:41'),
(82, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, 'none', NULL, NULL, 6, '2026-07-30 11:03:24', '2026-07-30 11:03:24'),
(83, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI2', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI2', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, 'none', NULL, NULL, 7, '2026-07-30 11:03:36', '2026-07-30 11:03:36'),
(84, 11, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI3', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI3', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, 'none', NULL, NULL, 8, '2026-07-30 11:03:46', '2026-07-30 11:03:46'),
(85, 4, 'PHB-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'PHB-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 'manual', 1.0000, 0.0000, 1, '2026-07-31 00:33:11', '2026-07-31 00:36:33'),
(86, 4, 'PHM-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'PHM-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 'manual', 1.0000, 0.0000, 2, '2026-07-31 00:33:11', '2026-07-31 00:37:15'),
(87, 4, 'PHD-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 'manual', 1.0000, 0.0000, 3, '2026-07-31 00:33:11', '2026-07-31 00:37:34'),
(88, 4, 'SHSB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, 'manual', NULL, NULL, 4, '2026-07-31 00:33:11', '2026-07-31 00:33:11'),
(89, 4, 'SHSM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, 'manual', NULL, NULL, 5, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(90, 4, 'OHSB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, 'manual', NULL, NULL, 6, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(91, 4, 'EnvHB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, 'manual', NULL, NULL, 7, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(92, 4, 'EnvHM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, 'manual', NULL, NULL, 8, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(93, 4, 'BMM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, 'manual', NULL, NULL, 9, '2026-07-31 00:33:12', '2026-07-31 00:33:12');

-- --------------------------------------------------------

--
-- Table structure for table `library_metric_annual_target`
--

CREATE TABLE `library_metric_annual_target` (
  `metric_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `target_value` decimal(14,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `library_metric_annual_target`
--

INSERT INTO `library_metric_annual_target` (`metric_id`, `year_no`, `target_value`) VALUES
(2, 1, 8.0000),
(2, 2, 10.0000),
(2, 3, NULL),
(2, 4, NULL),
(2, 5, NULL),
(3, 1, 0.0000),
(3, 2, 0.0000),
(3, 3, 0.0000),
(3, 4, 0.0000),
(3, 5, 0.0000),
(4, 1, 0.0000),
(4, 2, 0.0000),
(4, 3, 0.0000),
(4, 4, 0.0000),
(4, 5, 0.0000),
(5, 1, 0.0000),
(5, 2, 0.0000),
(5, 3, 0.0000),
(5, 4, 0.0000),
(5, 5, 0.0000),
(7, 1, 60.0000),
(7, 2, 60.0000),
(7, 3, 60.0000),
(7, 4, 60.0000),
(7, 5, 60.0000),
(8, 1, 90.0000),
(8, 2, 90.0000),
(8, 3, 90.0000),
(8, 4, 90.0000),
(8, 5, 90.0000),
(9, 1, 60.0000),
(9, 2, 60.0000),
(9, 3, 60.0000),
(9, 4, 60.0000),
(9, 5, 60.0000),
(10, 1, 90.0000),
(10, 2, 90.0000),
(10, 3, 90.0000),
(10, 4, 90.0000),
(10, 5, 90.0000),
(18, 1, 70.0000),
(18, 2, 75.0000),
(18, 3, 80.0000),
(18, 4, 85.0000),
(18, 5, 90.0000),
(21, 1, 70.0000),
(21, 2, 75.0000),
(21, 3, 80.0000),
(21, 4, 85.0000),
(21, 5, 90.0000),
(23, 1, 70.0000),
(23, 2, 75.0000),
(23, 3, 80.0000),
(23, 4, 85.0000),
(23, 5, 90.0000),
(24, 1, 70.0000),
(24, 2, 75.0000),
(24, 3, 80.0000),
(24, 4, 85.0000),
(24, 5, 90.0000),
(44, 1, 0.0000),
(44, 2, 0.0000),
(44, 3, 0.0000),
(44, 4, 0.0000),
(44, 5, 0.0000),
(45, 1, 0.0000),
(45, 2, 0.0000),
(45, 3, 0.0000),
(45, 4, 0.0000),
(45, 5, 0.0000),
(46, 1, 0.0000),
(46, 2, 0.0000),
(46, 3, 0.0000),
(46, 4, 0.0000),
(46, 5, 0.0000),
(47, 1, 0.0000),
(47, 2, 0.0000),
(47, 3, 0.0000),
(47, 4, 0.0000),
(47, 5, 0.0000),
(48, 1, 0.0000),
(48, 2, 0.0000),
(48, 3, 0.0000),
(48, 4, 0.0000),
(48, 5, 0.0000),
(49, 1, 0.0000),
(49, 2, 0.0000),
(49, 3, 0.0000),
(49, 4, 0.0000),
(49, 5, 0.0000),
(50, 1, 0.0000),
(50, 2, 0.0000),
(50, 3, 0.0000),
(50, 4, 0.0000),
(50, 5, 0.0000),
(51, 1, 0.0000),
(51, 2, 0.0000),
(51, 3, 0.0000),
(51, 4, 0.0000),
(51, 5, 0.0000),
(52, 1, 0.0000),
(52, 2, 0.0000),
(52, 3, 0.0000),
(52, 4, 0.0000),
(52, 5, 0.0000),
(53, 1, 0.0000),
(53, 2, 0.0000),
(53, 3, 0.0000),
(53, 4, 0.0000),
(53, 5, 0.0000),
(54, 1, 0.0000),
(54, 2, 0.0000),
(54, 3, 0.0000),
(54, 4, 0.0000),
(54, 5, 0.0000),
(55, 1, 20.0000),
(55, 2, 35.0000),
(55, 3, 30.0000),
(55, 4, 35.0000),
(55, 5, 40.0000),
(58, 1, 20.0000),
(58, 2, 35.0000),
(58, 3, 30.0000),
(58, 4, 35.0000),
(58, 5, 40.0000),
(60, 1, 20.0000),
(60, 2, 35.0000),
(60, 3, 30.0000),
(60, 4, 35.0000),
(60, 5, 40.0000),
(61, 1, 20.0000),
(61, 2, 35.0000),
(61, 3, 30.0000),
(61, 4, 35.0000),
(61, 5, 40.0000),
(65, 1, 80.0000),
(65, 2, 85.0000),
(65, 3, 90.0000),
(65, 4, 95.0000),
(65, 5, 100.0000),
(66, 1, 80.0000),
(66, 2, 85.0000),
(66, 3, 90.0000),
(66, 4, 95.0000),
(66, 5, 100.0000),
(68, 1, 80.0000),
(68, 2, 85.0000),
(68, 3, 90.0000),
(68, 4, 95.0000),
(68, 5, 100.0000),
(71, 1, 80.0000),
(71, 2, 85.0000),
(71, 3, 90.0000),
(71, 4, 95.0000),
(71, 5, 100.0000),
(72, 1, 80.0000),
(72, 2, 85.0000),
(72, 3, 90.0000),
(72, 4, 95.0000),
(72, 5, 100.0000),
(74, 1, 5.0000),
(74, 2, 10.0000),
(74, 3, 15.0000),
(74, 4, 20.0000),
(74, 5, 20.0000),
(75, 1, 5.0000),
(75, 2, 10.0000),
(75, 3, 10.0000),
(75, 4, 10.0000),
(75, 5, 10.0000),
(77, 1, 0.0000),
(77, 2, 0.0000),
(77, 3, 5.0000),
(77, 4, 10.0000),
(77, 5, 15.0000),
(80, 1, 0.0000),
(80, 2, 5.0000),
(80, 3, 10.0000),
(80, 4, 15.0000),
(80, 5, 20.0000),
(81, 1, 5.0000),
(81, 2, 10.0000),
(81, 3, 15.0000),
(81, 4, 15.0000),
(81, 5, 20.0000),
(82, 1, 0.0000),
(82, 2, 0.0000),
(82, 3, 0.0000),
(82, 4, 0.0000),
(82, 5, 0.0000),
(83, 1, 0.0000),
(83, 2, 0.0000),
(83, 3, 0.0000),
(83, 4, 0.0000),
(83, 5, 0.0000),
(84, 1, 0.0000),
(84, 2, 0.0000),
(84, 3, 0.0000),
(84, 4, 0.0000),
(84, 5, 0.0000),
(85, 1, 1.0000),
(85, 2, 1.0000),
(85, 3, 1.0000),
(85, 4, 1.0000),
(85, 5, 1.0000),
(86, 1, 1.0000),
(86, 2, 1.0000),
(86, 3, 1.0000),
(86, 4, 1.0000),
(86, 5, 1.0000),
(87, 1, 1.0000),
(87, 2, 1.0000),
(87, 3, 1.0000),
(87, 4, 1.0000),
(87, 5, 1.0000);

-- --------------------------------------------------------

--
-- Table structure for table `performance_record`
--

CREATE TABLE `performance_record` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `source_set_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_year` smallint(6) NOT NULL,
  `end_year` smallint(6) GENERATED ALWAYS AS (`start_year` + 4) STORED,
  `status` enum('active','inactive','completed') NOT NULL DEFAULT 'active',
  `activated_by` varchar(255) DEFAULT NULL,
  `activated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_synced_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `performance_record`
--

INSERT INTO `performance_record` (`id`, `source_set_id`, `name`, `start_year`, `status`, `activated_by`, `activated_at`, `last_synced_at`, `updated_at`) VALUES
(1, 1, 'SHS Strategic Set 2565-2569 — Performance', 2568, 'inactive', 'admin@mfu.ac.th', '2026-07-03 10:11:14', '2026-07-31 00:37:34', '2026-07-31 08:01:00'),
(2, 1, 'SHS strategic 2565-2569 -Performance 2', 2565, 'active', 'admin@mfu.ac.th', '2026-07-04 04:41:51', '2026-08-07 16:01:25', '2026-08-07 16:01:25');

-- --------------------------------------------------------

--
-- Table structure for table `performance_record_period`
--

CREATE TABLE `performance_record_period` (
  `record_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `quarter_no` tinyint(3) UNSIGNED NOT NULL CHECK (`quarter_no` between 1 and 4),
  `is_open` tinyint(1) NOT NULL DEFAULT 0,
  `opened_by` varchar(255) DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `performance_record_period`
--

INSERT INTO `performance_record_period` (`record_id`, `year_no`, `quarter_no`, `is_open`, `opened_by`, `opened_at`, `updated_by`, `updated_at`) VALUES
(1, 1, 1, 0, 'test', '2026-07-06 16:13:58', NULL, '2026-07-06 16:14:18'),
(2, 1, 1, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 1, 2, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 1, 3, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 1, 4, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 2, 1, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 2, 2, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 2, 3, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 2, 4, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 3, 1, 0, 'admin@mfu.ac.th', '2026-07-19 03:58:25', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 3, 2, 0, 'admin@mfu.ac.th', '2026-07-19 03:58:25', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 3, 3, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 3, 4, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 4, 1, 0, 'admin@mfu.ac.th', '2026-07-19 03:58:25', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 4, 2, 0, 'admin@mfu.ac.th', '2026-07-19 03:58:25', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 4, 3, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 4, 4, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 5, 1, 0, NULL, NULL, 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 5, 2, 0, NULL, NULL, 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 5, 3, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46'),
(2, 5, 4, 1, 'admin@mfu.ac.th', '2026-07-31 09:38:46', 'admin@mfu.ac.th', '2026-07-31 09:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `perf_kpi`
--

CREATE TABLE `perf_kpi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `record_id` bigint(20) UNSIGNED NOT NULL,
  `source_kpi_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(40) DEFAULT NULL,
  `routine_category_id` varchar(40) DEFAULT NULL,
  `kpi_type` varchar(20) NOT NULL,
  `data_collect_method` varchar(500) DEFAULT NULL,
  `collection_period` enum('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  `data_source_url` varchar(1000) DEFAULT NULL,
  `committee_id` varchar(30) DEFAULT NULL,
  `person_in_charge_id` varchar(20) DEFAULT NULL,
  `weight` decimal(6,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) DEFAULT NULL,
  `five_year_target` decimal(14,4) DEFAULT NULL,
  `calculation_type` enum('weighted_sum','simple_average','percent_of_total','ratio_of_total','combined_percent','combined_ratio','custom_formula') NOT NULL DEFAULT 'weighted_sum',
  `calculation_logic` text DEFAULT NULL,
  `formula_id` bigint(20) UNSIGNED DEFAULT NULL,
  `threshold_green` decimal(14,4) DEFAULT NULL,
  `threshold_amber` decimal(14,4) DEFAULT NULL,
  `quarterly_target_mode` enum('divide_equally','use_annual') NOT NULL DEFAULT 'divide_equally',
  `variable1_name` varchar(255) DEFAULT NULL,
  `variable1_unit` varchar(50) DEFAULT NULL,
  `variable2_name` varchar(255) DEFAULT NULL,
  `variable2_unit` varchar(50) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `has_children` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_kpi`
--

INSERT INTO `perf_kpi` (`id`, `record_id`, `source_kpi_id`, `name`, `description`, `category_id`, `routine_category_id`, `kpi_type`, `data_collect_method`, `collection_period`, `data_source_url`, `committee_id`, `person_in_charge_id`, `weight`, `unit`, `five_year_target`, `calculation_type`, `calculation_logic`, `formula_id`, `threshold_green`, `threshold_amber`, `quarterly_target_mode`, `variable1_name`, `variable1_unit`, `variable2_name`, `variable2_unit`, `sort_order`, `has_children`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Number of Innovation patent and inventions', 'Number of new Innovation patient and invention within each fiscal year. Use MFU criterions for determining innovation patient and invention.', 'research_output', NULL, 'operational', 'SYNC-TEST-METHOD', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-004', 100.00, 'Item', 40.0000, 'weighted_sum', NULL, NULL, 80.0000, 60.0000, 'divide_equally', NULL, NULL, NULL, NULL, 1, 1, '2026-07-03 10:11:14', '2026-07-19 10:47:48'),
(2, 2, 1, 'O2-2 จำนวนนวัตกรรม อนุสิทธิบัตร สิทธิบัตร และสิ่งประดิษฐ์', 'จำนวนนวัตกรรม อนุสิทธิบัตร สิทธิบัตร และสิ่งประดิษฐ์  Number of new Innovation patient and invention within each fiscal year. Use MFU criterions for determining innovation patient and invention.', 'research_output', NULL, 'operational', 'SYNC-TEST-METHOD', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-004', 100.00, 'Item', 40.0000, 'weighted_sum', NULL, NULL, 80.0000, 60.0000, 'divide_equally', 'จำนวนนวัตกรรม อนุสิทธิบัตร สิทธิบัตร และสิ่งประดิษฐ์ ทั้งหมด', 'Item', NULL, NULL, 1, 1, '2026-07-04 04:41:51', '2026-08-04 07:22:07'),
(3, 1, 3, 'K1-4 ร้อยละของนักศึกษารับเข้าเทียบเป้าหมาย', 'Percentage of enrolled students compared to the target ร้อยละของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', NULL, 'strategic', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-022', 100.00, 'Percent', 100.0000, 'percent_of_total', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'จำนวนนักศึกษาขึ้นทะเบียนจริง', 'Persons', 'จำนวนตามแผนรับนักศึกษา', 'Persons', 2, 1, '2026-07-06 05:42:47', '2026-07-30 10:44:27'),
(4, 2, 3, 'K1-4 ร้อยละของนักศึกษารับเข้าเทียบเป้าหมาย', 'Percentage of enrolled students compared to the target ร้อยละของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', NULL, 'strategic', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-022', 100.00, 'Percent', 100.0000, 'percent_of_total', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'จำนวนนักศึกษาขึ้นทะเบียนจริง', 'Persons', 'จำนวนตามแผนรับนักศึกษา', 'Persons', 2, 1, '2026-07-06 05:42:47', '2026-07-30 10:44:27'),
(5, 1, 4, 'O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', NULL, 'operational', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', 'fac-022', 100.00, 'Percent', 50.0000, 'percent_of_total', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'Programs at AUN-QA L4', 'Item', 'Total 9 Curriculums', 'Item', 3, 1, '2026-07-06 11:37:39', '2026-07-31 00:33:11'),
(6, 2, 4, 'O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', NULL, 'operational', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', 'fac-022', 100.00, 'Percent', 50.0000, 'percent_of_total', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'Programs at AUN-QA L4', 'Item', 'Total 9 Curriculums', 'Item', 3, 1, '2026-07-06 11:37:39', '2026-07-31 00:33:11'),
(7, 1, 5, 'K1-1 ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี เก็บข้อมูลเฉพาะระดับปริญญาตรี', 'student_success', NULL, 'strategic', 'Bi report', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'combined_percent', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'จำนวนนักศึกษาที่ได้งานทำใน 1 ปี', 'Persons', 'จำนวนนักศึกษาทั้งหมดที่จบการศึกษาในปีนั้น', 'Persons', 4, 1, '2026-07-08 12:22:55', '2026-07-30 16:55:19'),
(8, 2, 5, 'K1-1 ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี เก็บข้อมูลเฉพาะระดับปริญญาตรี', 'student_success', NULL, 'strategic', 'Bi report', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 'combined_percent', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'จำนวนนักศึกษาที่ได้งานทำใน 1 ปี', 'Persons', 'จำนวนนักศึกษาทั้งหมดที่จบการศึกษาในปีนั้น', 'Persons', 4, 1, '2026-07-08 12:22:55', '2026-07-30 16:55:19'),
(13, 1, 11, 'K2-1 สัดส่วนผลงานวืจัยที่ได้รับการตีพิมพ์ในระดับนานาชาตื (Scopus Q1-Q2) ต่ออาจารย์', 'K2-1 สัดส่วนผลงานวืจัยที่ได้รับการตีพิมพ์ในระดับนานาชาตื (Scopus Q1-Q2) ต่ออาจารย์', 'research_output', NULL, 'strategic', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Ratio', 1.0000, 'ratio_of_total', NULL, NULL, 85.0000, 60.0000, 'use_annual', 'number of research articles (Scopus Q1-Q2)', 'Item', 'Total number of faculty member', 'Persons', 5, 1, '2026-07-19 10:38:22', '2026-07-30 11:07:15'),
(14, 2, 11, 'K2-1 สัดส่วนผลงานวืจัยที่ได้รับการตีพิมพ์ในระดับนานาชาตื (Scopus Q1-Q2) ต่ออาจารย์', 'K2-1 สัดส่วนผลงานวืจัยที่ได้รับการตีพิมพ์ในระดับนานาชาตื (Scopus Q1-Q2) ต่ออาจารย์', 'research_output', NULL, 'strategic', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Ratio', 1.0000, 'ratio_of_total', NULL, NULL, 85.0000, 60.0000, 'use_annual', 'number of research articles (Scopus Q1-Q2)', 'Item', 'Total number of faculty member', 'Persons', 5, 1, '2026-07-19 10:38:22', '2026-07-30 11:07:15'),
(15, 1, 12, 'Number of research publications in international journals (Scopus)', NULL, 'research_output', NULL, 'routine', NULL, 'every_quarter', NULL, 'cmt-research-ethics', 'fac-004', 100.00, 'Item', 55.0000, 'weighted_sum', NULL, NULL, 100.0000, 60.0000, 'divide_equally', 'Variable 1', 'Item', NULL, NULL, 6, 1, '2026-07-19 11:36:24', '2026-07-30 08:09:43'),
(16, 2, 12, 'R2-10 Number of research publications in international journals (Scopus)', NULL, 'research_output', 'routine_area_2', 'routine', NULL, 'every_quarter', NULL, 'cmt-research-ethics', 'fac-004', 100.00, 'Item', 55.0000, 'weighted_sum', NULL, NULL, 100.0000, 60.0000, 'divide_equally', 'Variable 1', 'Item', NULL, NULL, 6, 1, '2026-07-19 11:36:24', '2026-08-06 09:02:06'),
(17, 1, 13, 'K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ เฉพาะระดับปริญญาตรี', 'student_success', NULL, 'strategic', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'combined_percent', NULL, NULL, 90.0000, 60.0000, 'use_annual', 'จำนวนนักศึกษาที่ทำงานในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'Persons', 'จำนวนนักศึกษาที่สำเร็จการศึกษาในปีนั้น', 'Persons', 7, 1, '2026-07-30 03:15:45', '2026-07-30 16:55:19'),
(18, 2, 13, 'K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ เฉพาะระดับปริญญาตรี', 'student_success', NULL, 'strategic', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 'combined_percent', NULL, NULL, 90.0000, 60.0000, 'use_annual', 'จำนวนนักศึกษาที่ทำงานในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'Persons', 'จำนวนนักศึกษาที่สำเร็จการศึกษาในปีนั้น', 'Persons', 7, 1, '2026-07-30 03:15:46', '2026-07-30 16:55:19'),
(19, 1, 14, 'K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูล SCOPUS', 'student_success', NULL, 'strategic', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'percent_of_total', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'ผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูล SCOPUS', 'Item', 'ผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูลทั้งหมด', 'Item', 8, 1, '2026-07-30 07:36:22', '2026-07-30 07:38:59'),
(20, 2, 14, 'K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูล SCOPUS', 'student_success', NULL, 'strategic', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 'percent_of_total', NULL, NULL, 80.0000, 60.0000, 'use_annual', 'ผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูล SCOPUS', 'Item', 'ผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติในฐานข้อมูลทั้งหมด', 'Item', 8, 1, '2026-07-30 07:36:22', '2026-07-30 07:38:59'),
(23, 2, 22, 'K1-5', NULL, 'student_success', NULL, 'strategic', NULL, 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 45.0000, 'weighted_sum', NULL, NULL, 100.0000, 70.0000, 'divide_equally', 'Test', 'Item', NULL, NULL, 9, 0, '2026-08-07 15:57:17', '2026-08-07 15:58:47'),
(24, 2, 23, 'K1-6', NULL, 'student_success', NULL, 'strategic', NULL, 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 100.0000, 'weighted_sum', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'test', 'Item', NULL, NULL, 10, 0, '2026-08-07 15:59:08', '2026-08-07 16:00:03'),
(25, 2, 24, 'K1-7', NULL, 'student_success', NULL, 'strategic', NULL, 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 70.0000, 'percent_of_total', NULL, NULL, 100.0000, 70.0000, 'use_annual', 'test1', 'Item', 'test2', 'Item', 11, 0, '2026-08-07 16:00:27', '2026-08-07 16:01:25');

-- --------------------------------------------------------

--
-- Table structure for table `perf_kpi_annual_target`
--

CREATE TABLE `perf_kpi_annual_target` (
  `perf_kpi_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `target_value` decimal(14,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_kpi_annual_target`
--

INSERT INTO `perf_kpi_annual_target` (`perf_kpi_id`, `year_no`, `target_value`) VALUES
(1, 1, 20.0000),
(1, 2, 25.0000),
(1, 3, 30.0000),
(1, 4, 35.0000),
(1, 5, 40.0000),
(2, 1, 20.0000),
(2, 2, 25.0000),
(2, 3, 30.0000),
(2, 4, 35.0000),
(2, 5, 40.0000),
(3, 1, 100.0000),
(3, 2, 100.0000),
(3, 3, 100.0000),
(3, 4, 100.0000),
(3, 5, 100.0000),
(4, 1, 100.0000),
(4, 2, 100.0000),
(4, 3, 100.0000),
(4, 4, 100.0000),
(4, 5, 100.0000),
(5, 1, 10.0000),
(5, 2, 20.0000),
(5, 3, 30.0000),
(5, 4, 40.0000),
(5, 5, 50.0000),
(6, 1, 10.0000),
(6, 2, 20.0000),
(6, 3, 30.0000),
(6, 4, 40.0000),
(6, 5, 50.0000),
(7, 1, 70.0000),
(7, 2, 75.0000),
(7, 3, 80.0000),
(7, 4, 85.0000),
(7, 5, 90.0000),
(8, 1, 70.0000),
(8, 2, 75.0000),
(8, 3, 80.0000),
(8, 4, 85.0000),
(8, 5, 90.0000),
(13, 1, 0.2500),
(13, 2, 0.2500),
(13, 3, 0.5000),
(13, 4, 0.7500),
(13, 5, 1.0000),
(14, 1, 0.2500),
(14, 2, 0.2500),
(14, 3, 0.5000),
(14, 4, 0.7500),
(14, 5, 1.0000),
(15, 1, 40.0000),
(15, 2, 40.0000),
(15, 3, 45.0000),
(15, 4, 50.0000),
(15, 5, 55.0000),
(16, 1, 40.0000),
(16, 2, 40.0000),
(16, 3, 45.0000),
(16, 4, 50.0000),
(16, 5, 55.0000),
(17, 1, 20.0000),
(17, 2, 35.0000),
(17, 3, 30.0000),
(17, 4, 35.0000),
(17, 5, 40.0000),
(18, 1, 20.0000),
(18, 2, 35.0000),
(18, 3, 30.0000),
(18, 4, 35.0000),
(18, 5, 40.0000),
(19, 1, 80.0000),
(19, 2, 85.0000),
(19, 3, 90.0000),
(19, 4, 95.0000),
(19, 5, 100.0000),
(20, 1, 80.0000),
(20, 2, 85.0000),
(20, 3, 90.0000),
(20, 4, 95.0000),
(20, 5, 100.0000),
(23, 1, 25.0000),
(23, 2, 30.0000),
(23, 3, 35.0000),
(23, 4, 40.0000),
(23, 5, 45.0000),
(24, 1, 25.0000),
(24, 2, 35.0000),
(24, 3, 65.0000),
(24, 4, 85.0000),
(24, 5, 100.0000),
(25, 1, 50.0000),
(25, 2, 55.0000),
(25, 3, 60.0000),
(25, 4, 65.0000),
(25, 5, 70.0000);

-- --------------------------------------------------------

--
-- Table structure for table `perf_kpi_approval`
--

CREATE TABLE `perf_kpi_approval` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `perf_kpi_id` bigint(20) UNSIGNED NOT NULL,
  `record_id` bigint(20) UNSIGNED NOT NULL,
  `committee_id` varchar(30) DEFAULT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `quarter_no` tinyint(3) UNSIGNED NOT NULL CHECK (`quarter_no` between 1 and 4),
  `state` enum('draft','submitted','returned','forwarded','approved') NOT NULL DEFAULT 'draft',
  `submitted_by` varchar(20) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `forwarded_by` varchar(20) DEFAULT NULL,
  `forwarded_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(20) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_kpi_approval`
--

INSERT INTO `perf_kpi_approval` (`id`, `perf_kpi_id`, `record_id`, `committee_id`, `year_no`, `quarter_no`, `state`, `submitted_by`, `submitted_at`, `forwarded_by`, `forwarded_at`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(7, 3, 1, 'cmt-curriculum', 1, 1, 'approved', 'fac-002', '2026-08-03 15:12:02', 'fac-022', '2026-08-03 15:12:02', 'fac-003', '2026-08-03 15:12:02', '2026-07-06 16:16:50', '2026-08-03 15:12:02'),
(8, 5, 1, 'cmt-curriculum', 1, 1, 'returned', 'fac-002', '2026-08-03 08:34:45', 'fac-022', '2026-08-03 08:35:09', NULL, NULL, '2026-07-07 02:08:19', '2026-08-03 08:36:07'),
(11, 4, 2, 'cmt-curriculum', 1, 1, 'forwarded', 'fac-002', '2026-08-03 05:38:16', 'fac-022', '2026-08-03 07:54:03', NULL, NULL, '2026-07-07 08:39:27', '2026-08-03 07:54:03'),
(19, 6, 2, 'cmt-curriculum', 1, 1, 'forwarded', 'fac-002', '2026-07-07 13:58:32', 'fac-005', '2026-07-08 09:23:22', NULL, NULL, '2026-07-07 13:58:32', '2026-07-08 09:23:22'),
(23, 6, 2, 'cmt-curriculum', 1, 2, 'submitted', 'fac-002', '2026-07-08 09:57:42', NULL, NULL, NULL, NULL, '2026-07-08 09:57:42', '2026-07-08 09:57:42'),
(24, 4, 2, 'cmt-curriculum', 1, 2, 'submitted', 'fac-002', '2026-07-09 05:22:51', NULL, NULL, NULL, NULL, '2026-07-09 05:22:51', '2026-07-09 05:22:51'),
(27, 8, 2, 'cmt-curriculum', 1, 1, 'forwarded', 'fac-002', '2026-08-03 05:12:18', 'fac-022', '2026-08-03 14:26:03', NULL, NULL, '2026-08-03 05:12:18', '2026-08-03 14:26:03'),
(34, 17, 1, 'cmt-curriculum', 1, 1, 'submitted', 'fac-002', '2026-08-03 06:18:04', 'fac-022', '2026-08-03 08:34:21', NULL, NULL, '2026-08-03 06:18:04', '2026-08-03 08:36:07'),
(39, 7, 1, 'cmt-curriculum', 1, 1, 'returned', 'fac-002', '2026-08-03 06:22:11', NULL, NULL, NULL, NULL, '2026-08-03 06:22:11', '2026-08-03 06:22:40');

-- --------------------------------------------------------

--
-- Table structure for table `perf_kpi_approval_event`
--

CREATE TABLE `perf_kpi_approval_event` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `approval_id` bigint(20) UNSIGNED NOT NULL,
  `actor_id` varchar(40) DEFAULT NULL,
  `actor_name` varchar(255) DEFAULT NULL,
  `actor_role` varchar(40) DEFAULT NULL,
  `action` varchar(40) NOT NULL,
  `from_state` varchar(20) DEFAULT NULL,
  `to_state` varchar(20) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_kpi_approval_event`
--

INSERT INTO `perf_kpi_approval_event` (`id`, `approval_id`, `actor_id`, `actor_name`, `actor_role`, `action`, `from_state`, `to_state`, `comment`, `created_at`) VALUES
(7, 7, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-07-06 16:16:50'),
(8, 8, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-07-07 02:08:19'),
(9, 7, 'fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-07-07 02:08:32'),
(10, 7, 'fac-001', 'อ.ดร.นิเวศน์ กุลวงค์', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-07-07 02:09:47'),
(11, 11, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-07-07 08:39:27'),
(12, 11, 'fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-07-07 08:39:35'),
(13, 11, 'fac-001', 'อ.ดร.นิเวศน์ กุลวงค์', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-07-07 08:39:51'),
(14, 7, NULL, 'Dr. Anchali Wong', 'admin', 'reverse', 'approved', 'forwarded', NULL, '2026-07-07 08:40:03'),
(15, 7, 'fac-001', 'อ.ดร.นิเวศน์ กุลวงค์', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-07-07 08:40:14'),
(16, 8, 'fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'lead', 'return', 'submitted', 'returned', 'recheck again', '2026-07-07 13:47:54'),
(17, 8, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'returned', 'submitted', NULL, '2026-07-07 13:48:09'),
(18, 8, 'fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'lead', 'return', 'submitted', 'returned', 'nothing', '2026-07-07 13:57:51'),
(19, 19, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-07-07 13:58:32'),
(20, 19, 'fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-07-08 09:21:03'),
(21, 19, 'fac-001', 'อ.ดร.นิเวศน์ กุลวงค์', 'counselor', 'reject', 'forwarded', 'submitted', 'check again', '2026-07-08 09:21:25'),
(22, 19, 'fac-005', 'รศ.ดร.ศศิธร ชูศรี', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-07-08 09:23:22'),
(23, 23, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-07-08 09:57:42'),
(24, 24, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-07-09 05:22:51'),
(25, 27, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-08-03 05:12:18'),
(26, 11, NULL, 'Dr. Anchali Wong', 'admin', 'reverse', 'approved', 'returned', NULL, '2026-08-03 05:17:13'),
(27, 11, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'returned', 'submitted', NULL, '2026-08-03 05:38:16'),
(28, 7, 'fac-000', 'Admin', 'admin', 'reverse', 'approved', 'returned', NULL, '2026-08-03 06:01:34'),
(29, 7, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'returned', 'submitted', NULL, '2026-08-03 06:01:49'),
(30, 7, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 06:05:23'),
(31, 7, 'fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-08-03 06:05:23'),
(32, 34, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-08-03 06:18:04'),
(33, 7, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'admin', 'reverse', 'approved', 'returned', NULL, '2026-08-03 06:19:05'),
(34, 7, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'returned', 'submitted', NULL, '2026-08-03 06:21:30'),
(35, 7, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 06:21:30'),
(36, 7, 'fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-08-03 06:21:30'),
(37, 39, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'draft', 'submitted', NULL, '2026-08-03 06:22:11'),
(38, 39, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 06:22:11'),
(39, 39, 'fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-08-03 06:22:40'),
(40, 39, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'admin', 'reverse', 'approved', 'returned', NULL, '2026-08-03 06:22:40'),
(41, 11, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 07:54:03'),
(42, 34, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 08:34:21'),
(43, 8, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'returned', 'submitted', NULL, '2026-08-03 08:34:45'),
(44, 8, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 08:35:09'),
(45, 8, 'fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'counselor', 'reject', 'forwarded', 'submitted', 'Reverting test transition', '2026-08-03 08:36:07'),
(46, 8, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'return', 'submitted', 'returned', 'Reverting test transition', '2026-08-03 08:36:07'),
(47, 34, 'fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'counselor', 'reject', 'forwarded', 'submitted', 'Reverting test transition', '2026-08-03 08:36:07'),
(48, 27, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 14:26:03'),
(49, 7, 'fac-000', 'Dr. Anchali Wong', 'admin', 'reverse', 'approved', 'returned', NULL, '2026-08-03 15:11:44'),
(50, 7, 'fac-002', 'ผศ.ดร.จงกล สายสิงห์', 'member', 'submit', 'returned', 'submitted', NULL, '2026-08-03 15:12:02'),
(51, 7, 'fac-022', 'อ.ดร.สหรัตถ์ อารีราษฎร์', 'lead', 'forward', 'submitted', 'forwarded', NULL, '2026-08-03 15:12:02'),
(52, 7, 'fac-003', 'ผศ.ดร.วิภพ สุทธนะ', 'counselor', 'approve', 'forwarded', 'approved', NULL, '2026-08-03 15:12:02');

-- --------------------------------------------------------

--
-- Table structure for table `perf_kpi_quarter_progress`
--

CREATE TABLE `perf_kpi_quarter_progress` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `perf_kpi_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `quarter_no` tinyint(3) UNSIGNED NOT NULL CHECK (`quarter_no` between 1 and 4),
  `progress_value` decimal(14,4) DEFAULT NULL,
  `variable1_value` decimal(14,4) DEFAULT NULL,
  `variable2_value` decimal(14,4) DEFAULT NULL,
  `is_computed` tinyint(1) NOT NULL DEFAULT 0,
  `value_source` enum('manual','rollup','data_source') NOT NULL DEFAULT 'manual',
  `issue` text DEFAULT NULL,
  `solution` text DEFAULT NULL,
  `recorded_by` varchar(255) DEFAULT NULL,
  `recorded_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_kpi_quarter_progress`
--

INSERT INTO `perf_kpi_quarter_progress` (`id`, `perf_kpi_id`, `year_no`, `quarter_no`, `progress_value`, `variable1_value`, `variable2_value`, `is_computed`, `value_source`, `issue`, `solution`, `recorded_by`, `recorded_at`, `updated_at`) VALUES
(2, 1, 1, 1, 62.0000, 62.0000, NULL, 1, 'rollup', 'kpi-level issue', 'kpi-level fix', NULL, '2026-07-04 04:34:37', '2026-07-29 06:03:23'),
(9, 1, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(10, 1, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(11, 1, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(12, 1, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13, 1, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(14, 1, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(15, 1, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(16, 1, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(17, 1, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(18, 1, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(19, 1, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(20, 1, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(21, 1, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(22, 1, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(23, 1, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(24, 1, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(25, 1, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(26, 1, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(31, 2, 2, 1, 6.0000, 6.0000, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:03:23'),
(32, 2, 2, 2, 12.0000, 12.0000, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:03:23'),
(33, 2, 2, 3, 16.0000, 16.0000, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:03:23'),
(34, 2, 2, 4, 21.0000, 21.0000, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:03:23'),
(35, 2, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(36, 2, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(37, 2, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(38, 2, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(39, 2, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(40, 2, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(41, 2, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(42, 2, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(43, 2, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(44, 2, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(45, 2, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(46, 2, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(909, 1, 1, 2, 15.0000, 15.0000, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:03:23'),
(928, 2, 1, 1, 4.0000, 4.0000, NULL, 1, 'rollup', 'nothing', 'nothing', 'lead@mfu.ac.th', '2026-07-08 10:24:06', '2026-07-29 06:03:23'),
(929, 2, 1, 2, 19.0000, 19.0000, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:03:23'),
(930, 2, 1, 3, 22.0000, 22.0000, NULL, 1, 'rollup', 'nothing', 'nothing', 'admin@mfu.ac.th', '2026-07-23 06:53:08', '2026-07-29 06:03:23'),
(931, 2, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1342, 3, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1343, 3, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1344, 3, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1345, 3, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1346, 3, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1347, 3, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1348, 3, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1349, 3, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1350, 3, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1351, 3, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1352, 3, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1353, 3, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1354, 3, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1355, 3, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1356, 3, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1357, 3, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1358, 3, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1359, 3, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1360, 3, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1361, 3, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1382, 4, 1, 1, NULL, NULL, NULL, 1, 'rollup', 'g', 'g', 'admin@mfu.ac.th', '2026-08-03 05:37:56', '2026-08-03 05:37:56'),
(1383, 4, 1, 2, NULL, NULL, NULL, 1, 'rollup', 'Collect data in Q3', 'No', 'member@mfu.ac.th', '2026-07-09 05:22:49', '2026-07-29 06:02:58'),
(1384, 4, 1, 3, 104.4444, 329.0000, 315.0000, 1, 'rollup', 'Collect data in Q3', 'No', 'admin@mfu.ac.th', '2026-07-31 09:39:00', '2026-07-31 09:39:00'),
(1386, 4, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1387, 4, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1388, 4, 2, 3, 84.7761, 284.0000, 335.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1389, 4, 2, 4, 84.7761, 284.0000, 335.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1390, 4, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1391, 4, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1392, 4, 3, 3, 81.9718, 291.0000, 355.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1393, 4, 3, 4, 81.9718, 291.0000, 355.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1394, 4, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1395, 4, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1396, 4, 4, 3, 85.9459, 318.0000, 370.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1397, 4, 4, 4, 85.9459, 318.0000, 370.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1398, 4, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1399, 4, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(1400, 4, 5, 3, 102.8571, 396.0000, 385.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(1401, 4, 5, 4, 102.8571, 396.0000, 385.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(3327, 6, 1, 1, NULL, NULL, NULL, 1, 'rollup', 'Late accreditation results', 'Follow up with QA office', 'admin@mfu.ac.th', '2026-07-07 13:45:08', '2026-07-31 00:33:11'),
(3649, 6, 1, 2, NULL, NULL, NULL, 1, 'rollup', 'Nothing', 'Nothing', 'admin@mfu.ac.th', '2026-07-06 15:26:00', '2026-07-31 00:33:11'),
(4108, 7, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4109, 7, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4110, 7, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4111, 7, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4112, 7, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4113, 7, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4114, 7, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4115, 7, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4116, 7, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4117, 7, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4118, 7, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4119, 7, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4120, 7, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4121, 7, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4122, 7, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4123, 7, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4124, 7, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4125, 7, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4126, 7, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4127, 7, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4168, 8, 1, 1, NULL, NULL, NULL, 1, 'rollup', 'Parent issue Q1', 'Parent solution Q1', 'admin@mfu.ac.th', '2026-07-09 05:08:07', '2026-07-30 16:55:25'),
(4169, 8, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4170, 8, 1, 3, 76.2238, 109.0000, 143.0000, 1, 'rollup', 'Parent issue Q1', 'Parent solution Q1', 'admin@mfu.ac.th', '2026-07-31 09:36:41', '2026-07-31 09:36:41'),
(4171, 8, 1, 4, 76.2238, 109.0000, 143.0000, 1, 'rollup', 'Parent issue Q1', 'Parent solution Q1', 'admin@mfu.ac.th', '2026-07-31 09:37:04', '2026-07-31 09:37:04'),
(4172, 8, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:25'),
(4173, 8, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:25'),
(4174, 8, 2, 3, 71.5328, 98.0000, 137.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:29:01'),
(4175, 8, 2, 4, 71.5328, 98.0000, 137.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:29:01'),
(4176, 8, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4177, 8, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4178, 8, 3, 3, 69.6970, 138.0000, 198.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:29:01'),
(4179, 8, 3, 4, 69.6970, 138.0000, 198.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:29:01'),
(4180, 8, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4181, 8, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4182, 8, 4, 3, 78.3217, 224.0000, 286.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:29:01'),
(4183, 8, 4, 4, 78.3217, 224.0000, 286.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:29:01'),
(4184, 8, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4185, 8, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4186, 8, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(4187, 8, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8250, 13, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8251, 13, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8252, 13, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8253, 13, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8254, 13, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8255, 13, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8256, 13, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8257, 13, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8258, 13, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8259, 13, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8260, 13, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8261, 13, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8262, 13, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8263, 13, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8264, 13, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8265, 13, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8266, 13, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8267, 13, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8268, 13, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8269, 13, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8330, 14, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8331, 14, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8332, 14, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8333, 14, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8334, 14, 2, 1, 0.1091, 6.0000, 55.0000, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 00:38:00'),
(8335, 14, 2, 2, 0.2000, 11.0000, 55.0000, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 00:38:00'),
(8336, 14, 2, 3, 0.2727, 15.0000, 55.0000, 1, 'data_source', 'nothing', 'nothing', 'admin@mfu.ac.th', '2026-07-23 16:20:14', '2026-07-31 00:38:00'),
(8337, 14, 2, 4, 0.3091, 17.0000, 55.0000, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 00:38:00'),
(8338, 14, 3, 1, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(8339, 14, 3, 2, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(8340, 14, 3, 3, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(8341, 14, 3, 4, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(8342, 14, 4, 1, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(8343, 14, 4, 2, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(8344, 14, 4, 3, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(8345, 14, 4, 4, NULL, NULL, NULL, 1, 'data_source', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(8346, 14, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8347, 14, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8348, 14, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(8349, 14, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13162, 16, 2, 1, 6.0000, 6.0000, NULL, 1, 'rollup', 'Hot', 'Hot', 'admin@mfu.ac.th', '2026-07-23 16:34:30', '2026-07-30 06:25:55'),
(13163, 16, 2, 2, 14.0000, 14.0000, NULL, 1, 'rollup', 'HotHot', 'HotHot', 'admin@mfu.ac.th', '2026-07-23 16:34:48', '2026-07-30 06:25:55'),
(13164, 16, 2, 3, 20.0000, 20.0000, NULL, 1, 'rollup', 'HotHotHot', 'HotHotHot', 'admin@mfu.ac.th', '2026-07-23 16:35:06', '2026-07-30 06:25:55'),
(13165, 16, 2, 4, 23.0000, 23.0000, NULL, 1, 'rollup', 'NothingJul', 'NothingJul', 'admin@mfu.ac.th', '2026-07-23 06:02:23', '2026-07-30 06:25:55'),
(13166, 16, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(13167, 16, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(13168, 16, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(13169, 16, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(13170, 16, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(13171, 16, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(13172, 16, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(13173, 16, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(13646, 15, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13647, 15, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13648, 15, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13649, 15, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13650, 15, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13651, 15, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13652, 15, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13653, 15, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13654, 15, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13655, 15, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13656, 15, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13657, 15, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13658, 15, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13659, 15, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13660, 15, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13661, 15, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13662, 15, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13663, 15, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13664, 15, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13665, 15, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13746, 16, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13747, 16, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13748, 16, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13749, 16, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13762, 16, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13763, 16, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13764, 16, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(13765, 16, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-29 06:02:58'),
(18402, 4, 1, 4, 104.4444, 329.0000, 315.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(24950, 17, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24951, 17, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24952, 17, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24953, 17, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24954, 17, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24955, 17, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24956, 17, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24957, 17, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24958, 17, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24959, 17, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24960, 17, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24961, 17, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24962, 17, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24963, 17, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24964, 17, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24965, 17, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24966, 17, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24967, 17, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24968, 17, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(24969, 17, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25070, 18, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25071, 18, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25072, 18, 1, 3, 20.9790, 30.0000, 143.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25073, 18, 1, 4, 20.9790, 30.0000, 143.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25074, 18, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25075, 18, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25076, 18, 2, 3, 21.8978, 30.0000, 137.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25077, 18, 2, 4, 21.8978, 30.0000, 137.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25078, 18, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25079, 18, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25080, 18, 3, 3, 24.2424, 48.0000, 198.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25081, 18, 3, 4, 24.2424, 48.0000, 198.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25082, 18, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25083, 18, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25084, 18, 4, 3, 11.5385, 33.0000, 286.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25085, 18, 4, 4, 11.5385, 33.0000, 286.0000, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 16:55:26'),
(25086, 18, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25087, 18, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25088, 18, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(25089, 18, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 03:20:33'),
(34568, 19, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34569, 19, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34570, 19, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34571, 19, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34572, 19, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34573, 19, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34574, 19, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34575, 19, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34576, 19, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34577, 19, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34578, 19, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34579, 19, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34580, 19, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34581, 19, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34582, 19, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34583, 19, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34584, 19, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34585, 19, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34586, 19, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34587, 19, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34708, 20, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34709, 20, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34710, 20, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34711, 20, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34712, 20, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34713, 20, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34714, 20, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34715, 20, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34716, 20, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34717, 20, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34718, 20, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34719, 20, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34720, 20, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34721, 20, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34722, 20, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34723, 20, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34724, 20, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34725, 20, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34726, 20, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(34727, 20, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-30 07:38:59'),
(69846, 6, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69847, 6, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69848, 6, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69849, 6, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69850, 6, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69851, 6, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69852, 6, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(69853, 6, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:45:47'),
(71229, 5, 1, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71230, 5, 1, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71231, 5, 1, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71232, 5, 1, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71233, 5, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71234, 5, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71235, 5, 2, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71236, 5, 2, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71237, 5, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71238, 5, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71239, 5, 3, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71240, 5, 3, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71241, 5, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71242, 5, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71243, 5, 4, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71244, 5, 4, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71245, 5, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71246, 5, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71247, 5, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71248, 5, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71393, 6, 2, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71394, 6, 2, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71397, 6, 3, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71398, 6, 3, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71401, 6, 4, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71402, 6, 4, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71405, 6, 5, 1, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71406, 6, 5, 2, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71407, 6, 5, 3, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11'),
(71408, 6, 5, 4, NULL, NULL, NULL, 1, 'rollup', NULL, NULL, NULL, NULL, '2026-07-31 00:33:11');

-- --------------------------------------------------------

--
-- Table structure for table `perf_metric`
--

CREATE TABLE `perf_metric` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `perf_kpi_id` bigint(20) UNSIGNED NOT NULL,
  `source_metric_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(40) DEFAULT NULL,
  `data_collect_method` varchar(500) DEFAULT NULL,
  `collection_period` enum('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  `data_source_url` varchar(1000) DEFAULT NULL,
  `committee_id` varchar(30) DEFAULT NULL,
  `person_in_charge_id` varchar(20) DEFAULT NULL,
  `weight` decimal(6,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) DEFAULT NULL,
  `five_year_target` decimal(14,4) DEFAULT NULL,
  `threshold_green` decimal(14,4) DEFAULT NULL,
  `threshold_amber` decimal(14,4) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_metric`
--

INSERT INTO `perf_metric` (`id`, `perf_kpi_id`, `source_metric_id`, `name`, `description`, `category_id`, `data_collect_method`, `collection_period`, `data_source_url`, `committee_id`, `person_in_charge_id`, `weight`, `unit`, `five_year_target`, `threshold_green`, `threshold_amber`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'Number of Innovation', 'Number of Innovation, definition according to MFU', 'research_output', 'self-report from SHS staff', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 25.0000, 15.0000, 2, '2026-07-03 10:11:14', '2026-07-04 14:16:53'),
(2, 1, 4, 'Number of Patent', 'Number of Patent, definition according to MFU', 'research_output', 'self-report from SHS staff', 'Q4', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 3.0000, 2.0000, 3, '2026-07-03 10:11:14', '2026-07-04 14:21:16'),
(3, 1, 5, 'Number of Invention', 'Number of Invention, definition according to MFU', 'research_output', 'self-report by SHS staff', 'every_quarter', NULL, 'cmt-student-alumni', 'fac-045', 100.00, 'Item', 0.0000, 3.0000, 2.0000, 4, '2026-07-03 10:11:14', '2026-07-04 14:21:32'),
(4, 2, 3, 'Number of Innovation', 'Number of Innovation, definition according to MFU', 'research_output', 'self-report from SHS staff', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 25.0000, 15.0000, 2, '2026-07-04 04:41:51', '2026-07-04 14:16:53'),
(5, 2, 4, 'Number of Patent', 'Number of Patent, definition according to MFU', 'research_output', 'self-report from SHS staff', 'Q4', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 3.0000, 2.0000, 3, '2026-07-04 04:41:51', '2026-07-04 14:21:16'),
(6, 2, 5, 'Number of Invention', 'Number of Invention, definition according to MFU', 'research_output', 'self-report by SHS staff', 'every_quarter', NULL, 'cmt-student-alumni', 'fac-045', 100.00, 'Item', 0.0000, 3.0000, 2.0000, 4, '2026-07-04 04:41:51', '2026-07-04 14:21:32'),
(9, 3, 7, 'OHS-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'OHS-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU BI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-018', 100.00, 'Persons', 60.0000, 60.0000, 40.0000, 1, '2026-07-06 05:48:52', '2026-07-30 10:42:24'),
(10, 4, 7, 'OHS-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'OHS-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU BI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-018', 100.00, 'Persons', 60.0000, 60.0000, 40.0000, 1, '2026-07-06 05:48:52', '2026-07-30 10:42:24'),
(11, 3, 8, 'PH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU BI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-042', 100.00, 'Persons', 90.0000, 90.0000, 50.0000, 2, '2026-07-06 05:49:52', '2026-07-30 10:42:39'),
(12, 4, 8, 'PH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU BI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-042', 100.00, 'Persons', 90.0000, 90.0000, 50.0000, 2, '2026-07-06 05:49:52', '2026-07-30 10:42:40'),
(13, 3, 9, 'EnvH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'EnvH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU bi', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-010', 100.00, 'Persons', 60.0000, 60.0000, 40.0000, 3, '2026-07-06 09:40:56', '2026-07-30 10:42:51'),
(14, 4, 9, 'EnvH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'EnvH-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU bi', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-010', 100.00, 'Persons', 60.0000, 60.0000, 40.0000, 3, '2026-07-06 09:40:56', '2026-07-30 10:42:51'),
(15, 3, 10, 'Sports-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'Sports-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU bi', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-058', 100.00, 'Persons', 90.0000, 90.0000, 60.0000, 4, '2026-07-06 09:42:12', '2026-07-30 10:43:12'),
(16, 4, 10, 'Sports-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'Sports-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU bi', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', 'fac-058', 100.00, 'Persons', 90.0000, 90.0000, 60.0000, 4, '2026-07-06 09:42:12', '2026-07-30 10:43:12'),
(31, 7, 18, 'PHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'PHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 1, '2026-07-09 04:36:58', '2026-07-30 05:34:36'),
(32, 8, 18, 'PHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'PHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 1, '2026-07-09 04:36:58', '2026-07-30 05:34:37'),
(37, 7, 21, 'SHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'SHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 4, '2026-07-09 04:36:58', '2026-07-30 05:34:42'),
(38, 8, 21, 'SHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'SHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 4, '2026-07-09 04:36:58', '2026-07-30 05:34:42'),
(41, 7, 23, 'OHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'OHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 6, '2026-07-09 04:36:58', '2026-07-30 05:34:49'),
(42, 8, 23, 'OHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'OHSB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 6, '2026-07-09 04:36:58', '2026-07-30 05:34:50'),
(43, 7, 24, 'EnvHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'EnvHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 7, '2026-07-09 04:36:58', '2026-07-30 05:34:58'),
(44, 8, 24, 'EnvHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'EnvHB-ร้อยละของบัณฑิตที่ได้งานทำในระยะเวลา 1 ปี', 'student_success', 'Bi report', 'Q3', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 90.0000, 90.0000, 60.0000, 7, '2026-07-09 04:36:59', '2026-07-30 05:34:58'),
(65, 1, 44, 'Number of Petty Patent', 'Number of Petty Patent', 'research_output', 'SYNC-TEST-METHOD', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 3.0000, 2.0000, 5, '2026-07-19 04:03:34', '2026-07-19 06:00:12'),
(66, 2, 44, 'Number of Petty Patent', 'Number of Petty Patent', 'research_output', 'SYNC-TEST-METHOD', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-045', 100.00, 'Item', 0.0000, 3.0000, 2.0000, 5, '2026-07-19 04:03:34', '2026-07-19 06:00:12'),
(67, 13, 45, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Tier-1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Tier-1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 1, '2026-07-19 11:28:29', '2026-07-30 11:01:00'),
(68, 14, 45, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Tier-1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Tier-1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 1, '2026-07-19 11:28:30', '2026-07-30 11:01:00'),
(69, 13, 46, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 2, '2026-07-19 11:28:52', '2026-07-30 11:01:40'),
(70, 14, 46, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 2, '2026-07-19 11:28:52', '2026-07-30 11:01:40'),
(71, 13, 47, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q2', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q2', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 3, '2026-07-19 11:29:05', '2026-07-30 11:01:53'),
(72, 14, 47, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q2', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q2', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 3, '2026-07-19 11:29:05', '2026-07-30 11:01:53'),
(73, 13, 48, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q3', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q3', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 4, '2026-07-19 11:29:18', '2026-07-30 11:02:15'),
(74, 14, 48, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q3', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q3', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 4, '2026-07-19 11:29:18', '2026-07-30 11:02:15'),
(75, 13, 49, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q4', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q4', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 5, '2026-07-19 11:29:48', '2026-07-30 11:02:57'),
(76, 14, 49, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q4', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับนานาชาติ (SCOPUS) Q4', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 5, '2026-07-19 11:29:49', '2026-07-30 11:02:57'),
(77, 15, 50, 'Number of Q1-tier1', 'Number of Q1-tier1', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 1, '2026-07-19 13:25:48', '2026-07-19 13:25:48'),
(78, 16, 50, 'Number of Q1-tier1', 'Number of Q1-tier1', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 1, '2026-07-19 13:25:48', '2026-07-19 13:25:48'),
(79, 15, 51, 'Number of Q1', 'Number of Q1', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 2, '2026-07-19 13:26:14', '2026-07-19 13:26:14'),
(80, 16, 51, 'Number of Q1', 'Number of Q1', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 2, '2026-07-19 13:26:14', '2026-07-19 13:26:14'),
(81, 15, 52, 'Number of Q2', 'Number of Q2', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 3, '2026-07-19 13:26:36', '2026-07-19 13:26:36'),
(82, 16, 52, 'Number of Q2', 'Number of Q2', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 3, '2026-07-19 13:26:36', '2026-07-19 13:26:36'),
(83, 15, 53, 'Number of Q3', 'Number of Q3', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 4, '2026-07-19 13:26:56', '2026-07-19 13:26:56'),
(84, 16, 53, 'Number of Q3', 'Number of Q3', 'research_output', 'Scopus DB', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 4, '2026-07-19 13:26:56', '2026-07-19 13:26:56'),
(85, 15, 54, 'Number of Q4', 'Number of Q4', 'research_output', 'Scopus', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 5, '2026-07-19 13:27:10', '2026-07-19 13:27:10'),
(86, 16, 54, 'Number of Q4', 'Number of Q4', 'research_output', 'Scopus', 'every_quarter', NULL, 'cmt-research-ethics', 'fac-006', 100.00, 'Item', 0.0000, NULL, NULL, 5, '2026-07-19 13:27:10', '2026-07-19 13:27:10'),
(87, 17, 55, 'PHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'PHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 1, '2026-07-30 03:20:33', '2026-07-30 03:21:31'),
(88, 18, 55, 'PHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'PHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 1, '2026-07-30 03:20:33', '2026-07-30 03:21:31'),
(93, 17, 58, 'SHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'SHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 4, '2026-07-30 03:20:34', '2026-07-30 03:21:48'),
(94, 18, 58, 'SHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'SHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 4, '2026-07-30 03:20:34', '2026-07-30 03:21:48'),
(97, 17, 60, 'OHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'OHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 6, '2026-07-30 03:20:34', '2026-07-30 03:22:03'),
(98, 18, 60, 'OHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'OHSB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 6, '2026-07-30 03:20:34', '2026-07-30 03:22:03'),
(99, 17, 61, 'EnvHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'EnvHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 7, '2026-07-30 03:20:34', '2026-07-30 03:22:15'),
(100, 18, 61, 'EnvHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'EnvHB-K1-2 ร้อยละของบัณฑิตที่ได้งานทำในองค์กรต่างชาติที่อยู่ในประเทศหรือต่างประเทศ', 'student_success', 'PowerBI และ แบบสำรวจภาวะการมีงานทำประจำปี', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 40.0000, 90.0000, 60.0000, 7, '2026-07-30 03:20:34', '2026-07-30 03:22:15'),
(107, 19, 65, 'PHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'PHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 2, '2026-07-30 07:38:59', '2026-07-30 07:40:30'),
(108, 20, 65, 'PHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'PHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 2, '2026-07-30 07:38:59', '2026-07-30 07:40:30'),
(109, 19, 66, 'PHD-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'PHD-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 3, '2026-07-30 07:38:59', '2026-07-30 07:40:35'),
(110, 20, 66, 'PHD-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'PHD-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 3, '2026-07-30 07:38:59', '2026-07-30 07:40:35'),
(113, 19, 68, 'SHSM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 5, '2026-07-30 07:38:59', '2026-07-30 07:40:39'),
(114, 20, 68, 'SHSM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 5, '2026-07-30 07:38:59', '2026-07-30 07:40:40'),
(119, 19, 71, 'EnvHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 8, '2026-07-30 07:39:00', '2026-07-30 07:40:19'),
(120, 20, 71, 'EnvHM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 8, '2026-07-30 07:39:00', '2026-07-30 07:40:19'),
(121, 19, 72, 'BMM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 9, '2026-07-30 07:39:00', '2026-07-30 07:40:25'),
(122, 20, 72, 'BMM-K1-3 ร้อยละผลงานวิจัยระดับบัณฑิตศึกษาที่ตีพิมพ์ในฐานข้อมูลนานาชาติ', NULL, 'student_success', 'ฝ่ายบัณฑิตและวิจัย', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', 100.0000, 80.0000, 50.0000, 9, '2026-07-30 07:39:00', '2026-07-30 07:40:25'),
(125, 3, 74, 'PHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 20.0000, 5.0000, 6, '2026-07-30 10:44:31', '2026-07-30 10:45:59'),
(126, 4, 74, 'PHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 20.0000, 5.0000, 6, '2026-07-30 10:44:31', '2026-07-30 10:45:59'),
(127, 3, 75, 'PHD-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PHD-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 10.0000, 10.0000, 5.0000, 7, '2026-07-30 10:44:31', '2026-07-30 10:46:33'),
(128, 4, 75, 'PHD-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'PHD-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 10.0000, 10.0000, 5.0000, 7, '2026-07-30 10:44:32', '2026-07-30 10:46:33'),
(131, 3, 77, 'SHSM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'SHSM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 15.0000, 5.0000, 9, '2026-07-30 10:44:32', '2026-07-30 10:47:40'),
(132, 4, 77, 'SHSM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'SHSM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 15.0000, 5.0000, 9, '2026-07-30 10:44:32', '2026-07-30 10:47:40'),
(137, 3, 80, 'EnvHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'EnvHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 20.0000, 5.0000, 12, '2026-07-30 10:44:32', '2026-07-30 10:48:04'),
(138, 4, 80, 'EnvHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'EnvHM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 20.0000, 5.0000, 12, '2026-07-30 10:44:32', '2026-07-30 10:48:04'),
(139, 3, 81, 'BMM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'BMM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 20.0000, 5.0000, 13, '2026-07-30 10:44:32', '2026-07-30 10:48:41'),
(140, 4, 81, 'BMM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'BMM-จำนวนของนักศึกษารับเข้าเทียบเป้าหมาย', 'student_success', 'MFU PowerBI', 'Q3', 'https://bi.mfu.ac.th/tcas/', 'cmt-curriculum', NULL, 100.00, 'Persons', 20.0000, 20.0000, 5.0000, 13, '2026-07-30 10:44:33', '2026-07-30 10:48:41'),
(141, 13, 82, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, NULL, NULL, 6, '2026-07-30 11:03:24', '2026-07-30 11:03:24'),
(142, 14, 82, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI1', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI1', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, NULL, NULL, 6, '2026-07-30 11:03:24', '2026-07-30 11:03:24'),
(143, 13, 83, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI2', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI2', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, NULL, NULL, 7, '2026-07-30 11:03:36', '2026-07-30 11:03:36'),
(144, 14, 83, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI2', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI2', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, NULL, NULL, 7, '2026-07-30 11:03:36', '2026-07-30 11:03:36'),
(145, 13, 84, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI3', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI3', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, NULL, NULL, 8, '2026-07-30 11:03:46', '2026-07-30 11:03:46'),
(146, 14, 84, 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI3', 'จำนวนงานวิจัยที่ได้รับการตีพิมพ์ในระดับชาติ TCI3', 'research_output', 'Google Scholar and Scopus database', 'every_quarter', NULL, 'cmt-research-ethics', NULL, 100.00, 'Item', 0.0000, NULL, NULL, 8, '2026-07-30 11:03:46', '2026-07-30 11:03:46'),
(147, 5, 85, 'PHB-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'PHB-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 1.0000, 0.0000, 1, '2026-07-31 00:33:11', '2026-07-31 00:36:33'),
(148, 6, 85, 'PHB-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'PHB-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 1.0000, 0.0000, 1, '2026-07-31 00:33:11', '2026-07-31 00:36:33'),
(149, 5, 86, 'PHM-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'PHM-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 1.0000, 0.0000, 2, '2026-07-31 00:33:11', '2026-07-31 00:37:15'),
(150, 6, 86, 'PHM-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'PHM-O1-1 ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 1.0000, 0.0000, 2, '2026-07-31 00:33:11', '2026-07-31 00:37:15'),
(151, 5, 87, 'PHD-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 1.0000, 0.0000, 3, '2026-07-31 00:33:11', '2026-07-31 00:37:34'),
(152, 6, 87, 'PHD-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Item', 1.0000, 1.0000, 0.0000, 3, '2026-07-31 00:33:11', '2026-07-31 00:37:34'),
(153, 5, 88, 'SHSB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 4, '2026-07-31 00:33:11', '2026-07-31 00:33:11'),
(154, 6, 88, 'SHSB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 4, '2026-07-31 00:33:11', '2026-07-31 00:33:11'),
(155, 5, 89, 'SHSM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 5, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(156, 6, 89, 'SHSM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 5, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(157, 5, 90, 'OHSB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 6, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(158, 6, 90, 'OHSB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 6, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(159, 5, 91, 'EnvHB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 7, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(160, 6, 91, 'EnvHB-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 7, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(161, 5, 92, 'EnvHM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 8, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(162, 6, 92, 'EnvHM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 8, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(163, 5, 93, 'BMM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 9, '2026-07-31 00:33:12', '2026-07-31 00:33:12'),
(164, 6, 93, 'BMM-O1-1 ร้อยละของหลักสูตรที่ผ่านการประเมินคุณภาพตามมาตรฐาน AUN-QA Level 4 (ASEAN Level)', NULL, 'student_success', 'QA Department', 'every_quarter', NULL, 'cmt-curriculum', NULL, 100.00, 'Percent', NULL, NULL, NULL, 9, '2026-07-31 00:33:12', '2026-07-31 00:33:12');

-- --------------------------------------------------------

--
-- Table structure for table `perf_metric_annual_target`
--

CREATE TABLE `perf_metric_annual_target` (
  `perf_metric_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `target_value` decimal(14,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_metric_annual_target`
--

INSERT INTO `perf_metric_annual_target` (`perf_metric_id`, `year_no`, `target_value`) VALUES
(1, 1, 0.0000),
(1, 2, 0.0000),
(1, 3, 0.0000),
(1, 4, 0.0000),
(1, 5, 0.0000),
(2, 1, 0.0000),
(2, 2, 0.0000),
(2, 3, 0.0000),
(2, 4, 0.0000),
(2, 5, 0.0000),
(3, 1, 0.0000),
(3, 2, 0.0000),
(3, 3, 0.0000),
(3, 4, 0.0000),
(3, 5, 0.0000),
(4, 1, 0.0000),
(4, 2, 0.0000),
(4, 3, 0.0000),
(4, 4, 0.0000),
(4, 5, 0.0000),
(5, 1, 0.0000),
(5, 2, 0.0000),
(5, 3, 0.0000),
(5, 4, 0.0000),
(5, 5, 0.0000),
(6, 1, 0.0000),
(6, 2, 0.0000),
(6, 3, 0.0000),
(6, 4, 0.0000),
(6, 5, 0.0000),
(9, 1, 60.0000),
(9, 2, 60.0000),
(9, 3, 60.0000),
(9, 4, 60.0000),
(9, 5, 60.0000),
(10, 1, 60.0000),
(10, 2, 60.0000),
(10, 3, 60.0000),
(10, 4, 60.0000),
(10, 5, 60.0000),
(11, 1, 90.0000),
(11, 2, 90.0000),
(11, 3, 90.0000),
(11, 4, 90.0000),
(11, 5, 90.0000),
(12, 1, 90.0000),
(12, 2, 90.0000),
(12, 3, 90.0000),
(12, 4, 90.0000),
(12, 5, 90.0000),
(13, 1, 60.0000),
(13, 2, 60.0000),
(13, 3, 60.0000),
(13, 4, 60.0000),
(13, 5, 60.0000),
(14, 1, 60.0000),
(14, 2, 60.0000),
(14, 3, 60.0000),
(14, 4, 60.0000),
(14, 5, 60.0000),
(15, 1, 90.0000),
(15, 2, 90.0000),
(15, 3, 90.0000),
(15, 4, 90.0000),
(15, 5, 90.0000),
(16, 1, 90.0000),
(16, 2, 90.0000),
(16, 3, 90.0000),
(16, 4, 90.0000),
(16, 5, 90.0000),
(31, 1, 70.0000),
(31, 2, 75.0000),
(31, 3, 80.0000),
(31, 4, 85.0000),
(31, 5, 90.0000),
(32, 1, 70.0000),
(32, 2, 75.0000),
(32, 3, 80.0000),
(32, 4, 85.0000),
(32, 5, 90.0000),
(37, 1, 70.0000),
(37, 2, 75.0000),
(37, 3, 80.0000),
(37, 4, 85.0000),
(37, 5, 90.0000),
(38, 1, 70.0000),
(38, 2, 75.0000),
(38, 3, 80.0000),
(38, 4, 85.0000),
(38, 5, 90.0000),
(41, 1, 70.0000),
(41, 2, 75.0000),
(41, 3, 80.0000),
(41, 4, 85.0000),
(41, 5, 90.0000),
(42, 1, 70.0000),
(42, 2, 75.0000),
(42, 3, 80.0000),
(42, 4, 85.0000),
(42, 5, 90.0000),
(43, 1, 70.0000),
(43, 2, 75.0000),
(43, 3, 80.0000),
(43, 4, 85.0000),
(43, 5, 90.0000),
(44, 1, 70.0000),
(44, 2, 75.0000),
(44, 3, 80.0000),
(44, 4, 85.0000),
(44, 5, 90.0000),
(65, 1, 0.0000),
(65, 2, 0.0000),
(65, 3, 0.0000),
(65, 4, 0.0000),
(65, 5, 0.0000),
(66, 1, 0.0000),
(66, 2, 0.0000),
(66, 3, 0.0000),
(66, 4, 0.0000),
(66, 5, 0.0000),
(67, 1, 0.0000),
(67, 2, 0.0000),
(67, 3, 0.0000),
(67, 4, 0.0000),
(67, 5, 0.0000),
(68, 1, 0.0000),
(68, 2, 0.0000),
(68, 3, 0.0000),
(68, 4, 0.0000),
(68, 5, 0.0000),
(69, 1, 0.0000),
(69, 2, 0.0000),
(69, 3, 0.0000),
(69, 4, 0.0000),
(69, 5, 0.0000),
(70, 1, 0.0000),
(70, 2, 0.0000),
(70, 3, 0.0000),
(70, 4, 0.0000),
(70, 5, 0.0000),
(71, 1, 0.0000),
(71, 2, 0.0000),
(71, 3, 0.0000),
(71, 4, 0.0000),
(71, 5, 0.0000),
(72, 1, 0.0000),
(72, 2, 0.0000),
(72, 3, 0.0000),
(72, 4, 0.0000),
(72, 5, 0.0000),
(73, 1, 0.0000),
(73, 2, 0.0000),
(73, 3, 0.0000),
(73, 4, 0.0000),
(73, 5, 0.0000),
(74, 1, 0.0000),
(74, 2, 0.0000),
(74, 3, 0.0000),
(74, 4, 0.0000),
(74, 5, 0.0000),
(75, 1, 0.0000),
(75, 2, 0.0000),
(75, 3, 0.0000),
(75, 4, 0.0000),
(75, 5, 0.0000),
(76, 1, 0.0000),
(76, 2, 0.0000),
(76, 3, 0.0000),
(76, 4, 0.0000),
(76, 5, 0.0000),
(77, 1, 0.0000),
(77, 2, 0.0000),
(77, 3, 0.0000),
(77, 4, 0.0000),
(77, 5, 0.0000),
(78, 1, 0.0000),
(78, 2, 0.0000),
(78, 3, 0.0000),
(78, 4, 0.0000),
(78, 5, 0.0000),
(79, 1, 0.0000),
(79, 2, 0.0000),
(79, 3, 0.0000),
(79, 4, 0.0000),
(79, 5, 0.0000),
(80, 1, 0.0000),
(80, 2, 0.0000),
(80, 3, 0.0000),
(80, 4, 0.0000),
(80, 5, 0.0000),
(81, 1, 0.0000),
(81, 2, 0.0000),
(81, 3, 0.0000),
(81, 4, 0.0000),
(81, 5, 0.0000),
(82, 1, 0.0000),
(82, 2, 0.0000),
(82, 3, 0.0000),
(82, 4, 0.0000),
(82, 5, 0.0000),
(83, 1, 0.0000),
(83, 2, 0.0000),
(83, 3, 0.0000),
(83, 4, 0.0000),
(83, 5, 0.0000),
(84, 1, 0.0000),
(84, 2, 0.0000),
(84, 3, 0.0000),
(84, 4, 0.0000),
(84, 5, 0.0000),
(85, 1, 0.0000),
(85, 2, 0.0000),
(85, 3, 0.0000),
(85, 4, 0.0000),
(85, 5, 0.0000),
(86, 1, 0.0000),
(86, 2, 0.0000),
(86, 3, 0.0000),
(86, 4, 0.0000),
(86, 5, 0.0000),
(87, 1, 20.0000),
(87, 2, 35.0000),
(87, 3, 30.0000),
(87, 4, 35.0000),
(87, 5, 40.0000),
(88, 1, 20.0000),
(88, 2, 35.0000),
(88, 3, 30.0000),
(88, 4, 35.0000),
(88, 5, 40.0000),
(93, 1, 20.0000),
(93, 2, 35.0000),
(93, 3, 30.0000),
(93, 4, 35.0000),
(93, 5, 40.0000),
(94, 1, 20.0000),
(94, 2, 35.0000),
(94, 3, 30.0000),
(94, 4, 35.0000),
(94, 5, 40.0000),
(97, 1, 20.0000),
(97, 2, 35.0000),
(97, 3, 30.0000),
(97, 4, 35.0000),
(97, 5, 40.0000),
(98, 1, 20.0000),
(98, 2, 35.0000),
(98, 3, 30.0000),
(98, 4, 35.0000),
(98, 5, 40.0000),
(99, 1, 20.0000),
(99, 2, 35.0000),
(99, 3, 30.0000),
(99, 4, 35.0000),
(99, 5, 40.0000),
(100, 1, 20.0000),
(100, 2, 35.0000),
(100, 3, 30.0000),
(100, 4, 35.0000),
(100, 5, 40.0000),
(107, 1, 80.0000),
(107, 2, 85.0000),
(107, 3, 90.0000),
(107, 4, 95.0000),
(107, 5, 100.0000),
(108, 1, 80.0000),
(108, 2, 85.0000),
(108, 3, 90.0000),
(108, 4, 95.0000),
(108, 5, 100.0000),
(109, 1, 80.0000),
(109, 2, 85.0000),
(109, 3, 90.0000),
(109, 4, 95.0000),
(109, 5, 100.0000),
(110, 1, 80.0000),
(110, 2, 85.0000),
(110, 3, 90.0000),
(110, 4, 95.0000),
(110, 5, 100.0000),
(113, 1, 80.0000),
(113, 2, 85.0000),
(113, 3, 90.0000),
(113, 4, 95.0000),
(113, 5, 100.0000),
(114, 1, 80.0000),
(114, 2, 85.0000),
(114, 3, 90.0000),
(114, 4, 95.0000),
(114, 5, 100.0000),
(119, 1, 80.0000),
(119, 2, 85.0000),
(119, 3, 90.0000),
(119, 4, 95.0000),
(119, 5, 100.0000),
(120, 1, 80.0000),
(120, 2, 85.0000),
(120, 3, 90.0000),
(120, 4, 95.0000),
(120, 5, 100.0000),
(121, 1, 80.0000),
(121, 2, 85.0000),
(121, 3, 90.0000),
(121, 4, 95.0000),
(121, 5, 100.0000),
(122, 1, 80.0000),
(122, 2, 85.0000),
(122, 3, 90.0000),
(122, 4, 95.0000),
(122, 5, 100.0000),
(125, 1, 5.0000),
(125, 2, 10.0000),
(125, 3, 15.0000),
(125, 4, 20.0000),
(125, 5, 20.0000),
(126, 1, 5.0000),
(126, 2, 10.0000),
(126, 3, 15.0000),
(126, 4, 20.0000),
(126, 5, 20.0000),
(127, 1, 5.0000),
(127, 2, 10.0000),
(127, 3, 10.0000),
(127, 4, 10.0000),
(127, 5, 10.0000),
(128, 1, 5.0000),
(128, 2, 10.0000),
(128, 3, 10.0000),
(128, 4, 10.0000),
(128, 5, 10.0000),
(131, 1, 0.0000),
(131, 2, 0.0000),
(131, 3, 5.0000),
(131, 4, 10.0000),
(131, 5, 15.0000),
(132, 1, 0.0000),
(132, 2, 0.0000),
(132, 3, 5.0000),
(132, 4, 10.0000),
(132, 5, 15.0000),
(137, 1, 0.0000),
(137, 2, 5.0000),
(137, 3, 10.0000),
(137, 4, 15.0000),
(137, 5, 20.0000),
(138, 1, 0.0000),
(138, 2, 5.0000),
(138, 3, 10.0000),
(138, 4, 15.0000),
(138, 5, 20.0000),
(139, 1, 5.0000),
(139, 2, 10.0000),
(139, 3, 15.0000),
(139, 4, 15.0000),
(139, 5, 20.0000),
(140, 1, 5.0000),
(140, 2, 10.0000),
(140, 3, 15.0000),
(140, 4, 15.0000),
(140, 5, 20.0000),
(141, 1, 0.0000),
(141, 2, 0.0000),
(141, 3, 0.0000),
(141, 4, 0.0000),
(141, 5, 0.0000),
(142, 1, 0.0000),
(142, 2, 0.0000),
(142, 3, 0.0000),
(142, 4, 0.0000),
(142, 5, 0.0000),
(143, 1, 0.0000),
(143, 2, 0.0000),
(143, 3, 0.0000),
(143, 4, 0.0000),
(143, 5, 0.0000),
(144, 1, 0.0000),
(144, 2, 0.0000),
(144, 3, 0.0000),
(144, 4, 0.0000),
(144, 5, 0.0000),
(145, 1, 0.0000),
(145, 2, 0.0000),
(145, 3, 0.0000),
(145, 4, 0.0000),
(145, 5, 0.0000),
(146, 1, 0.0000),
(146, 2, 0.0000),
(146, 3, 0.0000),
(146, 4, 0.0000),
(146, 5, 0.0000),
(147, 1, 1.0000),
(147, 2, 1.0000),
(147, 3, 1.0000),
(147, 4, 1.0000),
(147, 5, 1.0000),
(148, 1, 1.0000),
(148, 2, 1.0000),
(148, 3, 1.0000),
(148, 4, 1.0000),
(148, 5, 1.0000),
(149, 1, 1.0000),
(149, 2, 1.0000),
(149, 3, 1.0000),
(149, 4, 1.0000),
(149, 5, 1.0000),
(150, 1, 1.0000),
(150, 2, 1.0000),
(150, 3, 1.0000),
(150, 4, 1.0000),
(150, 5, 1.0000),
(151, 1, 1.0000),
(151, 2, 1.0000),
(151, 3, 1.0000),
(151, 4, 1.0000),
(151, 5, 1.0000),
(152, 1, 1.0000),
(152, 2, 1.0000),
(152, 3, 1.0000),
(152, 4, 1.0000),
(152, 5, 1.0000);

-- --------------------------------------------------------

--
-- Table structure for table `perf_metric_quarter_progress`
--

CREATE TABLE `perf_metric_quarter_progress` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `perf_metric_id` bigint(20) UNSIGNED NOT NULL,
  `year_no` tinyint(3) UNSIGNED NOT NULL CHECK (`year_no` between 1 and 5),
  `quarter_no` tinyint(3) UNSIGNED NOT NULL CHECK (`quarter_no` between 1 and 4),
  `progress_value` decimal(14,4) DEFAULT NULL,
  `variable1_value` decimal(14,4) DEFAULT NULL,
  `variable2_value` decimal(14,4) DEFAULT NULL,
  `is_computed` tinyint(1) NOT NULL DEFAULT 0,
  `issue` text DEFAULT NULL,
  `solution` text DEFAULT NULL,
  `recorded_by` varchar(255) DEFAULT NULL,
  `recorded_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perf_metric_quarter_progress`
--

INSERT INTO `perf_metric_quarter_progress` (`id`, `perf_metric_id`, `year_no`, `quarter_no`, `progress_value`, `variable1_value`, `variable2_value`, `is_computed`, `issue`, `solution`, `recorded_by`, `recorded_at`, `updated_at`) VALUES
(2, 1, 1, 1, 12.0000, NULL, NULL, 0, 'sensor calibration delay', 'recalibrate next quarter', 'admin@mfu.ac.th', '2026-07-04 04:37:34', '2026-07-04 04:37:34'),
(3, 2, 1, 1, 20.0000, NULL, NULL, 0, 'x', 'y', 'admin@mfu.ac.th', '2026-07-04 04:34:19', '2026-07-04 04:34:19'),
(4, 3, 1, 1, 30.0000, NULL, NULL, 0, 'x', 'y', 'admin@mfu.ac.th', '2026-07-04 04:34:19', '2026-07-04 04:34:19'),
(7, 1, 1, 2, 15.0000, NULL, NULL, 0, 'field survey delayed', 'reschedule site visit', 'admin@mfu.ac.th', '2026-07-04 13:51:48', '2026-07-04 13:51:48'),
(27, 4, 1, 1, 3.0000, NULL, NULL, 0, 'Nothing else', 'Nothing else', 'member@mfu.ac.th', '2026-07-08 10:10:23', '2026-07-08 10:10:23'),
(28, 4, 1, 2, 9.0000, NULL, NULL, 0, 'Nothing else', 'Nothing else', 'committee.lead@mfu.ac.th', '2026-07-05 15:53:24', '2026-07-05 15:53:24'),
(32, 5, 1, 1, 1.0000, NULL, NULL, 0, 'Nothing else', 'Nothing else', 'admin@mfu.ac.th', '2026-07-05 05:47:29', '2026-07-05 05:47:29'),
(33, 5, 1, 2, 5.0000, NULL, NULL, 0, 'Nothing else', 'Nothing else', 'admin@mfu.ac.th', '2026-07-05 05:48:02', '2026-07-05 05:48:02'),
(40, 6, 1, 2, 5.0000, NULL, NULL, 0, 'Nothing', 'Nothing', 'admin@mfu.ac.th', '2026-07-06 04:36:40', '2026-07-06 04:36:40'),
(42, 12, 1, 3, 118.0000, 118.0000, NULL, 1, 'Nothing', 'Nothing', 'admin@mfu.ac.th', '2026-07-06 05:55:56', '2026-07-30 07:01:57'),
(44, 14, 1, 3, 60.0000, 60.0000, NULL, 1, 'nothing', 'nothing', 'admin@mfu.ac.th', '2026-07-06 09:43:14', '2026-07-30 07:01:57'),
(45, 16, 1, 3, 79.0000, 79.0000, NULL, 1, 'nothing', 'nothing', 'member@mfu.ac.th', '2026-07-09 05:29:19', '2026-07-30 07:01:57'),
(46, 4, 1, 3, 10.0000, NULL, NULL, 0, 'nothing', 'nothing', 'admin@mfu.ac.th', '2026-07-07 01:55:18', '2026-07-07 01:55:18'),
(47, 5, 1, 3, 6.0000, NULL, NULL, 0, 'nothing', 'nothing', 'admin@mfu.ac.th', '2026-07-07 01:55:43', '2026-07-07 01:55:43'),
(48, 6, 1, 3, 6.0000, NULL, NULL, 0, 'nothing', 'nothing', 'admin@mfu.ac.th', '2026-07-07 01:55:51', '2026-07-07 01:55:51'),
(51, 32, 1, 1, 42.0000, NULL, NULL, 0, 'Metric issue Q1', 'Metric solution Q1', 'admin@mfu.ac.th', '2026-07-09 05:09:18', '2026-07-09 05:09:18'),
(52, 10, 1, 2, NULL, NULL, NULL, 0, 'Collect data in Q3', 'No', 'admin@mfu.ac.th', '2026-07-09 05:21:58', '2026-07-09 05:21:58'),
(53, 12, 1, 2, NULL, NULL, NULL, 0, 'Collect data in Q3', 'No', 'admin@mfu.ac.th', '2026-07-09 05:22:08', '2026-07-09 05:22:08'),
(54, 14, 1, 2, NULL, NULL, NULL, 0, 'Collect data in Q3', 'No', 'admin@mfu.ac.th', '2026-07-09 05:22:16', '2026-07-09 05:22:16'),
(55, 16, 1, 2, NULL, NULL, NULL, 0, 'Collect data in Q3', 'No', 'admin@mfu.ac.th', '2026-07-09 05:22:25', '2026-07-09 05:22:25'),
(57, 4, 2, 1, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(58, 4, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(59, 4, 2, 3, 5.0000, 5.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(60, 4, 2, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(61, 4, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(62, 4, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(63, 4, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(64, 4, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(65, 4, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(66, 4, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(67, 4, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(68, 4, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(153, 5, 2, 1, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(154, 5, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(155, 5, 2, 3, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(156, 5, 2, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(157, 5, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(158, 5, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(159, 5, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(160, 5, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(161, 5, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(162, 5, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(163, 5, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(164, 5, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(189, 6, 2, 1, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(190, 6, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(191, 6, 2, 3, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(192, 6, 2, 4, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(193, 6, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(194, 6, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(195, 6, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(196, 6, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(197, 6, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(198, 6, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(199, 6, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(200, 6, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(237, 66, 2, 1, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(238, 66, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(239, 66, 2, 3, 5.0000, 5.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(240, 66, 2, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(241, 66, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(242, 66, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(243, 66, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(244, 66, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(245, 66, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(246, 66, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(247, 66, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(248, 66, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(401, 78, 2, 1, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(402, 78, 2, 2, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(403, 78, 2, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(404, 78, 2, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(405, 78, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(406, 78, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(407, 78, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(408, 78, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(409, 78, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(410, 78, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(411, 78, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(412, 78, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(425, 80, 2, 1, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(426, 80, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(427, 80, 2, 3, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(428, 80, 2, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(429, 80, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(430, 80, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(431, 80, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(432, 80, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(433, 80, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(434, 80, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(435, 80, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(436, 80, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(461, 82, 2, 1, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(462, 82, 2, 2, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(463, 82, 2, 3, 7.0000, 7.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(464, 82, 2, 4, 9.0000, 9.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(465, 82, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(466, 82, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(467, 82, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(468, 82, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(469, 82, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(470, 82, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(471, 82, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(472, 82, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(509, 84, 2, 1, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(510, 84, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(511, 84, 2, 3, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(512, 84, 2, 4, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(513, 84, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(514, 84, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(515, 84, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(516, 84, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(517, 84, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(518, 84, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(519, 84, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(520, 84, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(569, 86, 2, 1, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(570, 86, 2, 2, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(571, 86, 2, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(572, 86, 2, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(573, 86, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(574, 86, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(575, 86, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(576, 86, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(577, 86, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(578, 86, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(579, 86, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(580, 86, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(917, 70, 2, 1, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:08:49'),
(918, 70, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:08:49'),
(919, 70, 2, 3, 6.0000, 6.0000, NULL, 1, 'Nothing', 'Nothing', 'admin@mfu.ac.th', '2026-07-21 04:51:07', '2026-07-30 11:08:49'),
(920, 70, 2, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:08:49'),
(921, 70, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(922, 70, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(923, 70, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(924, 70, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(925, 70, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(926, 70, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(927, 70, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(928, 70, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1313, 72, 2, 1, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 00:44:32'),
(1314, 72, 2, 2, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 00:44:32'),
(1315, 72, 2, 3, 7.0000, 7.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 00:44:32'),
(1316, 72, 2, 4, 9.0000, 9.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 00:44:32'),
(1317, 72, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1318, 72, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1319, 72, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1320, 72, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1321, 72, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1322, 72, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1323, 72, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1324, 72, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1925, 74, 2, 1, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:09'),
(1926, 74, 2, 2, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:09'),
(1927, 74, 2, 3, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:09'),
(1928, 74, 2, 4, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:09'),
(1929, 74, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1930, 74, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1931, 74, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1932, 74, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1933, 74, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1934, 74, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(1935, 74, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(1936, 74, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2129, 76, 2, 1, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:14'),
(2130, 76, 2, 2, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:14'),
(2131, 76, 2, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:14'),
(2132, 76, 2, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:09:14'),
(2133, 76, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2134, 76, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2135, 76, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2136, 76, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2137, 76, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2138, 76, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2139, 76, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2140, 76, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2249, 68, 2, 1, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:08:30'),
(2250, 68, 2, 2, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:08:30'),
(2251, 68, 2, 3, 2.0000, 2.0000, NULL, 1, 'Nothing', 'Nothing', 'admin@mfu.ac.th', '2026-07-23 16:20:23', '2026-07-30 11:08:30'),
(2252, 68, 2, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 11:08:30'),
(2253, 68, 3, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2254, 68, 3, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2255, 68, 3, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2256, 68, 3, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2257, 68, 4, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2258, 68, 4, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 06:40:08'),
(2259, 68, 4, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(2260, 68, 4, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:08'),
(3417, 32, 2, 1, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:07'),
(3418, 32, 2, 2, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-31 01:04:07'),
(3419, 32, 2, 3, 79.6296, 43.0000, 54.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3420, 32, 2, 4, 79.6296, 43.0000, 54.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3465, 10, 1, 3, 62.0000, 62.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3466, 10, 1, 4, 62.0000, 62.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3532, 12, 1, 4, 118.0000, 118.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3538, 14, 1, 4, 60.0000, 60.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3540, 16, 1, 4, 79.0000, 79.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3549, 16, 2, 3, 73.0000, 73.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3550, 16, 2, 4, 73.0000, 73.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3553, 10, 2, 3, 45.0000, 45.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3554, 10, 2, 4, 45.0000, 45.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3557, 12, 2, 3, 96.0000, 96.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3558, 12, 2, 4, 96.0000, 96.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3561, 14, 2, 3, 58.0000, 58.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3562, 14, 2, 4, 58.0000, 58.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3583, 10, 3, 3, 34.0000, 34.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3584, 10, 3, 4, 34.0000, 34.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3585, 10, 4, 3, 93.0000, 93.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3586, 10, 4, 4, 93.0000, 93.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3587, 10, 5, 3, 106.0000, 106.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3588, 10, 5, 4, 106.0000, 106.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:41:25'),
(3593, 12, 3, 3, 91.0000, 91.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3594, 12, 3, 4, 91.0000, 91.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3595, 12, 4, 3, 106.0000, 106.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3596, 12, 4, 4, 106.0000, 106.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3597, 12, 5, 3, 108.0000, 108.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3598, 12, 5, 4, 108.0000, 108.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3603, 14, 3, 3, 57.0000, 57.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3604, 14, 3, 4, 57.0000, 57.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3605, 14, 4, 3, 35.0000, 35.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3606, 14, 4, 4, 35.0000, 35.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3607, 14, 5, 3, 67.0000, 67.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3608, 14, 5, 4, 67.0000, 67.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3613, 16, 3, 3, 86.0000, 86.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3614, 16, 3, 4, 86.0000, 86.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3615, 16, 4, 3, 68.0000, 68.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3616, 16, 4, 4, 68.0000, 68.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3617, 16, 5, 3, 100.0000, 100.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3618, 16, 5, 4, 100.0000, 100.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:01:57'),
(3863, 32, 1, 3, 76.8116, 53.0000, 69.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3864, 32, 1, 4, 76.8116, 53.0000, 69.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3867, 32, 3, 3, 70.4545, 62.0000, 88.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3868, 32, 3, 4, 70.4545, 62.0000, 88.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3869, 32, 4, 3, 78.1955, 104.0000, 133.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(3870, 32, 4, 4, 78.1955, 104.0000, 133.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:30:38'),
(4311, 38, 1, 3, 75.8621, 22.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4312, 38, 1, 4, 75.8621, 22.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4313, 38, 2, 3, 70.0000, 14.0000, 20.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4314, 38, 2, 4, 70.0000, 14.0000, 20.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4315, 38, 3, 3, 71.1111, 32.0000, 45.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4316, 38, 3, 4, 71.1111, 32.0000, 45.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4317, 38, 4, 3, 79.6610, 47.0000, 59.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4318, 38, 4, 4, 79.6610, 47.0000, 59.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 08:40:56'),
(4893, 42, 1, 3, 75.0000, 30.0000, 40.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4894, 42, 1, 4, 75.0000, 30.0000, 40.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4895, 42, 2, 3, 68.0851, 32.0000, 47.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4896, 42, 2, 4, 68.0851, 32.0000, 47.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4897, 42, 3, 3, 75.0000, 27.0000, 36.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4898, 42, 3, 4, 75.0000, 27.0000, 36.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4899, 42, 4, 3, 79.6875, 51.0000, 64.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4900, 42, 4, 4, 79.6875, 51.0000, 64.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:10'),
(4925, 44, 1, 3, 80.0000, 4.0000, 5.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4926, 44, 1, 4, 80.0000, 4.0000, 5.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4927, 44, 2, 3, 56.2500, 9.0000, 16.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4928, 44, 2, 4, 56.2500, 9.0000, 16.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4929, 44, 3, 3, 58.6207, 17.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4930, 44, 3, 4, 58.6207, 17.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4931, 44, 4, 3, 73.3333, 22.0000, 30.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(4932, 44, 4, 4, 73.3333, 22.0000, 30.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:31:45'),
(5093, 88, 1, 3, 0.0000, 0.0000, 69.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5094, 88, 1, 4, 0.0000, 0.0000, 69.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5095, 88, 2, 3, 0.0000, 0.0000, 54.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5096, 88, 2, 4, 0.0000, 0.0000, 54.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5097, 88, 3, 3, 0.0000, 0.0000, 88.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5098, 88, 3, 4, 0.0000, 0.0000, 88.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5099, 88, 4, 3, 0.0000, 0.0000, 133.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5100, 88, 4, 4, 0.0000, 0.0000, 133.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:11'),
(5141, 94, 1, 3, 34.4828, 10.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5142, 94, 1, 4, 34.4828, 10.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5143, 94, 2, 3, 35.0000, 7.0000, 20.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5144, 94, 2, 4, 35.0000, 7.0000, 20.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5145, 94, 3, 3, 44.4444, 20.0000, 45.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5146, 94, 3, 4, 44.4444, 20.0000, 45.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5147, 94, 4, 3, 20.3390, 12.0000, 59.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5148, 94, 4, 4, 20.3390, 12.0000, 59.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:42:41'),
(5197, 98, 1, 3, 47.5000, 19.0000, 40.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5198, 98, 1, 4, 47.5000, 19.0000, 40.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5199, 98, 2, 3, 44.6809, 21.0000, 47.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5200, 98, 2, 4, 44.6809, 21.0000, 47.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5201, 98, 3, 3, 66.6667, 24.0000, 36.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5202, 98, 3, 4, 66.6667, 24.0000, 36.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5203, 98, 4, 3, 29.6875, 19.0000, 64.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5204, 98, 4, 4, 29.6875, 19.0000, 64.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:03'),
(5261, 100, 1, 3, 20.0000, 1.0000, 5.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5262, 100, 1, 4, 20.0000, 1.0000, 5.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5263, 100, 2, 3, 12.5000, 2.0000, 16.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5264, 100, 2, 4, 12.5000, 2.0000, 16.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5265, 100, 3, 3, 13.7931, 4.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5266, 100, 3, 4, 13.7931, 4.0000, 29.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5267, 100, 4, 3, 6.6667, 2.0000, 30.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(5268, 100, 4, 4, 6.6667, 2.0000, 30.0000, 1, NULL, NULL, NULL, NULL, '2026-07-30 07:43:29'),
(6377, 126, 1, 3, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6378, 126, 1, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6379, 126, 2, 3, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6380, 126, 2, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6381, 126, 3, 3, 15.0000, 15.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6382, 126, 3, 4, 15.0000, 15.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6383, 126, 4, 3, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6384, 126, 4, 4, 6.0000, 6.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6385, 126, 5, 3, 8.0000, 8.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6386, 126, 5, 4, 8.0000, 8.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:49:30'),
(6437, 128, 1, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6438, 128, 1, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6439, 128, 2, 3, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6440, 128, 2, 4, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6441, 128, 3, 3, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6442, 128, 3, 4, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6443, 128, 4, 3, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6444, 128, 4, 4, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6445, 128, 5, 3, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6446, 128, 5, 4, 0.0000, 0.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:51:29'),
(6507, 132, 1, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6508, 132, 1, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6509, 132, 2, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6510, 132, 2, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6511, 132, 3, 3, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6512, 132, 3, 4, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6513, 132, 4, 3, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6514, 132, 4, 4, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6515, 132, 5, 3, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6516, 132, 5, 4, 3.0000, 3.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:52:38'),
(6597, 138, 1, 3, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6598, 138, 1, 4, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6599, 138, 2, 3, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6600, 138, 2, 4, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6601, 138, 3, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6602, 138, 3, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6603, 138, 4, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6604, 138, 4, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6605, 138, 5, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6606, 138, 5, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:14'),
(6687, 140, 1, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6688, 140, 1, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6689, 140, 2, 3, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6690, 140, 2, 4, 1.0000, 1.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6691, 140, 3, 3, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6692, 140, 3, 4, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6693, 140, 4, 3, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6694, 140, 4, 4, 4.0000, 4.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6695, 140, 5, 3, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40'),
(6696, 140, 5, 4, 2.0000, 2.0000, NULL, 1, NULL, NULL, NULL, NULL, '2026-07-30 10:53:40');

-- --------------------------------------------------------

--
-- Table structure for table `strategic_set`
--

CREATE TABLE `strategic_set` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `start_year` smallint(6) NOT NULL,
  `end_year` smallint(6) GENERATED ALWAYS AS (`start_year` + 4) STORED,
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
  `cloned_from_set_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `strategic_set`
--

INSERT INTO `strategic_set` (`id`, `name`, `description`, `start_year`, `status`, `cloned_from_set_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'SHS Strategic Set 2565-2569', NULL, 2565, 'draft', NULL, 'admin@mfu.ac.th', '2026-07-03 07:33:28', '2026-07-04 04:40:47'),
(2, 'SHS Strategic Set 2573-2577 (clone)', NULL, 2574, 'draft', 1, 'admin@mfu.ac.th', '2026-07-03 07:53:02', '2026-07-03 07:53:02');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `unit_name_th` varchar(100) NOT NULL,
  `unit_name_en` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `unit_name_th`, `unit_name_en`, `description`, `created_at`, `updated_at`) VALUES
(1, 'ร้อยละ', 'Percent', 'Percentage value (%).', '2026-07-05 07:34:22', '2026-07-05 07:34:22'),
(2, 'คะแนน', 'Score', 'Score on a defined scale.', '2026-07-05 07:34:22', '2026-07-05 07:34:22'),
(3, 'อัตราส่วน', 'Ratio', 'Ratio between two quantities.', '2026-07-05 07:34:22', '2026-07-05 07:34:22'),
(4, 'จำนวน', 'Item', 'A simple count of items.', '2026-07-05 07:34:22', '2026-07-05 07:48:23'),
(5, 'คน', 'Persons', 'Number of people.', '2026-07-05 07:34:22', '2026-07-05 07:34:22'),
(6, 'ครั้ง', 'Time', 'Number of Times.', '2026-07-05 07:34:22', '2026-07-05 07:48:57'),
(9, 'กิโลกรัม', 'Kilograms', 'Weight in kg.', '2026-07-05 07:40:58', '2026-07-05 07:40:58'),
(11, 'กลุ่ม', 'Group', 'Number of Groups.', '2026-07-05 07:49:54', '2026-07-05 07:49:54'),
(12, 'FTE', 'FTE', 'Number of FTE.', '2026-07-05 07:50:29', '2026-07-05 07:50:29'),
(13, 'แหล่งทุน', 'Funding Source', 'Number of Funding sources.', '2026-07-05 07:51:15', '2026-07-05 07:51:15'),
(14, 'ตัน CO2 เทียบเท่า', 'tons of CO2 equivalent', 'Quantity of tons of CO2 equivalent.', '2026-07-05 07:51:47', '2026-07-05 07:51:47'),
(18, 'ปี', 'Year', 'Number of Year', '2026-07-31 08:13:28', '2026-07-31 08:13:28'),
(19, 'วัน', 'day', 'Number of days', '2026-07-31 08:13:47', '2026-07-31 08:13:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_program`
--
ALTER TABLE `academic_program`
  ADD PRIMARY KEY (`code`);

--
-- Indexes for table `committees`
--
ALTER TABLE `committees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_committee_head` (`head_id`);

--
-- Indexes for table `committee_memberships`
--
ALTER TABLE `committee_memberships`
  ADD PRIMARY KEY (`faculty_id`,`committee_id`),
  ADD KEY `idx_membership_committee` (`committee_id`);

--
-- Indexes for table `curriculum`
--
ALTER TABLE `curriculum`
  ADD PRIMARY KEY (`code`),
  ADD KEY `idx_curriculum_program` (`program_code`,`sort_order`);

--
-- Indexes for table `data_source`
--
ALTER TABLE `data_source`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ds_creator` (`created_by`),
  ADD KEY `idx_ds_committee` (`committee_id`,`status`);

--
-- Indexes for table `data_source_column`
--
ALTER TABLE `data_source_column`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ds_col` (`data_source_id`,`col_key`),
  ADD KEY `idx_dsc_sort` (`data_source_id`,`sort_order`);

--
-- Indexes for table `data_source_entry`
--
ALTER TABLE `data_source_entry`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dse_recorder` (`recorded_by`),
  ADD KEY `idx_dse_period` (`data_source_id`,`year`,`quarter`);

--
-- Indexes for table `data_source_link`
--
ALTER TABLE `data_source_link`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ds_link` (`data_source_id`,`target_key`),
  ADD KEY `idx_dsl_kpi` (`library_kpi_id`),
  ADD KEY `idx_dsl_metric` (`library_metric_id`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_faculty_email` (`email`);

--
-- Indexes for table `formula`
--
ALTER TABLE `formula`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `formula_variable`
--
ALTER TABLE `formula_variable`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_formula_symbol` (`formula_id`,`symbol`);

--
-- Indexes for table `formula_version`
--
ALTER TABLE `formula_version`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_formula_version` (`formula_id`,`version`);

--
-- Indexes for table `kpi_categories`
--
ALTER TABLE `kpi_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kpi_categories_sort` (`sort_order`),
  ADD KEY `idx_kpi_categories_set_sort` (`set_id`,`sort_order`),
  ADD KEY `fk_kpi_categories_type` (`kpi_type`),
  ADD KEY `idx_kpi_categories_type` (`set_id`,`kpi_type`,`sort_order`);

--
-- Indexes for table `kpi_type`
--
ALTER TABLE `kpi_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `library_kpi`
--
ALTER TABLE `library_kpi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lkpi_committee` (`committee_id`),
  ADD KEY `fk_lkpi_person` (`person_in_charge_id`),
  ADD KEY `fk_lkpi_formula` (`formula_id`),
  ADD KEY `idx_lkpi_set` (`set_id`),
  ADD KEY `idx_lkpi_category` (`category_id`),
  ADD KEY `fk_lkpi_type` (`kpi_type`),
  ADD KEY `idx_lkpi_routine_category` (`routine_category_id`);

--
-- Indexes for table `library_kpi_annual_target`
--
ALTER TABLE `library_kpi_annual_target`
  ADD PRIMARY KEY (`kpi_id`,`year_no`);

--
-- Indexes for table `library_metric`
--
ALTER TABLE `library_metric`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lmet_category` (`category_id`),
  ADD KEY `fk_lmet_committee` (`committee_id`),
  ADD KEY `fk_lmet_person` (`person_in_charge_id`),
  ADD KEY `idx_lmet_kpi` (`kpi_id`);

--
-- Indexes for table `library_metric_annual_target`
--
ALTER TABLE `library_metric_annual_target`
  ADD PRIMARY KEY (`metric_id`,`year_no`);

--
-- Indexes for table `performance_record`
--
ALTER TABLE `performance_record`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_perf_set` (`source_set_id`);

--
-- Indexes for table `performance_record_period`
--
ALTER TABLE `performance_record_period`
  ADD PRIMARY KEY (`record_id`,`year_no`,`quarter_no`);

--
-- Indexes for table `perf_kpi`
--
ALTER TABLE `perf_kpi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pkpi_formula` (`formula_id`),
  ADD KEY `idx_pkpi_record` (`record_id`),
  ADD KEY `idx_pkpi_source` (`source_kpi_id`);

--
-- Indexes for table `perf_kpi_annual_target`
--
ALTER TABLE `perf_kpi_annual_target`
  ADD PRIMARY KEY (`perf_kpi_id`,`year_no`);

--
-- Indexes for table `perf_kpi_approval`
--
ALTER TABLE `perf_kpi_approval`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pkpi_approval` (`perf_kpi_id`,`year_no`,`quarter_no`),
  ADD KEY `fk_pka_record` (`record_id`);

--
-- Indexes for table `perf_kpi_approval_event`
--
ALTER TABLE `perf_kpi_approval_event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pkae_appr` (`approval_id`);

--
-- Indexes for table `perf_kpi_quarter_progress`
--
ALTER TABLE `perf_kpi_quarter_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pkpi_period` (`perf_kpi_id`,`year_no`,`quarter_no`);

--
-- Indexes for table `perf_metric`
--
ALTER TABLE `perf_metric`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pmet_source` (`source_metric_id`),
  ADD KEY `idx_pmet_kpi` (`perf_kpi_id`);

--
-- Indexes for table `perf_metric_annual_target`
--
ALTER TABLE `perf_metric_annual_target`
  ADD PRIMARY KEY (`perf_metric_id`,`year_no`);

--
-- Indexes for table `perf_metric_quarter_progress`
--
ALTER TABLE `perf_metric_quarter_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pmet_period` (`perf_metric_id`,`year_no`,`quarter_no`);

--
-- Indexes for table `strategic_set`
--
ALTER TABLE `strategic_set`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_set_start_year` (`start_year`),
  ADD KEY `fk_set_clone` (`cloned_from_set_id`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_units_en` (`unit_name_en`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `data_source`
--
ALTER TABLE `data_source`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `data_source_column`
--
ALTER TABLE `data_source_column`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `data_source_entry`
--
ALTER TABLE `data_source_entry`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=662;

--
-- AUTO_INCREMENT for table `data_source_link`
--
ALTER TABLE `data_source_link`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `formula`
--
ALTER TABLE `formula`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `formula_variable`
--
ALTER TABLE `formula_variable`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `formula_version`
--
ALTER TABLE `formula_version`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `library_kpi`
--
ALTER TABLE `library_kpi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `library_metric`
--
ALTER TABLE `library_metric`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `performance_record`
--
ALTER TABLE `performance_record`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `perf_kpi`
--
ALTER TABLE `perf_kpi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `perf_kpi_approval`
--
ALTER TABLE `perf_kpi_approval`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `perf_kpi_approval_event`
--
ALTER TABLE `perf_kpi_approval_event`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `perf_kpi_quarter_progress`
--
ALTER TABLE `perf_kpi_quarter_progress`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79873;

--
-- AUTO_INCREMENT for table `perf_metric`
--
ALTER TABLE `perf_metric`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `perf_metric_quarter_progress`
--
ALTER TABLE `perf_metric_quarter_progress`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12871;

--
-- AUTO_INCREMENT for table `strategic_set`
--
ALTER TABLE `strategic_set`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `committees`
--
ALTER TABLE `committees`
  ADD CONSTRAINT `fk_committee_head` FOREIGN KEY (`head_id`) REFERENCES `faculty` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `committee_memberships`
--
ALTER TABLE `committee_memberships`
  ADD CONSTRAINT `fk_membership_committee` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_membership_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum`
--
ALTER TABLE `curriculum`
  ADD CONSTRAINT `fk_curriculum_program` FOREIGN KEY (`program_code`) REFERENCES `academic_program` (`code`);

--
-- Constraints for table `data_source`
--
ALTER TABLE `data_source`
  ADD CONSTRAINT `fk_ds_committee` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`),
  ADD CONSTRAINT `fk_ds_creator` FOREIGN KEY (`created_by`) REFERENCES `faculty` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `data_source_column`
--
ALTER TABLE `data_source_column`
  ADD CONSTRAINT `fk_dsc_source` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `data_source_entry`
--
ALTER TABLE `data_source_entry`
  ADD CONSTRAINT `fk_dse_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `faculty` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_dse_source` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `data_source_link`
--
ALTER TABLE `data_source_link`
  ADD CONSTRAINT `fk_dsl_kpi` FOREIGN KEY (`library_kpi_id`) REFERENCES `library_kpi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dsl_metric` FOREIGN KEY (`library_metric_id`) REFERENCES `library_metric` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dsl_source` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `formula_variable`
--
ALTER TABLE `formula_variable`
  ADD CONSTRAINT `fk_fvar_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `formula_version`
--
ALTER TABLE `formula_version`
  ADD CONSTRAINT `fk_fver_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kpi_categories`
--
ALTER TABLE `kpi_categories`
  ADD CONSTRAINT `fk_kpi_categories_set` FOREIGN KEY (`set_id`) REFERENCES `strategic_set` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_kpi_categories_type` FOREIGN KEY (`kpi_type`) REFERENCES `kpi_type` (`id`);

--
-- Constraints for table `library_kpi`
--
ALTER TABLE `library_kpi`
  ADD CONSTRAINT `fk_lkpi_category` FOREIGN KEY (`category_id`) REFERENCES `kpi_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lkpi_committee` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lkpi_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lkpi_person` FOREIGN KEY (`person_in_charge_id`) REFERENCES `faculty` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lkpi_routine_category` FOREIGN KEY (`routine_category_id`) REFERENCES `kpi_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lkpi_set` FOREIGN KEY (`set_id`) REFERENCES `strategic_set` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lkpi_type` FOREIGN KEY (`kpi_type`) REFERENCES `kpi_type` (`id`);

--
-- Constraints for table `library_kpi_annual_target`
--
ALTER TABLE `library_kpi_annual_target`
  ADD CONSTRAINT `fk_lkpitgt_kpi` FOREIGN KEY (`kpi_id`) REFERENCES `library_kpi` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `library_metric`
--
ALTER TABLE `library_metric`
  ADD CONSTRAINT `fk_lmet_category` FOREIGN KEY (`category_id`) REFERENCES `kpi_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lmet_committee` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lmet_kpi` FOREIGN KEY (`kpi_id`) REFERENCES `library_kpi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lmet_person` FOREIGN KEY (`person_in_charge_id`) REFERENCES `faculty` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `library_metric_annual_target`
--
ALTER TABLE `library_metric_annual_target`
  ADD CONSTRAINT `fk_lmettgt_metric` FOREIGN KEY (`metric_id`) REFERENCES `library_metric` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `performance_record`
--
ALTER TABLE `performance_record`
  ADD CONSTRAINT `fk_perf_set` FOREIGN KEY (`source_set_id`) REFERENCES `strategic_set` (`id`);

--
-- Constraints for table `performance_record_period`
--
ALTER TABLE `performance_record_period`
  ADD CONSTRAINT `fk_perf_period_record` FOREIGN KEY (`record_id`) REFERENCES `performance_record` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `perf_kpi`
--
ALTER TABLE `perf_kpi`
  ADD CONSTRAINT `fk_pkpi_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pkpi_record` FOREIGN KEY (`record_id`) REFERENCES `performance_record` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pkpi_source` FOREIGN KEY (`source_kpi_id`) REFERENCES `library_kpi` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `perf_kpi_annual_target`
--
ALTER TABLE `perf_kpi_annual_target`
  ADD CONSTRAINT `fk_pkpitgt` FOREIGN KEY (`perf_kpi_id`) REFERENCES `perf_kpi` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `perf_kpi_approval`
--
ALTER TABLE `perf_kpi_approval`
  ADD CONSTRAINT `fk_pka_kpi` FOREIGN KEY (`perf_kpi_id`) REFERENCES `perf_kpi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pka_record` FOREIGN KEY (`record_id`) REFERENCES `performance_record` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `perf_kpi_approval_event`
--
ALTER TABLE `perf_kpi_approval_event`
  ADD CONSTRAINT `fk_pkae_appr` FOREIGN KEY (`approval_id`) REFERENCES `perf_kpi_approval` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `perf_kpi_quarter_progress`
--
ALTER TABLE `perf_kpi_quarter_progress`
  ADD CONSTRAINT `fk_pkpiqp` FOREIGN KEY (`perf_kpi_id`) REFERENCES `perf_kpi` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `perf_metric`
--
ALTER TABLE `perf_metric`
  ADD CONSTRAINT `fk_pmet_kpi` FOREIGN KEY (`perf_kpi_id`) REFERENCES `perf_kpi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pmet_source` FOREIGN KEY (`source_metric_id`) REFERENCES `library_metric` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `perf_metric_annual_target`
--
ALTER TABLE `perf_metric_annual_target`
  ADD CONSTRAINT `fk_pmettgt` FOREIGN KEY (`perf_metric_id`) REFERENCES `perf_metric` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `perf_metric_quarter_progress`
--
ALTER TABLE `perf_metric_quarter_progress`
  ADD CONSTRAINT `fk_pmetqp` FOREIGN KEY (`perf_metric_id`) REFERENCES `perf_metric` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `strategic_set`
--
ALTER TABLE `strategic_set`
  ADD CONSTRAINT `fk_set_clone` FOREIGN KEY (`cloned_from_set_id`) REFERENCES `strategic_set` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
