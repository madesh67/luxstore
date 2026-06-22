import { SignJWT, jwtVerify } from "jose";

// Encode JWT secret safely for jose
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }
  return new TextEncoder().encode(secret);
};

export interface AccessTokenPayload {
  userId: string;
  role: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string;
}

// Generate Access Token (Short-lived: 15 minutes)
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

// Verify Access Token
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

// Generate Refresh Token (Long-lived: 7 days)
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// Verify Refresh Token
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}
