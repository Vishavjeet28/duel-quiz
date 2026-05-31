// Firebase Authentication Service — Google & Apple Sign-In
// Uses expo-auth-session for OAuth flow (works with Expo Go + standalone builds)
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { API_URL } from './api';

WebBrowser.maybeCompleteAuthSession();

// =====================================================================
// FIREBASE CONFIGURATION
// Configured with credentials for duel-quiz-48c69
// =====================================================================
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC4bUPT0-xxctL0y8wDuovPjnyaQdPdusI',
  authDomain: 'duel-quiz-48c69.firebaseapp.com',
  projectId: 'duel-quiz-48c69',
  storageBucket: 'duel-quiz-48c69.firebasestorage.app',
  messagingSenderId: '564392294692',
  appId: '1:564392294692:ios:71b87dc47593186ff61bb1',
  // Google Sign-In OAuth 2.0 Client ID (Web client from Firebase → Auth → Google)
  webClientId: '564392294692-v7ke3lavjj50uk84ei0pv62vqbnivkm6.apps.googleusercontent.com',
};

// Safe base64url decoder since React Native doesn't have global atob
function decodeBase64Url(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  let binary = '';
  for (let i = 0; i < base64.length; i += 4) {
    const o1 = chars.indexOf(base64[i]);
    const o2 = chars.indexOf(base64[i + 1]);
    const o3 = chars.indexOf(base64[i + 2]);
    const o4 = chars.indexOf(base64[i + 3]);

    const code = (o1 << 18) | (o2 << 12) | (o3 << 6) | o4;

    const c1 = (code >> 16) & 0xff;
    const c2 = (code >> 8) & 0xff;
    const c3 = code & 0xff;

    if (o1 === 64) break;
    binary += String.fromCharCode(c1);
    if (o3 !== 64 && o3 !== -1) {
      binary += String.fromCharCode(c2);
    }
    if (o4 !== 64 && o4 !== -1) {
      binary += String.fromCharCode(c3);
    }
  }
  return decodeURIComponent(
    binary
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

// =====================================================================
// GOOGLE SIGN-IN  (via expo-auth-session + Firebase REST API)
// This approach works in Expo Go AND standalone builds
// =====================================================================
export async function signInWithGoogle(): Promise<{
  idToken: string;
  user: {
    email: string;
    name: string;
    photoUrl?: string;
    googleUid: string;
  };
 }> {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'duel',
    path: 'auth/google',
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: FIREBASE_CONFIG.webClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: {
      nonce: Math.random().toString(36).substring(2),
    },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error(result.type === 'cancel' ? 'Sign in was cancelled' : 'Google sign-in failed');
  }

  const idToken = result.params.id_token;
  if (!idToken) throw new Error('No ID token returned from Google');

  // Decode JWT payload safely
  const payload = JSON.parse(decodeBase64Url(idToken.split('.')[1]));

  return {
    idToken,
    user: {
      email: payload.email,
      name: payload.name,
      photoUrl: payload.picture,
      googleUid: payload.sub,
    },
  };
}

// =====================================================================
// APPLE SIGN-IN  (uses native Apple auth — iOS only)
// =====================================================================
export async function signInWithApple(): Promise<{
  identityToken: string;
  user: {
    email: string | null;
    name: string | null;
    appleUid: string;
  };
}> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In failed — no identity token');
  }

  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ')
    : null;

  return {
    identityToken: credential.identityToken,
    user: {
      email: credential.email || null,
      name: fullName,
      appleUid: credential.user,
    },
  };
}

// =====================================================================
// SEND TOKEN TO BACKEND — Backend verifies with Firebase Admin SDK
// =====================================================================
export async function authenticateWithBackend(params: {
  provider: 'google' | 'apple';
  idToken: string;
  email: string | null;
  name: string | null;
  providerUid: string;
}): Promise<{ user: any; token: string; isNewUser: boolean }> {
  const response = await fetch(`${API_URL}/v1/auth/social-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Authentication failed');
  }

  return response.json();
}
