// Kilter's own backend, as used by its app. Not a documented or supported API: see
// https://github.com/wmmg101/kilter-mcp, which these values come from.
export const KILTER_TOKEN_URL = 'https://idp.kiltergrips.com/realms/kilter/protocol/openid-connect/token';
export const KILTER_LOGS_URL = 'https://portal.kiltergrips.com/api/logs';

/** Kilter's public app client -- there is no way to register our own. */
export const KILTER_CLIENT_ID = 'kilter';
/** `offline_access` is what makes the IdP hand back a refresh token, so we never keep the password. */
export const KILTER_SCOPE = 'openid offline_access';

/** `external_logs.source` and the imported session/gym name. */
export const KILTER_SOURCE = 'kilter';
export const KILTER_GYM_NAME = 'Kilter Board';

/** Refresh this long before the access token actually expires. */
export const EXPIRY_MARGIN_MS = 60_000;
/** Assumed lifetime when the token response omits `expires_in`. */
export const DEFAULT_TOKEN_LIFETIME_MS = 300_000;
/** Wait after a rejected login before allowing another, so retries can't trip Keycloak's brute-force lockout. */
export const LOGIN_LOCKOUT_MS = 60_000;
/** Kilter's logbook should be fetched at most this often. */
export const MIN_SYNC_INTERVAL_MS = 60_000;
