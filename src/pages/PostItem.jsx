import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Camera, Check, Search, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/AuthContext";
import { awardPoints } from "@/lib/rewards";
import { uploadImage } from "@/lib/upload";
import { LOST_CATEGORIES, labelFor } from "@/lib/categories";
import { usePageMode, useSite } from "@/lib/SiteContext";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PageBand, Container, ItemTile, inputClass } from "@/components/site/parts";

/** @param {{ to: string, active: boolean, icon: any, tone: "l"|"t", title: string, sub: string }} props */
function TypeCard({ to, active, icon: Icon, tone, title, sub }) {
  return (
    <Link to={to} aria-current={active ? "true" : undefined}
      className={cn("flex min-h-[132px] flex-col gap-2.5 rounded-[22px] border-2 bg-card p-4 transition hover:-translate-y-0.5",
        active ? "border-ink shadow-[0_18px_40px_-24px_rgba(36,33,28,.45)]" : "border-border")}>
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tone === "t" ? "bg-thrift-soft text-thrift" : "bg-lost-soft text-lost")}><Icon size={21} /></span>
      <b className="text-[17px]">{title}</b>
      <span className="text-sm text-muted-foreground">{sub}</span>
    </Link>
  );
}

export default function PostItem() {
  usePageMode("l");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openHelp } = useSite();
  const [params] = useSearchParams();
  const type = params.get("type") === "lost" ? "lost" : "found";

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "general", location_name: "", date: "", image_url: "" });

  useEffect(() => setError(""), [type]);

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
    if (!form.title.trim() || !form.description.trim()) {
      setError("Please add a title and a short description.");
      return;
    }
    if (!user) return navigate("/login");
    try {
      setSubmitting(true);
      const created = await db.entities.Item.create({
        ...form,
        date: form.date || null,
        type,
        user_id: user.id,
        created_date: new Date().toISOString(),
        status: "active",
      });
      try {
        const earned = await awardPoints(type === "found" ? "post_found" : "report_lost", created.id);
        if (earned > 0) toast({ title: `+${earned} points`, description: "Thanks for helping the community!" });
      } catch (rewardsErr) { console.error(rewardsErr); }
      queryClient.invalidateQueries({ queryKey: ["items"] });
      navigate(`/item/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the post");
    } finally {
      setSubmitting(false);
    }
  };

  const preview = {
    id: "preview", type, title: form.title || "Your item's name", location_name: form.location_name || "Location",
    category: form.category, image_url: form.image_url, created_date: new Date().toISOString(), date: form.date,
  };

  return (
    <>
      <PageBand>
        <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Post</span>
        <h1 className="mt-2 text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1.04] tracking-tight">What would you like to post?</h1>
        <p className="mt-2 text-[17px] opacity-85">
          Each post takes about a minute.{" "}
          <button type="button" onClick={() => openHelp("post")} className="font-bold underline underline-offset-4">Learn more about posting</button>
        </p>
      </PageBand>

      <Container className="pb-16">
        <div className="grid grid-cols-1 gap-3.5 pt-6 sm:grid-cols-3">
          <TypeCard to="/post?type=found" active={type === "found"} icon={Check} tone="l" title="I found something" sub="Help it get back to its owner." />
          <TypeCard to="/post?type=lost" active={type === "lost"} icon={Search} tone="l" title="I lost something" sub="Post a report so finders can reach you." />
          <TypeCard to="/sell" active={false} icon={Tag} tone="t" title="Sell something" sub="Clothes and small items only." />
        </div>

        <div className="grid items-start gap-6 pt-6 lg:grid-cols-[1.3fr_.7fr]">
          <form onSubmit={submit} className="flex flex-col gap-4 rounded-[22px] border border-border p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold tracking-tight">{type === "found" ? "Tell us about what you found" : "Tell us what you lost"}</h2>

            <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted p-6 text-center text-muted-foreground hover:border-ink/50">
              {uploading ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
              <b className="text-foreground">{form.image_url ? "Change photo" : "Add a photo"}</b>
              <span className="text-sm">{uploading ? "Uploading…" : "A clear photo helps people recognise it."}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={onImage} />
            </label>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-bold">What is it?
                <input id="post-title" className={inputClass} placeholder="e.g. Black leather wallet" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-bold">Category
                <select id="post-category" className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {LOST_CATEGORIES.map((c) => <option key={c} value={c}>{labelFor(c)}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-bold">{type === "found" ? "Where did you find it?" : "Where did you lose it?"}
                <input id="post-location" className={inputClass} placeholder="e.g. Woodlands MRT, Tampines Mall" value={form.location_name} onChange={(e) => set("location_name", e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-bold">When?
                <input id="post-date" type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-bold">Description
              <textarea id="post-description" rows={4} className={cn(inputClass, "resize-y")}
                placeholder={type === "found" ? "Where is it now? Keep one detail back so you can check the real owner." : "Colour, brand, anything distinctive"}
                value={form.description} onChange={(e) => set("description", e.target.value)} />
            </label>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={submitting || uploading} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-lost px-6 py-3 font-bold text-white disabled:opacity-60">
              {submitting && <Loader2 size={17} className="animate-spin" />}
              {type === "found" ? "Post found item" : "Post lost report"}
            </button>
          </form>

          <aside className="sticky top-6 flex flex-col gap-3" aria-label="Live preview">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Live preview</span>
            <div className="pointer-events-none"><ItemTile item={preview} /></div>
            <p className="text-sm text-muted-foreground">This is how your post will look in search.</p>
          </aside>
        </div>
      </Container>
    </>
  );
}
