export default {
  jwt: {
    access_token_secret: process.env.JWT_ACCESS_SECRET || 'default_secret',
    refresh_token_secret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    access_token_expires_in: "15m",
    refresh_token_expires_in: "7d",
    refresh_token_expires_days: 7,
  }
}