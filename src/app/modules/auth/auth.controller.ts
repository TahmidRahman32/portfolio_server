import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import httpStatus from "http-status";
import config from "../../../config";
import auth from "../../middlewares/auth";
// import { Role } from "@prisma/client";
import { setAuthCookie } from "../../helpers/setCookie";



const login = catchAsync(async (req: Request, res: Response) => {
   const result = await AuthService.login(req.body);
   console.log(result, "login-add")
   const { accessToken, refreshToken,} = result;

   res.cookie("accessToken", accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60,
   });
   res.cookie("refreshToken", refreshToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 90,
   });

   sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User logged in successfully!",
      data: {
         needPasswordChange: false,
      },
   });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
   const { refreshToken } = req.cookies;

   const result = await AuthService.refreshToken(refreshToken);
   res.cookie("accessToken", result.accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60,
   });

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Access token generated successfully!",
      data: {
         message: "Access token generated successfully!",
      },
   });
});

const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
   const user = req.user;

   const result = await AuthService.changePassword(user, req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password Changed successfully",
      data: result,
   });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
   await AuthService.forgotPassword(req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Check your email!",
      data: null,
   });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
   const token = req.headers.authorization || "";

   await AuthService.resetPassword(token, req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password Reset!",
      data: null,
   });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
   const userSession = req.cookies;
   const result = await AuthService.getMe(userSession);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User retrieved successfully!",
      data: result,
   });
});

// const googleCallbackController = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//    let redirectTo = req.query.state ? (req.query.state as string) : "";

//    if (redirectTo.startsWith("/")) {
//       redirectTo = redirectTo.slice(1);
//    }

//    // /booking => booking , => "/" => ""
//    const user = req.user;

//    if (!user) {
//       throw new Error( "User Not Found");
//    }

//    const tokenInfo = auth(Role.USER);

//    setAuthCookie(res, tokenInfo as any);

//    // sendResponse(res, {
//    //     success: true,
//    //     statusCode: httpStatus.OK,
//    //     message: "Password Changed Successfully",
//    //     data: null,
//    // })

//    res.redirect(`${config.frontend_url}/${redirectTo}`);
// });

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
   res.cookie("accessToken", accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
   });
   res.cookie("refreshToken", refreshToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
   });
}

// ── Google callback ────────────────────────────────────────────────────────────
// GET /api/v1/auth/google/callback
export const googleCallbackController = catchAsync(async (req: Request & { user?: any }, res: Response) => {
   const user = req.user; // set by Passport after successful OAuth

   if (!user) {
      return res.redirect(`${config.frontend_url}/login?error=Google authentication failed`);
   }

   const { accessToken, refreshToken } = await AuthService.oAuthLogin(user);
   setAuthCookies(res, accessToken, refreshToken);

   // `state` carries the original redirect path the frontend passed
   const redirectPath = (req.query.state as string) || "/user/dashboard";
   res.redirect(`${config.frontend_url}${redirectPath}`); // ✅ Just redirect, no token in URL
});

// ── GitHub callback ────────────────────────────────────────────────────────────
// GET /api/v1/auth/github/callback
 const githubCallbackController = catchAsync(async (req: Request & { user?: any }, res: Response) => {
   const user = req.user;

   if (!user) {
      return res.redirect(`${config.frontend_url}/login?error=GitHub authentication failed`);
   }

   const { accessToken, refreshToken } = await AuthService.oAuthLogin(user);
   setAuthCookies(res, accessToken, refreshToken);

   const redirectPath = (req.query.state as string) || "/user/dashboard";
   res.redirect(`${config.frontend_url}${redirectPath}`);
});

 


export const AuthController = {
   login,
   refreshToken,
   changePassword,
   resetPassword,
   forgotPassword,
   getMe,
   googleCallbackController,
   githubCallbackController,
};
