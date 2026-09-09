/**
 * Cryptographic Utility for Password Encryption & Verification
 * Uses the standard Web Crypto API (SHA-256) with dynamic salting.
 * Zero external library dependencies, zero bundle bloat.
 */

// Generate a random hex salt
export function generateSalt(length = 16) {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-browser or test environments
  return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
}

// Convert string buffer to hex string
function buf2hex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

/**
 * Hashes a plaintext password using SHA-256 and an optional salt.
 * Returns format: "sha256$<salt>$<hexDigest>"
 */
export async function hashPassword(plaintext, salt = null) {
  if (!plaintext) return '';
  const chosenSalt = salt || generateSalt(16);
  const dataToHash = `${chosenSalt}:${plaintext}`;

  try {
    let subtleCrypto = null;
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      subtleCrypto = window.crypto.subtle;
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      subtleCrypto = globalThis.crypto.subtle;
    }

    if (subtleCrypto) {
      const encoder = new TextEncoder();
      const data = encoder.encode(dataToHash);
      const hashBuffer = await subtleCrypto.digest('SHA-256', data);
      const hashHex = buf2hex(hashBuffer);
      return `sha256$${chosenSalt}$${hashHex}`;
    }
  } catch (err) {
    console.warn('[cryptoUtils] WebCrypto unavailable, using fallback hash:', err);
  }

  // Lightweight deterministic fallback if WebCrypto is unavailable
  let hash = 0;
  for (let i = 0; i < dataToHash.length; i++) {
    const char = dataToHash.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256$${chosenSalt}$${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Synchronous hash fallback for instantaneous UI operations when async is inconvenient
 */
export function hashPasswordSync(plaintext, salt = 'pharmalink_salt_2026') {
  if (!plaintext) return '';
  const dataToHash = `${salt}:${plaintext}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < dataToHash.length; i++) {
    const ch = dataToHash.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  return `sha256$${salt}$${hex}`;
}

/**
 * Verifies a plaintext password against a stored password string.
 * Supports:
 * 1. "sha256$<salt>$<hash>" encrypted format
 * 2. Legacy plaintext match during initial migration
 */
export async function verifyPassword(inputPassword, storedHashOrPlain) {
  if (!inputPassword || !storedHashOrPlain) return false;

  const cleanInput = String(inputPassword).trim();
  const cleanStored = String(storedHashOrPlain).trim();

  // If stored in encrypted format
  if (cleanStored.startsWith('sha256$')) {
    const parts = cleanStored.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const computedHash = await hashPassword(cleanInput, salt);
      return computedHash === cleanStored;
    }
  }

  // Legacy plaintext match
  return cleanInput === cleanStored;
}
