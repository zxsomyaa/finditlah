import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/AuthContext";
import { uploadImage } from "@/lib/upload";
import { createListing, getListing, updateListing } from "@/lib/thrift";
import { THRIFT_CATEGORIES, THRIFT_CONDITIONS } from "@/lib/categories";
import { usePageMode, useSite } from "@/lib/SiteContext";
import { cn } from "@/lib/utils";
import { PageBand, Container, ListingTile, inputClass } from "@/components/site/parts";

const EMPTY = { title: "", description: "", category: "tops", price: "", condition: "good", size: "", location_name: "", image_url: "" };

export default function SellItem() {
  usePageMode("t");
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openHelp } = useSite();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    getListing(id)
      .then((l) => {
        if (!l || l.user_id !== user?.id) {
          setError("You can only edit your own listings.");
          return;
        }
        setForm({
          title: l.title || "", description: l.description || "", category: l.category || "others",
          price: String(l.price ?? ""), condition: l.condition || "good", size: l.size || "",
          location_name: l.location_name || "", image_url: l.image_url || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [editing, id, user?.id]);

  /** @param {string} key @param {any} value */
  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      set("image_url", await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /** @param {React.FormEvent} e */
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const price = Number(form.price);
    if (!form.title.trim()) return setError("Please add a title.");
    if (!form.price || isNaN(price) || price <= 0) return setError("Please enter a price above $0.");
    if (price > 5000) return setError("Thrift is for clothes and small items, so prices are capped at $5,000.");
    if (!user) return navigate("/login");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Math.round(price * 100) / 100,
      condition: form.condition,
      size: form.size.trim(),
      location_name: form.location_name.trim(),
      image_url: form.image_url,
    };

    try {
      setSaving(true);
      let saved;
      if (editing) {
        saved = await updateListing(id, payload);
      } else {
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
        const sellerName = profile?.username || user.user_metadata?.full_name || (user.email || "").split("@")[0];
        saved = await createListing({ ...payload, user_id: user.id, seller_name: sellerName, status: "active" });
      }
      queryClient.invalidateQueries({ queryKey: ["thrift-listings"] });
      queryClient.invalidateQueries({ queryKey: ["thrift-listing", saved.id] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      navigate(`/thrift/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the listing");
    } finally {
      setSaving(false);
    }
  };

  const preview = {
    id: "preview", title: form.title || "Your item's name", price: form.price || 0, size: form.size,
    category: form.category, condition: form.condition, location_name: form.location_name || "Area", image_url: form.image_url,
  };

  return (
    <>
      <PageBand>
        <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Thrift</span>
        <h1 className="mt-2 text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1.04] tracking-tight">
          {editing ? "Edit your listing" : "Sell something"}
        </h1>
        <p className="mt-2 text-[17px] opacity-85">
          Clothes and small items only.{" "}
          <button type="button" onClick={() => openHelp("thrift")} className="font-bold underline underline-offset-4">How thrift works</button>
        </p>
      </PageBand>

      <Container className="pb-16">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid items-start gap-6 pt-6 lg:grid-cols-[1.3fr_.7fr]">
            <form onSubmit={submit} className="flex flex-col gap-4 rounded-[22px] border border-border p-5 sm:p-7">
              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted p-6 text-center text-muted-foreground hover:border-ink/50">
                {uploading ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
                <b className="text-foreground">{form.image_url ? "Change photo" : "Add a photo"}</b>
                <span className="text-sm">{uploading ? "Uploading…" : "Good light and a plain background work best."}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={onImage} />
              </label>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-bold">What is it?
                  <input id="sell-title" className={inputClass} placeholder="e.g. Denim jacket" value={form.title} onChange={(e) => set("title", e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">Category
                  <select id="sell-category" className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {THRIFT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">Price (S$)
                  <input id="sell-price" inputMode="decimal" className={inputClass} placeholder="e.g. 18" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">Size (if clothing)
                  <input id="sell-size" className={inputClass} placeholder="e.g. M, EU 40" value={form.size} onChange={(e) => set("size", e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold sm:col-span-2">Area for meet-ups
                  <input id="sell-area" className={inputClass} placeholder="e.g. Tampines, Bishan" value={form.location_name} onChange={(e) => set("location_name", e.target.value)} />
                </label>
              </div>

              <div className="flex flex-col gap-1.5 text-sm font-bold">Condition
                <div role="group" aria-label="Condition" className="flex flex-wrap gap-2">
                  {THRIFT_CONDITIONS.map((c) => (
                    <button key={c.value} type="button" aria-pressed={form.condition === c.value} onClick={() => set("condition", c.value)}
                      className={cn("h-10 rounded-full border px-4 text-sm font-semibold", form.condition === c.value ? "border-ink bg-ink text-white" : "border-border bg-card")}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-sm font-bold">Description
                <textarea id="sell-description" rows={4} className={cn(inputClass, "resize-y")} placeholder="Fit, any marks or wear, why you're selling" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </label>

              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}

              <button type="submit" disabled={saving || uploading} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-thrift px-6 py-3 font-bold text-white disabled:opacity-60">
                {saving && <Loader2 size={17} className="animate-spin" />}
                {editing ? "Save changes" : "List item"}
              </button>
            </form>

            <aside className="sticky top-6 flex flex-col gap-3" aria-label="Live preview">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Live preview</span>
              <div className="pointer-events-none"><ListingTile listing={preview} /></div>
              <p className="text-sm text-muted-foreground">This is how your listing will look in Thrift.</p>
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
