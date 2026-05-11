"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { CameraIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";

import { updateAvatarAction } from "./actions";
import { MAX_SIZE } from "./constants";

interface Props {
  userId: string;
  currentUrl: string | null;
  initials: string;
}

export function AvatarUpload({ userId, currentUrl, initials }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be smaller than 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const result = await updateAvatarAction(publicUrl);
      if (!result.success) throw new Error(result.error);

      setPreviewUrl(publicUrl);
      toast.success("Avatar updated.");
      router.refresh();
    } catch {
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      const result = await updateAvatarAction(null);
      if (!result.success) throw new Error(result.error);

      if (previewUrl) {
        const supabase = createClient();
        const url = new URL(previewUrl);
        const pathParts = url.pathname.split("/avatars/");
        if (pathParts[1]) {
          await supabase.storage.from("avatars").remove([pathParts[1]]);
        }
      }

      setPreviewUrl(null);
      toast.success("Avatar removed.");
      router.refresh();
    } catch {
      toast.error("Failed to remove avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="size-20 text-lg">
          {previewUrl && <AvatarImage src={previewUrl} alt="Your avatar" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {uploading && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center rounded-full">
            <Loader2Icon className="text-foreground size-5 animate-spin" />
          </div>
        )}

        {!uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload avatar"
            className="bg-primary text-primary-foreground ring-background hover:bg-primary/90 absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full shadow ring-2 transition-colors"
          >
            <CameraIcon className="size-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {previewUrl && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 text-xs transition-colors"
        >
          <XIcon className="size-3" />
          Remove photo
        </button>
      )}
    </div>
  );
}
