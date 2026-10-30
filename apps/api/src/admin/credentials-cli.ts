// Generates the admin credentials for one environment:
// `pnpm --filter @banquinha/api admin:credentials`. Asks for a password (not echoed) and
// prints ADMIN_USERNAME, ADMIN_PASSWORD_HASH and ADMIN_TOTP_SECRET plus the otpauth:// URI
// for the authenticator app. Nothing is written to disk; see docs/deploy.md for where the
// values go.
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { hashPassword } from '../auth/password.js';
import { generateTotpSecret, totpUri } from './totp.js';

const MIN_PASSWORD_LENGTH = 16;

function ask(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) {
    // Prints the question, then nothing for the keys typed.
    const output = rl as unknown as { _writeToOutput: (text: string) => void };
    output._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    }),
  );
}

const environment =
  (await ask('Environment (production/staging) [production]: ')).trim() ||
  'production';
const suggested = `adm-${randomBytes(9).toString('base64url')}`;
const username = (await ask(`Username [${suggested}]: `)).trim() || suggested;
if (username.length < 12) throw new Error('Use at least 12 characters');

const password = await ask(
  `Password (at least ${MIN_PASSWORD_LENGTH} characters): `,
  true,
);
if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters`);
}
if ((await ask('Password again: ', true)) !== password) {
  throw new Error('The passwords do not match');
}

const totpSecret = generateTotpSecret();
console.log(`
ADMIN_USERNAME=${username}
ADMIN_PASSWORD_HASH=${await hashPassword(password)}
ADMIN_TOTP_SECRET=${totpSecret}

Add to the authenticator app (paste the URI, or type the secret above as a time-based key):
${totpUri(totpSecret, `admin-${environment}`)}
`);
