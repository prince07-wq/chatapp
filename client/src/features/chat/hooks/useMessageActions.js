import { useRef, useState } from "react";

export default function useMessageActions() {
  const [messageValue, setMessageValue] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionDetailsMessageId, setReactionDetailsMessageId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const sendInFlightRef = useRef(false);
  const hiddenMessageIdsRef = useRef(new Set());

  return {
    messageValue,
    setMessageValue,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    reactionDetailsMessageId,
    setReactionDetailsMessageId,
    selectedFile,
    setSelectedFile,
    attachmentError,
    setAttachmentError,
    sendingMessage,
    setSendingMessage,
    sendInFlightRef,
    hiddenMessageIdsRef,
  };
}
