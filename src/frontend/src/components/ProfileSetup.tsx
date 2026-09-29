/**
 * Display-name capture for a signed-in user who has no profile yet.
 *
 * The backend stores one profile per identity. Until the user picks a name we
 * show this screen instead of the chat, so every message has a sender name.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterUser } from "@/hooks/useChat";
import { Loader2, MessagesSquare } from "lucide-react";
import { useState } from "react";

export function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const registerUser = useRegisterUser();

  const trimmed = displayName.trim();
  const canSubmit = trimmed.length > 0 && !registerUser.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    registerUser.mutate(trimmed);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessagesSquare className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-foreground">
                Signal
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Chat workspace
              </p>
            </div>
          </div>

          <h1 className="mt-8 font-display text-2xl font-bold tracking-tight text-foreground">
            Choose your display name
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is how other members will see you in every room.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                data-ocid="profile.input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g. Ada Lovelace"
                maxLength={40}
                autoComplete="nickname"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              data-ocid="profile.submit_button"
              disabled={!canSubmit}
              className="w-full rounded-full"
            >
              {registerUser.isPending ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                "Continue to chat"
              )}
            </Button>

            {registerUser.isError ? (
              <p
                data-ocid="profile.error_state"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {registerUser.error instanceof Error
                  ? registerUser.error.message
                  : "Could not save your name. Please try again."}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
