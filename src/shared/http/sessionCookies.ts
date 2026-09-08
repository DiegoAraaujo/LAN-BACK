import type { CookieOptions, Request, Response } from "express";

const production = process.env.NODE_ENV === "production";
export const accessCookie = production ? "__Host-lan-access" : "lan-access";
export const refreshCookie = production ? "__Host-lan-refresh" : "lan-refresh";
const options: CookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: "lax",
  path: "/",
  // No Domain: cookies belong only to the API host, not the landing page.
};

export function readCookie(request: Request, name: string): string | undefined {
  const values = (request.headers.cookie ?? "").split(";")
    .map(value => value.trim()).filter(value => value.startsWith(`${name}=`));
  if (values.length !== 1) return undefined;
  try { return decodeURIComponent(values[0]!.slice(name.length + 1)); }
  catch { return undefined; }
}

export function setSessionCookies(response: Response, token: string, refreshToken: string, remember: boolean) {
  response.cookie(accessCookie, token, { ...options, ...(remember ? { maxAge: 15 * 60 * 1000 } : {}) });
  response.cookie(refreshCookie, refreshToken, { ...options, ...(remember ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}) });
  response.setHeader("Cache-Control", "no-store");
}

export function clearSessionCookies(response: Response) {
  response.clearCookie(accessCookie, options);
  response.clearCookie(refreshCookie, options);
  response.setHeader("Cache-Control", "no-store");
}
