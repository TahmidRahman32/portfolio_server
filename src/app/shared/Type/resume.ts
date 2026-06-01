// types/resume.ts
export interface PersonalInfo {
   fullName: string;
   email: string;
   phone: string;
   address?: string;
   linkedin?: string;
   github?: string;
   website?: string;
}

export interface Education {
   id: string;
   institution: string;
   degree: string;
   fieldOfStudy: string;
   startDate: string;
   endDate: string;
   gpa?: string;
   description?: string;
}

export interface WorkExperience {
   id: string;
   company: string;
   position: string;
   startDate: string;
   endDate: string;
   current: boolean;
   description?: string;
   achievements?: string[];
}

export interface Skill {
   id: string;
   name: string;
   level?: string;
   category?: string;
}

export interface Project {
   id: string;
   name: string;
   description: string;
   startDate?: string;
   endDate?: string;
   current?: boolean;
   url?: string;
   technologies: string[];
}

export interface ResumeData {
   personalInfo: PersonalInfo;
   summary: string;
   education: Education[];
   workExperience: WorkExperience[];
   skills: Skill[];
   projects: Project[];
}

export type ResumeTemplate = "modern" | "professional" | "creative" | "minimal";

export interface CreateResumeDto {
   title: string;
   template?: ResumeTemplate;
   // Flat fields from personal info
   fullName: string;
   email: string;
   phone: string;
   address?: string;
   linkedin?: string;
   github?: string;
   website?: string;
   summary?: string;
   // Arrays for related data
   education: Omit<Education, "id" | "resumeId" | "createdAt" | "updatedAt">[];
   workExperience: Omit<WorkExperience, "id" | "resumeId" | "createdAt" | "updatedAt">[];
   skills: Omit<Skill, "id" | "resumeId" | "createdAt" | "updatedAt">[];
   projects: Omit<Project, "id" | "resumeId" | "createdAt" | "updatedAt">[];
   userId: number;
}

export interface UpdateResumeDto extends Partial<CreateResumeDto> {
   id: string;
}

export interface ResumeResponse {
   id: string;
   title: string;
   template: string;
   fullName: string;
   email: string;
   phone: string;
   address?: string;
   linkedin?: string;
   github?: string;
   website?: string;
   summary?: string;
   education: Education[];
   workExperience: WorkExperience[];
   skills: Skill[];
   projects: Project[];
   createdAt: Date;
   updatedAt: Date;
   userId: number;
   pdfData?: Buffer;
   fileName?: string;
   fileSize?: number;
   lastSavedAt: Date;
}

// Helper function to convert frontend data to backend DTO
export function mapFrontendToBackend(frontendData: ResumeData, title: string, userId: number, template: ResumeTemplate = "modern"): CreateResumeDto {
   return {
      title,
      template,
      userId,
      // Map personal info to flat fields
      fullName: frontendData.personalInfo.fullName,
      email: frontendData.personalInfo.email,
      phone: frontendData.personalInfo.phone,
      address: frontendData.personalInfo.address,
      linkedin: frontendData.personalInfo.linkedin,
      github: frontendData.personalInfo.github,
      website: frontendData.personalInfo.website,
      summary: frontendData.summary,
      // Map arrays without frontend-generated IDs
      education: frontendData.education.map((edu) => ({
         institution: edu.institution,
         degree: edu.degree,
         fieldOfStudy: edu.fieldOfStudy,
         startDate: edu.startDate,
         endDate: edu.endDate,
         description: edu.description,
         grade: edu.gpa, // Map gpa to grade for Prisma schema
      })),
      workExperience: frontendData.workExperience.map((exp) => ({
         company: exp.company,
         position: exp.position,
         startDate: exp.startDate,
         endDate: exp.endDate,
         current: exp.current || false,
         description: exp.description,
      })),
      skills: frontendData.skills.map((skill) => ({
         name: skill.name,
         level: skill.level,
         category: skill.category,
      })),
      projects: frontendData.projects.map((project) => ({
         name: project.name,
         description: project.description,
         startDate: project.startDate,
         endDate: project.endDate,
         current: project.current || false,
         url: project.url,
         technologies: project.technologies || [],
      })),
   };
}
