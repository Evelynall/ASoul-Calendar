import { GIST_TOKEN_KEY } from '../constants';

export function loadGistToken() {
    const sessionToken = sessionStorage.getItem(GIST_TOKEN_KEY);
    if (sessionToken) return sessionToken;

    const legacyToken = localStorage.getItem(GIST_TOKEN_KEY);
    if (legacyToken) {
        sessionStorage.setItem(GIST_TOKEN_KEY, legacyToken);
        localStorage.removeItem(GIST_TOKEN_KEY);
        return legacyToken;
    }

    return '';
}

export function saveGistToken(token) {
    localStorage.removeItem(GIST_TOKEN_KEY);
    if (token) {
        sessionStorage.setItem(GIST_TOKEN_KEY, token);
    } else {
        sessionStorage.removeItem(GIST_TOKEN_KEY);
    }
}
