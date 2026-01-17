/**
 * Canva-specific utility functions for asset handling
 */
import { upload } from "@canva/asset";
import axios from "axios";

/**
 * Fetches the content-type of an image from its URL
 * @param imageUrl - The URL of the image to check
 * @returns The content-type header value or null
 */
export async function getImageFileType(imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl);
    const contentType = response.headers["content-type"];
    return contentType;
  } catch (error) {
    console.error("Failed to get image file type:", error);
    return null;
  }
}

/**
 * Uploads an image to Canva from a URL
 * @param imgUrl - The URL of the image to upload
 * @returns The reference to the uploaded image
 */
export async function uploadImage(imgUrl: string): Promise<string> {
  const mimeType = await getImageFileType(imgUrl);
  
  const res = await upload({
    type: "image",
    url: imgUrl,
    mimeType: (mimeType || "image/png") as "image/png",
    thumbnailUrl: imgUrl,
    aiDisclosure: "none",
  });
  
  await res.whenUploaded();
  return res.ref;
}

/**
 * Creates a promise that resolves after a specified delay
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
