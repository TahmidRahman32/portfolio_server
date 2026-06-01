import * as multer from "multer";
// import type { File } from "multer";

import path from "path";
import { v2 as cloudinary } from "cloudinary";

import fs from "fs";
import config from "../../config";
import { UploadedFile } from "../shared/Type/UploadedFile";
// import { UploadedFile } from "../shared/Types/UploadedFile";

const storage = multer.default.diskStorage({
   destination: function (req, file, cb) {
      cb(null, path.join(process.cwd(), "/uploads"));
      // console.log("file", file);
   },
   filename: function (req, file, cb) {
      cb(null, file.originalname);
   },
});

async function uploadToCloudinary(file: UploadedFile) {
   // Configuration
   cloudinary.config({
      cloud_name: config.cloudinary.cloud_name as string,
      api_key: config.cloudinary.api_key as string,
      api_secret: config.cloudinary.api_secret as string,
   });

   // Upload an image
   const uploadResult = await cloudinary.uploader
      .upload(file.path, {
         public_id: `${file.originalname}-${Date.now()}`,
      })
      .catch((error) => {
         throw error;
      });
   fs.unlinkSync(file.path);
   // console.log(uploadResult,"added")

   return uploadResult;

   // // Optimize delivery by resizing and applying auto-format and auto-quality
   // const optimizeUrl = cloudinary.url(`${uploadResult?.public_id}`, {
   //     fetch_format: 'auto',
   //     quality: 'auto'
   // });

   // console.log(optimizeUrl);

   // // Transform the image: auto-crop to square aspect_ratio
   // const autoCropUrl = cloudinary.url(`${uploadResult?.public_id}`, {
   //     crop: 'auto',
   //     gravity: 'auto',
   //     width: 500,
   //     height: 500,
   // });

   // console.log(autoCropUrl);
}

const upload = multer.default({ storage: storage });

export const fileUploader = {
   upload,
   uploadToCloudinary,
};
