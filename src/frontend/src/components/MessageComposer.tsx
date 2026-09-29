/**
 * Fixed bottom message composer.
 *
 * Owns the in-progress draft locally, tells the backend when the user starts
 * and stops typing (debounced), and clears the draft as soon as the message
 * is sent so the next one can be typed immediately.
 */
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSendMessage, useSetTyping } from "@/hooks/useChat";
import type { RoomId } from "@/types/chat";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessageComposerProps {
  roomId: RoomId;
}

/** How long to wait after the last keystroke before clearing the typing flag. */
const TYPING_STOP_MS = 1500;

export function MessageComposer({ roomId }: MessageComposerProps) {
  const [draft, setDraft] = useState("");
  const sendMessage = useSendMessage(roomId);
  const setTyping = useSetTyping(roomId);

  // Timer used to clear the "typing" flag once the user pauses.
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const canSend = draft.trim().length > 0 && !sendMessage.isPending;

  /** Send the current draft and reset the composer. */
  function handleSend() {
    const body = draft.trim();
    if (body.length === 0 || sendMessage.isPending) return;

    // Clear the draft right away so the user can keep typing.
    setDraft("");
    // Stop the typing indicator immediately.
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setTyping.mutate(false);

    sendMessage.mutate(body, {
      // If sending fails, put the text back so it is not lost.
      onError: () => setDraft((current) => (current === "" ? body : current)),
    });
  }

  /** Update the draft and (re)start the typing debounce. */
  function handleChange(value: string) {
    setDraft(value);

    if (value.trim().length > 0) {
      setTyping.mutate(true);
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping.mutate(false);
    }, TYPING_STOP_MS);
  }

  /** Enter sends; Shift+Enter inserts a new line. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-card px-3 py-3 md:px-4">
      <div className="flex items-end gap-2">
        <Textarea
          data-ocid="room_view.message_input"
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl bg-background"
        />
        <Button
          type="button"
          data-ocid="room_view.send_button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="h-11 shrink-0 rounded-xl px-4"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
      {sendMessage.isError ? (
        <p
          data-ocid="room_view.send_error_state"
          className="mt-2 text-xs text-destructive"
        >
          Message could not be sent. Please try again.
        </p>
      ) : null}
    </div>
  );
}
