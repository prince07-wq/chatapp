function NavigationItem({
  icon: Icon,
  label,
  active = false,
  badge,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      onClick={onClick}
      className="group flex w-full shrink-0 flex-col items-center gap-1.5 text-center focus:outline-none"
    >
      <span
        className={[
          "relative flex h-[50px] w-[50px] items-center justify-center rounded-[15px]",
          "transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-[#3B82F6]/50",
          active
            ? "bg-[#3B82F6] text-white"
            : "text-[#979DA6] group-hover:bg-white/[0.045] group-hover:text-[#C8CCD2]",
        ].join(" ")}
      >
        <Icon size={21} strokeWidth={active ? 2.1 : 1.8} />

        {badge && (
          <span className="absolute -right-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#17191D] bg-[#3A3F47] px-1 text-[9px] font-semibold text-[#E5E7EA] dark:border-[#181A1F]">
            {badge}
          </span>
        )}
      </span>

      <span
        className={[
          "text-[10px] font-medium leading-none transition-colors duration-200",
          active
            ? "text-[#DDE1E6]"
            : "text-[#7F858F] group-hover:text-[#A8ADB5]",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}

export default NavigationItem;