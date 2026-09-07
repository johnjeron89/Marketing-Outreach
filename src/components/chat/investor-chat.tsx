"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from "date-fns";
import { Send, Search, Check, Clock, X, MessageSquare, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { getInvestorThread, sendManualEmail } from "@/actions/emails";

export interface Message {
  id: string;
  direction: string; // 'INBOUND' | 'OUTBOUND'
  status: string; // 'Sent' | 'Queued' | 'Failed' | string
  subject: string;
  body: string;
  fromEmail: string;
  toEmail: string;
  sentAt: Date | null;
  createdAt: Date;
  replyClassification?: string | null;
  suggestedResponse?: string | null;
}

export interface Investor {
  id: string;
  name: string;
  firm: string | null;
  email: string | null;
  pipelineStatus: string;
}

interface InvestorChatProps {
  investors: Investor[];
  initialThreads: Record<string, Message[]>;
  selectedInvestorId?: string;
}

function createMarkup(html: string) {
  return { __html: html };
}

function getInitials(name: string) {
  return name.charAt(0).toUpperCase();
}

function formatDateHeader(dateStr: string | Date) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export default function InvestorChat({
  investors,
  initialThreads,
  selectedInvestorId,
}: InvestorChatProps) {
  const [threads, setThreads] = useState<Record<string, Message[]>>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(selectedInvestorId || null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(!!selectedInvestorId);

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeInvestor = investors.find((inv) => inv.id === activeId);
  const activeThread = activeId ? threads[activeId] || [] : [];

  // Group messages by day
  const groupedMessages: Record<string, Message[]> = {};
  [...activeThread]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((msg) => {
      const day = format(new Date(msg.createdAt), "yyyy-MM-dd");
      if (!groupedMessages[day]) {
        groupedMessages[day] = [];
      }
      groupedMessages[day].push(msg);
    });

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread.length, activeId]);

  useEffect(() => {
    if (activeId && activeThread.length > 0) {
      const lastMsg = activeThread[activeThread.length - 1];
      if (!subject && lastMsg) {
        let prefix = lastMsg.subject.toLowerCase().startsWith("re:") ? "" : "Re: ";
        setSubject(`${prefix}${lastMsg.subject}`);
      }
      
      // Auto-fill suggested AI response
      if (!body && lastMsg?.direction === "INBOUND" && lastMsg.suggestedResponse) {
        setBody(lastMsg.suggestedResponse);
      }
    } else {
      setSubject("");
    }
  }, [activeId, activeThread]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/engine/sync-emails', { method: 'POST' });
      if (activeId) {
        const newThread = await getInvestorThread(activeId);
        if (newThread) {
          setThreads((prev) => ({ ...prev, [activeId]: newThread }));
        }
      }
      toast.success("Inbox synced successfully");
    } catch (err) {
      toast.error("Failed to sync inbox");
    } finally {
      setIsSyncing(false);
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (!activeId) return;

    const interval = setInterval(async () => {
      try {
        const newThread = await getInvestorThread(activeId);
        if (newThread) {
          setThreads((prev) => {
            const oldThread = prev[activeId] || [];
            if (newThread.length > oldThread.length) {
              const newMessages = newThread.slice(oldThread.length);
              const hasNewInbound = newMessages.some(m => m.direction === 'INBOUND');
              if (hasNewInbound) {
                toast.success('New message received from ' + (activeInvestor?.name || 'investor'));
              }
            }
            return {
              ...prev,
              [activeId]: newThread,
            };
          });
        }
      } catch (err) {
        console.error("Failed to poll thread:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeId, activeInvestor]);

  const handleSend = async () => {
    if (!activeId || !body.trim()) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      direction: "OUTBOUND",
      status: "Queued",
      subject: subject || "No Subject",
      body: body,
      fromEmail: "me@example.com", // Assuming self email
      toEmail: activeInvestor?.email || "",
      sentAt: null,
      createdAt: new Date(),
    };

    setThreads((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), optimisticMessage],
    }));
    
    const previousBody = body;
    setBody("");
    
    try {
      const result = await sendManualEmail(activeId, optimisticMessage.subject, previousBody);
      // Re-fetch to get actual ID and status
      const updatedThread = await getInvestorThread(activeId);
      setThreads((prev) => ({
        ...prev,
        [activeId]: updatedThread || [],
      }));
      toast.success("Message sent successfully");
    } catch (err) {
      setThreads((prev) => ({
        ...prev,
        [activeId]: (prev[activeId] || []).filter((m) => m.id !== tempId),
      }));
      setBody(previousBody);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const filteredInvestors = investors
    .filter((inv) => inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || inv.firm?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const lastA = threads[a.id]?.[threads[a.id]?.length - 1];
      const lastB = threads[b.id]?.[threads[b.id]?.length - 1];
      
      const timeA = lastA ? new Date(lastA.createdAt).getTime() : 0;
      const timeB = lastB ? new Date(lastB.createdAt).getTime() : 0;
      
      if (timeA !== timeB) return timeB - timeA;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] w-full border rounded-xl overflow-hidden bg-background text-foreground shadow-sm">
      {/* Left Sidebar */}
      <div
        className={cn(
          "w-full md:w-[320px] flex-shrink-0 flex flex-col border-r bg-muted/10 transition-all",
          showMobileChat ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search investors..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredInvestors.map((inv) => {
              const thread = threads[inv.id] || [];
              const lastMsg = thread[thread.length - 1];
              const hasUnread = lastMsg && lastMsg.direction === "INBOUND";

              return (
                <button
                  key={inv.id}
                  onClick={() => {
                    setActiveId(inv.id);
                    setShowMobileChat(true);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                    activeId === inv.id
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {getInitials(inv.name)}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-medium text-sm truncate pr-2">{inv.name}</p>
                      {lastMsg && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {inv.firm && (
                      <p className="text-xs text-muted-foreground truncate mb-1">{inv.firm}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg ? lastMsg.body.replace(/<[^>]*>?/gm, '') : "No messages"}
                    </p>
                  </div>
                </button>
              );
            })}
            {filteredInvestors.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No investors found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-background",
          !showMobileChat ? "hidden md:flex" : "flex"
        )}
      >
        {activeInvestor ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-card/50 px-4 md:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2 text-muted-foreground"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(activeInvestor.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold truncate">{activeInvestor.name}</h2>
                  <Badge variant="outline" className="hidden sm:inline-flex text-[10px] px-1.5 h-5">
                    {activeInvestor.pipelineStatus}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1.5 truncate">
                  {activeInvestor.firm && <span>{activeInvestor.firm}</span>}
                  {activeInvestor.firm && activeInvestor.email && <span>•</span>}
                  {activeInvestor.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {activeInvestor.email}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto flex items-center gap-2"
                onClick={handleManualSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Emails"}</span>
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
              {activeThread.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 pt-20">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 opacity-50" />
                  </div>
                  <p>No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {Object.entries(groupedMessages).map(([day, msgs]) => (
                    <div key={day} className="space-y-6">
                      <div className="flex justify-center">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                          {formatDateHeader(day)}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {msgs.map((msg) => {
                          const isOutbound = msg.direction === "OUTBOUND";
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex flex-col max-w-[85%] md:max-w-[75%]",
                                isOutbound ? "ml-auto items-end" : "mr-auto items-start"
                              )}
                            >
                              {msg.subject && (
                                <div className="text-xs text-muted-foreground mb-1 px-1 max-w-full truncate opacity-70">
                                  {msg.subject}
                                </div>
                              )}
                              {!isOutbound && msg.replyClassification && (
                                <div className="mb-1">
                                  <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200 uppercase">
                                    AI Detected: {msg.replyClassification.replace(/_/g, ' ')}
                                  </Badge>
                                </div>
                              )}
                              <div
                                className={cn(
                                  "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm",
                                  isOutbound
                                    ? "bg-indigo-600 text-white rounded-br-sm"
                                    : "bg-muted rounded-bl-sm"
                                )}
                                dangerouslySetInnerHTML={createMarkup(msg.body)}
                              />
                              <div className="flex items-center gap-1.5 mt-1 px-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(msg.createdAt), "h:mm a")}
                                </span>
                                {isOutbound && (
                                  <span className="text-muted-foreground">
                                    {msg.status === "Sent" ? (
                                      <Check className="h-3 w-3" />
                                    ) : msg.status === "Queued" ? (
                                      <Clock className="h-3 w-3" />
                                    ) : msg.status === "Failed" ? (
                                      <X className="h-3 w-3 text-destructive" />
                                    ) : (
                                      <Check className="h-3 w-3 opacity-50" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compose Area */}
            <div className="p-4 bg-background border-t">
              <div className="max-w-4xl mx-auto flex flex-col gap-2">
                <Input
                  placeholder="Subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-sm h-8 bg-muted/50 border-transparent focus-visible:border-border"
                />
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="min-h-[44px] max-h-[144px] resize-none bg-muted/50 border-transparent focus-visible:border-border"
                    rows={Math.min(6, Math.max(1, body.split("\n").length))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!body.trim() || isSending}
                    className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-md"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-lg font-medium text-foreground">No conversation selected</p>
            <p className="text-sm">Select an investor from the list to view your chat history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
