/* eslint-disable react-hooks/immutability, react-hooks/refs */
import { Bell, House, LogOut, MessageCircle, MessageSquare, Phone, Settings, User, UserPlus } from "lucide-react";

import Avatar from "../../../components/Chat/Avatar.jsx";
import DeleteConversationModal from "../../../components/Chat/DeleteConversationModal.jsx";
import MuteConversationModal from "../../../components/Chat/MuteConversationModal.jsx";
import NavigationItem from "../../../components/Chat/NavigationItem.jsx";
import ReactionDetailsModal from "../../../components/Chat/ReactionDetailsModal.jsx";
import FriendsPage from "../../../pages/Friends/FriendsPage.jsx";
import NotificationsPage from "../../../pages/Notifications/NotificationsPage.jsx";
import ProfilePage from "../../../pages/Profile/ProfilePage.jsx";
import SettingsPage from "../../../pages/Settings/SettingsPage.jsx";
import ConversationDetailsPanel from "../../conversation-details/components/ConversationDetailsPanel.jsx";
import { getDmRoomId } from "../utils/conversation.js";
import useChatController from "../hooks/useChatController.js";
import ChatSidebar from "./ChatSidebar.jsx";
import ConversationPanel from "./ConversationPanel.jsx";

const navigationItems = [
  { label: "Rooms", icon: House, section: "rooms" },
  { label: "DMs", icon: MessageCircle, section: "dms" },
  { label: "Friends", icon: UserPlus, section: "friends" },
  { label: "Calls", icon: Phone },
  { label: "Notifications", icon: Bell, section: "notifications" },
  { label: "Profile", icon: User, section: "profile" },
  { label: "Settings", icon: Settings, section: "settings" },
];
const mobileSections = ["rooms", "dms", "friends", "notifications", "profile"];

function NavigationRail({ controller }) {
  return (
    <aside className="hidden min-h-0 w-[76px] flex-col bg-[#17191D] text-white dark:bg-[#181A1F] md:flex">
      <div className="flex h-[84px] shrink-0 items-center justify-center border-b border-white/[0.06]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.07] bg-white/[0.055]">
          <MessageSquare size={22} strokeWidth={2} />
        </div>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col items-center gap-2.5 overflow-y-auto px-2 py-3" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <NavigationItem key={item.label} icon={item.icon} label={item.label} active={item.section === controller.activeSection} badge={item.section === "friends" ? controller.incomingFriendCount || undefined : item.section === "notifications" ? controller.unreadNotificationCount || undefined : item.badge} onClick={item.section ? () => controller.handleSectionChange(item.section) : undefined} />
        ))}
      </nav>
      <div className="flex shrink-0 items-center justify-center gap-1 border-t border-white/[0.06] py-3">
        <Avatar size="sm" imageSrc={controller.resolveUploadedFileUrl(controller.user?.profileImage)} initials={controller.profileInitials} tone="border border-white/10 bg-[#25282E] text-white" />
        <button type="button" onClick={controller.handleLogout} disabled={controller.loggingOut} aria-label="Log out" title="Log out" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8F959E] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:cursor-not-allowed disabled:opacity-50">
          <LogOut size={18} strokeWidth={1.9} />
        </button>
      </div>
    </aside>
  );
}

function MobileNavigation({ controller }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(76px+env(safe-area-inset-bottom))] items-start justify-around border-t border-white/[0.06] bg-[#17191D] px-1.5 pt-2 text-white dark:bg-[#181A1F] md:hidden" aria-label="Primary navigation">
      {navigationItems.filter((item) => mobileSections.includes(item.section)).map((item) => (
        <div key={item.section} className="flex min-w-0 flex-1 justify-center">
          <NavigationItem icon={item.icon} label={item.label} active={item.section === controller.activeSection} badge={item.section === "friends" ? controller.incomingFriendCount || undefined : item.section === "notifications" ? controller.unreadNotificationCount || undefined : undefined} onClick={() => controller.handleSectionChange(item.section, "", item.section === "rooms" || item.section === "dms")} />
        </div>
      ))}
    </nav>
  );
}

