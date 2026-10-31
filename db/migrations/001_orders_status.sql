-- Migration 001: add status and updated_at columns to orders table
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE orders ADD COLUMN updated_at TEXT;