const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret?.trim() || !refreshSecret?.trim()) {
  throw new Error(
    "JWT_ACCESS_SECRET e JWT_REFRESH_SECRET precisam estar configurados.",
  );
}

export default {
  jwt: {
    access_token_secret: accessSecret,
    refresh_token_secret: refreshSecret,
    access_token_expires_in: "15m",
    refresh_token_expires_in: "7d",
    refresh_token_expires_days: 7,
  }
}
