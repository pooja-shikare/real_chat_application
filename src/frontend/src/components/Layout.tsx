/**
 * App shell: a sticky header with the wordmark and signed-in user, plus the
 * main content area. The room sidebar and conversation pane are rendered by
 * the pages inside `children`.
 */
import { Button } from "@/components/ui/button";
import type { User } from "@/types/chat";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { LogOut, MessagesSquare } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  /** The signed-in user's profile, used for the avatar and name. */
  profile: User | null;
  children: ReactNode;
}

export function Layout({ profile, children }: LayoutProps) {
  const { clear } = useInternetIdentity();

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessagesSquare className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight text-foreground">
              Signal
            </p>
            <p className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
              Chat workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground"
              >
                {profile.avatarInitial}
              </span>
              <span className="hidden max-w-[12rem] truncate text-sm font-medium text-foreground sm:block">
                {profile.displayName}
              </span>
            </div>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="header.signout_button"
            onClick={() => clear()}
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

      <footer className="shrink-0 border-t border-border bg-card px-4 py-2 text-center md:px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
