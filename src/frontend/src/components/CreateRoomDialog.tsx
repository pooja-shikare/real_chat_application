/**
 * CreateRoomDialog — a small modal form for creating a new room.
 *
 * The name is required; the description is optional. The form keeps its own
 * draft state (Local UI state) and only clears it after a successful create.
 *
 * Beginner note: `useCreateRoom()` is a React Query mutation. Calling
 * `createRoom.mutate(...)` sends the request; `createRoom.isPending` is true
 * while it is in flight, which we use to disable the submit button.
 */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRoom } from "@/hooks/useChat";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface CreateRoomDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog should open or close. */
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
}: CreateRoomDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createRoom = useCreateRoom();

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !createRoom.isPending;

  /** Reset the form back to its empty state. */
  function resetForm() {
    setName("");
    setDescription("");
  }

  /** Submit the form: create the room, then close and clear on success. */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    createRoom.mutate(
      { name: trimmedName, description: description.trim() },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Clear any error state when the dialog is dismissed.
        if (!next) createRoom.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        data-ocid="create_room.dialog"
        className="rounded-lg border-border bg-card"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-foreground">
            Create a room
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Give your room a name. You will join it automatically as the first
            member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="room-name" className="text-foreground">
              Room name
            </Label>
            <Input
              id="room-name"
              data-ocid="create_room.name_input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Project Standup"
              maxLength={60}
              autoFocus
              className="rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="room-description" className="text-foreground">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="room-description"
              data-ocid="create_room.description_input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this room about?"
              rows={3}
              maxLength={200}
              className="rounded-lg"
            />
          </div>

          {createRoom.isError ? (
            <p
              data-ocid="create_room.error_state"
              className="text-sm text-destructive"
            >
              Could not create the room. Please try again.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              data-ocid="create_room.cancel_button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="create_room.submit_button"
              className="rounded-lg"
            >
              {createRoom.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
