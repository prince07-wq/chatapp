import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { saveNotificationPreferences } from "../../../utils/notificationPreferences.js";
import { routableSections, swipeIgnoredTargets } from "../constants/chatConfig.js";

const mobileSections = ["rooms", "dms", "friends", "notifications", "profile"];

export default function usePageNavigation({ chat, currentUserId, transport }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    const requested = searchParams.get("section");
    return routableSections.has(requested) ? requested : "rooms";
  });
  const [mobileTransition, setMobileTransition] = useState("");
  const [showMobileChatList, setShowMobileChatList] = useState(false);
  const layoutRef = useRef(null);
  const touchGestureRef = useRef(null);
  const sectionScrollPositionsRef = useRef(new Map());
  const transitionTimeoutRef = useRef(null);
  const syncedSearchSectionRef = useRef(activeSection);

  useEffect(() => {
    const requested = searchParams.get("section");
    if (routableSections.has(requested) && requested !== syncedSearchSectionRef.current) {
      syncedSearchSectionRef.current = requested;
      setActiveSection(requested);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!routableSections.has(activeSection) || searchParams.get("section") === activeSection) return;
    syncedSearchSectionRef.current = activeSection;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("section", activeSection);
    setSearchParams(nextParams, { replace: true });
  }, [activeSection, searchParams, setSearchParams]);

  useLayoutEffect(() => {
    const savedScrollTop = sectionScrollPositionsRef.current.get(activeSection);
    if (savedScrollTop == null || window.innerWidth >= 768) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      const container = Array.from(
        layoutRef.current?.querySelectorAll(".overflow-y-auto") ?? [],
      ).find((element) => element.offsetParent !== null);
      if (container) container.scrollTop = savedScrollTop;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection]);

  useEffect(() => () => window.clearTimeout(transitionTimeoutRef.current), []);

  function rememberMobileSectionScroll() {
    if (window.innerWidth >= 768) return;
    const container = Array.from(
      layoutRef.current?.querySelectorAll(".overflow-y-auto") ?? [],
    ).find((element) => element.offsetParent !== null);
    if (container) sectionScrollPositionsRef.current.set(activeSection, container.scrollTop);
  }

  function handleSectionChange(section, transitionDirection = "", openMobileList = false) {
    if (!routableSections.has(section)) return;
    if (openMobileList && window.innerWidth < 768) setShowMobileChatList(true);
    if (section === activeSection) return;
    rememberMobileSectionScroll();
    if (section === "friends") chat.setFriendsInitialTab("friends");
    if (window.innerWidth < 768 && transitionDirection) {
      window.clearTimeout(transitionTimeoutRef.current);
      setMobileTransition(transitionDirection);
      transitionTimeoutRef.current = window.setTimeout(() => setMobileTransition(""), 180);
    }
    setActiveSection(section);
  }

  function handleTouchStart(event) {
    if (window.innerWidth >= 768 || event.touches.length !== 1) return;
    if (event.target.closest(swipeIgnoredTargets)) return;
    const touch = event.touches[0];
    touchGestureRef.current = { x: touch.clientX, y: touch.clientY, time: performance.now() };
  }

  function handleTouchEnd(event) {
    const gesture = touchGestureRef.current;
    touchGestureRef.current = null;
    if (!gesture || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - gesture.x;
    const deltaY = touch.clientY - gesture.y;
    const elapsed = Math.max(performance.now() - gesture.time, 1);
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.35;
    const passesThreshold = Math.abs(deltaX) >= 64 || Math.abs(deltaX) / elapsed >= 0.5;
    if (!isHorizontal || !passesThreshold || Math.abs(deltaX) < 28) return;
    const currentIndex = mobileSections.indexOf(activeSection);
    const nextSection = mobileSections[deltaX < 0 ? currentIndex + 1 : currentIndex - 1];
    if (nextSection) {
      handleSectionChange(nextSection, deltaX < 0 ? "next" : "previous", nextSection === "rooms" || nextSection === "dms");
    }
  }

  function handleNotificationPreferenceChange(key, enabled) {
    chat.setNotificationPreferences((preferences) => {
      const nextPreferences = { ...preferences, [key]: enabled };
      saveNotificationPreferences(nextPreferences);
      return nextPreferences;
    });
  }

  function handleOpenProfile(conversation) {
    if (conversation?.recipientId == null || String(conversation.recipientId) === String(currentUserId)) return;
    chat.setActiveProfileChat(conversation);
    setActiveSection("member_profile");
  }

  function handleShowMembers() {
    const room = chat.activeRoomRef.current;
    if (transport.getStatus() === "connected" && room) {
      transport.emit("request_members", { room });
    }
    setActiveSection("members");
  }

  return {
    activeSection,
    handleNotificationPreferenceChange,
    handleOpenProfile,
    handleSectionChange,
    handleShowMembers,
    handleTouchEnd,
    handleTouchStart,
    layoutRef,
    mobileTransition,
    setActiveSection,
    setShowMobileChatList,
    showMobileChatList,
    touchGestureRef,
  };
}
