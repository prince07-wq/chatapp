import { useState } from "react";
import { Users } from "lucide-react";

const sizes = {
  sm: { pixels: 36, fontSize: 12 },
  md: { pixels: 48, fontSize: 48 * 0.28 },
  lg: { pixels: 54, fontSize: 54 * 0.28 },
};

function Avatar({
  size = "md",
  imageSrc,
  initials,
  online = false,
  group = false,
  tone = "",
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const { pixels, fontSize } = sizes[size];
  const showImage = imageSrc && failedSrc !== imageSrc;

  return (
    <div className="relative shrink-0">
      <div
        className={`flex items-center justify-center rounded-full ${tone}`}
        style={{ width: pixels, height: pixels }}
        aria-hidden="true"
      >
        {showImage ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full rounded-full object-cover"
            onError={() => setFailedSrc(imageSrc)}
          />
        ) : group ? (
          <Users size={pixels * 0.42} strokeWidth={1.8} />
        ) : (
          <span
            className={
              size === "sm"
                ? "font-semibold"
                : "font-semibold tracking-[-0.02em]"
            }
            style={{ fontSize }}
          >
            {initials}
          </span>
        )}
      </div>

      {online && (
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#7D838C] dark:border-[#181A1F] dark:bg-[#A2A8B1]" />
      )}
    </div>
  );
}

export default Avatar;
