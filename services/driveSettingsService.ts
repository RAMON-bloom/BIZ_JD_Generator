/// <reference types="vite/client" />

import { loadGisScript } from './googleIdentity';
import { AppSettingsDocument, MediaPreset } from '../types';

const SETTINGS_FILE_NAME = 'jd-scout-handler-settings.json';
// Full Drive scope (not drive.file) so an agent can find and write into a settings file a
// researcher owns and merely shared with them — drive.file only ever grants access to files
// the app itself created or that the user picked via Google Picker, neither of which applies
// to a file another user owns. This is an "internal" Workspace OAuth app, so no Google
// verification review is required for this broader scope, but it does need to be added on
// the OAuth consent screen in Google Cloud Console, and existing users must re-consent.
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const USERINFO_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
export const DRIVE_FILE_ID_STORAGE_KEY = 'jdScoutHandlerDriveFileId';
export const RESEARCHER_ROSTER_STORAGE_KEY = 'jdScoutHandlerResearcherRoster';
export const SHARED_WITH_AGENT_EMAIL_STORAGE_KEY = 'jdScoutHandlerSharedWithAgentEmail';

export interface DriveConnection {
  email: string | null;
}

let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiresAt = 0;

export const isDriveConfigured = (): boolean => !!GOOGLE_CLIENT_ID;

const getTokenClient = async () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client IDが設定されていません(VITE_GOOGLE_CLIENT_ID)。');
  }
  await loadGisScript();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: `${DRIVE_SCOPE} ${USERINFO_SCOPE}`,
      callback: () => {},
      error_callback: () => {},
    });
  }
  return tokenClient;
};

// Google's callback never fires if the user closes/blocks the consent popup, so without a
// timeout + error_callback the connect button would stay disabled ("接続中...") forever.
const INTERACTIVE_TIMEOUT_MS = 30000;
// Silent (background) attempts should fail fast instead of hanging the sync/reconnect UI.
const SILENT_TIMEOUT_MS = 8000;

const requestAccessToken = (prompt: '' | 'consent'): Promise<string> => {
  return new Promise((resolve, reject) => {
    getTokenClient()
      .then((client) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error('Google認証がタイムアウトしました。もう一度お試しください。'));
        }, prompt === 'consent' ? INTERACTIVE_TIMEOUT_MS : SILENT_TIMEOUT_MS);

        client.callback = (resp: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          if (resp.error) {
            reject(new Error(resp.error));
            return;
          }
          accessToken = resp.access_token;
          tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3300) * 1000;
          resolve(accessToken as string);
        };
        client.error_callback = (err: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          const message = err?.type === 'popup_closed'
            ? 'Googleの認証画面が閉じられました。もう一度お試しください。'
            : (err?.message || 'Googleの認証に失敗しました。もう一度お試しください。');
          reject(new Error(message));
        };
        client.requestAccessToken({ prompt });
      })
      .catch(reject);
  });
};

const ensureAccessToken = async (interactive: boolean): Promise<string> => {
  if (accessToken && Date.now() < tokenExpiresAt - 60000) {
    return accessToken;
  }
  return requestAccessToken(interactive ? 'consent' : '');
};

const fetchUserEmail = async (token: string): Promise<string | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email || null;
  } catch {
    return null;
  }
};

export const connectDrive = async (): Promise<DriveConnection> => {
  const token = await requestAccessToken('consent');
  const email = await fetchUserEmail(token);
  return { email };
};

export const tryReconnectSilently = async (): Promise<DriveConnection | null> => {
  try {
    const token = await requestAccessToken('');
    const email = await fetchUserEmail(token);
    return { email };
  } catch {
    return null;
  }
};

export const disconnectDrive = (): void => {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem(DRIVE_FILE_ID_STORAGE_KEY);
};

const describeDriveError = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    return body?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
};

const findSettingsFileId = async (token: string): Promise<string | null> => {
  const q = encodeURIComponent(`name='${SETTINGS_FILE_NAME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Google Driveのファイル検索に失敗しました。(${await describeDriveError(res)})`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
};

const createSettingsFile = async (token: string, data: unknown): Promise<string> => {
  const boundary = 'jdscouthandlerboundary';
  const metadata = { name: SETTINGS_FILE_NAME, mimeType: 'application/json' };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n` +
    `--${boundary}--`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Google Driveへの設定ファイル作成に失敗しました。(${await describeDriveError(res)})`);
  const created = await res.json();
  return created.id;
};

