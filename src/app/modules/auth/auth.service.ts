// import { UserStatus } from "@prisma/client";
// import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
// import { jwtHelper } from "../../helper/jwtHelper";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import config from "../../../config";
// import { Prisma, userStatus } from "../../../generated/client";
import { jwtHelper } from "../../helpers/jwtHelper";
// import prisma from "../../../config/db";
import emailSender from "./emailSender";
import prisma from "../../../config/db";
import { UserStatus } from "../../../generated/prisma/enums";
// import { UserStatus } from "@prisma/client";
// import emailSender from "./emailSender";
// import prisma from "../../shared/prisma";
// import { userStatus } from "@prisma/client";

const login = async (payload: { email: string; password: string }) => {
   const user = await prisma.user.findUniqueOrThrow({
      where: {
         email: payload.email,
         status: UserStatus.ACTIVE,
      },
   });

   if (!user.password) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect!");
   }

   const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
   if (!isCorrectPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect!");
   }

   const accessToken = jwtHelper.generateToken({ id: user.id, email: user.email, role: user.role }, config.jwt.jwt_secret as Secret, config.jwt.access_token_expires_in as string);

   const refreshToken = jwtHelper.generateToken({ id: user.id, email: user.email, role: user.role }, config.jwt.refresh_token_secret as Secret, config.jwt.refresh_token_expires_in as string);

   // console.log(accessToken, refreshToken, "accessToken setUp");

   return {
      accessToken,
      refreshToken,
   };
};

const refreshToken = async (token: string) => {
   let decodedData;
   try {
      decodedData = jwtHelper.verifyToken(token, config.jwt.refresh_token_secret as Secret);
   } catch (err) {
      throw new Error("You are not authorized!");
   }

   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         email: decodedData.email,
         status: UserStatus.ACTIVE,
      },
   });

   const accessToken = jwtHelper.generateToken(
      {
         id: userData.id,
         email: userData.email,
         role: userData.role,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.access_token_expires_in as string,
   );

   return {
      accessToken,
      
   };
};

const changePassword = async (user: any, payload: any) => {
   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         email: user.email,
         status: UserStatus.ACTIVE,
      },
   });

   if (!userData.password) {
      throw new Error("Password is not set!");
   }

   const isCorrectPassword: boolean = await bcrypt.compare(payload.oldPassword, userData.password);

   if (!isCorrectPassword) {
      throw new Error("Password incorrect!");
   }

   const hashedPassword: string = await bcrypt.hash(payload.newPassword, Number(config.salt_round));

   await prisma.user.update({
      where: {
         email: userData.email,
      },
      data: {
         password: hashedPassword,
         needPasswordChange: false,
      },
   });

   return {
      message: "Password changed successfully!",
   };
};

const forgotPassword = async (payload: { email: string }) => {
   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         email: payload.email,
         status: UserStatus.ACTIVE,
      },
   });

   const resetPassToken = jwtHelper.generateToken({ email: userData.email, role: userData.role }, config.jwt.reset_pass_secret as Secret, config.jwt.reset_pass_token_expires_in as string);

   const resetPassLink = config.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`;

   await emailSender(
      userData.email,
      `
        <div>
            <p>Dear User,</p>
            <p>Your password reset link 
                <a href=${resetPassLink}>
                    <button>
                        Reset Password
                    </button>
                </a>
            </p>

        </div>
        `,
   );
};

const resetPassword = async (token: string, payload: { id: string; password: string }) => {
   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         id: payload.id,
         status: UserStatus.ACTIVE,
      },
   });

   const isValidToken = jwtHelper.verifyToken(token, config.jwt.reset_pass_secret as Secret);

   if (!isValidToken) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
   }

   // hash password
   const password = await bcrypt.hash(payload.password, Number(config.salt_round));

   // update into database
   await prisma.user.update({
      where: {
         id: payload.id,
      },
      data: {
         password,
      },
   });
};

const getMe = async (session: any) => {
   const accessToken = session.accessToken;
   const userToken = jwtHelper.verifyToken(accessToken, config.jwt.jwt_secret as Secret);

   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         email: userToken.email,
         status: UserStatus.ACTIVE,
      },
   });

   const { id, last_name, first_name, email, role, status } = userData;

   return {
      id,
      name: `${first_name} ${last_name}`,
      email,
      role,

      status,
   };
};

const oAuthLogin = async (user: { id: string; email: string; role: string; first_name: string; last_name: string }) => {
   const payload = { id: user.id, email: user.email, role: user.role };

   const accessToken = jwtHelper.generateToken(payload, config.jwt.jwt_secret as Secret, config.jwt.access_token_expires_in as string);

   const refreshToken = jwtHelper.generateToken(payload, config.jwt.refresh_token_secret as Secret, config.jwt.refresh_token_expires_in as string);

   return { accessToken, refreshToken };
};

export const AuthService = {
   login,
   changePassword,
   forgotPassword,
   oAuthLogin,
   refreshToken,
   resetPassword,
   getMe,
};
