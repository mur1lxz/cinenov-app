import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/** Gera `scrypt$<salt>$<hash>` com salt aleatório (nunca o mesmo hash para a mesma senha). */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Compara a senha informada com o hash salvo, em tempo constante. */
export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Hash "de mentira" usado quando o e-mail não existe, para o login levar o mesmo
// tempo nos dois casos e não revelar quais e-mails estão cadastrados.
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString("hex"));
