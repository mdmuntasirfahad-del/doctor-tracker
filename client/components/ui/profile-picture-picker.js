"use client";

import { useId, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  PROFILE_PICTURE_ACCEPT,
  PROFILE_PICTURE_HINT,
  fileToProfilePicture,
} from "@/lib/profile-picture";

export function ProfilePicturePicker({
  name,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  label = "Profile picture",
  hint = PROFILE_PICTURE_HINT,
  idPrefix: providedIdPrefix,
}) {
  const generatedId = useId().replace(/:/g, "");
  const idPrefix = providedIdPrefix ?? generatedId;
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState("");

  const message = error || localError;
  const busy = disabled || processing;

  function openPicker() {
    if (!busy) {
      inputRef.current?.click();
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setLocalError("");
    setProcessing(true);
    try {
      const dataUrl = await fileToProfilePicture(file);
      onChange(dataUrl);
    } catch (error) {
      setLocalError(error?.message ?? "That image could not be processed.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <p className="mb-2 block text-[12.5px] font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar name={name} src={value || undefined} size="xl" />
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-surface bg-brand text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={value ? "Change profile picture" : "Upload profile picture"}
          >
            {processing ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Camera size={14} aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="min-w-0">
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="btn-secondary-quiet h-9 px-3 text-[12.5px]"
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Processing…
              </>
            ) : value ? (
              "Change photo"
            ) : (
              "Upload photo"
            )}
          </button>
          <p id={`${idPrefix}-profile-picture-hint`} className="mt-1.5 text-[11.5px] text-muted">
            {hint}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={`${idPrefix}-profile-picture`}
        type="file"
        accept={PROFILE_PICTURE_ACCEPT}
        className="sr-only"
        onChange={handleFileChange}
        disabled={busy}
        aria-describedby={
          message ? `${idPrefix}-profile-picture-error` : `${idPrefix}-profile-picture-hint`
        }
      />

      {message ? (
        <p
          id={`${idPrefix}-profile-picture-error`}
          role="alert"
          className="mt-2 text-[12px] font-medium text-danger"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
