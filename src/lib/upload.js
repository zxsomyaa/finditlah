/* Image uploads go to Cloudinary (same account the app already uses). */
const CLOUD_NAME = "dlu21nvii";
const UPLOAD_PRESET = "fxipenex";

/** @param {File} file */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed");
  }
  return data.secure_url;
}
