import { GIST_TOKEN_KEY, GIST_REMEMBER_TOKEN_KEY } from '../constants';

export function loadRememberGistToken() {
    return localStorage.getItem(GIST_REMEMBER_TOKEN_KEY) === 'true';
}

export function loadGistToken() {
    const remember = loadRememberGistToken();

    if (remember) {
        return localStorage.getItem(GIST_TOKEN_KEY) || '';
    }

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

export function saveGistToken(token, remember) {
    if (remember) {
        if (token) {
            localStorage.setItem(GIST_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(GIST_TOKEN_KEY);
        }
        sessionStorage.removeItem(GIST_TOKEN_KEY);
    } else {
        localStorage.removeItem(GIST_TOKEN_KEY);
        if (token) {
            sessionStorage.setItem(GIST_TOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(GIST_TOKEN_KEY);
        }
    }
}

export function saveRememberGistToken(remember) {
    localStorage.setItem(GIST_REMEMBER_TOKEN_KEY, remember ? 'true' : 'false');
}
