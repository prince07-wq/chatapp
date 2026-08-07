import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Settings, Upload, X } from "lucide-react";

import Avatar from "../../components/Chat/Avatar.jsx";
import FloatingInput from "../../components/UI/FloatingInput.jsx";
import PrimaryButton from "../../components/UI/PrimaryButton.jsx";
import ThemeToggle from "../../components/UI/ThemeToggle.jsx";
import { resolveUploadedFileUrl, uploadFile } from "../../api/fileApi.js";
import { updateProfile } from "../../api/profileApi.js";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{2,32}$/;

function getErrorMessage(error) {
  return (
    error.response?.data?.error ??
    error.response?.data?.message ??
    error.message ??
    "Unable to update your profile."
  );
}

export default function ProfilePage({
  user,
  online,
  onProfileUpdated,
  onOpenSettings,
}) {
  const username = user?.username || "User";
  const displayName = user?.displayName || "";
  const bio = user?.bio || "";
  const email = user?.email || "";
  const profileImage = resolveUploadedFileUrl(user?.profileImage);
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draftUsername, setDraftUsername] = useState(username);
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [draftBio, setDraftBio] = useState(bio);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function resetEditor() {
    setDraftUsername(username);
    setDraftDisplayName(displayName);
    setDraftBio(bio);
    setImageFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");
    setDragging(false);
  }

  function openEditor() {
    resetEditor();
    setEditing(true);
  }

  function chooseImage(file) {
    if (!file) return;
    setError("");
    setSuccess("");

    if (!IMAGE_TYPES.has(file.type)) {
      setError("Choose a PNG, JPEG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Profile images must be 10 MB or smaller.");
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setEditing(true);
  }

  const normalizedUsername = draftUsername.trim();
  const usernameError =
    normalizedUsername && !USERNAME_REGEX.test(normalizedUsername)
      ? "Use 2-32 letters, numbers, dots, dashes, or underscores."
      : "";
  const hasChanges = normalizedUsername !== username || draftDisplayName.trim() !== displayName || draftBio.trim() !== bio || Boolean(imageFile);
  const canSave = hasChanges && !usernameError && normalizedUsername && !saving;

  async function handleSave(event) {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let nextProfileImage = user?.profileImage || "";
      if (imageFile) {
        const uploaded = await uploadFile(imageFile);
        if (!uploaded?.url) throw new Error("Image upload did not return a URL.");
        nextProfileImage = uploaded.url;
      }

      const response = await updateProfile({
        username: normalizedUsername,
        displayName: draftDisplayName.trim(),
        bio: draftBio.trim(),
        ...(imageFile ? { profileImage: nextProfileImage } : {}),
      });
      onProfileUpdated(response);
      setDraftUsername(response.user.username);
      setDraftDisplayName(response.user.displayName || "");
      setDraftBio(response.user.bio || "");
      setImageFile(null);
      setPreviewUrl("");
      setSuccess("Profile updated successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="col-start-1 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-span-2 md:col-start-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={(event) => {
          chooseImage(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <header className="shrink-0 border-b border-[#E6E8E5] bg-white px-5 py-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:px-8">
        <div className="mx-auto flex max-w-[1050px] items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9EA5]">Workspace</p>
            <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em] text-[#1C1E22] dark:text-[#F3F4F6]">Profile</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6F737B] transition-colors duration-200 hover:bg-black/[0.045] hover:text-[#202226] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:text-[#9CA2AC] dark:hover:bg-white/[0.07] dark:hover:text-white md:hidden"
            >
              <Settings size={19} strokeWidth={1.8} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[720px] rounded-[18px] border border-[#E6E8E5] bg-white p-6 dark:border-white/[0.06] dark:bg-[#181A1F] sm:p-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Choose a profile picture"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35"
            >
              <Avatar
                size="lg"
                imageSrc={profileImage}
                initials={username.slice(0, 2).toUpperCase()}
                online={online}
                onlineIndicatorClassName={online ? "bg-[#22C55E]" : undefined}
                tone="bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]"
              />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[18px] font-semibold text-[#25272B] dark:text-[#F0F1F3]">{displayName || username}</h2>
              {displayName && <p className="mt-0.5 truncate text-[12px] text-[#92969D]">@{username}</p>}
              <p className="mt-1 text-[13px] text-[#92969D] dark:text-[#777E88]">{online ? "Online" : "Offline"}</p>
            </div>
            <button
              type="button"
              onClick={openEditor}
              className="shrink-0 rounded-[10px] bg-[#3B82F6]/10 px-3 py-2 text-[12px] font-semibold text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:bg-[#3B82F6]/15 dark:text-[#7EACF8]"
            >
              Edit Profile
            </button>
          </div>

          <div className="mt-7 space-y-4">
            <FloatingInput label="Username" value={username} disabled readOnly />
            <FloatingInput label="Display name" value={displayName} disabled readOnly />
            <FloatingInput label="Bio" value={bio} disabled readOnly />
            <FloatingInput label="Email" type="email" value={email} disabled readOnly />
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && setEditing(false)}>
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[18px] border border-[#E6E8E5] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#181A1F] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
            <div className="flex items-center justify-between">
              <h2 id="edit-profile-title" className="text-[20px] font-semibold text-[#25272B] dark:text-[#F0F1F3]">Edit Profile</h2>
              <button type="button" disabled={saving} onClick={() => setEditing(false)} aria-label="Close edit profile" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#858A92] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 disabled:opacity-50 dark:hover:bg-[#20242B]">
                <X size={19} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
              onDrop={(event) => { event.preventDefault(); setDragging(false); chooseImage(event.dataTransfer.files?.[0]); }}
              className={`mt-6 flex w-full flex-col items-center rounded-[16px] border border-dashed px-5 py-6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 ${dragging ? "border-[#3B82F6] bg-[#3B82F6]/5" : "border-[#D8DAD6] bg-[#F7F7F5] dark:border-white/[0.1] dark:bg-[#20242B]"}`}
            >
              <div className="relative">
                <Avatar size="lg" imageSrc={previewUrl || profileImage} initials={normalizedUsername.slice(0, 2).toUpperCase()} tone="bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]" />
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#3B82F6] text-white dark:border-[#181A1F]"><Camera size={14} /></span>
              </div>
              <span className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#555B63] dark:text-[#C5C9CF]"><Upload size={16} />Choose or drop an image</span>
              <span className="mt-1 text-[11px] text-[#92969D] dark:text-[#777E88]">PNG, JPEG, GIF, or WebP up to 10 MB</span>
            </button>

            <div className="mt-5">
              <FloatingInput label="Username" value={draftUsername} error={usernameError} onChange={(event) => { setDraftUsername(event.target.value); setError(""); setSuccess(""); }} autoComplete="username" />
            </div>
            <div className="mt-4"><FloatingInput label="Display name" value={draftDisplayName} maxLength={80} onChange={(event) => { setDraftDisplayName(event.target.value); setError(""); setSuccess(""); }} /></div>
            <div className="mt-4"><FloatingInput label="Bio" value={draftBio} maxLength={280} onChange={(event) => { setDraftBio(event.target.value); setError(""); setSuccess(""); }} /></div>

            {error && <p className="mt-4 rounded-[12px] bg-[#FBF3F3] px-4 py-3 text-[13px] text-[#9A5656] dark:bg-[#2B2021] dark:text-[#E0A4A4]" role="alert">{error}</p>}
            {success && <p className="mt-4 flex items-center gap-2 rounded-[12px] bg-[#EEF8F1] px-4 py-3 text-[13px] text-[#39724A] dark:bg-[#203027] dark:text-[#91D2A4]" role="status"><CheckCircle2 size={16} />{success}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => setEditing(false)} className="h-11 rounded-[12px] border border-[#E2E4E1] px-4 text-[13px] font-semibold text-[#555B63] hover:bg-[#F7F7F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 disabled:opacity-50 dark:border-white/[0.09] dark:text-[#C5C9CF] dark:hover:bg-[#20242B]">Cancel</button>
              <PrimaryButton type="submit" loading={saving} disabled={!canSave} className="h-11 w-auto rounded-[12px] px-5 text-[13px]">Save</PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
