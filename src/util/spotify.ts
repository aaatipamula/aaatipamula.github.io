/**
 * spotify.ts — A single-file TypeScript library for Spotify API auth & requests.
 *
 * Supports:
 *   - Authorization Code Flow (user auth)
 *   - Client Credentials Flow (server-to-server)
 *   - PKCE Flow (public clients / SPAs)
 *   - Automatic token refresh
 *   - Typed helpers for common endpoints
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotifyConfig {
  clientId: string;
  clientSecret?: string; // not required for PKCE
  redirectUri?: string;
  scopes?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface TokenStore {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  scope?: string;
}

// ---- Spotify resource types (extend as needed) ----------------------------

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  href: string;
  external_urls: { spotify: string };
  genres?: string[];
  popularity?: number;
  images?: SpotifyImage[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  uri: string;
  href: string;
  total_tracks: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url: string | null;
  uri: string;
  href: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  uri: string;
  href: string;
  images: SpotifyImage[];
  followers: { total: number };
  country?: string;
  product?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  public: boolean | null;
  collaborative: boolean;
  owner: { id: string; display_name: string | null };
  tracks: { total: number; href: string };
  images: SpotifyImage[];
  uri: string;
  href: string;
}

export interface PagingObject<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
  href: string;
}

export interface SearchResult {
  tracks?: PagingObject<SpotifyTrack>;
  artists?: PagingObject<SpotifyArtist>;
  albums?: PagingObject<SpotifyAlbum>;
  playlists?: PagingObject<SpotifyPlaylist>;
}

export type SearchType = "track" | "artist" | "album" | "playlist";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SpotifyError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(`Spotify API Error ${status}: ${message}`);
    this.name = "SpotifyError";
  }
}

export class SpotifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generatePKCEPair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array.buffer);
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
  const codeChallenge = base64UrlEncode(digest);
  return { codeVerifier, codeChallenge };
}

export function generateState(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer).slice(0, length);
}

// ---------------------------------------------------------------------------
// Core client
// ---------------------------------------------------------------------------

const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

export class SpotifyClient {
  private config: SpotifyConfig;
  private tokenStore: TokenStore | null = null;

  constructor(config: SpotifyConfig) {
    this.config = config;
  }

  // -------------------------------------------------------------------------
  // Auth — Authorization Code Flow
  // -------------------------------------------------------------------------

  /** Build the authorization URL to redirect the user to. */
  getAuthorizationUrl(state?: string): string {
    if (!this.config.redirectUri) throw new SpotifyAuthError("redirectUri is required");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      ...(this.config.scopes ? { scope: this.config.scopes.join(" ") } : {}),
      ...(state ? { state } : {}),
    });
    return `${ACCOUNTS_BASE}/authorize?${params}`;
  }

  /** Exchange the authorization code for tokens. */
  async exchangeCode(code: string): Promise<TokenStore> {
    if (!this.config.clientSecret) throw new SpotifyAuthError("clientSecret required for Authorization Code Flow");
    if (!this.config.redirectUri) throw new SpotifyAuthError("redirectUri is required");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
    });

    return this.fetchToken(body);
  }

  // -------------------------------------------------------------------------
  // Auth — PKCE Flow
  // -------------------------------------------------------------------------

  /** Build the authorization URL for PKCE. Returns URL + codeVerifier to store client-side. */
  async getPKCEAuthorizationUrl(state?: string): Promise<{
    url: string;
    codeVerifier: string;
  }> {
    if (!this.config.redirectUri) throw new SpotifyAuthError("redirectUri is required");
    const { codeVerifier, codeChallenge } = await generatePKCEPair();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      ...(this.config.scopes ? { scope: this.config.scopes.join(" ") } : {}),
      ...(state ? { state } : {}),
    });
    return { url: `${ACCOUNTS_BASE}/authorize?${params}`, codeVerifier };
  }

  /** Exchange the PKCE authorization code for tokens. */
  async exchangePKCECode(code: string, codeVerifier: string): Promise<TokenStore> {
    if (!this.config.redirectUri) throw new SpotifyAuthError("redirectUri is required");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: codeVerifier,
    });

    return this.fetchToken(body, false); // no Basic auth for PKCE
  }

  // -------------------------------------------------------------------------
  // Auth — Client Credentials Flow
  // -------------------------------------------------------------------------

  /** Obtain a token using Client Credentials (no user context). */
  async authenticateAsApp(): Promise<TokenStore> {
    if (!this.config.clientSecret) throw new SpotifyAuthError("clientSecret required for Client Credentials Flow");

    const body = new URLSearchParams({ grant_type: "client_credentials" });
    return this.fetchToken(body);
  }

  // -------------------------------------------------------------------------
  // Token management
  // -------------------------------------------------------------------------

  /** Manually set tokens (e.g. loaded from storage). */
  setTokens(store: TokenStore): void {
    this.tokenStore = store;
  }

  getTokens(): TokenStore | null {
    return this.tokenStore;
  }

  isTokenExpired(): boolean {
    if (!this.tokenStore) return true;
    return Date.now() >= this.tokenStore.expiresAt - 30_000; // 30s buffer
  }

  /** Refresh the access token using the stored refresh token. */
  async refreshAccessToken(): Promise<TokenStore> {
    if (!this.tokenStore?.refreshToken) {
      throw new SpotifyAuthError("No refresh token available");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.tokenStore.refreshToken,
      ...(this.config.clientSecret ? {} : { client_id: this.config.clientId }),
    });

    const store = await this.fetchToken(body, !!this.config.clientSecret);
    // Preserve existing refresh token if new one not returned
    if (!store.refreshToken && this.tokenStore.refreshToken) {
      store.refreshToken = this.tokenStore.refreshToken;
    }
    return store;
  }

  /** Ensure a valid access token, refreshing if needed. */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokenStore) throw new SpotifyAuthError("Not authenticated");
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.tokenStore!.accessToken;
  }

  private async fetchToken(body: URLSearchParams, useBasicAuth = true): Promise<TokenStore> {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (useBasicAuth && this.config.clientSecret) {
      headers["Authorization"] =
        "Basic " + btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    }

    const res = await fetch(`${ACCOUNTS_BASE}/api/token`, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new SpotifyAuthError(
        `Token request failed (${res.status}): ${(err as any).error_description ?? res.statusText}`
      );
    }

    const data: TokenResponse = await res.json();
    const store: TokenStore = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    };
    this.tokenStore = store;
    return store;
  }

  // -------------------------------------------------------------------------
  // Generic HTTP helpers
  // -------------------------------------------------------------------------

  async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string | number>; body?: unknown } = {},
    retries = 3
  ): Promise<T> {
    const token = await this.getValidAccessToken();

    let url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    if (options.params) {
      const qs = new URLSearchParams(
        Object.entries(options.params).reduce((acc, [k, v]) => {
          acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      );
      url += `?${qs}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (res.status === 429 && retries > 0) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? 1);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.request<T>(method, path, options, retries - 1);
    }

    if (res.status === 204) return undefined as unknown as T;

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new SpotifyError(
        res.status,
        data?.error?.message ?? res.statusText,
        data
      );
    }

    return data as T;
  }

  get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, { body });
  }

  // -------------------------------------------------------------------------
  // Spotify API — Users
  // -------------------------------------------------------------------------

  getCurrentUser(): Promise<SpotifyUser> {
    return this.get<SpotifyUser>("/me");
  }

  getUser(userId: string): Promise<SpotifyUser> {
    return this.get<SpotifyUser>(`/users/${encodeURIComponent(userId)}`);
  }

  // -------------------------------------------------------------------------
  // Spotify API — Tracks
  // -------------------------------------------------------------------------

  getTrack(trackId: string): Promise<SpotifyTrack> {
    return this.get<SpotifyTrack>(`/tracks/${encodeURIComponent(trackId)}`);
  }

  getTracks(trackIds: string[]): Promise<{ tracks: SpotifyTrack[] }> {
    return this.get<{ tracks: SpotifyTrack[] }>("/tracks", { ids: trackIds.join(",") });
  }

  // -------------------------------------------------------------------------
  // Spotify API — Artists
  // -------------------------------------------------------------------------

  getArtist(artistId: string): Promise<SpotifyArtist> {
    return this.get<SpotifyArtist>(`/artists/${encodeURIComponent(artistId)}`);
  }

  getArtistTopTracks(artistId: string, market = "US"): Promise<{ tracks: SpotifyTrack[] }> {
    return this.get<{ tracks: SpotifyTrack[] }>(
      `/artists/${encodeURIComponent(artistId)}/top-tracks`,
      { market }
    );
  }

  getRelatedArtists(artistId: string): Promise<{ artists: SpotifyArtist[] }> {
    return this.get<{ artists: SpotifyArtist[] }>(
      `/artists/${encodeURIComponent(artistId)}/related-artists`
    );
  }

  // -------------------------------------------------------------------------
  // Spotify API — Albums
  // -------------------------------------------------------------------------

  getAlbum(albumId: string): Promise<SpotifyAlbum> {
    return this.get<SpotifyAlbum>(`/albums/${encodeURIComponent(albumId)}`);
  }

  getAlbumTracks(
    albumId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<PagingObject<SpotifyTrack>> {
    return this.get<PagingObject<SpotifyTrack>>(
      `/albums/${encodeURIComponent(albumId)}/tracks`,
      options as Record<string, number>
    );
  }

  // -------------------------------------------------------------------------
  // Spotify API — Playlists
  // -------------------------------------------------------------------------

  getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return this.get<SpotifyPlaylist>(`/playlists/${encodeURIComponent(playlistId)}`);
  }

  getCurrentUserPlaylists(
    options: { limit?: number; offset?: number } = {}
  ): Promise<PagingObject<SpotifyPlaylist>> {
    return this.get<PagingObject<SpotifyPlaylist>>("/me/playlists", options as Record<string, number>);
  }

  createPlaylist(
    userId: string,
    name: string,
    options: { description?: string; public?: boolean } = {}
  ): Promise<SpotifyPlaylist> {
    return this.post<SpotifyPlaylist>(`/users/${encodeURIComponent(userId)}/playlists`, {
      name,
      ...options,
    });
  }

  addTracksToPlaylist(playlistId: string, uris: string[]): Promise<{ snapshot_id: string }> {
    return this.post<{ snapshot_id: string }>(
      `/playlists/${encodeURIComponent(playlistId)}/tracks`,
      { uris }
    );
  }

  removeTracksFromPlaylist(
    playlistId: string,
    uris: string[]
  ): Promise<{ snapshot_id: string }> {
    return this.delete<{ snapshot_id: string }>(
      `/playlists/${encodeURIComponent(playlistId)}/tracks`,
      { tracks: uris.map((uri) => ({ uri })) }
    );
  }

  // -------------------------------------------------------------------------
  // Spotify API — Search
  // -------------------------------------------------------------------------

  search(
    query: string,
    types: SearchType[],
    options: { limit?: number; offset?: number; market?: string } = {}
  ): Promise<SearchResult> {
    return this.get<SearchResult>("/search", {
      q: query,
      type: types.join(","),
      ...options,
    } as Record<string, string | number>);
  }

  // -------------------------------------------------------------------------
  // Spotify API — Player
  // -------------------------------------------------------------------------

  getCurrentlyPlaying(): Promise<unknown> {
    return this.get("/me/player/currently-playing");
  }

  getRecentlyPlayed(limit = 20): Promise<PagingObject<unknown>> {
    return this.get<PagingObject<unknown>>("/me/player/recently-played", { limit });
  }

  play(options: { uris?: string[]; context_uri?: string; position_ms?: number } = {}): Promise<void> {
    return this.put("/me/player/play", options);
  }

  pause(): Promise<void> {
    return this.put("/me/player/pause");
  }

  skipToNext(): Promise<void> {
    return this.post("/me/player/next");
  }

  skipToPrevious(): Promise<void> {
    return this.post("/me/player/previous");
  }

  setVolume(volumePercent: number): Promise<void> {
    return this.put(`/me/player/volume?volume_percent=${volumePercent}`);
  }

  // -------------------------------------------------------------------------
  // Pagination helper
  // -------------------------------------------------------------------------

  /** Fetch all pages of a paged resource. */
  async fetchAllPages<T>(firstPageUrl: string): Promise<T[]> {
    let url: string | null = firstPageUrl;
    const results: T[] = [];

    while (url) {
      const page = await this.get<PagingObject<T>>(url);
      results.push(...page.items);
      url = page.next;
    }

    return results;
  }
}
