import { z } from "zod";

import { findUserById, issueSessionToken, randomToken, type SessionUser } from "./auth.server";
import { getTurso } from "./client";
import { hashPassword, verifyPassword } from "./password.server";

const emailInput = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .email("Enter a valid email address");

const passwordInput = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

const nameInput = z.string().trim().min(1, "Name is required").max(80, "Name is too long");

export const registerInputSchema = z.object({
  name: nameInput,
  email: emailInput,
  password: passwordInput,
});

export const loginInputSchema = z.object({
  email: emailInput,
  password: z.string().min(1, "Password is required").max(200),
});

export const upgradeInputSchema = z.object({
  name: nameInput,
  email: emailInput,
  password: passwordInput,
});

export type AuthSession = {
  user: SessionUser;
  token: string;
};

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid input.");
  }
  return result.data;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function sessionFor(user: SessionUser): Promise<AuthSession> {
  return { user, token: await issueSessionToken(user.id) };
}

export async function registerEmailAccount(input: unknown): Promise<AuthSession> {
  const data = parseInput(registerInputSchema, input);
  const email = normalizeEmail(data.email);

  const existing = await getTurso().execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (existing.rows[0]) {
    throw new Error("An account with this email already exists. Try signing in.");
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(data.password);
  const insert = await getTurso().execute({
    sql: `INSERT INTO users
            (email, password_hash, display_name, is_guest, created_at, last_sign_in_at)
          VALUES (?, ?, ?, 0, ?, ?)`,
    args: [email, passwordHash, data.name.trim(), now, now],
  });

  const user = await findUserById(Number(insert.lastInsertRowid));
  if (!user) throw new Error("Could not create the account.");
  return sessionFor(user);
}

export async function loginEmailAccount(input: unknown): Promise<AuthSession> {
  const data = parseInput(loginInputSchema, input);
  const email = normalizeEmail(data.email);
  const result = await getTurso().execute({
    sql: "SELECT id, password_hash, is_guest FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  const row = result.rows[0];
  const passwordHash = row ? String(row.password_hash ?? "") : "";
  if (!row || Number(row.is_guest) === 1 || !passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const valid = await verifyPassword(data.password, passwordHash);
  if (!valid) throw new Error("Invalid email or password.");

  const id = Number(row.id);
  await getTurso().execute({
    sql: "UPDATE users SET last_sign_in_at = ? WHERE id = ?",
    args: [new Date().toISOString(), id],
  });

  const user = await findUserById(id);
  if (!user) throw new Error("Invalid email or password.");
  return sessionFor(user);
}

export async function createGuestAccount(): Promise<AuthSession> {
  const now = new Date().toISOString();
  const email = `guest-${randomToken(12)}@guests.pathway.local`;
  const insert = await getTurso().execute({
    sql: `INSERT INTO users
            (email, display_name, is_guest, is_admin, created_at, last_sign_in_at)
          VALUES (?, 'Guest', 1, 0, ?, ?)`,
    args: [email, now, now],
  });

  const user = await findUserById(Number(insert.lastInsertRowid));
  if (!user) throw new Error("Could not start a guest session.");
  return sessionFor(user);
}

export async function upgradeGuestAccount(userId: number, input: unknown): Promise<AuthSession> {
  const data = parseInput(upgradeInputSchema, input);
  const current = await findUserById(userId);
  if (!current) throw new Error("Sign in required.");
  if (!current.isGuest) throw new Error("This account already has an email.");

  const email = normalizeEmail(data.email);
  const conflict = await getTurso().execute({
    sql: "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
    args: [email, userId],
  });
  if (conflict.rows[0]) {
    throw new Error("An account with this email already exists. Try signing in.");
  }

  const passwordHash = await hashPassword(data.password);
  await getTurso().execute({
    sql: `UPDATE users
          SET email = ?, password_hash = ?, display_name = ?, is_guest = 0,
              last_sign_in_at = ?
          WHERE id = ?`,
    args: [email, passwordHash, data.name.trim(), new Date().toISOString(), userId],
  });

  const user = await findUserById(userId);
  if (!user) throw new Error("Could not update the account.");
  return sessionFor(user);
}
