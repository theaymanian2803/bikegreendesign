-- Migration 003: add last_sign_in_at column to users table
ALTER TABLE users ADD COLUMN last_sign_in_at TEXT;