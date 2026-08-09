import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckCheck,
  FileText,
  Inbox,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Square,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, NOTIFICATION_TYPES } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ICONS = {
  [NOTIFICATION_TYPES.STARTED]: { icon: Sparkles, tone: "text-primary", bg: "bg-primary/10" },
  [NOTIFICATION_TYPES.RESUMED]: { icon: PlayCircle, tone: "text-primary", bg: "bg-primary/10" },
  [NOTIFICATION_TYPES.PAUSED]: { icon: PauseCircle, tone: "text-warning", bg: "bg-warning/10" },
  [NOTIFICATION_TYPES.COMPLETED]: { icon: CheckCircle2, tone: "text-success", bg: "bg-success/10" },
  [NOTIFICATION_TYPES.ENDED]: { icon: Square, tone: "text-muted-foreground", bg: "bg-muted" },
  [NOTIFICATION_TYPES.EXPIRED]: { icon: AlertTriangle, tone: "text-destructive", bg: "bg-destructive/10" },
  [NOTIFICATION_TYPES.RESULT]: { icon: FileText, tone: "text-accent", bg: "bg-accent/10" },
};

const FEEDBACK_TYPES = new Set([
  NOTIFICATION_TYPES.COMPLETED,
  NOTIFICATION_TYPES.EXPIRED,
  NOTIFICATION_TYPES.RESULT,
]);

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { items, unread, markRead, markAllRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
          title="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-[14px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-[14px] text-white ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[360px] overflow-hidden rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground">Notifications</div>
            <div className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up."}
            </div>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5 text-primary" /> Mark all as read
          </button>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Inbox className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">You're all caught up.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Interview activity will appear here as it happens.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const meta = ICONS[n.type] || ICONS[NOTIFICATION_TYPES.STARTED];
                const Icon = meta.icon;
                const hasSession = !!n.sessionId && FEEDBACK_TYPES.has(n.type);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead(n.id);
                        if (hasSession) navigate(`/feedback/${n.sessionId}`);
                      }}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                        !n.read && "bg-primary/[0.03]"
                      )}
                    >
                      <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", meta.bg, meta.tone)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-foreground">{n.title}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.message}</span>
                      </span>
                      {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <Link to="/select" className="text-[11px] font-semibold text-primary hover:underline">
              View candidates
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
