import { FileText, Mic } from "lucide-react";

import { resolveUploadedFileUrl } from "../../../api/fileApi.js";

export default function SharedMediaGrid({ items, hasMore, loading, onLoadMore }) {
  if (!items.length) {
    return <p className="py-6 text-center text-[12px] text-[#92969D]">No shared media yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const attachment = item.attachment;
          const url = resolveUploadedFileUrl(attachment.fileUrl);
          const image = attachment.mimeType?.startsWith("image/");
          const audio = attachment.mimeType?.startsWith("audio/");
          return (
            <a
              key={item.id}
              href={url}
              target="_blank"
              rel="noreferrer"
              download={!image ? attachment.fileName : undefined}
              className="flex aspect-square min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#E6E8E5] bg-white text-[#777D86] dark:border-white/[0.07] dark:bg-[#20242B]"
            >
              {image ? (
                <img src={url} alt={attachment.fileName || "Shared image"} className="h-full w-full object-cover" />
              ) : audio ? (
                <><Mic size={22} /><span className="mt-1 max-w-full truncate px-2 text-[9px]">Voice message</span></>
              ) : (
                <><FileText size={22} /><span className="mt-1 max-w-full truncate px-2 text-[9px]">{attachment.fileName}</span></>
              )}
            </a>
          );
        })}
      </div>
      {hasMore && (
        <button type="button" disabled={loading} onClick={onLoadMore} className="mt-3 w-full rounded-xl py-2 text-[12px] font-medium text-[#3B82F6] hover:bg-[#3B82F6]/5 disabled:opacity-50">
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </>
  );
}
