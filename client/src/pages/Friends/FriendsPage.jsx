import { useCallback, useEffect, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";

import UserListItem from "../../components/Chat/UserListItem.jsx";
import AppleSpinner from "../../components/UI/AppleSpinner.jsx";
import PrimaryButton from "../../components/UI/PrimaryButton.jsx";
import ThemeToggle from "../../components/UI/ThemeToggle.jsx";
import {
  cancelFriendRequest,
  getFriends,
  removeFriend,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from "../../api/userApi.js";

const EMPTY_LISTS = { friends: [], incoming: [], outgoing: [] };
const TABS = [
  { id: "friends", label: "Friends" },
  { id: "incoming", label: "Incoming requests" },
  { id: "outgoing", label: "Outgoing requests" },
];

function initials(username) {
  return String(username || "User").slice(0, 2).toUpperCase();
}

function presenceNameKey(username) {
  const normalized = String(username || "").trim().toLowerCase();
  return normalized ? `name:${normalized}` : "";
}

function avatarFor(username) {
  return {
    initials: initials(username),
    tone:
      "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
  };
}

function errorMessage(error) {
  return (
    error.response?.data?.error ??
    error.response?.data?.message ??
    error.message ??
    "Something went wrong."
  );
}

function SmallButton({ children, variant = "secondary", ...props }) {
  const styles = {
    primary:
      "bg-[#3B82F6] text-white hover:bg-[#3478E5] dark:bg-[#3B82F6]",
    secondary:
      "border border-[#E2E4E1] bg-white text-[#555B63] hover:bg-[#F7F7F5] dark:border-white/[0.09] dark:bg-[#20242B] dark:text-[#C5C9CF] dark:hover:bg-[#262B33]",
    danger:
      "border border-[#E2E4E1] bg-white text-[#A15D5D] hover:bg-[#FBF3F3] dark:border-white/[0.09] dark:bg-[#20242B] dark:text-[#D39494] dark:hover:bg-[#302526]",
  };

  return (
    <button
      type="button"
      className={`h-9 shrink-0 rounded-[10px] px-3 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function FriendsPage({
  onlineUserKeys,
  refreshVersion,
  initialTab = "friends",
  onIncomingCountChange,
  onMessage,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [lists, setLists] = useState(EMPTY_LISTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadFriends = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const nextLists = await getFriends({ signal });
      setLists(nextLists);
      onIncomingCountChange(nextLists.incoming.length);
    } catch (requestError) {
      if (requestError.code !== "ERR_CANCELED") {
        setError(errorMessage(requestError));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [onIncomingCountChange]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadFriends(controller.signal));
    return () => controller.abort();
  }, [loadFriends, refreshVersion]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return undefined;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        setSearchResults(
          await searchUsers(normalizedQuery, { signal: controller.signal }),
        );
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          setError(errorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, refreshVersion]);

  async function runAction(id, request) {
    setActionId(id);
    setError("");
    try {
      await request();
      await loadFriends();
      if (query.trim()) setSearchResults(await searchUsers(query.trim()));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setActionId(null);
    }
  }

  function toChat(person) {
    return {
      id: `dm-${person.userId}`,
      recipientId: String(person.userId),
      name: person.username || "User",
      initials: initials(person.username),
      tone: avatarFor(person.username).tone,
    };
  }

  function searchAction(person) {
    if (person.relationshipStatus === "friend") {
      return (
        <SmallButton variant="primary" onClick={() => onMessage(toChat(person))}>
          Message
        </SmallButton>
      );
    }
    if (person.relationshipStatus === "incoming") {
      return <span className="text-[12px] font-medium text-[#92969D]">Incoming</span>;
    }
    if (person.relationshipStatus === "outgoing") {
      return <span className="text-[12px] font-medium text-[#92969D]">Requested</span>;
    }
    return (
      <PrimaryButton
        className="h-9 w-auto rounded-[10px] px-3 text-[12px]"
        loading={actionId === person.userId}
        onClick={() =>
          runAction(person.userId, () => sendFriendRequest(person.userId))
        }
      >
        Add friend
      </PrimaryButton>
    );
  }

  const visiblePeople = query.trim() ? searchResults : lists[activeTab];
  const emptyText = query.trim()
    ? "No users match that username."
    : activeTab === "friends"
      ? "You have no friends yet. Search by username to add someone."
      : activeTab === "incoming"
        ? "You have no incoming friend requests."
        : "You have no outgoing friend requests.";

  return (
    <section className="col-start-2 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-span-2">
      <header className="shrink-0 border-b border-[#E6E8E5] bg-white px-5 py-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:px-8">
        <div className="mx-auto flex max-w-[1050px] items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9EA5]">
              Workspace
            </p>
            <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em] text-[#1C1E22] dark:text-[#F3F4F6]">
              Friends
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[1050px]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#969AA1]"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (!value.trim()) {
                  setSearchResults([]);
                  setSearching(false);
                }
              }}
              aria-label="Search users by username"
              placeholder="Search users by username"
              className="h-11 w-full rounded-[14px] border border-transparent bg-white pl-10 pr-4 text-[14px] text-[#25272B] outline-none transition-colors placeholder:text-[#9A9EA5] focus:border-[#3B82F6]/35 focus:ring-2 focus:ring-[#3B82F6]/10 dark:bg-[#20242B] dark:text-[#F2F3F5] dark:placeholder:text-[#737A85]"
            />
          </div>

          {!query.trim() && (
            <div className="mt-5 flex flex-wrap gap-2" role="tablist">
              {TABS.map((tab) => {
                const count = lists[tab.id].length;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-9 rounded-xl px-4 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 ${active ? "bg-[#3B82F6] text-white" : "border border-[#E2E4E1] bg-white text-[#646970] hover:bg-[#F7F7F5] dark:border-white/[0.08] dark:bg-[#181A1F] dark:text-[#AEB3BB] dark:hover:bg-[#20242B]"}`}
                  >
                    {tab.label}
                    <span className={`ml-2 ${active ? "text-white/75" : "text-[#3B82F6]"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-5 rounded-[14px] border border-[#EBCFCF] bg-[#FBF3F3] px-4 py-3 text-[13px] text-[#9A5656] dark:border-[#5B3434] dark:bg-[#2B2021] dark:text-[#E0A4A4]">
              {error}
            </div>
          )}

          <div className="mt-5 rounded-[18px] border border-[#E6E8E5] bg-white p-2 dark:border-white/[0.06] dark:bg-[#181A1F]">
            {(loading || searching) && (
              <div className="flex min-h-48 items-center justify-center">
                <AppleSpinner size={28} className="text-[#3B82F6]" label="Loading friends" />
              </div>
            )}

            {!loading && !searching && visiblePeople.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#F1F3F5] text-[#858B94] dark:bg-[#242830] dark:text-[#9BA1AA]">
                  {query.trim() ? <Search size={21} /> : activeTab === "friends" ? <Users size={21} /> : <UserPlus size={21} />}
                </div>
                <p className="mt-3 max-w-sm text-[13px] text-[#858A92] dark:text-[#838A94]">
                  {emptyText}
                </p>
              </div>
            )}

            {!loading && !searching &&
              visiblePeople.map((person) => {
                const online =
                  onlineUserKeys.has(`id:${person.userId}`) ||
                  onlineUserKeys.has(presenceNameKey(person.username));
                let actions = query.trim() ? searchAction(person) : null;

                if (!query.trim() && activeTab === "friends") {
                  actions = (
                    <div className="flex gap-2">
                      <SmallButton variant="primary" onClick={() => onMessage(toChat(person))}>Message</SmallButton>
                      <SmallButton disabled={actionId === person.userId} variant="danger" onClick={() => runAction(person.userId, () => removeFriend(person.userId))}>Remove</SmallButton>
                    </div>
                  );
                } else if (!query.trim() && activeTab === "incoming") {
                  actions = (
                    <div className="flex gap-2">
                      <SmallButton disabled={actionId === person.requestId} variant="primary" onClick={() => runAction(person.requestId, () => respondToFriendRequest(person.requestId, "accept"))}>Accept</SmallButton>
                      <SmallButton disabled={actionId === person.requestId} onClick={() => runAction(person.requestId, () => respondToFriendRequest(person.requestId, "decline"))}>Decline</SmallButton>
                    </div>
                  );
                } else if (!query.trim() && activeTab === "outgoing") {
                  actions = (
                    <SmallButton disabled={actionId === person.requestId} onClick={() => runAction(person.requestId, () => cancelFriendRequest(person.requestId))}>Cancel request</SmallButton>
                  );
                }

                return (
                  <UserListItem
                    key={person.userId}
                    avatar={avatarFor(person.username)}
                    name={person.username}
                    online={online}
                    onlineIndicatorClassName={
                      query.trim() && online ? "bg-[#22C55E]" : undefined
                    }
                    onOpenProfile={() => {}}
                    actions={actions}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
