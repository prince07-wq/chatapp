import MessageComposer from "../../../components/Chat/MessageComposer.jsx";
import MessageList from "./MessageList.jsx";
import ConversationToolbar from "./ConversationToolbar.jsx";

export default function ConversationPanel({
  activeChat,
  activeChatOnline,
  isTyping,
  messages,
  messagesEndRef,
  scrollContainerRef,
  onMessagesScroll,
  loadingOlderMessages,
  messageValue,
  onMessageChange,
  onMessageSend,
  selectedFile,
  onFileSelect,
  onFileRemove,
  recordingState,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onShowMembers,
  composerLoading,
  composerError,
  currentUserId,
  onReactMessage,
  onOpenReactionDetails,
  replyingTo,
  onCancelReply,
  onReplyMessage,
  editingMessage,
  onCancelEdit,
  onEditMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
  highlightedMessageBackendId,
  mobileVisible = true,
  onBack,
  onOpenDetails,
}) {
  if (!activeChat) {
    return (
      <section className={`relative col-start-1 ${mobileVisible ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 items-center justify-center bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto md:flex`}>
        <p className="text-[14px] text-[#858A92] dark:text-[#9198A2]">
          Select a conversation to start chatting.
        </p>
      </section>
    );
  }

  return (
    <section className={`relative col-start-1 ${mobileVisible ? "flex" : "hidden"} min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto md:flex`}>
      <ConversationToolbar
        activeChat={activeChat}
        activeChatOnline={activeChatOnline}
        onBack={onBack}
        onShowMembers={onShowMembers}
        onOpenDetails={onOpenDetails}
      />
      <MessageList
        messages={messages}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        onScroll={onMessagesScroll}
        loadingOlderMessages={loadingOlderMessages}
        currentUserId={currentUserId}
        onReactMessage={onReactMessage}
        onOpenReactionDetails={onOpenReactionDetails}
        onReplyMessage={onReplyMessage}
        onEditMessage={onEditMessage}
        onDeleteMessageForMe={onDeleteMessageForMe}
        onDeleteMessageForEveryone={onDeleteMessageForEveryone}
        highlightedMessageBackendId={highlightedMessageBackendId}
      />
      <MessageComposer
        value={messageValue}
        onChange={onMessageChange}
        onSend={onMessageSend}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        onFileRemove={onFileRemove}
        recordingState={recordingState}
        recordingDuration={recordingDuration}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onCancelRecording={onCancelRecording}
        loading={composerLoading}
        error={composerError}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        editingMessage={editingMessage}
        onCancelEdit={onCancelEdit}
        placeholder="Type a message..."
      />
    </section>
  );
}
