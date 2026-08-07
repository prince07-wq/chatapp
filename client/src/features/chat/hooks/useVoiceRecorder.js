import { useEffect, useRef, useState } from "react";

const VOICE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getVoiceMimeType() {
  return VOICE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function getVoiceFileExtension(mimeType) {
  if (mimeType.startsWith("audio/ogg")) return "ogg";
  if (mimeType.startsWith("audio/mp4")) return "m4a";
  return "webm";
}

export default function useVoiceRecorder({
  sendInFlightRef,
  setAttachmentError,
  setSelectedFile,
  onSend,
}) {
  const [recordingState, setRecordingState] = useState("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const recordingSessionRef = useRef(0);
  const voiceSendPendingRef = useRef(false);

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function stopMicrophoneTracks() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function cancelVoiceRecording({ updateState = true } = {}) {
    recordingSessionRef.current += 1;
    voiceSendPendingRef.current = false;
    clearRecordingTimer();
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // The tracks are stopped below even if the recorder is already closing.
      }
    }
    stopMicrophoneTracks();
    if (updateState) {
      setRecordingState("idle");
      setRecordingDuration(0);
    }
  }

  async function handleStartVoiceRecording() {
    if (sendInFlightRef.current || recordingState === "recording") return;
    if (
      typeof MediaRecorder === "undefined" ||
      typeof MediaRecorder.isTypeSupported !== "function" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setAttachmentError("Voice recording is not supported in this browser.");
      return;
    }
    const mimeType = getVoiceMimeType();
    if (!mimeType) {
      setAttachmentError("This browser does not support a compatible audio format.");
      return;
    }

    cancelVoiceRecording();
    voiceSendPendingRef.current = false;
    setSelectedFile(null);
    setAttachmentError("");
    setRecordingState("processing");
    const session = recordingSessionRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== recordingSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("error", () => {
        if (session !== recordingSessionRef.current) return;
        recordingSessionRef.current += 1;
        voiceSendPendingRef.current = false;
        clearRecordingTimer();
        stopMicrophoneTracks();
        mediaRecorderRef.current = null;
        setRecordingState("idle");
        setRecordingDuration(0);
        setAttachmentError("Voice recording failed. Please try again.");
      });
      recorder.addEventListener("stop", () => {
        clearRecordingTimer();
        stopMicrophoneTracks();
        if (session !== recordingSessionRef.current) return;
        mediaRecorderRef.current = null;
        if (!voiceSendPendingRef.current) {
          setRecordingState("idle");
          setRecordingDuration(0);
          setAttachmentError("Voice recording stopped before it could be sent.");
          return;
        }
        const audioMimeType = (recorder.mimeType || mimeType).split(";")[0];
        const blob = new Blob(chunks, { type: audioMimeType });
        if (!blob.size) {
          voiceSendPendingRef.current = false;
          setRecordingState("idle");
          setRecordingDuration(0);
          setAttachmentError("No audio was recorded. Please try again.");
          return;
        }
        const file = new File(
          [blob],
          `voice-message-${Date.now()}.${getVoiceFileExtension(audioMimeType)}`,
          { type: audioMimeType },
        );
        void onSend("", { file, voice: true });
      });
      recordingStartedAtRef.current = Date.now();
      setRecordingDuration(0);
      setRecordingState("recording");
      recorder.start(250);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
      }, 250);
    } catch (error) {
      if (session !== recordingSessionRef.current) return;
      voiceSendPendingRef.current = false;
      clearRecordingTimer();
      stopMicrophoneTracks();
      mediaRecorderRef.current = null;
      setRecordingState("idle");
      setRecordingDuration(0);
      if (error?.name === "NotAllowedError") setAttachmentError("Microphone permission was denied.");
      else if (error?.name === "NotFoundError") setAttachmentError("No microphone was found.");
      else setAttachmentError("Unable to start voice recording.");
    }
  }

  function handleStopVoiceRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive" || voiceSendPendingRef.current) return;
    voiceSendPendingRef.current = true;
    clearRecordingTimer();
    setRecordingDuration(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
    setRecordingState("processing");
    try {
      recorder.stop();
    } catch {
      cancelVoiceRecording();
      setAttachmentError("Unable to finish voice recording.");
    }
    stopMicrophoneTracks();
  }

  function handleCancelVoiceRecording() {
    if (sendInFlightRef.current) return;
    cancelVoiceRecording();
    setAttachmentError("");
  }

  useEffect(
    () => () => {
      recordingSessionRef.current += 1;
      voiceSendPendingRef.current = false;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // The tracks are stopped below even if the recorder is already closing.
        }
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  return {
    recordingState,
    setRecordingState,
    recordingDuration,
    setRecordingDuration,
    mediaRecorderRef,
    mediaStreamRef,
    recordingTimerRef,
    recordingStartedAtRef,
    recordingSessionRef,
    voiceSendPendingRef,
    cancelVoiceRecording,
    handleStartVoiceRecording,
    handleStopVoiceRecording,
    handleCancelVoiceRecording,
  };
}
