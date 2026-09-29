/**
 * Sign-in screen shown to visitors who are not authenticated.
 *
 * Internet Identity is the only sign-in method for this app. The `login()`
 * call must run inside a real click handler, so it lives on the button's
 * `onClick` — never in a form submit or after an `await`.
 */
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2, MessagesSquare } from "lucide-react";

export function SignInGate() {
  const { login, isInitializing, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();
  const busy = isInitializing || isLoggingIn;

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
            Sign in to join the conversation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rooms, messages, and read state are tied to your identity, so they
            follow you across sessions.
          </p>

          <Button
            type="button"
            data-ocid="signin.submit_button"
            onClick={() => login()}
            disabled={busy}
            className="mt-6 w-full rounded-full"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>

          {isLoginError ? (
            <p
              data-ocid="signin.error_state"
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {loginError?.message ?? "Sign-in failed. Please try again."}
            </p>
          ) : null}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Internet Identity is a secure, passwordless way to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
