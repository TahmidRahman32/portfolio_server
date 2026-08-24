import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import httpStatus from "http-status";
import config from "../../../config";



const login = catchAsync(async (req: Request, res: Response) => {
   const result = await AuthService.login(req.body);
   // console.log(result, "login-add")
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
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
   // Check if we're in production or development
   const isProduction = config.node_env === "production";
   

   const cookieOptions = {
      httpOnly: true,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
   };
   res.cookie("accessToken", accessToken, cookieOptions);
   res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
   });
}
// ── Google callback ────────────────────────────────────────────────────────────
// GET /api/v1/auth/google/callback
// ✅ FIXED: Google callback controller
export const googleCallbackController = catchAsync(
   async (req: Request & { user?: any }, res: Response) => {
      const user = req.user;

      if (!user) {
         console.error("❌ No user object from Passport");
         return res.redirect(
            `${config.frontend_url}/login?error=Google+authentication+failed`
         );
      }

      try {
         // Call AuthService to handle OAuth login
         const { accessToken, refreshToken } = await AuthService.oAuthLogin(user);

         // console.log("✅ Tokens generated successfully");

         // Set cookies
         setAuthCookies(res, accessToken, refreshToken);

         // Get redirect path from state parameter
         // state was passed when initiating OAuth: passport.authenticate("google", { state: redirect })
         const redirectPath = (req.query.state as string) || "/user/dashboard";

         // console.log(`🔄 Redirecting to: ${config.frontend_url}${redirectPath}`);

         // Redirect to frontend with success
         res.redirect(`${config.frontend_url}${redirectPath}`);
      } catch (error) {
         console.error("❌ OAuth login error:", error);
         res.redirect(
            `${config.frontend_url}/login?error=OAuth+login+failed`
         );
      }
   }
);

// ✅ FIXED: GitHub callback controller
export const githubCallbackController = catchAsync(
   async (req: Request & { user?: any }, res: Response) => {
      const user = req.user;

     // console.log("✅ GitHub OAuth callback received");
    //  console.log("📌 User from Passport:", user);

      if (!user) {
         console.error("❌ No user object from Passport");
         return res.redirect(
            `${config.frontend_url}/login?error=GitHub+authentication+failed`
         );
      }

      try {
         const { accessToken, refreshToken } = await AuthService.oAuthLogin(user);

        // console.log("✅ Tokens generated successfully");

         setAuthCookies(res, accessToken, refreshToken);

         const redirectPath = (req.query.state as string) || "/user/dashboard";

        // console.log(`🔄 Redirecting to: ${config.frontend_url}${redirectPath}`);

         res.redirect(`${config.frontend_url}${redirectPath}`);
      } catch (error) {
         console.error("❌ OAuth login error:", error);
         res.redirect(
            `${config.frontend_url}/login?error=OAuth+login+failed`
         );
      }
   }
);

 


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
