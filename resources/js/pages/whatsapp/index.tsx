"use client";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/layouts/app-layout";
import { cn } from "@/lib/utils";
import { type BreadcrumbItem } from "@/types";
import { Head, usePage } from "@inertiajs/react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Chat {
  id: number;
  to: string;
  client_name: string;
  store_name: string;
  cc_agents?: string;
  status: string;
  sid: string;
  message: string;
  created_at: string;
  updated_at: string;
  type?: string;
}

interface Conversation {
  phone: string;
  client_name: string;
  store_name: string;
  cc_agents?: string;
  messages: Chat[];
  latest_at: string;
}

const BREADCRUMBS: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "WhatsApp Chats", href: "/whatsapp" },
];

export default function WhatsAppPage() {
  const { conversations: initialConversations } = usePage<{ conversations: Conversation[] }>().props;
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages, selected]);

  useEffect(() => {
    if (selected) {
      const updatedSelected = conversations.find((conv) => conv.phone === selected.phone);
      if (updatedSelected) setSelected(updatedSelected);
    }
  }, [conversations, selected?.phone]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery) ||
      conv.messages.some((msg) => msg.message.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="size-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="size-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="size-3 text-sky-500" />;
      case "failed":
        return <Clock className="size-3 animate-pulse text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string, phone: string) => {
    if (name && name !== phone) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return phone.slice(-2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleSend = async () => {
    if (!selected || !message.trim()) return;

    const newMsg: Chat = {
      id: Date.now(),
      to: selected.phone,
      client_name: selected.client_name,
      store_name: selected.store_name,
      cc_agents: selected.cc_agents,
      status: "pending",
      sid: "",
      message: message.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "1",
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.phone === selected.phone
          ? { ...conv, messages: [...conv.messages, newMsg], latest_at: newMsg.created_at }
          : conv,
      ),
    );
    setMessage("");

    try {
      const res = await fetch("/api/whatsapp/send-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ to: selected.phone, message: newMsg.message }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(true);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.phone === selected.phone
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === newMsg.id ? { ...msg, status: "sent", sid: data.sid || "" } : msg,
                  ),
                }
              : conv,
          ),
        );
      } else {
        toast.error("Message could not be sent. Please try again.");
        setConversations((prev) =>
          prev.map((conv) =>
            conv.phone === selected.phone
              ? { ...conv, messages: conv.messages.filter((msg) => msg.id !== newMsg.id) }
              : conv,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while sending the message.");
      setConversations((prev) =>
        prev.map((conv) =>
          conv.phone === selected.phone
            ? { ...conv, messages: conv.messages.filter((msg) => msg.id !== newMsg.id) }
            : conv,
        ),
      );
    }
  };

  const getUnreadCount = (conversation: Conversation) =>
    conversation.messages.filter(
      (msg) => !["sent", "delivered", "read", "pending"].includes(msg.status),
    ).length;

  return (
    <AppLayout breadcrumbs={BREADCRUMBS}>
      <Head title="WhatsApp Chats" />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCheck className="size-4 text-emerald-500" />
              </span>
              Message sent
            </DialogTitle>
            <DialogDescription>Your WhatsApp message has been sent successfully.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowModal(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex h-[calc(100svh-4rem)] flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Communication"
          title="WhatsApp inbox"
          description="Talk to customers in one shared inbox, with every conversation tied to the order."
          icon={MessageSquare}
          actions={
            <>
              <Badge variant="outline" className="h-9 gap-1.5 border-emerald-500/20 bg-emerald-500/5 px-3 text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Connected
              </Badge>
              <Badge variant="outline" className="h-9 bg-card px-3 text-muted-foreground">
                {conversations.length} conversations
              </Badge>
            </>
          }
        />

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          {/* Conversation list */}
          <div
            className={cn(
              "w-full flex-col border-r border-border/60 bg-muted/20 md:flex md:w-80 lg:w-[340px]",
              selected ? "hidden" : "flex",
            )}
          >
            <div className="border-b border-border/60 bg-card/70 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <MessageSquare className="size-4 text-emerald-600" />
                    All conversations
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {filteredConversations.length} active chats
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-8 py-16 text-center text-muted-foreground">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted">
                    <MessageSquare className="size-6 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No chats found</p>
                  <p className="mt-1 text-xs">
                    {searchQuery ? "Try a different search term." : "Conversations will appear here."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredConversations.map((conv) => {
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    const unreadCount = getUnreadCount(conv);
                    const isSelected = selected?.phone === conv.phone;

                    return (
                      <button
                        key={conv.phone}
                        type="button"
                        onClick={() => setSelected(conv)}
                        className={cn(
                          "w-full p-4 text-left transition-colors hover:bg-muted/50",
                          isSelected && "bg-primary/[0.06] shadow-[inset_3px_0_0_var(--primary)]",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="size-11">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-600 font-semibold text-white">
                                {getInitials(conv.client_name, conv.phone)}
                              </AvatarFallback>
                            </Avatar>
                            {lastMsg?.type === "1" && (
                              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold">
                                {conv.client_name || conv.phone}
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {formatTime(conv.latest_at)}
                              </span>
                            </div>

                            <div className="mt-0.5 flex items-center gap-1.5">
                              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                                {lastMsg?.message}
                              </p>
                              {lastMsg && renderStatusIcon(lastMsg.status)}
                              {unreadCount > 0 && (
                                <Badge className="h-5 min-w-5 justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] text-white">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 truncate text-[10px] text-muted-foreground/80">
                              {conv.cc_agents || "No agent assigned"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat pane */}
          <div className="flex min-w-0 flex-1 flex-col">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 md:hidden"
                      onClick={() => setSelected(null)}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-600 font-semibold text-white">
                        {getInitials(selected.client_name, selected.phone)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">
                        {selected.client_name || selected.phone}
                      </h3>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {selected.phone}
                        <span className="mx-1.5 text-border">•</span>
                        {selected.cc_agents || "No agent"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                      <Phone className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden size-8 text-muted-foreground sm:inline-flex">
                      <Video className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                      <MoreVertical className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary)_4%,transparent),transparent_45%)] p-4 sm:p-6">
                  <div className="mx-auto max-w-3xl space-y-4">
                    {selected.messages.map((msg, index) => {
                      const isOutgoing = ["sent", "delivered", "read", "pending"].includes(msg.status);
                      const showTimestamp =
                        index === 0 ||
                        new Date(msg.created_at).getDate() !==
                          new Date(selected.messages[index - 1].created_at).getDate();

                      return (
                        <div key={msg.id}>
                          {showTimestamp && (
                            <div className="my-5 text-center">
                              <span className="rounded-full border border-border/60 bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
                                {new Date(msg.created_at).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
                            <div
                              className={cn(
                                "relative max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[70%]",
                                isOutgoing
                                  ? "rounded-br-md bg-emerald-600 text-white"
                                  : "rounded-bl-md border border-border/60 bg-card",
                              )}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              <div className="mt-1 flex items-center justify-end gap-1">
                                <span
                                  className={cn(
                                    "text-[10px]",
                                    isOutgoing ? "text-emerald-100/80" : "text-muted-foreground",
                                  )}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  })}
                                </span>
                                {isOutgoing && (
                                  <div className="text-emerald-100">{renderStatusIcon(msg.status)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-border/60 bg-card/80 p-3 backdrop-blur sm:p-4">
                  <div className="mx-auto flex max-w-3xl items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mb-0.5 size-9 shrink-0 text-muted-foreground"
                    >
                      <Paperclip className="size-4" />
                    </Button>

                    <div className="relative flex-1">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Write a message…"
                        rows={1}
                        className="max-h-32 min-h-10 resize-none rounded-2xl bg-muted/60 py-2.5 pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
                      >
                        <Smile className="size-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={!message.trim()}
                      size="icon"
                      className="size-10 shrink-0 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      aria-label="Send message"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center bg-muted/10 px-6 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-3xl border border-primary/10 bg-primary/5 text-primary">
                  <MessageSquare className="size-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">Your shared WhatsApp inbox</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Select a conversation to read the full thread and reply to your customer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
