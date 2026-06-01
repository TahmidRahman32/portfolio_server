import { NextFunction, Request, Response, Router } from "express";
import { useController } from "./user.controller";
import auth from "../../middlewares/auth";
import { Role as userRole } from "@prisma/client";
import { fileUploader } from "../../helpers/fileUploader";

const router = Router();

router.get("/all", auth(userRole.ADMIN), useController.getAllUser);
router.get("/my-profile", auth(userRole.USER, userRole.ADMIN), useController.getMyProfile);

router.post("/create", useController.createUser);
router.patch("/update-status/:id", useController.UpdateUserStatus);
// router.get("/:id", useController.UpdateUserStatus);
router.patch("/update-my-profile", auth(userRole.ADMIN, userRole.USER, userRole.SUPER_ADMIN), fileUploader.upload.single("file"), (req: Request, res: Response, next: NextFunction) => {
   req.body = JSON.parse(req.body.data);
   return useController.updateMyProfile(req, res, next);
});

export const userRouter = router;
