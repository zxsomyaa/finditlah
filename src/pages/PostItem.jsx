import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, ImagePlus } from "lucide-react";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase-client";
import { awardPoints } from "@/lib/rewards";
import { toast } from "@/components/ui/use-toast";

/* ---------------- CLOUDINARY CONFIG ---------------- */
const CLOUD_NAME = "dlu21nvii";
const UPLOAD_PRESET = "fxipenex";

/* ---------------- CATEGORIES ---------------- */
const categories = [
  "general",
  "electronics",
  "wallet",
  "keys",
  "bags",
  "documents",
  "jewellery",
  "clothing",
  "phone",
  "laptop",
  "watch",
  "id card",
  "passport",
  "student card",
  "books",
  "water bottle",
  "umbrella",
  "accessories",
  "sports items",
  "headphones",
  "charger",
  "others",
];

/* ---------------- UPLOAD FUNCTION ---------------- */
/** @param {File} file */
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed");
  }

  return data.secure_url;
};

export default function PostItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    location_name: "",
    date: "",
    type: "lost",
    image_url: "",
  });

  /**
   * @param {string} key
   * @param {any} value
   */
  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);

      setForm((prev) => ({
        ...prev,
        image_url: url,
      }));
    } catch (err) {
      console.error(err);
      alert((err instanceof Error && err.message) || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      alert("Title and Description required");
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      alert("Please login first");
      return;
    }

    try {
      setSubmitting(true);

      const created = await db.entities.Item.create({
        ...form,
        user_id: user.id,
        created_date: new Date().toISOString(),
        status: "active",
      });

      try {
        const earned = await awardPoints(form.type === "found" ? "post_found" : "report_lost", created.id);
        if (earned > 0) {
          toast({ title: `+${earned} points`, description: "Thanks for helping the community!" });
        }
      } catch (rewardsErr) {
        console.error(rewardsErr);
      }

      queryClient.invalidateQueries({ queryKey: ["items"] });
      navigate("/");
    } catch (err) {
      console.error(err);
      alert((err instanceof Error && err.message) || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <div className="w-full max-w-xl mx-auto bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Post</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share details so others can help you find it.
          </p>
        </div>

        {/* TYPE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Post Type
          </label>
          <select
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="lost">Lost Item</option>
            <option value="found">Found Item</option>
          </select>
        </div>

        {/* IMAGE */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Item Image
          </label>

          <div className="border border-border rounded-xl bg-background p-3">
            <label className="flex items-center justify-center gap-2 cursor-pointer text-sm text-muted-foreground border border-dashed border-border rounded-xl py-4 hover:bg-muted transition">
              <ImagePlus className="w-5 h-5" />
              {uploading ? "Uploading image..." : "Upload Image"}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />
            </label>

            {form.image_url && (
              <div className="mt-3 w-full h-44 bg-muted rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={form.image_url}
                  alt="preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* TITLE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Title</label>
          <input
            placeholder="e.g. Gold earring"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            placeholder="Describe the item clearly..."
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* CATEGORY */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* LOCATION */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Location
          </label>
          <input
            placeholder="e.g. Jurong, Orchard, Tampines"
            value={form.location_name}
            onChange={(e) => handleChange("location_name", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* DATE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 rounded-xl font-semibold flex justify-center items-center transition disabled:opacity-60"
        >
          {submitting || uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Create Post"
          )}
        </button>
      </div>
    </div>
  );
}