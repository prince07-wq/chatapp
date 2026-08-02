import Avatar from "./Avatar.jsx";

function ConversationHeader({
  avatar,
  name,
  statusText,
  online = false,
  headerActions,
}) {
  return (
    <header className="relative flex h-[92px] shrink-0 items-center border-b border-[#E8E9E6] bg-white px-4 dark:border-white/[0.06] dark:bg-[#181A1F] lg:px-6">
      <div className="hidden items-center lg:flex">
        <Avatar {...avatar} size="lg" online={online} />
      </div>

      <div className="absolute left-1/2 top-1/2 max-w-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em] text-[#202226] dark:text-[#F4F5F6]">
          {name}
        </h2>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[#7B8087] dark:text-[#969CA6]">
          <span>{statusText}</span>
          {online && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#7D838C] dark:bg-[#A2A8B1]" />
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-0.5">{headerActions}</div>
    </header>
  );
}

export default ConversationHeader;