const updateSettingsFile = async (token: string, fileId: string, data: unknown): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Google Driveの設定ファイル更新に失敗しました。(${await describeDriveError(res)})`);
};

const readSettingsFile = async (token: string, fileId: string): Promise<any> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Driveの設定ファイル読込に失敗しました。(${await describeDriveError(res)})`);
  return res.json();
};

export const loadSettingsFromDrive = async (): Promise<{ fileId: string; data: AppSettingsDocument } | null> => {
  const token = await ensureAccessToken(false);
  let fileId = localStorage.getItem(DRIVE_FILE_ID_STORAGE_KEY);
  if (!fileId) {
    fileId = await findSettingsFileId(token);
  }
  if (!fileId) return null;
  const data = await readSettingsFile(token, fileId);
  localStorage.setItem(DRIVE_FILE_ID_STORAGE_KEY, fileId);
  return { fileId, data };
};

export const saveSettingsToDrive = async (data: AppSettingsDocument): Promise<string> => {
  const token = await ensureAccessToken(false);
  let fileId = localStorage.getItem(DRIVE_FILE_ID_STORAGE_KEY);
  if (!fileId) {
    fileId = await findSettingsFileId(token);
  }
  if (fileId) {
    await updateSettingsFile(token, fileId, data);
  } else {
    fileId = await createSettingsFile(token, data);
  }
  localStorage.setItem(DRIVE_FILE_ID_STORAGE_KEY, fileId);
  return fileId;
};

// --- Agent/Researcher team sharing ---------------------------------------
// No backend: a researcher shares their own settings file with their agent's email (Drive
// ACL). Because the OAuth scope is full `drive` (not drive.file), the agent's own app
// session can search for and write into that file directly — no manual file-selection step.

const escapeDriveQueryValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const findResearcherSettingsFileId = async (token: string, researcherEmail: string): Promise<string | null> => {
  const q = encodeURIComponent(
    `name='${SETTINGS_FILE_NAME}' and trashed=false and '${escapeDriveQueryValue(researcherEmail)}' in owners`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Google Driveのファイル検索に失敗しました。(${await describeDriveError(res)})`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
};

export const sharePersonalSettingsFile = async (granteeEmail: string, currentSettings: AppSettingsDocument): Promise<void> => {
  const token = await ensureAccessToken(false);
  let fileId = localStorage.getItem(DRIVE_FILE_ID_STORAGE_KEY);
  if (!fileId) {
    fileId = await findSettingsFileId(token);
  }
  if (!fileId) {
    fileId = await createSettingsFile(token, currentSettings);
    localStorage.setItem(DRIVE_FILE_ID_STORAGE_KEY, fileId);
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'writer', type: 'user', emailAddress: granteeEmail }),
  });
  if (!res.ok) throw new Error(`Google Driveの共有設定に失敗しました。(${await describeDriveError(res)})`);
};

// Overwrites only the researcher's `presets` array with the agent's current full array (no
// per-preset merge — the agent's array wins entirely). `activePresetIdByTab` is left as-is
// when it still points at a surviving preset, otherwise it falls back to the first preset, so
// the researcher isn't silently dropped onto a preset the agent didn't intend to touch.
export const overwriteResearcherSettings = async (
  researcherEmail: string,
  presets: MediaPreset[]
): Promise<void> => {
  const token = await ensureAccessToken(false);

  const fileId = await findResearcherSettingsFileId(token, researcherEmail);
  if (!fileId) {
    throw new Error('共有された設定ファイルが見つかりませんでした。リサーチャー側で「担当エージェントと共有する」が実行済みか確認してください。');
  }

  let existing: AppSettingsDocument | null = null;
  try {
    existing = await readSettingsFile(token, fileId);
  } catch {
    // First-ever overwrite, or the file is unreadable — proceed without prior state.
  }

  const presetIds = new Set(presets.map(p => p.id));
  const fallbackId = presets[0]?.id;
  const nextActive = existing?.activePresetIdByTab
    ? { ...existing.activePresetIdByTab }
    : { extract: fallbackId, scout: fallbackId };
  (Object.keys(nextActive) as Array<'extract' | 'scout'>).forEach(tab => {
    if (!presetIds.has(nextActive[tab])) nextActive[tab] = fallbackId;
  });

  const merged: AppSettingsDocument = {
    schemaVersion: existing?.schemaVersion ?? 1,
    presets,
    activePresetIdByTab: nextActive,
  };

  await updateSettingsFile(token, fileId, merged);
};
