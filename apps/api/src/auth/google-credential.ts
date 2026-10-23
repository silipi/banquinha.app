import { createRemoteJWKSet, jwtVerify } from 'jose';

const googleKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

export interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
}

/**
 * Verifies the ID token ("credential") returned by Google Identity Services on the web
 * and returns the account, or null when it is invalid or the email is not verified.
 */
export async function verifyGoogleCredential(
  credential: string,
  clientId: string,
): Promise<GoogleIdentity | null> {
  try {
    const { payload } = await jwtVerify(credential, googleKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.email_verified !== true
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}
