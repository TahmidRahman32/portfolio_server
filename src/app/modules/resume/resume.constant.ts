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