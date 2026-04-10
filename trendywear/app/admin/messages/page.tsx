"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    FiMail,
    FiSearch,
    FiInbox,
    FiEye,
    FiArchive,
    FiRefreshCw,
    FiTrash2,
    FiX,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

type MessageRow = {
    id: number;
    full_name: string;
    email: string;
    subject: string;
    message: string;
    status: "unread" | "read" | "archived";
    created_at: string;
};

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<MessageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "all" | "unread" | "read" | "archived"
    >("all");
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MessageRow | null>(null);

    useEffect(() => {
        fetchMessages();

        const supabase = createClient();

        const channel = supabase
            .channel("admin-contact-messages")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "contact_messages",
                },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchMessages() {
        const supabase = createClient();
        setLoading(true);

        const { data, error } = await supabase
            .from("contact_messages")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching messages:", error);
            setLoading(false);
            return;
        }

        setMessages((data ?? []) as MessageRow[]);
        setLoading(false);
    }

    async function updateMessageStatus(
        id: number,
        nextStatus: "unread" | "read" | "archived"
    ) {
        const supabase = createClient();
        setUpdatingId(id);

        const { error } = await supabase
            .from("contact_messages")
            .update({ status: nextStatus })
            .eq("id", id);

        if (error) {
            console.error("Error updating message status:", error);
            alert("Failed to update message status.");
        } else {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === id ? { ...msg, status: nextStatus } : msg
                )
            );
        }

        setUpdatingId(null);
    }

    async function markAsReadBeforeOpen(id: number) {
        const target = messages.find((m) => m.id === id);
        if (!target || target.status !== "unread") return;

        const supabase = createClient();

        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === id ? { ...msg, status: "read" } : msg
            )
        );

        const { error } = await supabase
            .from("contact_messages")
            .update({ status: "read" })
            .eq("id", id);

        if (error) {
            console.error("Error marking message as read:", error);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === id ? { ...msg, status: target.status } : msg
                )
            );
        }
    }

    async function confirmDeleteMessage() {
        if (!deleteTarget) return;

        const supabase = createClient();
        setUpdatingId(deleteTarget.id);

        const { error } = await supabase
            .from("contact_messages")
            .delete()
            .eq("id", deleteTarget.id);

        if (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message.");
        } else {
            setMessages((prev) => prev.filter((msg) => msg.id !== deleteTarget.id));
            setDeleteTarget(null);
        }

        setUpdatingId(null);
    }

    const filteredMessages = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return messages.filter((msg) => {
            const matchesSearch =
                q.length === 0 ||
                msg.full_name.toLowerCase().includes(q) ||
                msg.email.toLowerCase().includes(q) ||
                msg.subject.toLowerCase().includes(q) ||
                msg.message.toLowerCase().includes(q);

            const matchesStatus =
                statusFilter === "all" || msg.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [messages, searchQuery, statusFilter]);

    const totalMessages = messages.length;
    const unreadMessages = messages.filter((m) => m.status === "unread").length;
    const readMessages = messages.filter((m) => m.status === "read").length;
    const archivedMessages = messages.filter((m) => m.status === "archived").length;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#b81d24] tracking-wide">
                        Messages
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Read and manage user inquiries in one place
                    </p>
                </div>

                <button
                    onClick={fetchMessages}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition"
                >
                    <FiRefreshCw />
                    <span className="text-sm font-medium">Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <TopCard
                    title="Total Messages"
                    value={String(totalMessages)}
                    icon={<FiInbox className="text-xl text-blue-500" />}
                />
                <TopCard
                    title="Unread"
                    value={String(unreadMessages)}
                    icon={<FiMail className="text-xl text-red-500" />}
                />
                <TopCard
                    title="Read"
                    value={String(readMessages)}
                    icon={<FiEye className="text-xl text-green-500" />}
                />
                <TopCard
                    title="Archived"
                    value={String(archivedMessages)}
                    icon={<FiArchive className="text-xl text-gray-500" />}
                />
            </div>

            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative w-[420px]">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by sender, subject, or content"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#F9FAFB] border border-gray-200 rounded-full py-3 pl-11 pr-4 text-sm focus:border-gray-500 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 bg-[#F8F9F4] p-1 rounded-xl border border-gray-200">
                    {[
                        { label: "All", value: "all" },
                        { label: "Unread", value: "unread" },
                        { label: "Read", value: "read" },
                        { label: "Archived", value: "archived" },
                    ].map((item) => {
                        const active = statusFilter === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() =>
                                    setStatusFilter(
                                        item.value as "all" | "unread" | "read" | "archived"
                                    )
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${active
                                        ? "bg-[#C1121F] text-white"
                                        : "text-gray-600 hover:text-[#C1121F]"
                                    }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-[1.15fr_1.15fr_0.7fr_0.95fr_1.05fr] px-6 py-4 bg-[#FAFAFA] border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wide">
                    <span>Sender</span>
                    <span>Subject</span>
                    <span>Status</span>
                    <span>Date</span>
                    <span>Actions</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">
                            Loading messages...
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            No messages found.
                        </div>
                    ) : (
                        filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className="grid grid-cols-[1.15fr_1.15fr_0.7fr_0.95fr_1.05fr] px-6 py-5 items-center text-sm"
                            >
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">
                                        {msg.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{msg.email}</p>
                                </div>

                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {msg.subject}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {msg.message}
                                    </p>
                                </div>

                                <div>
                                    <span
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${msg.status === "unread"
                                                ? "bg-red-100 text-red-700"
                                                : msg.status === "read"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {msg.status}
                                    </span>
                                </div>

                                <div className="text-gray-600">
                                    {new Date(msg.created_at).toLocaleDateString()}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/messages/${msg.id}`}
                                        onClick={() => markAsReadBeforeOpen(msg.id)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition"
                                    >
                                        <FiEye />
                                        <span className="text-sm font-medium">Read</span>
                                    </Link>

                                    <button
                                        onClick={() =>
                                            updateMessageStatus(
                                                msg.id,
                                                msg.status === "archived" ? "read" : "archived"
                                            )
                                        }
                                        disabled={updatingId === msg.id}
                                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 hover:border-[#003049] hover:text-[#003049] transition disabled:opacity-50"
                                        title={
                                            msg.status === "archived"
                                                ? "Unarchive message"
                                                : "Archive message"
                                        }
                                    >
                                        <FiArchive />
                                    </button>

                                    <button
                                        onClick={() => setDeleteTarget(msg)}
                                        disabled={updatingId === msg.id}
                                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 hover:border-red-600 hover:text-red-600 transition disabled:opacity-50"
                                        title="Delete message"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {deleteTarget && (
                <DeleteMessageModal
                    subject={deleteTarget.subject}
                    loading={updatingId === deleteTarget.id}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={confirmDeleteMessage}
                />
            )}
        </div>
    );
}

function TopCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {title}
                </p>
                {icon}
            </div>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
    );
}

function DeleteMessageModal({
    subject,
    loading,
    onCancel,
    onConfirm,
}: {
    subject: string;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
                aria-label="Close delete modal"
            />

            <div className="relative w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center"
                >
                    <FiX />
                </button>

                <h3 className="text-2xl font-bold text-[#b81d24] mb-2">
                    Delete Message
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to delete this?
                </p>

                <div className="rounded-2xl border border-gray-200 px-4 py-4 mb-6 bg-[#FAFAFA]">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Subject
                    </p>
                    <p className="text-sm font-semibold text-gray-900 break-all">
                        {subject}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}