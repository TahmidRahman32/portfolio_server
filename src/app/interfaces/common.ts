// import { userRole } from "../../generated/enums";

// import { Role } from "@prisma/client";


export type IAuthUser = {
   email: string;
   id: string;
   role: Role;
} | null;
