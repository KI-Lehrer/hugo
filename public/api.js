import { state } from './state.js';

let resolveToken;
let rejectToken;
let sessionRequest;
const tokenReady = new Promise((resolve, reject) => {
  resolveToken = resolve;
  rejectToken = reject;
});
// A startup failure can precede the first interactive request.
tokenReady.catch(() => {});

export function startSession() {
  if (sessionRequest) return sessionRequest;
  sessionRequest = (async () => {
    try {
      const response = await fetch('/api/session');
      const result = await response.json();
      if (!response.ok || typeof result.token !== 'string' || !result.token) {
        throw new Error('Die lokale Sitzung konnte nicht geöffnet werden.');
      }
      state.token = result.token;
      resolveToken(result.token);
      return result.token;
    } catch (error) {
      rejectToken(error);
      throw error;
    }
  })();
  return sessionRequest;
}

export async function authenticatedFetch(route, options = {}) {
  await tokenReady;
  return fetch(route, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'X-Hugo-Token': state.token,
    },
  });
}

export async function api(route, options = {}) {
  const response = await authenticatedFetch(route, options);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result.error || 'Verbindung zum lokalen Helfer unterbrochen.',
    );
  }
  return result;
}
