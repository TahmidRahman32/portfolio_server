// import { Role } from "@prisma/client";

import { Role } from "../../../generated/prisma/enums";

export type IUserPayload = {
   id: string;
   email: string;
   role: Role;
};
