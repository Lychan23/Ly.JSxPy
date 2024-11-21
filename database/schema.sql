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
  `password` TEXT NOT NULL,
  `mfa_enabled` BOOLEAN DEFAULT 0,
  `mfa_secret` TEXT,
  `mfa_backup_codes` TEXT
);

-- Insert a test user (hashed password for 'admin12345')
INSERT OR IGNORE INTO users (username, password, mfa_enabled, mfa_secret, mfa_backup_codes) 
VALUES ('exampleUsec', '$2b$10$bo0.lTwyBgUGhDgdJhXcbe7NAtu0.ZPTJnyJrft9A5zoBOcifDUJm', 0, NULL, NULL);
INSERT OR IGNORE INTO users (username, password, mfa_enabled, mfa_secret, mfa_backup_codes) 
VALUES ('main', '$2b$10$Mb/6SHYLIWcTwl2/H6rWnOLwAumcm4iCOS0DQaqy/oDjXxc1SbzYe', 0, NULL, NULL);
