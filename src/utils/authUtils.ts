import { fetchUserCredentialsFromCloud, saveUserCredentialsToCloud } from './firebase';

// Web Crypto API helper for hashing passwords securely
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface UserAccount {
  username: string;
  passwordHash: string;
  updatedAt: string;
}

export const DEFAULT_USERNAME = 'weiwei2027';
export const INITIAL_USER_ACCOUNT_KEY = 'wsm_user_account';
export const AUTH_SESSION_KEY = 'wsm_auth_session';

export async function getStoredAccount(): Promise<UserAccount> {
  // Try fetching from cloud database first
  const cloudCreds = await fetchUserCredentialsFromCloud();
  if (cloudCreds) {
    const acc: UserAccount = {
      username: cloudCreds.username,
      passwordHash: cloudCreds.passwordHash,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(INITIAL_USER_ACCOUNT_KEY, JSON.stringify(acc));
    return acc;
  }

  const stored = localStorage.getItem(INITIAL_USER_ACCOUNT_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  
  const defaultHash = await hashPassword('SHIJIAN2027!');
  const defaultAccount: UserAccount = {
    username: DEFAULT_USERNAME,
    passwordHash: defaultHash,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(INITIAL_USER_ACCOUNT_KEY, JSON.stringify(defaultAccount));
  // Sync to Firestore asynchronously
  saveUserCredentialsToCloud(defaultAccount.username, defaultAccount.passwordHash);
  return defaultAccount;
}

export async function verifyLogin(usernameInput: string, passwordInput: string): Promise<boolean> {
  const account = await getStoredAccount();
  if (usernameInput.trim() !== account.username) {
    return false;
  }
  const inputHash = await hashPassword(passwordInput);
  return inputHash === account.passwordHash;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
}

export function setAuthenticated(authed: boolean): void {
  if (authed) {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

