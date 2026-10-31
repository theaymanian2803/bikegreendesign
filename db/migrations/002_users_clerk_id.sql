-- Migration 002: add Clerk user ID column to users table
ALTER TABLE users ADD COLUMN clerk_id TEXT;