import { OAuth2Client } from "google-auth-library";

export const ALLOWED_GOOGLE_DOMAIN = process.env.ALLOWED_GOOGLE_DOMAIN || "bloom-firm.com";

let client: OAuth2Client | null = null;
const getClient = (): OAuth2Client => {
  if (client) return client;
  client = new OAuth2Client();
  return client;
};

export interface AuthenticatedUser {
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<AuthenticatedUser> {
  const audience = process.env.VITE_GOOGLE_CLIENT_ID;
  if (!audience) {
    throw new Error("Google Client ID(VITE_GOOGLE_CLIENT_ID)がサーバーに設定されていません。");
  }

  const ticket = await getClient().verifyIdToken({ idToken, audience });
  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new Error("Googleトークンの検証に失敗しました。");
  }
  if (payload.hd !== ALLOWED_GOOGLE_DOMAIN) {
    throw new Error(`@${ALLOWED_GOOGLE_DOMAIN} のGoogleアカウントでログインしてください。`);
  }

  return { email: payload.email, name: payload.name, picture: payload.picture };
}

export function extractBearerToken(authorizationHeader: string | undefined | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
