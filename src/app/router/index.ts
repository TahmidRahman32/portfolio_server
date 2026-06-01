import express from "express";
// import { userRouter } from "../modules/user/user.routes";

// import { authRouter } from "../modules/auth/auth.route";
import { resumeRoutes } from "../modules/resume/resume.route";
import { userRouter } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";

const router = express.Router();

const moduleRoutes = [
   {
      path: "/user",
      route: userRouter,
   },
   {
      path: "/auth",
      route: authRoutes,
   },
   {
      path: "/resume",
      route: resumeRoutes,
   },

   // {
   //    path: "/massage",
   //    route: MassageRoutes,
   // },

   // {
   //    path: "/review",
   //    route: ReviewRoutes,
   // },
   // {
   //    path: "/order",
   //    route: orderRoutes,
   // },
   // {
   //    path: "/service",
   //    route: serviceRoute,
   // },
   // {
   //    path: "/meta",
   //    route: MetaRoutes,
   // },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
