"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    FiArrowLeft,
    FiArchive,
    FiClock,
    FiEye,
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

export default function AdminMessageDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [message, setMessage] = useState<MessageRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchMessage();

        const supabase = createClient();

        const channel = supabase
            .channel(`admin-contact-message-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "contact_messages",
                    filter: `id=eq.${id}`,
                },
                () => {
                    fetchMessage();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    async function fetchMessage() {
        const supabase = createClient();
        setLoading(true);

        const { data, error } = await supabase
            .from("contact_messages")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching message:", error);
            setLoading(false);
            return;
        }

        const row = data as MessageRow;

        const normalizedRow =
            row.status === "unread" ? { ...row, status: "read" as const } : row;

        setMessage(normalizedRow);
        setLoading(false);

        if (row.status === "unread") {
            const { error: updateError } = await supabase
                .from("contact_messages")
                .update({ status: "read" })
                .eq("id", row.id);

            if (updateError) {
                console.error("Error auto-marking as read:", updateError);
                setMessage(row);
            }
        }
    }

    async function updateMessageStatus(
        nextStatus: "unread" | "read" | "archived"
    ) {
        if (!message) return;

        const supabase = createClient();
        setUpdating(true);

        const previous = message;
        setMessage({ ...message, status: nextStatus });

        const { error } = await supabase
            .from("contact_messages")
            .update({ status: nextStatus })
            .eq("id", message.id);

        if (error) {
            console.error("Error updating message status:", error);
            alert("Failed to update message status.");
            setMessage(previous);
        }

        setUpdating(false);
    }

    async function confirmDeleteMessage() {
        if (!message) return;

        const supabase = createClient();
        setUpdating(true);

        const { error } = await supabase
            .from("contact_messages")
            .delete()
            .eq("id", message.id);

        if (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message.");
            setUpdating(false);
            return;
        }

        router.push("/admin/messages");
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading message...
            </div>
        );
    }

    if (!message) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Message not found
                </h2>
                <p className="text-gray-500 mb-6">
                    This message may have been deleted or does not exist.
                </p>
                <Link
                    href="/admin/messages"
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition"
                >
                    Back to Messages
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/admin/messages")}
                        className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition"
                        title="Back to inbox"
                    >
                        <FiArrowLeft />
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold text-[#b81d24] tracking-wide">
                            Message Details
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Read and manage a user inquiry
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchMessage}
                        disabled={updating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition disabled:opacity-50"
                    >
                        <FiRefreshCw />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>

                    <button
                        onClick={() =>
                            updateMessageStatus(
                                message.status === "archived" ? "read" : "archived"
                            )
                        }
                        disabled={updating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-[#003049] hover:text-[#003049] transition disabled:opacity-50"
                    >
                        <FiArchive />
                        <span className="text-sm font-medium">
                            {message.status === "archived" ? "Unarchive" : "Archive"}
                        </span>
                    </button>

                    <button
                        onClick={() =>
                            updateMessageStatus(
                                message.status === "unread" ? "read" : "unread"
                            )
                        }
                        disabled={updating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-green-600 hover:text-green-600 transition disabled:opacity-50"
                    >
                        {message.status === "unread" ? <FiEye /> : <FiClock />}
                        <span className="text-sm font-medium">
                            {message.status === "unread" ? "Mark as Read" : "Mark as Unread"}
                        </span>
                    </button>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={updating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition disabled:opacity-50"
                    >
                        <FiTrash2 />
                        <span className="text-sm font-medium">Delete</span>
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm flex-1 overflow-y-auto">
                <div className="px-8 py-8 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h2 className="text-[32px] leading-tight font-medium text-gray-900">
                                    {message.subject}
                                </h2>

                                <span
                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${message.status === "unread"
                                            ? "bg-red-100 text-red-700"
                                            : message.status === "read"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {message.status}
                                </span>
                            </div>

                            <div className="flex items-start gap-4 mt-6">
                                <div className="w-12 h-12 rounded-full bg-[#C1121F] text-white flex items-center justify-center text-lg font-bold uppercase shrink-0">
                                    {message.full_name.charAt(0)}
                                </div>

                                <div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {message.full_name}
                                    </p>
                                    <p className="text-sm text-gray-500">{message.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 shrink-0">
                            {new Date(message.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-10">
                    <div className="max-w-[860px]">
                        <p className="text-[17px] leading-8 text-gray-800 whitespace-pre-wrap">
                            {message.message}
                        </p>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <DeleteMessageModal
                    subject={message.subject}
                    loading={updating}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={confirmDeleteMessage}
                />
            )}
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