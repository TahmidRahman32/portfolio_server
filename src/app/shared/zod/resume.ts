import { z } from "zod";

/* ---------------- PERSONAL INFO ---------------- */
export const personalInfoSchema = z.object({
   fullName: z.string(),
   email: z.string().email(),
   phone: z.string().optional(),
   address: z.string().optional(),
   linkedin: z.string().optional(),
   github: z.string().optional(),
   website: z.string().optional(),
});
/* ---------------- EDUCATION ---------------- */
export const educationSchema = z.object({
   id: z.string().optional(),
   institution: z.string(),
   degree: z.string(),
   fieldOfStudy: z.string().optional(),
   startDate: z.string(),
   endDate: z.string(),
   description: z.string().optional(),
});

/* ---------------- WORK EXPERIENCE ---------------- */
export const workExperienceSchema = z.object({
   id: z.string().optional(),
   company: z.string().min(1),
   position: z.string().min(1),
   description: z.string().min(1),
   startDate: z.string().min(1),
   endDate: z.string().optional(),
   current: z.boolean().optional(),
});

/* ---------------- SKILLS ---------------- */
export const skillSchema = z.object({
   id: z.string().optional(),
   name: z.string().min(1),
   level: z.number().min(0).max(100),
   category: z.string().min(1),
});

/* ---------------- PROJECTS ---------------- */
export const projectSchema = z.object({
   id: z.string().optional(),
   name: z.string().min(1),
   description: z.string().min(1),
   technologies: z.array(z.string()).default([]),
   link: z.string().url().optional().or(z.literal("")).optional(),
   image: z.string().url().optional().or(z.literal("")).optional(),
});

/* ---------------- CERTIFICATIONS ---------------- */
export const certificationSchema = z.object({
   id: z.string().optional(),
   title: z.string(),
   issuer: z.string(),
   issueDate: z.string().optional(),
   expiryDate: z.string().optional(),
   credentialId: z.string().optional(),
   credentialUrl: z.string().optional(),
});

/* ---------------- MAIN RESUME ---------------- */
export const resumeSchema = z.object({
   summary: z.string().min(1, "Summary is required"),

   personalInfo: personalInfoSchema.optional(),

   education: z.array(educationSchema).optional(),

   workExperience: z.array(workExperienceSchema).optional(),

   skills: z.array(skillSchema).optional(),

   projects: z.array(projectSchema).optional(),

   certifications: z.array(certificationSchema).optional(),
});
