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

-- Insert a test user (hashed password for 'admin')
INSERT OR IGNORE INTO users (username, password, mfa_enabled, mfa_secret, mfa_backup_codes) 
VALUES ('exampleUsec', '$2b$10$bo0.lTwyBgUGhDgdJhXcbe7NAtu0.ZPTJnyJrft9A5zoBOcifDUJm', 0, NULL, NULL);
INSERT OR IGNORE INTO users (username, password, mfa_enabled, mfa_secret, mfa_backup_codes) 
VALUES ('main', '$2b$10$sYSXq.MkBRXESb/o.l8p5eBLGhT/VL.2J4mwYZX4JljbS2ZkhOTDi', 0, NULL, NULL);

CREATE TABLE IF NOT EXISTS mfa_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);