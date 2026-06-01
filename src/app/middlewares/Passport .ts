// src/app/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { UserStatus } from "@prisma/client";
import config from "../../config";
import prisma from "../../config/db";
// import prisma from "../../../config/db";
// import config from "../../../config";

// ── Google Strategy ───────────────────────────────────────────────────────────
passport.use(
   new GoogleStrategy(
      {
         clientID: config.google.client_id as string,
         clientSecret: config.google.client_secret as string,
         callbackURL: `${config.google.callback_url}` as string,
      },
      async (_accessToken, _refreshToken, profile, done) => {
         try {
            const email = profile.emails?.[0]?.value || `${profile.id}@google.oauth`;

            // Upsert: create if new, update avatar/name if returning
            const user = await prisma.user.upsert({
               where: { email },
               update: {
                  // keep the account active if it was somehow deactivated
                  status: UserStatus.ACTIVE,
               },
               create: {
                  email,
                  first_name: profile.name?.givenName ?? profile.displayName ?? "Google",
                  last_name: profile.name?.familyName ?? "User",
                  status: UserStatus.ACTIVE,
                  provider: "google",
                  providerId: profile.id,
                  // password is intentionally null — OAuth users don't need one
               },
            });

            return done(null, user);
         } catch (err) {
            return done(err as Error);
         }
      },
   ),
);

// ── GitHub Strategy ───────────────────────────────────────────────────────────
passport.use(
   new GitHubStrategy(
      {
         clientID: config.github.client_id as string,
         clientSecret: config.github.client_secret as string,
         callbackURL: config.github.callback_url as string,
         scope: ["user:email"],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
         try {
            // GitHub may expose multiple emails; pick the primary verified one
            const primaryEmail = profile.emails?.find((e: any) => e.primary && e.verified)?.value || profile.emails?.[0]?.value || `${profile.id}@github.oauth`;

            const nameParts = (profile.displayName ?? profile.username ?? "GitHub User").split(" ");

            const user = await prisma.user.upsert({
               where: { email: primaryEmail },
               update: { status: UserStatus.ACTIVE },
               create: {
                  email: primaryEmail,
                  first_name: nameParts[0] ?? "GitHub",
                  last_name: nameParts.slice(1).join(" ") || "User",
                  status: UserStatus.ACTIVE,
                  provider: "github",
                  providerId: String(profile.id),
               },
            });

            return done(null, user);
         } catch (err) {
            return done(err as Error);
         }
      },
   ),
);

// Passport doesn't manage sessions — we only use it for the OAuth handshake
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
   try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
   } catch (err) {
      done(err);
   }
});

export default passport;
