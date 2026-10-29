import "server-only";

import { randomInt } from "node:crypto";

// No look-alikes (0/O, 1/l/I) so it can be read out or retyped without mistakes.
const LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const ALPHABET = LETTERS + DIGITS;

/**
 * A one-time password for a new or reset account, e.g. "Xk7m-Qp2r-Tn8w-Hd4z"
 * (~93 bits). The account must replace it at first sign-in.
 */
export function generateTempPassword() {
  for (;;) {
    const chars = Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]);
    const value = chars.join("");
    if (/\d/.test(value) && /[a-z]/i.test(value)) {
      return value.match(/.{4}/g)!.join("-");
    }
  }
}
