import { Request, Response } from "express";
import { createResumeService, deleteResumeService, getResumeService, updateResumeService, ResumePayload, resumeService } from "./resume.service";
import { IUserPayload } from "../../shared/Type/commonTypes";
import catchAsync from "../../shared/catchAsync";
import pick from "../../helpers/pick";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
// import { IUserPayload } from "../../Type/commonTypes";

// ─── Extended Request Interface ──────────────────────────────────────────────

// declare global {
//    namespace Express {
//       interface Request {
//          user?: {
//             id: number;
//             email: string;
//             role: string;
//          };
//       }
//    }
// }

// ─── Error Response Helper ────────────────────────────────────────────────────

/**
 * Determine HTTP status code based on error message
 */
function getStatusCode(errorMessage: string): number {
   if (errorMessage.includes("Unauthorized")) return 401;
   if (errorMessage.includes("not found")) return 404;
   if (errorMessage.includes("already exists")) return 409;
   if (errorMessage.includes("required")) return 400;
   if (errorMessage.includes("cannot be")) return 400;
   return 500;
}

// ─── CREATE Resume Controller ─────────────────────────────────────────────────

/**
 * POST /api/v1/resume
 * Create a complete resume with all sections
 */
async function createResume(req: Request & { user?: IUserPayload }, res: Response): Promise<void> {
  // console.log(req.user)
   try {
      const userId = req.user?.id;
      // console.log("Authenticated user ID:", userId);

      // Authenticate user
      if (!userId) {
         res.status(401).json({
            success: false,
            message: "Unauthorized - User ID not found",
         });
         return;
      }

      // Validate request body
      const payload: ResumePayload = req.body;
      if (!payload) {
         res.status(400).json({
            success: false,
            message: "Request body is required",
         });
         return;
      }

      // Call service
      const resume = await createResumeService(userId, payload);

      res.status(201).json({
         success: true,
         message: "Resume created successfully",
         data: resume,
      });
   } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = getStatusCode(message);

      console.error("createResume error:", error);

      res.status(statusCode).json({
         success: false,
         message: message || "Failed to create resume",
      });
   }
}

// ─── GET Resume Controller ───────────────────────────────────────────────────

/**
 * GET /api/v1/resume
 * Fetch the complete resume for authenticated user
 */
async function getResume(req: Request & { user?: IUserPayload }, res: Response): Promise<void> {
  // console.log(req.user.email)
   try {
      const userId = req.user?.id;

      // Authenticate user
      if (!userId) {
         res.status(401).json({
            success: false,
            message: "Unauthorized - User ID not found",
         });
         return;
      }

      // Call service
      const resume = await getResumeService(userId);

      // Handle not found
      if (!resume) {
         res.status(404).json({
            success: false,
            message: "Resume not found. Create one first using POST /resume",
         });
         return;
      }

      res.status(200).json({
         success: true,
         message: "Resume fetched successfully",
         data: resume,
      });
   } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = getStatusCode(message);

      console.error("getResume error:", error);

      res.status(statusCode).json({
         success: false,
         message: message || "Failed to fetch resume",
      });
   }
}

const getAllResumes = catchAsync(async (req: Request, res: Response) => {
   // console.log("data", req.body);
   const filters = pick(req.query, ["role", "status", "email", "searchTerm"]);
   const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
   const result = await resumeService.getAllResumes(filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get AllResumes successfully!",
      data: result,
   });
});

// ─── UPDATE Resume Controller ─────────────────────────────────────────────────

/**
 * PUT/PATCH /api/v1/resume
 * Update entire resume with all sections
 * Supports partial updates - only send sections you want to update
 */
async function updateResume(req: Request & { user?: IUserPayload }, res: Response): Promise<void> {
   try {
      const userId = req.user?.email;

      // Authenticate user
      if (!userId) {
         res.status(401).json({
            success: false,
            message: "Unauthorized - User ID not found",
         });
         return;
      }

      // Validate request body
      const payload: Partial<ResumePayload> = req.body;
      if (!payload || Object.keys(payload).length === 0) {
         res.status(400).json({
            success: false,
            message: "Request body with at least one field is required",
         });
         return;
      }

      // Call service
      const resume = await updateResumeService(userId, payload);

      res.status(200).json({
         success: true,
         message: "Resume updated successfully",
         data: resume,
      });
   } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = getStatusCode(message);

      console.error("updateResume error:", error);

      res.status(statusCode).json({
         success: false,
         message: message || "Failed to update resume",
      });
   }
}

// ─── DELETE Resume Controller ─────────────────────────────────────────────────

/**
 * DELETE /api/v1/resume
 * Delete entire resume and all related sections
 * This is permanent and cannot be undone
 */
async function deleteResume(req: Request & { user?: IUserPayload }, res: Response): Promise<void> {
   try {
      const userId = req.user?.email;

      // Authenticate user
      if (!userId) {
         res.status(401).json({
            success: false,
            message: "Unauthorized - User ID not found",
         });
         return;
      }

      // Call service
      const result = await deleteResumeService(userId);

      res.status(200).json({
         success: true,
         message: "Resume deleted permanently",
         data: result,
      });
   } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = getStatusCode(message);

      console.error("deleteResume error:", error);

      res.status(statusCode).json({
         success: false,
         message: message || "Failed to delete resume",
      });
   }
}

const getMyResume = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
   const user = req.user;
   const filters = pick(req.query, ["status", "searchTerm"]);
   const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

   const result = await resumeService.getMyResume(user as IAuthUser, filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My resume fetched successfully!!",
      data: result.data,
      meta: result.meta,
   });
});


export const resumeController = {
   createResume,
   getResume,
   getAllResumes,
   updateResume,
   deleteResume,
   getMyResume,
};
