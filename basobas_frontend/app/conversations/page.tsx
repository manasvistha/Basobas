"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Conversation, getConversations } from "@/lib/api/conversation";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import styles from "./page.module.css";

const AVATAR_THEMES = [
  { background: "linear-gradient(135deg, #0f766e, #14b8a6)", ring: "rgba(15, 118, 110, 0.35)" },
  { background: "linear-gradient(135deg, #ea580c, #f97316)", ring: "rgba(249, 115, 22, 0.34)" },
  { background: "linear-gradient(135deg, #2563eb, #0ea5e9)", ring: "rgba(14, 165, 233, 0.34)" },
  { background: "linear-gradient(135deg, #7c2d12, #b45309)", ring: "rgba(180, 83, 9, 0.34)" },
] as const;

type FilterOption = "all" | "active";

type ParticipantLike = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

type UserLike = {
  _id?: string | number;
  id?: string | number;
};

type PreparedConversation = {
  id: string;
  participantName: string;
  initials: string;
  preview: string;
  hasMessages: boolean;
  messageCount: number;
  timestampLabel: string;
  timestampRaw: string;
  isBookingThread: boolean;
};

function normalizeId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Failed to load conversations";
  }

  const typed = error as {
    message?: string;
    response?: { data?: { error?: string; message?: string } };
  };

  return (
    typed.response?.data?.error ??
    typed.response?.data?.message ??
    typed.message ??
    "Failed to load conversations"
  );
}

function getOtherParticipant(conversation: Conversation, currentUserId: string): ParticipantLike | undefined {
  const participants = (conversation.participants ?? []) as ParticipantLike[];
  if (participants.length === 0) {
    return undefined;
  }

  return (
    participants.find((participant) => {
      const participantId = normalizeId(participant._id ?? participant.id);
      return participantId.length > 0 && participantId !== currentUserId;
    }) ?? participants[0]
  );
}

function getName(participant?: ParticipantLike): string {
  if (!participant) {
    return "Unknown user";
  }

  const cleanedName = participant.name?.trim();
  if (cleanedName) {
    return cleanedName;
  }

  const emailPrefix = participant.email?.split("@")[0]?.trim();
  if (emailPrefix) {
    return emailPrefix;
  }

  return "Unknown user";
}