export default function ChatPageView() {
  const chat = useChatController();
  const details = chat.conversationDetailsController;
  return (
    <main className="h-[100dvh] min-h-0 overflow-x-hidden overflow-y-hidden bg-[#F7F7F5] pb-[calc(76px+env(safe-area-inset-bottom))] font-sans text-[#202226] dark:bg-[#111315] dark:text-[#F4F5F6] md:h-screen md:min-h-[640px] md:pb-0" onTouchStart={chat.handleTouchStart} onTouchEnd={chat.handleTouchEnd} onTouchCancel={() => { chat.touchGestureRef.current = null; }}>
      <div ref={chat.layoutRef} className={`grid h-full min-w-0 grid-cols-[minmax(0,1fr)] md:grid-cols-[76px_300px_minmax(0,1fr)] xl:grid-cols-[76px_390px_minmax(0,1fr)] 2xl:grid-cols-[76px_420px_minmax(0,1fr)] ${chat.mobileTransition ? `mobile-section-${chat.mobileTransition}` : ""}`}>
        <NavigationRail controller={chat} />
        {chat.activeSection === "friends" ? (
          <FriendsPage onlineUserKeys={chat.onlineUserKeys} refreshVersion={chat.friendsRefreshVersion} initialTab={chat.friendsInitialTab} onIncomingCountChange={chat.setIncomingFriendCount} onMessage={chat.handleMessageUser} />
        ) : chat.activeSection === "notifications" ? (
          <NotificationsPage notifications={chat.notifications} onOpen={chat.handleOpenNotification} />
        ) : chat.activeSection === "profile" ? (
          <ProfilePage user={chat.user} online={chat.socketConnected} onProfileUpdated={chat.updateAuthenticatedUser} onOpenSettings={() => chat.handleSectionChange("settings")} />
        ) : chat.activeSection === "settings" ? (
          <SettingsPage preferences={chat.notificationPreferences} onPreferenceChange={chat.handleNotificationPreferenceChange} loggingOut={chat.loggingOut} onLogout={chat.handleLogout} />
        ) : (
          <>
            <ChatSidebar title={chat.listTitle} chatItems={chat.visibleChats} conversationAvatarOverride={chat.displayedActiveChat} emptyMessage={chat.listEmptyMessage} peopleMode={chat.peopleMode} activeRoom={chat.activeRoom} activeRoomOnline={chat.activeChatOnline} onlineUserKeys={chat.onlineUserKeys} roomSummaries={chat.roomSummaries} pinnedConversations={chat.pinnedConversations} mutedConversations={chat.mutedConversations} archivedConversations={chat.archivedConversations} relativeTimeNow={chat.relativeTimeNow} onSelectChat={chat.handleChatSelect} onTogglePin={chat.handleToggleConversationPin} onRequestMute={chat.handleRequestMuteConversation} onToggleArchive={chat.handleToggleConversationArchive} onRequestDelete={chat.handleRequestDeleteConversation} onOpenProfile={chat.handleOpenProfile} onMessageUser={chat.handleMessageUser} onOpenSearchConversation={chat.handleOpenSearchConversation} onOpenSearchUser={chat.handleOpenSearchUser} onOpenSearchMessage={chat.handleOpenSearchMessage} mobileVisible={chat.showMobileChatList} />
            <ConversationPanel activeChat={chat.displayedActiveChat} activeChatOnline={chat.activeChatOnline} isTyping={chat.typingSocketIds.size > 0} messages={chat.chatMessages} messagesEndRef={chat.messagesEndRef} scrollContainerRef={chat.messagesScrollRef} onMessagesScroll={chat.handleMessagesScroll} loadingOlderMessages={chat.loadingOlderMessages} messageValue={chat.messageValue} onMessageChange={chat.handleMessageChange} onMessageSend={chat.handleMessageSend} selectedFile={chat.selectedFile} onFileSelect={chat.handleFileSelect} onFileRemove={chat.handleFileRemove} recordingState={chat.recordingState} recordingDuration={chat.recordingDuration} onStartRecording={chat.handleStartVoiceRecording} onStopRecording={chat.handleStopVoiceRecording} onCancelRecording={chat.handleCancelVoiceRecording} onShowMembers={chat.handleShowMembers} composerLoading={chat.sendingMessage} composerError={chat.attachmentError} currentUserId={chat.currentUserId} onReactMessage={chat.handleReactToMessage} onOpenReactionDetails={(message) => chat.setReactionDetailsMessageId(message.id)} replyingTo={chat.replyingTo} onCancelReply={chat.handleCancelReply} onReplyMessage={chat.handleStartReplyingToMessage} editingMessage={chat.editingMessage} onCancelEdit={chat.handleCancelEditingMessage} onEditMessage={chat.handleStartEditingMessage} onDeleteMessageForMe={chat.handleDeleteMessageForMe} onDeleteMessageForEveryone={chat.handleDeleteMessageForEveryone} highlightedMessageBackendId={chat.searchMessageTarget?.messageId} mobileVisible={!chat.showMobileChatList} onBack={() => chat.setShowMobileChatList(true)} onOpenDetails={details.openDetails} />
          </>
        )}
      </div>
      <ConversationDetailsPanel controller={details} currentUserId={chat.currentUserId} online={chat.activeChatOnline} onlineUserKeys={chat.onlineUserKeys} muted={Boolean(chat.activeChat?.room && chat.isMutedConversation(chat.activeChat.room))} pinned={Boolean(chat.activeChat?.room && chat.pinnedConversations.some((item) => item.room === chat.activeChat.room))} archived={Boolean(chat.activeChat?.room && chat.archivedConversations.some((item) => item.room === chat.activeChat.room))} onMessageMember={(member) => { details.closeDetails(); chat.handleMessageUser({ recipientId: member.userId, name: member.displayName || member.username, imageSrc: chat.resolveUploadedFileUrl(member.profileImage) }); }} onOpenProfile={(member) => { details.closeDetails(); chat.handleOpenProfile({ recipientId: member.userId, name: member.displayName || member.username, imageSrc: chat.resolveUploadedFileUrl(member.profileImage), room: getDmRoomId(chat.currentUserId, member.userId) }); }} onMute={() => { details.closeDetails(); if (chat.activeChat) chat.handleRequestMuteConversation(chat.activeChat); }} onPin={() => chat.activeChat?.room && chat.handleToggleConversationPin(chat.activeChat.room)} onArchive={() => chat.activeChat && chat.handleToggleConversationArchive(chat.activeChat)} onCleared={() => { chat.setChatMessages([]); chat.oldestPageRef.current = 1; chat.hasOlderMessagesRef.current = false; }} onDelete={() => { details.closeDetails(); if (chat.activeChat) chat.handleRequestDeleteConversation(chat.activeChat); }} onExited={(deletions) => { if (!chat.activeChat) return; chat.deletedConversationRoomsRef.current.add(chat.activeChat.room); chat.setDeletedConversations(deletions); chat.clearConversationFromUi(chat.activeChat); }} onFriendRemoved={() => chat.setFriendsRefreshVersion((version) => version + 1)} />
      <MobileNavigation controller={chat} />
      {chat.reactionDetailsMessage && <ReactionDetailsModal message={chat.reactionDetailsMessage} currentUserId={chat.currentUserId} onClose={() => chat.setReactionDetailsMessageId(null)} onRemove={(emoji) => chat.handleReactToMessage(chat.reactionDetailsMessage, emoji, "remove")} />}
      {chat.deleteConfirmation && <DeleteConversationModal conversation={chat.deleteConfirmation} deleting={chat.deletingConversation} error={chat.deleteConversationError} onClose={() => { if (chat.deletingConversation) return; chat.setDeleteConfirmation(null); chat.setDeleteConversationError(""); }} onConfirm={chat.handleConfirmDeleteConversation} />}
      {chat.muteConfirmation && <MuteConversationModal conversation={chat.muteConfirmation} onClose={() => chat.setMuteConfirmation(null)} onSelect={chat.handleMuteDuration} />}
    </main>
  );
}
