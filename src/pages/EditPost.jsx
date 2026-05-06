import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/db";

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

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    location_name: "",
    date: "",
    type: "lost",
  });

  useEffect(() => {
    const loadItem = async () => {
      try {
        const item = await db.entities.Item.getById(id);

        setForm({
          title: item.title || "",
          description: item.description || "",
          category: item.category || "general",
          location_name: item.location_name || "",
          date: item.date || "",
          type: item.type || "lost",
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      alert("Title and Description required");
      return;
    }

    try {
      setSaving(true);

      await db.entities.Item.update(id, form);

      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <div className="w-full max-w-xl mx-auto bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>

        <div className="space-y-1">
          <label className="text-sm font-medium">Post Type</label>
          <select
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm"
          >
            <option value="lost">Lost Item</option>
            <option value="found">Found Item</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Location</label>
          <input
            value={form.location_name}
            onChange={(e) => handleChange("location_name", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}