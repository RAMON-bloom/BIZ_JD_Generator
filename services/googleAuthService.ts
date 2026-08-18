/// <reference types="vite/client" />

import { loadGisScript } from './googleIdentity';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const HOSTED_DOMAIN = 'bloom-firm.com';

export const isGoogleLoginConfigured = (): boolean => !!GOOGLE_CLIENT_ID;

export interface GoogleUser {
  email: string;
  name?: string;
  picture?: string;
}

export const decodeIdTokenPayload = (idToken: string): GoogleUser | null => {
  try {
    const payloadBase64Url = idToken.split('.')[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));
    return { email: json.email, name: json.name, picture: json.picture };
  } catch {
    return null;
  }
};

export const initGoogleSignIn = async (
  onCredential: (idToken: string, user: GoogleUser | null) => void
): Promise<void> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client IDが設定されていません(VITE_GOOGLE_CLIENT_ID)。');
  }
  await loadGisScript();
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    hosted_domain: HOSTED_DOMAIN,
    callback: (response: { credential: string }) => {
      onCredential(response.credential, decodeIdTokenPayload(response.credential));
    },
  });
};

export const renderGoogleSignInButton = (container: HTMLElement): void => {
  window.google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
  });
};

export const signOutGoogle = (): void => {
  window.google?.accounts?.id?.disableAutoSelect?.();
};
