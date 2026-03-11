'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MessageSquare, Send, Search,
    Loader2, Check, CheckCheck,
} from 'lucide-react';
import { cn, formatDate, getApiError } from '@/lib/utils';
import { messagesApi, type Conversation, type Message } from '@/lib/api/messages.api';
import { useAuthStore } from '@/lib/store/auth.store';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Conversation list item ────────────────────────────────────────────────────

function ConvoItem({
    convo, active, userId, onClick,
}: {
    convo: Conversation; active: boolean; userId: string; onClick: () => void;
}) {
    const other = convo.participants.find((p) => p.id !== userId);
    const name = other?.profile?.fullName ?? other?.email ?? 'Unknown';
    const lastMsg = convo.lastMessage ?? 'No messages yet';
    const timeLabel = convo.lastMessageAt
        ? new Date(convo.lastMessageAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '';

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-all',
                active ? 'bg-blue-50/80' : 'hover:bg-[var(--color-neutral-50)]',
            )}
        >
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-semibold text-xs">
                {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-neutral-900)] truncate">{name}</p>
                    <span className="text-[10px] text-[var(--color-neutral-400)] flex-shrink-0">{timeLabel}</span>
                </div>
                <p className="text-xs text-[var(--color-neutral-500)] truncate mt-0.5">{lastMsg}</p>
            </div>
            {convo.unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0 mt-1"
                    style={{ background: 'var(--color-portal-primary)' }}>
                    {convo.unreadCount}
                </span>
            )}
        </button>
    );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
    const time = new Date(msg.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    return (
        <div className={cn('flex gap-2 max-w-[80%]', isMine ? 'ml-auto flex-row-reverse' : '')}>
            {!isMine && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 text-[10px] font-semibold mt-auto">
                    {(msg.sender?.profile?.fullName ?? msg.sender?.email ?? '?').charAt(0).toUpperCase()}
                </div>
            )}
            <div>
                <div className={cn(
                    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMine
                        ? 'bg-[var(--color-portal-primary)] text-white rounded-br-md'
                        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] rounded-bl-md',
                )}>
                    {msg.content}
                </div>
                <div className={cn('flex items-center gap-1 mt-0.5', isMine ? 'justify-end' : '')}>
                    <span className="text-[10px] text-[var(--color-neutral-400)]">{time}</span>
                    {isMine && (
                        msg.isRead
                            ? <CheckCheck className="w-3 h-3 text-blue-500" />
                            : <Check className="w-3 h-3 text-[var(--color-neutral-400)]" />
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSep({ date }: { date: string }) {
    return (
        <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-[var(--color-neutral-100)]" />
            <span className="text-[10px] text-[var(--color-neutral-400)] font-medium">{formatDate(date)}</span>
            <div className="flex-1 h-px bg-[var(--color-neutral-100)]" />
        </div>
    );
}

// ── Message input ─────────────────────────────────────────────────────────────

function MessageInput({
    onSend, loading,
}: {
    onSend: (content: string) => void;
    loading: boolean;
}) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        onSend(trimmed);
        setText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    const handleInput = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    return (
        <div className="flex items-end gap-2 p-3 border-t border-[var(--color-neutral-100)] bg-white">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); handleInput(); }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--color-neutral-200)]
                           text-sm placeholder:text-[var(--color-neutral-400)]
                           focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none
                           max-h-[120px]"
            />
            <button
                onClick={handleSend}
                disabled={!text.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white
                           transition-all active:scale-[0.95] disabled:opacity-40"
                style={{ background: 'var(--color-portal-primary)' }}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id) ?? '';
    const [activeConvo, setActiveConvo] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Conversations
    const { data: convos, isLoading: convosLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => messagesApi.getConversations(),
        staleTime: 15_000,
        refetchInterval: 15_000,
    });

    const conversations: Conversation[] = Array.isArray(convos) ? convos : [];

    // Messages for selected conversation
    const { data: msgs, isLoading: msgsLoading } = useQuery({
        queryKey: ['messages', activeConvo],
        queryFn: () => messagesApi.getMessages(activeConvo!),
        enabled: !!activeConvo,
        staleTime: 10_000,
        refetchInterval: 10_000,
    });

    const messages: Message[] = Array.isArray(msgs) ? msgs : [];

    // Group messages by date for separators
    const groupedMessages = useMemo(() => {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';
        for (const msg of messages) {
            const msgDate = msg.createdAt.split('T')[0];
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ date: currentDate, messages: [msg] });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        }
        return groups;
    }, [messages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length]);

    // Mark as read when opening conversation
    useEffect(() => {
        if (activeConvo) {
            messagesApi.markRead(activeConvo).catch(() => {});
        }
    }, [activeConvo]);

    // Send message
    const activeConvoObj = conversations.find((c) => c.id === activeConvo);
    const otherParticipant = activeConvoObj?.participants.find((p) => p.id !== userId);
    const receiverId = otherParticipant?.id;

    const sendMut = useMutation({
        mutationFn: (content: string) => {
            if (!receiverId) throw new Error('No recipient found');
            return messagesApi.send(receiverId, content);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', activeConvo] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    return (
        <div className="flex flex-col h-[calc(100vh-var(--topbar-h)-80px)] lg:h-[calc(100vh-var(--topbar-h)-56px)]">
            <h1 className="text-xl font-bold text-[var(--color-neutral-900)] mb-4">Messages</h1>

            <div className="flex-1 flex rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden min-h-0">
                {/* Left: Conversation list */}
                <div className={cn(
                    'w-full md:w-[280px] lg:w-[320px] border-r border-[var(--color-neutral-100)] flex flex-col flex-shrink-0',
                    activeConvo ? 'hidden md:flex' : 'flex',
                )}>
                    <div className="p-3 border-b border-[var(--color-neutral-100)]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)]" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-neutral-200)]
                                           text-sm placeholder:text-[var(--color-neutral-400)]
                                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {convosLoading ? (
                            <div className="p-3 space-y-2">{[0, 1, 2].map((i) => <SkeletonCard key={i} className="h-16" />)}</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-6 text-center">
                                <MessageSquare className="w-8 h-8 text-[var(--color-neutral-300)] mx-auto mb-2" />
                                <p className="text-xs text-[var(--color-neutral-500)]">No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((c) => (
                                <ConvoItem
                                    key={c.id}
                                    convo={c}
                                    active={c.id === activeConvo}
                                    userId={userId}
                                    onClick={() => setActiveConvo(c.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Message thread */}
                <div className={cn(
                    'flex-1 flex flex-col min-w-0',
                    !activeConvo ? 'hidden md:flex' : 'flex',
                )}>
                    {!activeConvo ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState
                                icon={<MessageSquare className="w-8 h-8 text-[var(--color-neutral-300)]" />}
                                title="Select a conversation"
                                description="Choose a conversation from the left to start messaging."
                            />
                        </div>
                    ) : (
                        <>
                            {/* Thread header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-neutral-100)]">
                                <button
                                    onClick={() => setActiveConvo(null)}
                                    className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center
                                               text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]"
                                >
                                    ←
                                </button>
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 text-xs font-semibold">
                                    {(otherParticipant?.profile?.fullName ?? '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
                                        {otherParticipant?.profile?.fullName ?? otherParticipant?.email ?? 'Unknown'}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-neutral-400)]">
                                        {otherParticipant?.role === 'TAX_ADVISOR' ? 'Tax Advisor' : 'Staff'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                {msgsLoading ? (
                                    <div className="space-y-3 py-6">
                                        {[0, 1, 2].map((i) => <SkeletonCard key={i} className={cn('h-12', i % 2 === 0 ? 'w-2/3' : 'w-1/2 ml-auto')} />)}
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center py-12">
                                        <p className="text-sm text-[var(--color-neutral-400)]">No messages yet. Say hello!</p>
                                    </div>
                                ) : (
                                    groupedMessages.map((group) => (
                                        <div key={group.date}>
                                            <DateSep date={group.date} />
                                            <div className="space-y-3">
                                                {group.messages.map((msg) => (
                                                    <MessageBubble key={msg.id} msg={msg} isMine={msg.senderId === userId} />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input */}
                            <MessageInput
                                onSend={(content) => sendMut.mutate(content)}
                                loading={sendMut.isPending}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