function getInitials(name: string): string {
  const words = name
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function toTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTimeLabel(value?: string): string {
  if (!value) {
    return "No activity yet";
  }

  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return "No activity yet";
  }

  const elapsed = Date.now() - timestamp;
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const days = Math.floor(elapsed / 86400000);

  if (minutes < 1) {
    return "Now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconArrowUpRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7H17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const user = getCurrentUser() as UserLike | null;
    if (!user) {
      router.push("/login");
      return;
    }

    const userId = normalizeId(user.id ?? user._id);
    setCurrentUserId(userId);

    let isAlive = true;

    const loadConversations = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await getConversations();
        if (isAlive) {
          setConversations(Array.isArray(payload) ? payload : []);
        }
      } catch (caughtError) {
        if (isAlive) {
          setError(extractErrorMessage(caughtError));
        }
      } finally {
        if (isAlive) {
          setLoading(false);
        }
      }
    };

    void loadConversations();

    return () => {
      isAlive = false;
    };
  }, [refreshIndex, router]);

  const prepared = useMemo<PreparedConversation[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return conversations
      .map((conversation) => {
        const participant = getOtherParticipant(conversation, currentUserId);
        const participantName = getName(participant);
        const hasMessages =
          Boolean(conversation.lastMessage?.trim()) && conversation.lastMessage?.trim() !== "No messages yet";
        const preview = hasMessages ? conversation.lastMessage?.trim() || "" : "No messages yet. Start the thread.";
        const timestampRaw = conversation.lastMessageTime || conversation.createdAt || "";

        return {
          id: conversation._id,
          participantName,
          initials: getInitials(participantName),
          preview,
          hasMessages,
          messageCount: conversation.messages?.length || 0,
          timestampLabel: formatTimeLabel(timestampRaw),
          timestampRaw,
          isBookingThread: Boolean(conversation.booking),
        };
      })
      .filter((conversation) => {
        if (filter === "active" && !conversation.hasMessages) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const corpus = `${conversation.participantName} ${conversation.preview}`.toLowerCase();
        return corpus.includes(normalizedSearch);
      })
      .sort((left, right) => toTimestamp(right.timestampRaw) - toTimestamp(left.timestampRaw));
  }, [conversations, currentUserId, filter, search]);

  const activeConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const message = conversation.lastMessage?.trim();
        return Boolean(message) && message !== "No messages yet";
      }).length,
    [conversations],
  );

  const pendingConversations = Math.max(conversations.length - activeConversations, 0);

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.heroPanel}>
          <Link href="/dashboard" className={styles.backLink}>
            <IconArrowLeft />
            <span>Back to dashboard</span>
          </Link>

          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>Message Center</p>
              <h1 className={styles.title}>Conversations</h1>
              <p className={styles.subtitle}>
                Review booking chats, respond faster, and keep every renter conversation organized in one place.
              </p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{conversations.length}</span>
                <span className={styles.statLabel}>Total Threads</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{activeConversations}</span>
                <span className={styles.statLabel}>Active Chats</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{pendingConversations}</span>
                <span className={styles.statLabel}>No Reply Yet</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentPanel}>
          <div className={styles.toolbar}>
            <label className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <IconSearch />
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or message"
                className={styles.searchInput}
              />
            </label>

            <div className={styles.filterGroup}>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`${styles.filterButton} ${filter === "all" ? styles.filterButtonActive : ""}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("active")}
                className={`${styles.filterButton} ${filter === "active" ? styles.filterButtonActive : ""}`}
              >
                Active
              </button>
            </div>
          </div>

          {loading && (
            <div className={styles.listWrap}>
              <ul className={styles.list}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <li key={`skeleton-${index}`} className={styles.skeletonCard}>
                    <span className={styles.skeletonAvatar} />
                    <div className={styles.skeletonBody}>
                      <span className={styles.skeletonLineShort} />
                      <span className={styles.skeletonLineLong} />
                      <span className={styles.skeletonLineMedium} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && error && (
            <div className={styles.stateCard}>
              <h2 className={styles.stateTitle}>Could not load conversations</h2>
              <p className={styles.stateText}>{error}</p>
              <button type="button" className={styles.retryButton} onClick={() => setRefreshIndex((value) => value + 1)}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && conversations.length === 0 && (
            <div className={styles.stateCard}>
              <h2 className={styles.stateTitle}>No conversations yet</h2>
              <p className={styles.stateText}>
                Messages with property owners and renters will appear here once you start chatting.
              </p>
              <button type="button" className={styles.retryButton} onClick={() => router.push("/dashboard")}>
                Browse listings
              </button>
            </div>
          )}

          {!loading && !error && conversations.length > 0 && prepared.length === 0 && (
            <div className={styles.stateCard}>
              <h2 className={styles.stateTitle}>No matching conversations</h2>
              <p className={styles.stateText}>Try a different name, keyword, or switch back to the All filter.</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Reset filters
              </button>
            </div>
          )}

          {!loading && !error && prepared.length > 0 && (
            <div className={styles.listWrap}>
              <ul className={styles.list}>
                {prepared.map((conversation, index) => {
                  const avatarTheme = AVATAR_THEMES[hashText(conversation.participantName) % AVATAR_THEMES.length];
                  const animationStyle = { "--item-delay": `${Math.min(index, 9) * 48}ms` } as CSSProperties;

                  return (
                    <li key={conversation.id}>
                      <Link href={`/conversation/${conversation.id}`} className={styles.conversationCard} style={animationStyle}>
                        <div
                          className={styles.avatar}
                          style={{
                            background: avatarTheme.background,
                            boxShadow: `0 10px 22px -10px ${avatarTheme.ring}`,
                          }}
                        >
                          {conversation.initials}
                        </div>

                        <div className={styles.cardBody}>
                          <div className={styles.cardTop}>
                            <h2 className={styles.name}>{conversation.participantName}</h2>
                            <span className={styles.time}>{conversation.timestampLabel}</span>
                          </div>

                          <p className={`${styles.preview} ${!conversation.hasMessages ? styles.previewMuted : ""}`}>
                            {conversation.preview}
                          </p>

                          <div className={styles.cardMeta}>
                            <span className={styles.metaBadge}>
                              {conversation.hasMessages
                                ? `${conversation.messageCount} message${conversation.messageCount === 1 ? "" : "s"}`
                                : "Awaiting first message"}
                            </span>
                            {conversation.isBookingThread && <span className={styles.bookingBadge}>Booking thread</span>}
                          </div>
                        </div>

                        <span className={styles.openAction}>
                          Open
                          <IconArrowUpRight />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
