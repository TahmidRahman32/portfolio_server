import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
// import { userRole } from "@prisma/client";
import passport from "passport";
import config from "../../../config";

const router = express.Router();

router.get("/me", AuthController.getMe);

router.post("/login", AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/change-password", auth(Role.ADMIN, Role.USER), AuthController.changePassword);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

// ── Google OAuth ───────────────────────────────────────────────────────────────
// Step 1: redirect user to Google consent screen
// Optionally pass ?redirect=/some-path to return there after login
router.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    const redirect = (req.query.redirect as string) || "/user/dashboard";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect,
    })(req, res, next);
  }
);
 
// Step 2: Google redirects back here
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.frontend_url}/login?error=Google+authentication+failed`,
  }),
  AuthController.googleCallbackController
);
 
// ── GitHub OAuth ───────────────────────────────────────────────────────────────
// Step 1: redirect user to GitHub consent screen
router.get(
  "/github",
  (req: Request, res: Response, next: NextFunction) => {
    const redirect = (req.query.redirect as string) || "/user/dashboard";
    passport.authenticate("github", {
      scope: ["user:email"],
      state: redirect,
    })(req, res, next);
  }
);
 
// Step 2: GitHub redirects back here
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session:         false,
    failureRedirect: `${config.frontend_url}/login?error=GitHub+authentication+failed`,
  }),
  AuthController.githubCallbackController
);

export const authRoutes = router;
