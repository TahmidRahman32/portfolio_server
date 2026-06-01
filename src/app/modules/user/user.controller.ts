import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helpers/pick";
// import catchAsync from "../../shared/catchAsync";
// import { userService } from "./user.service";
// import sendResponse from "../../shared/sendResponse";
// import pick from "../../helper/pick";
// import { IJWTPayload } from "../../shared/types/common";
import httpStatus from "http-status";
import { IUserPayload } from "../../shared/Type/commonTypes";
import { UploadedFile } from "../../shared/Type/UploadedFile";
// import { IJWTPayload } from "../../shared/Types/commonTypes";
// import { UploadedFile } from "../../shared/Types/UploadedFile";
// import { UpdateProfileData } from "../../shared/types/userFileType";

const createUser = catchAsync(async (req: Request, res: Response) => {
   const { first_name, last_name, email, password, picture } = req.body;
   // console.log({ first_name, last_name, email, password });
   const result = await userService.createUser({
      first_name,
      last_name,
      email,
      password,
      picture,
   });
   // console.log(result);
   sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User created successfully",
      data: result,
   });
});

const getAllUser = catchAsync(async (req: Request, res: Response) => {
   // console.log("data", req.body);
   const filters = pick(req.query, ["role", "status", "email", "searchTerm"]);
   const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
   const result = await userService.getAllUser(filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get AllUsers successfully!",
      data: result,
   });
});
const getMyProfile = catchAsync(async (req: Request & { user?: IUserPayload }, res: Response) => {
   const result = await userService.getMyProfile(req.user as IUserPayload);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get My Profile successfully!",
      data: result,
   });
});

type AuthenticatedRequest = Request & {
   user?: IUserPayload;
   file?: UploadedFile;
};

const updateMyProfile = catchAsync(async (req: Request & { user?: IUserPayload }, res: Response) => {
   const user = req.user;
   const result = await userService.updateMyProfile(user as IUserPayload, req as AuthenticatedRequest);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My profile updated!",
      data: result,
   });
});

const UpdateUserStatus = async (req: Request, res: Response) => {
   const { id } = req.params;
   const { status } = req.body;

   const result = await userService.UpdateUserStatus(id as string, { status });

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User status updated successfully",
      data: result,
   });
};

export const useController = {
   createUser,
   getAllUser,
   getMyProfile,
   updateMyProfile,
   UpdateUserStatus,
};
