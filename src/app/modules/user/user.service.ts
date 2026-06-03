import config from "../../../config";
import bcrypt from "bcryptjs";
// import { IOptions, paginationHelper } from "../../helper/paginationHelper";
// import { userSearchAbleFields } from "./user.constant";
// import prisma from "../../shared/prisma";
// import { Prisma, userRole, userStatus } from "@prisma/client";
// import { IJWTPayload } from "../../shared/types/common";
// import { fileUploader } from "../../helper/fileUploader";
// import { UpdateProfileData } from "../../shared/types/userFileType";
import { Request } from "express";
// import prisma from "../../../config/db";
import { IOptions, paginationHelper } from "../../helpers/paginationHelper";
// import { Prisma, Role, UserStatus } from "@prisma/client";
import { IOrderUserPayload, userSearchAbleFields } from "./user.constant";
// import { IJWTPayload } from "../../shared/Types/commonTypes";
import { fileUploader } from "../../helpers/fileUploader";
import { IUserPayload } from "../../shared/Type/commonTypes";
import { UploadedFile } from "../../shared/Type/UploadedFile";
import prisma from "../../../config/db";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";
// import { UploadedFile } from "../../shared/Types/UploadedFile";
interface CreateUserData {
   first_name: string;
   last_name: string;
   email: string;
   password: string;
   picture?: string;
}

const createUser = async (userData: CreateUserData) => {
 //  console.log(userData)
   if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
      throw new Error("Missing required fields");
   }

   // Validate email format
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(userData.email)) {
      throw new Error("Invalid email format");
   }

   // Validate password strength
   if (userData.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
   }

   // Check if user already exists
   const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
   });

   if (existingUser) {
      throw new Error("User with this email already exists");
   }

   // Hash password
   const hashPassword = await bcrypt.hash(userData.password, Number(config.salt_round));

   // Create user
   const result = await prisma.user.create({
      data: {
         first_name: userData.first_name,
         last_name: userData.last_name,
         email: userData.email,
         password: hashPassword,
         ...(userData.picture && { picture: userData.picture }),
      },
      select: {
         // Only return necessary fields (exclude password)
         id: true,
         first_name: true,
         last_name: true,
         email: true,
         picture: true,
      },
   });

   return result;
};

const getAllUser = async (params: any, options: IOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.UserWhereInput[] = [];

   if (searchTerm) {
      andConditions.push({
         OR: userSearchAbleFields.map((field) => ({
            [field]: {
               contains: searchTerm,
               mode: "insensitive",
            },
         })),
      });
   }

   if (Object.keys(filterData).length > 0) {
      andConditions.push({
         AND: Object.keys(filterData).map((key) => ({
            [key]: {
               equals: (filterData as any)[key],
            },
         })),
      });
   }

   const whereConditions: Prisma.UserWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const result = await prisma.user.findMany({
      skip,
      take: limit,

      where: whereConditions,
      orderBy: {
         [sortBy]: sortOrder,
      },
      select: {
         id: true,
         email: true,
         first_name: true,
         last_name: true,
         picture: true,
         role: true,
         status: true,
         createdAt: true,
         updatedAt: true,
      },
   });

   const total = await prisma.user.count({
      where: whereConditions,
   });
   return {
      meta: {
         page,
         limit,
         total,
      },
      data: result,
   };
};

const getMyProfile = async (user: IUserPayload) => {
   const userInfo = await prisma.user.findUniqueOrThrow({
      where: {
         email: user.email,
         status: UserStatus.ACTIVE,
      },
      select: {
         id: true,
         email: true,
         needPasswordChange: true,
         role: true,
         status: true,
         picture: true,
      },
   });

   let profileData;

   if (userInfo.role === Role.USER) {
      profileData = await prisma.user.findUnique({
         where: {
            email: userInfo.email,
         },
      });
   } else if (userInfo.role === Role.ADMIN) {
      profileData = await prisma.admin.findUnique({
         where: {
            email: userInfo.email,
         },
      });
   } else if (userInfo.role === Role.SUPER_ADMIN) {
      profileData = await prisma.admin.findUnique({
         where: {
            email: userInfo.email,
         },
      });
   }

   return {
      ...userInfo,
      ...profileData,
   };
};

// const updateMyProfile = async (user: IJWTPayload, req: Request & { file?: UploadedFile }) => {
//    const userInfo = await prisma.user.findUniqueOrThrow({
//       where: {
//          email: user?.email,
//          status: userStatus.ACTIVE,
//       },
//    });

//    const file = req.file;
//    if (file) {
//       const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
//       req.body.profilePhoto = uploadToCloudinary?.secure_url;
//    }

//    let profileInfo;

//    if (userInfo.role === userRole.ADMIN) {
//       profileInfo = await prisma.admin.update({
//          where: {
//             email: userInfo.email,
//          },
//          data: req.body,
//       });
//    } else if (userInfo.role === userRole.USER) {
//       profileInfo = await prisma.user.update({
//          where: {
//             email: userInfo.email,
//          },
//          data: req.body,
//       });
//    }

//    return { ...profileInfo };
// };

const updateMyProfile = async (user: IUserPayload, req: Request & { file?: UploadedFile }) => {
   const userInfo = await prisma.user.findUniqueOrThrow({
      where: {
         email: user?.email,
         status: UserStatus.ACTIVE,
      },
   });

   const file = req.file;
   if (file) {
      const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
      req.body.profilePhoto = uploadToCloudinary?.secure_url;
   }

   let profileInfo;

   if (userInfo.role === Role.ADMIN) {
      const { first_name, last_name, profilePhoto } = req.body;
      profileInfo = await prisma.admin.update({
         where: { email: userInfo.email },
         data: {
            ...(first_name && { first_name }),
            ...(last_name && { last_name }),
            ...(profilePhoto && { profilePhoto }),
         },
      });
   } else if (userInfo.role === Role.USER) {
      const { first_name, last_name, profilePhoto } = req.body;
      profileInfo = await prisma.user.update({
         where: { email: userInfo.email },
         data: {
            ...(first_name && { first_name }),
            ...(last_name && { last_name }),
            ...(profilePhoto && { profilePhoto }),
         },
      });
   }

   return { ...profileInfo };
};

const UpdateUserStatus = async (id: string, payload: IOrderUserPayload) => {
   try {
      // 1. Check if order exists
      const existingOrder = await prisma.user.findUnique({
         where: { id },
      });

      if (!existingOrder) {
         throw new Error(`User with id ${id} not found`);
      }

      // 4. Update the order
      const updatedUserStatus = await prisma.user.update({
         where: { id },
         data: {
            status: payload.status as UserStatus,
         },
      });

      return updatedUserStatus;
   } catch (error) {
      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === "P2025") {
            throw new Error(`Order with id ${id} not found`);
         }
      }
      throw error; // rethrow other errors
   }
};

export const userService = {
   createUser,
   getAllUser,
   getMyProfile,
   updateMyProfile,
   UpdateUserStatus,
};
