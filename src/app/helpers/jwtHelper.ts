import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
   const token = jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn,
   } as SignOptions);
   return token;
};

export const verifyToken = (token: string, secret: Secret): JwtPayload => {
   try {
      if (!token) {
         throw new Error("Token is required");
      }
      return jwt.verify(token, secret) as JwtPayload;
   } catch (error) {
      console.error("Token verification error:", error);
      throw new Error("Invalid or expired token");
   }
};

// Additional helper to safely extract accessToken
const extractAccessToken = (decoded: JwtPayload): string => {
   if (!decoded || typeof decoded !== "object") {
      throw new Error("Invalid token payload");
   }

   if (!decoded.accessToken) {
      throw new Error("accessToken not found in token payload");
   }

   return decoded.accessToken as string;
};

export const jwtHelper = {
   generateToken,
   verifyToken,
   extractAccessToken, // New helper
};
