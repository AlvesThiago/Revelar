import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

let emptyAccountHash: string | null = null;

function dummyAccountHash() {
  if (!emptyAccountHash) {
    emptyAccountHash = hashPassword("revelar-empty-account");
  }
  return emptyAccountHash;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, "hex");
  if (storedBuf.length !== test.length) return false;
  return timingSafeEqual(storedBuf, test);
}

export function verifyPasswordForAccount(password: string, stored?: string | null) {
  if (!stored) {
    verifyPassword(password, dummyAccountHash());
    return false;
  }
  return verifyPassword(password, stored);
}

export function newId() {
  return crypto.randomUUID();
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
