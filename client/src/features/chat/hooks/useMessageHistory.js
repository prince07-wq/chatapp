import { useRef, useState } from "react";

export default function useMessageHistory(initialMessages) {
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const oldestPageRef = useRef(null);
  const hasOlderMessagesRef = useRef(false);
  const olderRequestInFlightRef = useRef(false);
  const historyGenerationRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const initialScrollPendingRef = useRef(false);
  const prependScrollSnapshotRef = useRef(null);
  const programmaticScrollTopRef = useRef(null);
  const previousScrollTopRef = useRef(null);
  const shouldAutoScrollNewMessageRef = useRef(false);
  const wasTypingRef = useRef(false);
  const receivedSocketMessageIdsRef = useRef(new Set());

  return {
    chatMessages,
    setChatMessages,
    loadingOlderMessages,
    setLoadingOlderMessages,
    messagesEndRef,
    messagesScrollRef,
    oldestPageRef,
    hasOlderMessagesRef,
    olderRequestInFlightRef,
    historyGenerationRef,
    isNearBottomRef,
    initialScrollPendingRef,
    prependScrollSnapshotRef,
    programmaticScrollTopRef,
    previousScrollTopRef,
    shouldAutoScrollNewMessageRef,
    wasTypingRef,
    receivedSocketMessageIdsRef,
  };
}
