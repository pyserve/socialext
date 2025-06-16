import axios from "axios";

let accessToken = "";
let tokenExpiry = 0;

export async function refreshAccessToken() {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    client_id: process.env.ZOHO_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });

  const res = await axios.post(
    `${process.env.ZOHO_REFRESH_TOKEN_URL}?${params.toString()}`
  );

  if (res.status !== 200) {
    throw new Error("Failed to refresh access token");
  }

  const data = res.data;
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
}

export async function getValidAccessToken() {
  if (!accessToken || Date.now() > tokenExpiry - 5 * 60 * 1000) {
    await refreshAccessToken();
  }
  return accessToken;
}
