
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config";
import router from "./app/router";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import passport from "passport";

const app: Application = express();
app.use(
   cors({
      origin: ["http://localhost:3000", "https://portfolio-frontend-jet-eight.vercel.app"],
      credentials: true,
   }),
);

//parser
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use("/api/v1", router);
app.get("/", (req: Request, res: Response) => {
   res.send({
      message: "Server is running..",
      environment: config.node_env,
      uptime: process.uptime().toFixed(2) + "sec",
      timeStamp: new Date().toISOString(),
   });
});

// const uploadDir = path.join(process.cwd(), "/uploads");

// if (!fs.existsSync(uploadDir)) {
//    fs.mkdirSync(uploadDir, { recursive: true });
// }

app.use(globalErrorHandler);

app.use(notFound);

export default app;
