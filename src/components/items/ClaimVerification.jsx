
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, ShieldCheck, ShieldX, Loader2, Lock, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Panel shown to the FINDER to set a verification question on their found item
export function SetVerificationQuestion({ item, onSaved }) {
  const [question, setQuestion] = useState(item.verification_question || "");
  const [answer, setAnswer] = useState(item.verification_answer || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Please enter both a question and the correct answer.");
      return;
    }
    setSaving(true);
    await db.entities.Item.update(item.id, {
      verification_question: question.trim(),
      verification_answer: answer.trim().toLowerCase(),
    });
    setSaving(false);
    toast.success("Verification question saved!");
    onSaved?.();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm">Set Claim Verification</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Set a question only the true owner can answer. This protects against false claims.
      </p>
      <div>
        <Label className="text-xs mb-1 block">Verification Question</Label>
        <Input
          placeholder="e.g. What sticker is on the back of the laptop?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="h-10 rounded-xl text-sm"
        />
      </div>
      <div>
        <Label className="text-xs mb-1 block">Correct Answer (kept private)</Label>
        <Input
          placeholder="e.g. a cat sticker"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="h-10 rounded-xl text-sm"
        />
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm" className="w-full rounded-xl">
        {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
        Save Question
      </Button>
    </div>
  );
}

// Panel shown to the CLAIMANT (non-owner) to submit their answer
export function SubmitClaim({ item, currentUser, onClaimed }) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!item.verification_question) {
    return null; // No question set yet
  }

  // Already claimed by this user
  if (item.claimant_email === currentUser?.email) {
    const claimConfig = {
      pending:  { icon: Shield,     color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Claim Pending", sub: "The finder is reviewing your answer." },
      verified: { icon: ShieldCheck, color: "text-green-600",  bg: "bg-green-50 border-green-200",   label: "Claim Verified!", sub: "Your ownership has been confirmed." },
      rejected: { icon: ShieldX,     color: "text-red-600",    bg: "bg-red-50 border-red-200",       label: "Claim Rejected", sub: "Your answer didn't match. Try contacting the finder." },
    };
    const cfg = claimConfig[item.claim_status] || claimConfig.pending;
    const Icon = cfg.icon;
    return (
      <div className={cn("rounded-2xl border p-4 flex items-center gap-3", cfg.bg)}>
        <Icon className={cn("w-5 h-5 flex-shrink-0", cfg.color)} />
        <div>
          <p className={cn("font-semibold text-sm", cfg.color)}>{cfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.sub}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!answer.trim()) { toast.error("Please enter your answer."); return; }
    setSubmitting(true);
    const isCorrect = answer.trim().toLowerCase() === item.verification_answer?.toLowerCase();
    await db.entities.Item.update(item.id, {
      claimant_email: currentUser.email,
      claim_status: isCorrect ? "verified" : "pending",
    });
    setSubmitting(false);
    if (isCorrect) {
      toast.success("Answer correct! Your claim has been verified.");
    } else {
      toast.info("Answer submitted. The finder will review your claim.");
    }
    onClaimed?.();
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm">Verify Your Ownership</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Answer the question below to prove this item belongs to you.
      </p>
      <div className="bg-background rounded-xl px-3 py-2.5 border border-border">
        <p className="text-sm font-medium">"{item.verification_question}"</p>
      </div>
      <Input
        placeholder="Your answer..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="h-10 rounded-xl text-sm"
      />
      <Button onClick={handleSubmit} disabled={submitting} size="sm" className="w-full rounded-xl">
        {submitting && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
        Submit Claim
      </Button>
    </div>
  );
}

// Panel shown to the OWNER to review pending claims
export function ReviewClaim({ item, onResolved }) {
  const [resolving, setResolving] = useState(false);

  if (!item.claimant_email || item.claim_status === "none") return null;

  const handleReview = async (verdict) => {
    setResolving(true);
    await db.entities.Item.update(item.id, {
      claim_status: verdict,
      status: verdict === "verified" ? "resolved" : item.status,
    });
    setResolving(false);
    toast.success(verdict === "verified" ? "Claim approved! Item marked as resolved." : "Claim rejected.");
    onResolved?.();
  };

  const statusColors = {
    pending:  "bg-yellow-50 border-yellow-200",
    verified: "bg-green-50 border-green-200",
    rejected: "bg-red-50 border-red-200",
  };

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", statusColors[item.claim_status] || "bg-secondary border-border")}>
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm">Ownership Claim Received</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{item.claimant_email}</span> has submitted a claim for this item.
      </p>
      <div className="bg-background/70 rounded-xl px-3 py-2 border border-border/50 text-xs">
        <span className="text-muted-foreground">Status: </span>
        <span className={cn("font-semibold capitalize",
          item.claim_status === "pending" ? "text-yellow-600" :
          item.claim_status === "verified" ? "text-green-600" : "text-red-600"
        )}>
          {item.claim_status}
        </span>
      </div>
      {item.claim_status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleReview("verified")}
            disabled={resolving}
            className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white"
          >
            {resolving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReview("rejected")}
            disabled={resolving}
            className="flex-1 rounded-xl border-red-300 text-red-600 hover:bg-red-50"
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}