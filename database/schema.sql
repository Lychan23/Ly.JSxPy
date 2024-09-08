-- database/schema.sql
CREATE TABLE IF NOT EXISTS `warns` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `server_id` varchar(20) NOT NULL,
  `moderator_id` varchar(20) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL
);

-- Insert a test user (hashed password for 'admin')
INSERT OR IGNORE INTO users (username, password) VALUES ('exampleUsec', '$2b$10$bo0.lTwyBgUGhDgdJhXcbe7NAtu0.ZPTJnyJrft9A5zoBOcifDUJm');
INSERT OR IGNORE INTO users (username, password) VALUES ('main', '$2b$10$bo0.lTwyBgUGhDgdJhXcbe7NAtu0.ZPTJnyJrft9A5zoBOcifDUJm');