const axios = require('axios');
const { AppError } = require('../utils');

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * Google Service
 * - Builds OAuth authorization URL
 * - Exchanges authorization code for tokens
 * - Fetches user info using access token
 */
const GoogleService = {
  getAuthUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    if (state) params.append('state', state);
    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  },

  async exchangeCodeForTokens(code, redirectUri) {
    try {
      const params = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const res = await axios.post(GOOGLE_TOKEN_ENDPOINT, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
      });

      // returns { access_token, id_token, refresh_token, expires_in }
      return res.data;
    } catch (error) {
      throw AppError.unauthorized('Failed to exchange code for tokens', { error: error.message });
    }
  },

  async getUserInfo(accessToken) {
    try {
      const res = await axios.get(GOOGLE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000,
      });
      return res.data;
    } catch (error) {
      throw AppError.unauthorized('Failed to fetch Google user info', { error: error.message });
    }
  },
};

module.exports = GoogleService;