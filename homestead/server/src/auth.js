import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function newToken() {
  return randomBytes(24).toString('base64url');
}

// Fields safe to show other members.
export function publicMember(m) {
  return {
    id: m.id,
    name: m.name,
    neighborhood: m.neighborhood,
    householdSize: m.householdSize,
    bio: m.bio,
    joinedAt: m.joinedAt,
  };
}
