"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Send, Check, Clock, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getInvestorThread, sendManualEmail } from "@/actions/emails";
import { Message } from "./investor-chat";

interface InvestorChatMiniProps {
  investorId: string;
  investorName: string;
  investorEmail: string | null;
  initialMessages: Message[];
}

function createMarkup(html: string) {
  return { __html: html };
}

function formatDateHeader(dateStr: string | Date) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export default function InvestorChatMini({
  investorId,
  investorName,
  investorEmail,
  initialMessages,
}: InvestorChatMiniProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Group messages by day
  const groupedMessages: Record<string, Message[]> = {};
  [...messages]
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
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (!subject && lastMsg) {
        let prefix = lastMsg.subject.toLowerCase().startsWith("re:") ? "" : "Re: ";
        setSubject(`${prefix}${lastMsg.subject}`);
      }
    }
  }, [messages, subject]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newThread = await getInvestorThread(investorId);
        if (newThread) {
          setMessages(newThread);
        }
      } catch (err) {
        console.error("Failed to poll thread:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [investorId]);

  const handleSend = async () => {
    if (!body.trim()) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      direction: "OUTBOUND",
      status: "Queued",
      subject: subject || "No Subject",
      body: body,
      fromEmail: "me@example.com",
      toEmail: investorEmail || "",
      sentAt: null,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    
    const previousBody = body;
    setBody("");
    
    try {
      await sendManualEmail(investorId, optimisticMessage.subject, previousBody);
      const updatedThread = await getInvestorThread(investorId);
      setMessages(updatedThread || []);
      toast.success("Message sent successfully");
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setBody(previousBody);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full border rounded-xl overflow-hidden bg-background text-foreground shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 pt-10">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-6 w-6 opacity-50" />
            </div>
            <p>No messages yet with {investorName}.<br/>Start the conversation below.</p>
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
                          "flex flex-col max-w-[85%]",
                          isOutbound ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        {msg.subject && (
                          <div className="text-xs text-muted-foreground mb-1 px-1 max-w-full truncate opacity-70">
                            {msg.subject}
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
        <div className="flex flex-col gap-2">
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
    </div>
  );
}
