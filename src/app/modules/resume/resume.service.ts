
import { IOptions, paginationHelper } from "../../helpers/paginationHelper";
import { resumeSchema } from "../../shared/zod/resume";
import { userSearchAbleFields } from "../user/user.constant";
import { IAuthUser } from "../../interfaces/common";
import { Prisma } from "../../../generated/prisma/client";
import prisma from "../../../config/db";

export interface PersonalInfoPayload {
   fullName: string;
   email: string;
   phone: string;
   address: string;
   linkedin?: string;
   github?: string;
   website?: string;
}

export interface EducationItem {
   id?: string;
   institution: string;
   degree: string;
   fieldOfStudy: string;
   startDate: string;
   endDate: string;
   description?: string;
}

export interface WorkExperienceItem {
   id?: string;
   company: string;
   position: string;
   description: string;
   startDate: string;
   endDate?: string;
   current?: boolean;
}

export interface SkillItem {
   id?: string;
   name: string;
   level: number;
   category: string;
}

export interface ProjectItem {
   id?: string;
   name: string;
   description: string;
   technologies: string[];
   link?: string;
   image?: string;
}

export interface CertificationItem {
   id?: string;
   title: string;
   issuer: string;
   issueDate: string;
   expiryDate?: string;
   credentialId?: string;
   credentialUrl?: string;
}

export interface ResumePayload {
   personalInfo?: PersonalInfoPayload;
   summary: string;
   education?: EducationItem[];
   workExperience?: WorkExperienceItem[];
   skills?: SkillItem[];
   projects?: ProjectItem[];
   certifications?: CertificationItem[];
}

// ─── CREATE Resume Service ────────────────────────────────────────────────────

/**
 * Create a complete resume with all sections
 * @param userId - User ID (number from auth)
 * @param payload - Resume data with all sections
 */
export async function createResumeService(userId: string, payload: ResumePayload) {
   console.log(payload, "resume payload", userId);

   const parsed = resumeSchema.parse(payload); // Validate required fields
   if (!payload.summary || payload.summary.trim().length === 0) {
      throw new Error("Summary is required");
   }

   if (!payload.personalInfo) {
      throw new Error("Personal info is required");
   }

   // Check if resume already exists
   const existing = await prisma.resume.findFirst({
      where: { userId },
   });

   if (existing) {
      throw new Error("Resume already exists. Use update or delete first.");
   }

   try {
      // Create resume with all related data
      const resume = await prisma.resume.create({
         data: {
            userId,
            summary: parsed.summary,

            personalInfo: parsed.personalInfo
               ? {
                    create: {
                       ...parsed.personalInfo,
                       phone: parsed.personalInfo.phone ?? "",
                       address: parsed.personalInfo.address ?? "",
                    },
                 }
               : undefined,

            education: parsed.education?.length
               ? {
                    create: parsed.education.map(({ id, ...r }) => ({
                       ...r,
                       fieldOfStudy: r.fieldOfStudy ?? "",
                    })),
                 }
               : undefined,

            workExperience: parsed.workExperience?.length ? { create: parsed.workExperience.map(({ id, ...r }) => r) } : undefined,

            skills: parsed.skills?.length ? { create: parsed.skills.map(({ id, ...r }) => r) } : undefined,

            projects: parsed.projects?.length
               ? {
                    create: parsed.projects.map(({ id, ...r }) => ({
                       ...r,
                       technologies: r.technologies || [],
                    })),
                 }
               : undefined,

            certifications: parsed.certifications?.length
               ? {
                    create: parsed.certifications.map(({ id, ...r }) => ({
                       title: r.title,
                       issuer: r.issuer,
                       date: r.issueDate ? new Date(r.issueDate) : null,
                       link: r.credentialUrl || null,
                    })),
                 }
               : undefined,
         },
         include: {
            personalInfo: true,
            education: true,
            workExperience: true,
            skills: true,
            projects: true,
            certifications: true,
         },
      });

      return formatResumeResponse(resume);
   } catch (error) {
      console.error("Create resume error:", error);
      throw error;
   }
}

