let _getAccessToken: () => string | null = () => null;
let _setAccessToken: (t: string) => void = () => undefined;
let _doLogout: () => void = () => undefined;

export function initAuthBridge(
    getAccessToken: () => string | null,
    setAccessToken: (t: string) => void,
    doLogout: () => void,
): void {
    _getAccessToken = getAccessToken;
    _setAccessToken = setAccessToken;
    _doLogout = doLogout;
}

export const authBridge = {
    getAccessToken: () => _getAccessToken(),
    setAccessToken: (t: string) => _setAccessToken(t),
    logout: () => _doLogout(),
};
