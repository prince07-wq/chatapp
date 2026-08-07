import { Bell, LogOut } from "lucide-react";

import PrimaryButton from "../../components/UI/PrimaryButton.jsx";
import ThemeToggle from "../../components/UI/ThemeToggle.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const preferenceRows = [
  {
    key: "friendRequests",
    label: "Friend requests",
    description: "Requests and accepted friend updates",
  },
  {
    key: "directMessages",
    label: "Direct messages",
    description: "Unread private message notifications",
  },
  {
    key: "roomMessages",
    label: "Room messages",
    description: "Unread room message notifications",
  },
];

function PreferenceSwitch({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 ${checked ? "bg-[#3B82F6]" : "bg-[#D8DADD] dark:bg-[#3A3F47]"}`}
    >
      <span
        className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

export default function SettingsPage({
  preferences,
  onPreferenceChange,
  loggingOut,
  onLogout,
}) {
  const { theme } = useTheme();

  return (
    <section className="col-start-1 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-span-2 md:col-start-2">
      <header className="shrink-0 border-b border-[#E6E8E5] bg-white px-5 py-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:px-8">
        <div className="mx-auto flex max-w-[1050px] items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9EA5]">
              Workspace
            </p>
            <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em] text-[#1C1E22] dark:text-[#F3F4F6]">
              Settings
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[720px] space-y-5">
          <section className="rounded-[18px] border border-[#E6E8E5] bg-white p-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#25272B] dark:text-[#F0F1F3]">
                  Appearance
                </h2>
                <p className="mt-1 text-[12px] text-[#92969D] dark:text-[#777E88]">
                  {theme === "dark" ? "Dark theme" : "Light theme"}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          <section className="rounded-[18px] border border-[#E6E8E5] bg-white p-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:p-6">
            <div className="flex items-center gap-2 text-[#25272B] dark:text-[#F0F1F3]">
              <Bell size={17} strokeWidth={1.9} />
              <h2 className="text-[15px] font-semibold">Notifications</h2>
            </div>
            <div className="mt-3 divide-y divide-[#ECEDEA] dark:divide-white/[0.06]">
              {preferenceRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-[14px] font-medium text-[#35383D] dark:text-[#E4E6E9]">
                      {row.label}
                    </p>
                    <p className="mt-1 text-[12px] text-[#92969D] dark:text-[#777E88]">
                      {row.description}
                    </p>
                  </div>
                  <PreferenceSwitch
                    checked={preferences[row.key]}
                    label={row.label}
                    onChange={(checked) => onPreferenceChange(row.key, checked)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-[#E6E8E5] bg-white p-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:p-6">
            <PrimaryButton
              loading={loggingOut}
              onClick={onLogout}
              className="bg-[#3B82F6]"
            >
              <span className="flex items-center gap-2">
                <LogOut size={18} />
                Log out
              </span>
            </PrimaryButton>
          </section>
        </div>
      </div>
    </section>
  );
}
