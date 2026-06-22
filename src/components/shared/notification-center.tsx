"use client";

import * as React from "react";
import { Bell, Check, Trash2, CheckSquare, Inbox, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  NotificationType,
} from "@/hooks/use-notifications";
import { useUser } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

export function NotificationCenter() {
  const { data: user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: notificationsData, isLoading } = useNotifications({
    page: 1,
    limit: 20,
    unreadOnly,
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Hide notification center entirely if user is guest/logged out
  if (!user) return null;

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Bell Icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-foreground/80 hover:text-foreground relative"
        aria-label="Notification Center"
      >
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border/80 shadow-xl rounded-sm z-50 overflow-hidden animate-fade-in origin-top-right">
          {/* Header */}
          <div className="p-4 border-b border-border/60 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground flex items-center gap-1.5">
              Notifications {unreadCount > 0 && <span className="text-[10px] text-accent font-normal">({unreadCount} new)</span>}
            </h3>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-[9px] font-bold tracking-widest text-accent hover:text-accent/80 transition-colors uppercase disabled:opacity-50 flex items-center gap-1"
              >
                <CheckSquare className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-border/40 flex items-center gap-4 text-[10px] uppercase tracking-widest bg-neutral-50/50 dark:bg-neutral-900/50">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`font-semibold transition-colors ${!unreadOnly ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`font-semibold transition-colors ${unreadOnly ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Unread
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
            {isLoading ? (
              <div className="py-12 text-center flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Inbox className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs font-light">No notifications to display</p>
              </div>
            ) : (
              notifications.map((item: NotificationType) => (
                <div
                  key={item.id}
                  className={`p-4 transition-colors relative flex items-start gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 ${
                    !item.isRead ? "bg-accent/[0.02]" : ""
                  }`}
                >
                  {/* Status Indicator Dot */}
                  {!item.isRead && (
                    <span className="absolute left-2 top-5 h-1.5 w-1.5 bg-accent rounded-full" />
                  )}

                  <div className="flex-1 space-y-1 pl-1">
                    <p className={`text-xs font-semibold leading-normal ${!item.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] font-light text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-[9px] font-light text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  {/* Actions (Mark read, Delete) */}
                  <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                    {!item.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="h-7 w-7 text-green-600 hover:text-green-700"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="h-7 w-7 text-neutral-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
