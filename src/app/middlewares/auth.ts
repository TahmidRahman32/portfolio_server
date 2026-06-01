import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";
import { Secret } from "jsonwebtoken";
// import ApiError from "../errors/ApiError";
// import { jwtHelper } from "../helper/jwtHelper";
import ApiError from "../errors/ApiError";
import { jwtHelper } from "../helpers/jwtHelper";

const auth = (...roles: string[]) => {
   return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
      try {
         // const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "") || req.body?.accessToken || req.query?.accessToken;

         // if (!token) {
         //    throw new ApiError(httpStatus.UNAUTHORIZED, "No access token provided");
         // }

         let token: string | undefined;

         // 1. From cookies
         if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
         }

         // 2. From Authorization header
         else if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
         }

         if (!token) {
            throw new ApiError(httpStatus.UNAUTHORIZED, "No access token provided");
         }

         const verifyUser = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);

         // Check if verifyUser is valid
         if (!verifyUser || typeof verifyUser !== "object") {
            throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token payload");
         }

         console.log(verifyUser, "auth")

         req.user = verifyUser;

         if (roles.length && !roles.includes(verifyUser.role)) {
            throw new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions");
         }

         next();
      } catch (err) {
         // Handle specific JWT errors
         if (err instanceof Error) {
            if (err.name === "JsonWebTokenError") {
               next(new ApiError(httpStatus.UNAUTHORIZED, "Invalid token"));
            } else if (err.name === "TokenExpiredError") {
               next(new ApiError(httpStatus.UNAUTHORIZED, "Token expired"));
            } else {
               next(err);
            }
         } else {
            next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Authentication failed"));
         }
      }
   };
};

export default auth;
