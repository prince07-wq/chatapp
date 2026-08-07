"use no memo";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import MessageBubble from "../../../components/Chat/MessageBubble.jsx";
import { canEditMessage, MESSAGE_EDIT_WINDOW_MS } from "../utils/message.js";

export default function MessageList({
  messages,
  isTyping,
  messagesEndRef,
  scrollContainerRef,
  onScroll,
  loadingOlderMessages,
  currentUserId,
  onReactMessage,
  onOpenReactionDetails,
  onReplyMessage,
  onEditMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
  highlightedMessageBackendId,
}) {
  const [editEligibilityTime, setEditEligibilityTime] = useState(() => Date.now());
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const highlightTimeoutRef = useRef(null);
  // TanStack Virtual intentionally owns mutable measurement state and opts this renderer out of compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const messageVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 88,
    getItemKey: (index) => messages[index].id,
    overscan: 8,
  });

  useEffect(
    () => () => window.clearTimeout(highlightTimeoutRef.current),
    [],
  );

  useEffect(() => {
    if (!highlightedMessageBackendId) return;
    const message = messages.find(
      (candidate) =>
        String(candidate.backendId) === String(highlightedMessageBackendId),
    );
    if (!message) return;

    const messageIndex = messages.indexOf(message);
    messageVirtualizer.scrollToIndex(messageIndex, {
      align: "center",
      behavior: "smooth",
    });
    setHighlightedMessageId(message.id);
    window.clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = window.setTimeout(
      () => setHighlightedMessageId(null),
      1400,
    );
  }, [highlightedMessageBackendId, messageVirtualizer, messages]);

  useEffect(() => {
    const now = Date.now();
    const nextExpiration = messages.reduce((soonest, message) => {
      if (!canEditMessage(message, now)) return soonest;
      const expiration =
        new Date(message.createdAt).getTime() + MESSAGE_EDIT_WINDOW_MS;
      return soonest === null || expiration < soonest ? expiration : soonest;
    }, null);

    if (nextExpiration === null) return undefined;

    const timeoutId = window.setTimeout(
      () => setEditEligibilityTime(Date.now()),
      Math.max(0, nextExpiration - now + 25),
    );
    return () => window.clearTimeout(timeoutId);
  }, [messages, editEligibilityTime]);

  const eligibilityNow = messages.reduce((latestTime, message) => {
    const createdAt = new Date(message.createdAt).getTime();
    return Number.isFinite(createdAt) ? Math.max(latestTime, createdAt) : latestTime;
  }, editEligibilityTime);

  function handleReplyQuoteClick(messageId) {
    const original = messages.find(
      (message) => String(message.backendId) === String(messageId),
    );
    if (!original) return false;

    const messageIndex = messages.indexOf(original);
    messageVirtualizer.scrollToIndex(messageIndex, {
      align: "center",
      behavior: "smooth",
    });
    setHighlightedMessageId(original.id);
    window.clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = window.setTimeout(
      () => setHighlightedMessageId(null),
      1400,
    );
    return true;
  }

  function renderTypingIndicator() {
    if (!isTyping) return null;

    return (
      <div
        className="mt-2 flex justify-start"
        role="status"
        aria-label="Another user is typing"
      >
        <div className="typing-bubble relative flex h-9 w-[54px] items-center justify-center gap-1 rounded-[16px] rounded-bl-[6px] border border-black/[0.035] bg-[#E9E9EB] shadow-[0_2px_7px_rgba(20,22,26,0.025)] dark:border-white/[0.05] dark:bg-[#2C3036]">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#8E8E93] dark:bg-[#9A9EA6]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#8E8E93] dark:bg-[#9A9EA6]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#8E8E93] dark:bg-[#9A9EA6]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto bg-[#F7F7F5] px-5 py-7 dark:bg-[#111315] sm:px-8 lg:px-10 xl:px-14"
      data-mobile-swipe-ignore
    >
      <div className="relative mx-auto flex min-h-full max-w-[1100px] flex-col">
        {loadingOlderMessages && (
          <div className="pointer-events-none sticky top-0 z-10 flex h-0 justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#8C9198] shadow-[0_2px_7px_rgba(20,22,26,0.04)] dark:bg-[#20242B] dark:text-[#8F96A0]">
              Loading older messages...
            </span>
          </div>
        )}
        <div className="flex justify-center">
          <span className="rounded-full border border-black/[0.035] bg-white px-4 py-1.5 text-[11px] font-medium text-[#777C84] shadow-[0_2px_7px_rgba(20,22,26,0.025)] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#AEB3BB]">
            Today
          </span>
        </div>

        <div className="mt-7 flex flex-1 flex-col justify-center pb-4">
          <div
            className="relative shrink-0"
            style={{ height: messageVirtualizer.getTotalSize() }}
          >
            {messageVirtualizer.getVirtualItems().map((virtualRow) => {
              const message = messages[virtualRow.index];
              return (
                <div
                  key={message.id}
                  ref={messageVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="absolute left-0 top-0 flow-root w-full"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <MessageBubble
                    messageId={message.id}
                    text={message.text}
                    attachment={message.attachment}
                    replyTo={message.replyTo}
                    reactions={message.reactions}
                    currentUserId={currentUserId}
                    senderType={
                      message.direction === "outgoing" ? "sent" : "received"
                    }
                    timestamp={message.time}
                    deliveryStatus={
                      message.direction === "outgoing"
                        ? message.status ?? (message.read ? "seen" : undefined)
                        : undefined
                    }
                    edited={message.edited}
                    breakBefore={message.breakBefore}
                    highlighted={highlightedMessageId === message.id}
                    onReact={
                      message.backendId
                        ? (emoji) => onReactMessage(message, emoji)
                        : undefined
                    }
                    onOpenReactionDetails={() => onOpenReactionDetails(message)}
                    onReply={
                      message.backendId
                        ? () => onReplyMessage(message)
                        : undefined
                    }
                    onReplyQuoteClick={handleReplyQuoteClick}
                    onEdit={
                      canEditMessage(message, eligibilityNow)
                        ? () => onEditMessage(message)
                        : undefined
                    }
                    onDeleteForMe={
                      message.direction === "outgoing" && message.backendId
                        ? () => onDeleteMessageForMe(message)
                        : undefined
                    }
                    onDeleteForEveryone={
                      message.direction === "outgoing" && message.backendId
                        ? () => onDeleteMessageForEveryone(message)
                        : undefined
                    }
                  />
                  {virtualRow.index === messages.length - 1 &&
                    renderTypingIndicator()}
                </div>
              );
            })}
          </div>
          {messages.length === 0 && renderTypingIndicator()}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
