import { generateRandomString, sha256, base64encode } from "./crypto";

const clientId = 'YOUR_CLIENT_ID';
const redirectUri = 'http://127.0.0.1:8080';

const authUrl = new URL("https://accounts.spotify.com/authorize")

async function useSpotifyAPI() {
  let codeVerifier = window.localStorage.getItem('code_verifier');
  let accessToken = window.localStorage.getItem('access_token');

  if (!codeVerifier) {
    codeVerifier = generateRandomString(64);
    window.localStorage.setItem('code_verifier', codeVerifier);
  }

  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed);


  const params =  {
    response_type: 'code',
    client_id: clientId,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
    // state: someState,
  }

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();

  const getToken = async code => {
    const url = "https://accounts.spotify.com/api/token";
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    }

    const body = await fetch(url, payload);
    const response = await body.json();

    accessToken = response.accessToken
    window.localStorage.setItem('access_token', accessToken);
  }

  if (!accessToken) {
    await getToken()
  }

  return {
  }
}

export default useSpotifyAPI;