// ─── GET Resume Service ──────────────────────────────────────────────────────
const getAllResumes = async (params: any, options: IOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.ResumeWhereInput[] = [];

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

   const whereConditions: Prisma.ResumeWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const result = await prisma.resume.findMany({
      skip,
      take: limit,

      where: whereConditions,
      orderBy: {
         [sortBy]: sortOrder,
      },
      include: {
         personalInfo: true,
         education: { orderBy: { startDate: "desc" } },
         workExperience: { orderBy: { startDate: "desc" } },
         skills: { orderBy: { category: "asc" } },
         projects: { orderBy: { createdAt: "desc" } },
         certifications: { orderBy: { date: "desc" } },
      },
   });

   const total = await prisma.resume.count({
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
/**
 * Fetch complete resume for a user
 * @param userId - User ID (number from auth)
 */
export async function getResumeService(userId: string) {
   try {
      const resume = await prisma.resume.findUnique({
         where: { userId },
         include: {
            personalInfo: true,
            education: { orderBy: { startDate: "desc" } },
            workExperience: { orderBy: { startDate: "desc" } },
            skills: { orderBy: { category: "asc" } },
            projects: { orderBy: { createdAt: "desc" } },
            certifications: { orderBy: { createdAt: "desc" } },
         },
      });

      if (!resume) {
         return null;
      }

      return formatResumeResponse(resume);
   } catch (error) {
      console.error("Get resume error:", error);
      throw error;
   }
}

// ─── UPDATE Resume Service ──────────────────────────────────────────────────

/**
 * Update resume (full or partial)
 * @param userId - User ID (number from auth)
 * @param payload - Partial resume data with sections to update
 */
export async function updateResumeService(userId: string, payload: Partial<ResumePayload>) {
   try {
      // Get existing resume
      const existingResume = await prisma.resume.findUnique({
         where: { userId },
      });

      if (!existingResume) {
         throw new Error("Resume not found");
      }

      // Build update data dynamically
      const updateData: any = {};

      // Update summary if provided
      if (payload.summary !== undefined) {
         if (!payload.summary.trim()) {
            throw new Error("Summary cannot be empty");
         }
         updateData.summary = payload.summary;
      }

      // Update personalInfo if provided
      if (payload.personalInfo) {
         updateData.personalInfo = {
            update: payload.personalInfo,
         };
      }

      // Replace education (delete old, create new)
      if (payload.education !== undefined) {
         updateData.education = {
            deleteMany: {},
            create: payload.education.map(({ id, ...rest }) => rest),
         };
      }

      // Replace workExperience (delete old, create new)
      if (payload.workExperience !== undefined) {
         updateData.workExperience = {
            deleteMany: {},
            create: payload.workExperience.map(({ id, ...rest }) => rest),
         };
      }

      // Replace skills (delete old, create new)
      if (payload.skills !== undefined) {
         updateData.skills = {
            deleteMany: {},
            create: payload.skills.map(({ id, ...rest }) => rest),
         };
      }

      // Replace projects (delete old, create new)
      if (payload.projects !== undefined) {
         updateData.projects = {
            deleteMany: {},
            create: payload.projects.map(({ id, ...rest }) => ({
               ...rest,
               technologies: rest.technologies || [],
            })),
         };
      }

      // Replace certifications (delete old, create new)
      if (payload.certifications !== undefined) {
         updateData.certifications = {
            deleteMany: {},
            create: payload.certifications.map(({ id, ...rest }) => ({
               title: rest.title,
               issuer: rest.issuer || null,
               date: rest.issueDate ? new Date(rest.issueDate) : null,
               link: rest.credentialUrl || null,
            })),
         };
      }

      const resume = await prisma.resume.update({
         where: { userId },
         data: updateData,
         include: {
            personalInfo: true,
            education: { orderBy: { startDate: "desc" } },
            workExperience: { orderBy: { startDate: "desc" } },
            skills: { orderBy: { category: "asc" } },
            projects: { orderBy: { createdAt: "desc" } },
            certifications: { orderBy: { createdAt: "desc" } },
         },
      });

      return formatResumeResponse(resume);
   } catch (error) {
      console.error("Update resume error:", error);
      throw error;
   }
}

// ─── DELETE Resume Service ──────────────────────────────────────────────────

/**
 * Delete entire resume and all related sections
 * @param userId - User ID (number from auth)
 */
export async function deleteResumeService(userId: string) {
   try {
      // Check if resume exists
      const existingResume = await prisma.resume.findUnique({
         where: { userId },
      });

      if (!existingResume) {
         throw new Error("Resume not found");
      }

      // Delete entire resume (cascade delete handles all related records)
      await prisma.resume.delete({
         where: { userId },
      });

      return { success: true };
   } catch (error) {
      console.error("Delete resume error:", error);
      throw error;
   }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Format database response to match frontend data structure
 */
export function formatResumeResponse(resume: any) {
   return {
      id: resume.id,
      userId: resume.userId,
      summary: resume.summary,
      personalInfo: resume.personalInfo || {},
      education: resume.education || [],
      workExperience: resume.workExperience || [],
      skills: resume.skills || [],
      projects: (resume.projects || []).map((p: any) => ({
         ...p,
         technologies: Array.isArray(p.technologies) ? p.technologies : [],
      })),
      certifications: resume.certifications || [],
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
   };
}

const getMyResume = async (user: IAuthUser, filters: any, options: IOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.OrderCalculatePagination(options);
   const { status, searchTerm } = filters;

   const andConditions: Prisma.ResumeWhereInput[] = [{ userId: user.id }];

   if (status) {
      andConditions.push({ id: { equals: status } });
   }

   if (searchTerm) {
      andConditions.push({
         OR: [{ personalInfo: { fullName: { contains: searchTerm, mode: "insensitive" } } }],
      });
   }

   const whereConditions: Prisma.ResumeWhereInput = { AND: andConditions };

   const result = await prisma.resume.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
         personalInfo: true,
         education: { orderBy: { startDate: "desc" } },
         workExperience: { orderBy: { startDate: "desc" } },
         skills: { orderBy: { category: "asc" } },
         projects: { orderBy: { createdAt: "desc" } },
         certifications: { orderBy: { date: "desc" } },    
      },
   });

   const total = await prisma.resume.count({ where: whereConditions });

   return {
      meta: { total, limit, page },
      data: result,
   };
};


/**
 * Check if resume exists for user
 */
export async function resumeExists(userId: string): Promise<boolean> {
   try {
      const resume = await prisma.resume.findUnique({
         where: { userId },
         select: { id: true },
      });
      return !!resume;
   } catch (error) {
      console.error("Resume exists check error:", error);
      return false;
   }
}

export const resumeService = {
   createResumeService,
   getAllResumes,
   getResumeService,
   updateResumeService,
   deleteResumeService,
   resumeExists,
   getMyResume,
};
