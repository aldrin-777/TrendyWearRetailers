"use client";

import { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiUsers,
    FiShield,
    FiUser,
    FiEye,
    FiX,
    FiPauseCircle,
    FiCheckCircle,
    FiRefreshCw,
    FiTrash2,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

type UserRow = {
    id: string;
    username: string;
    is_admin: boolean;
    status: "active" | "suspended";
    created_at: string;
    total_orders: number;
    total_spent: number;
    last_order_date: string | null;
    wishlist_count: number;
    reviews_count: number;
};

type OrderRow = {
    id: number;
    user_id: string;
    total_price: number;
    created_at: string;
    status: string;
};

type WishlistRow = {
    id: number;
    user_id: string;
};

type ReviewRow = {
    id: number;
    user_id: string;
};

type ConfirmAction =
    | {
        type: "status";
        user: UserRow;
        nextStatus: "active" | "suspended";
    }
    | {
        type: "role";
        user: UserRow;
        nextIsAdmin: boolean;
    }
    | {
        type: "delete";
        user: UserRow;
    };

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "customer">(
        "all"
    );
    const [statusFilter, setStatusFilter] = useState<
        "all" | "active" | "suspended"
    >("all");
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

    useEffect(() => {
        fetchUsersWithStats();
    }, []);

    async function fetchUsersWithStats() {
        const supabase = createClient();
        setLoading(true);

        const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, username, is_admin, status, created_at")
            .order("created_at", { ascending: false });

        if (usersError || !usersData) {
            console.error("Error fetching users:", usersError);
            setLoading(false);
            return;
        }

        const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("id, user_id, total_price, created_at, status");

        if (ordersError) {
            console.error("Error fetching orders:", ordersError);
        }

        const { data: wishlistData, error: wishlistError } = await supabase
            .from("wishlist")
            .select("id, user_id");

        if (wishlistError) {
            console.error("Error fetching wishlist:", wishlistError);
        }

        const { data: reviewsData, error: reviewsError } = await supabase
            .from("reviews")
            .select("id, user_id");

        if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
        }

        const safeOrders: OrderRow[] = ordersData ?? [];
        const safeWishlist: WishlistRow[] = wishlistData ?? [];
        const safeReviews: ReviewRow[] = reviewsData ?? [];

        const enrichedUsers: UserRow[] = usersData.map((user) => {
            const userOrders = safeOrders.filter((order) => order.user_id === user.id);
            const userWishlist = safeWishlist.filter((item) => item.user_id === user.id);
            const userReviews = safeReviews.filter((review) => review.user_id === user.id);

            const totalOrders = userOrders.length;
            const totalSpent = userOrders.reduce(
                (sum, order) => sum + Number(order.total_price ?? 0),
                0
            );

            const lastOrder =
                userOrders.length > 0
                    ? [...userOrders].sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0]
                    : null;

            return {
                id: user.id,
                username: user.username ?? "Unknown User",
                is_admin: user.is_admin ?? false,
                status: (user.status ?? "active") as "active" | "suspended",
                created_at: user.created_at,
                total_orders: totalOrders,
                total_spent: totalSpent,
                last_order_date: lastOrder?.created_at ?? null,
                wishlist_count: userWishlist.length,
                reviews_count: userReviews.length,
            };
        });

        setUsers(enrichedUsers);
        setLoading(false);
    }

    async function updateUserRole(userId: string, makeAdmin: boolean) {
        const supabase = createClient();
        setUpdatingUserId(userId);

        const { error } = await supabase
            .from("users")
            .update({ is_admin: makeAdmin })
            .eq("id", userId);

        if (error) {
            console.error("Error updating role:", error);
            alert("Failed to update user role.");
        } else {
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userId ? { ...user, is_admin: makeAdmin } : user
                )
            );

            setSelectedUser((prev) =>
                prev && prev.id === userId ? { ...prev, is_admin: makeAdmin } : prev
            );
        }

        setUpdatingUserId(null);
    }

    async function updateUserStatus(
        userId: string,
        nextStatus: "active" | "suspended"
    ) {
        const supabase = createClient();
        setUpdatingUserId(userId);

        const { error } = await supabase
            .from("users")
            .update({ status: nextStatus })
            .eq("id", userId);

        if (error) {
            console.error("Error updating status:", error);
            alert("Failed to update user status.");
        } else {
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userId ? { ...user, status: nextStatus } : user
                )
            );

            setSelectedUser((prev) =>
                prev && prev.id === userId ? { ...prev, status: nextStatus } : prev
            );
        }

        setUpdatingUserId(null);
    }

    async function deleteUser(userId: string) {
        const supabase = createClient();
        setUpdatingUserId(userId);

        // Delete related rows first to avoid FK issues
        const relatedDeletes = await Promise.all([
            supabase.from("wishlist").delete().eq("user_id", userId),
            supabase.from("reviews").delete().eq("user_id", userId),
            supabase.from("orders").delete().eq("user_id", userId),
            supabase.from("carts").delete().eq("user_id", userId),
        ]);

        const relatedError = relatedDeletes.find((result) => result.error)?.error;

        if (relatedError) {
            console.error("Error deleting related user data:", relatedError);
            alert("Failed to delete related user data.");
            setUpdatingUserId(null);
            return;
        }

        const { error } = await supabase.from("users").delete().eq("id", userId);

        if (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        } else {
            setUsers((prev) => prev.filter((user) => user.id !== userId));
            setSelectedUser((prev) => (prev?.id === userId ? null : prev));
        }

        setUpdatingUserId(null);
    }

    async function handleConfirmAction() {
        if (!confirmAction) return;

        if (confirmAction.type === "status") {
            await updateUserStatus(confirmAction.user.id, confirmAction.nextStatus);
        } else if (confirmAction.type === "role") {
            await updateUserRole(confirmAction.user.id, confirmAction.nextIsAdmin);
        } else if (confirmAction.type === "delete") {
            await deleteUser(confirmAction.user.id);
        }

        setConfirmAction(null);
    }

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return users.filter((user) => {
            const matchesSearch =
                q.length === 0 ||
                user.username.toLowerCase().includes(q) ||
                user.id.toLowerCase().includes(q);

            const matchesRole =
                roleFilter === "all" ||
                (roleFilter === "admin" && user.is_admin) ||
                (roleFilter === "customer" && !user.is_admin);

            const matchesStatus =
                statusFilter === "all" || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.is_admin).length;
    const totalCustomers = users.filter((u) => !u.is_admin).length;
    const activeBuyers = users.filter((u) => u.total_orders > 0).length;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#b81d24] tracking-wide">
                        User Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage customer accounts, roles, status, and engagement
                    </p>
                </div>

                <button
                    onClick={fetchUsersWithStats}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition"
                >
                    <FiRefreshCw />
                    <span className="text-sm font-medium">Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <TopCard
                    title="Total Users"
                    value={String(totalUsers)}
                    icon={<FiUsers className="text-xl text-blue-500" />}
                />
                <TopCard
                    title="Admins"
                    value={String(totalAdmins)}
                    icon={<FiShield className="text-xl text-orange-500" />}
                />
                <TopCard
                    title="Customers"
                    value={String(totalCustomers)}
                    icon={<FiUser className="text-xl text-purple-500" />}
                />
                <TopCard
                    title="Active Buyers"
                    value={String(activeBuyers)}
                    icon={<FiUsers className="text-xl text-green-500" />}
                />
            </div>

            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative w-[360px]">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by username or user ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#F9FAFB] border border-gray-200 rounded-full py-3 pl-11 pr-4 text-sm focus:border-gray-500 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-2 bg-[#F8F9F4] p-1 rounded-xl border border-gray-200">
                        {[
                            { label: "All Users", value: "all" },
                            { label: "Admins", value: "admin" },
                            { label: "Customers", value: "customer" },
                        ].map((item) => {
                            const active = roleFilter === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setRoleFilter(item.value as "all" | "admin" | "customer")
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

                    <div className="flex gap-2 bg-[#F8F9F4] p-1 rounded-xl border border-gray-200">
                        {[
                            { label: "All Status", value: "all" },
                            { label: "Active", value: "active" },
                            { label: "Suspended", value: "suspended" },
                        ].map((item) => {
                            const active = statusFilter === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setStatusFilter(
                                            item.value as "all" | "active" | "suspended"
                                        )
                                    }
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${active
                                            ? "bg-[#003049] text-white"
                                            : "text-gray-600 hover:text-[#003049]"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-[1.35fr_0.75fr_0.7fr_0.85fr_0.85fr_0.85fr_0.8fr] px-6 py-4 bg-[#FAFAFA] border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wide">
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Orders</span>
                    <span>Wishlist</span>
                    <span>Reviews</span>
                    <span>Action</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">No users found.</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="grid grid-cols-[1.35fr_0.75fr_0.7fr_0.85fr_0.85fr_0.85fr_0.8fr] px-6 py-5 items-center text-sm"
                            >
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{user.username}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.id}</p>
                                </div>

                                <div>
                                    <span
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${user.is_admin
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {user.is_admin ? "Admin" : "Customer"}
                                    </span>
                                </div>

                                <div>
                                    <span
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${user.status === "active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {user.status}
                                    </span>
                                </div>

                                <div className="font-semibold text-gray-800">{user.total_orders}</div>
                                <div className="font-semibold text-gray-800">{user.wishlist_count}</div>
                                <div className="font-semibold text-gray-800">{user.reviews_count}</div>

                                <div>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#C1121F] hover:text-[#C1121F] transition"
                                    >
                                        <FiEye />
                                        <span className="text-sm font-medium">View</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedUser && (
                <UserDetailsModal
                    user={selectedUser}
                    updating={updatingUserId === selectedUser.id}
                    onClose={() => setSelectedUser(null)}
                    onAskToggleStatus={() =>
                        setConfirmAction({
                            type: "status",
                            user: selectedUser,
                            nextStatus:
                                selectedUser.status === "active" ? "suspended" : "active",
                        })
                    }
                    onAskToggleRole={() =>
                        setConfirmAction({
                            type: "role",
                            user: selectedUser,
                            nextIsAdmin: !selectedUser.is_admin,
                        })
                    }
                    onAskDelete={() =>
                        setConfirmAction({
                            type: "delete",
                            user: selectedUser,
                        })
                    }
                />
            )}

            {confirmAction && (
                <ConfirmActionModal
                    action={confirmAction}
                    loading={updatingUserId === confirmAction.user.id}
                    onCancel={() => setConfirmAction(null)}
                    onConfirm={handleConfirmAction}
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

function UserDetailsModal({
    user,
    updating,
    onClose,
    onAskToggleStatus,
    onAskToggleRole,
    onAskDelete,
}: {
    user: UserRow;
    updating: boolean;
    onClose: () => void;
    onAskToggleStatus: () => void;
    onAskToggleRole: () => void;
    onAskDelete: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label="Close modal"
            />

            <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl overflow-y-auto">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center"
                >
                    <FiX />
                </button>

                <div className="px-8 pt-16 pb-8">
                    <h2 className="text-2xl font-bold text-[#b81d24] mb-2">
                        User Details
                    </h2>
                    <p className="text-sm text-gray-500 mb-8">
                        View and manage customer account details
                    </p>

                    <div className="space-y-5 mb-8">
                        <DetailItem label="Username" value={user.username} />
                        <DetailItem label="User ID" value={user.id} />
                        <DetailItem label="Role" value={user.is_admin ? "Admin" : "Customer"} />
                        <DetailItem label="Status" value={user.status} />
                        <DetailItem
                            label="Joined"
                            value={new Date(user.created_at).toLocaleString()}
                        />
                        <DetailItem label="Total Orders" value={String(user.total_orders)} />
                        <DetailItem
                            label="Total Spent"
                            value={`₱${user.total_spent.toLocaleString()}`}
                        />
                        <DetailItem
                            label="Wishlist Count"
                            value={String(user.wishlist_count)}
                        />
                        <DetailItem label="Reviews Count" value={String(user.reviews_count)} />
                        <DetailItem
                            label="Last Order Date"
                            value={
                                user.last_order_date
                                    ? new Date(user.last_order_date).toLocaleString()
                                    : "No orders yet"
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={onAskToggleRole}
                            disabled={updating}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 hover:border-[#003049] hover:text-[#003049] transition disabled:opacity-50"
                        >
                            <FiShield />
                            <span className="font-medium">
                                {user.is_admin ? "Set as Customer" : "Set as Admin"}
                            </span>
                        </button>

                        <button
                            onClick={onAskToggleStatus}
                            disabled={updating}
                            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition disabled:opacity-50 ${user.status === "active"
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                        >
                            {user.status === "active" ? <FiPauseCircle /> : <FiCheckCircle />}
                            <span className="font-medium">
                                {user.status === "active" ? "Suspend User" : "Activate User"}
                            </span>
                        </button>

                        <button
                            onClick={onAskDelete}
                            disabled={updating}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90 transition disabled:opacity-50"
                        >
                            <FiTrash2 />
                            <span className="font-medium">Delete User</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConfirmActionModal({
    action,
    loading,
    onCancel,
    onConfirm,
}: {
    action: ConfirmAction;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const title =
        action.type === "status"
            ? action.nextStatus === "suspended"
                ? "Suspend User"
                : "Activate User"
            : action.type === "role"
                ? action.nextIsAdmin
                    ? "Set as Admin"
                    : "Set as Customer"
                : "Delete User";

    const message =
        action.type === "status"
            ? `Are you sure you want to ${action.nextStatus === "suspended" ? "suspend" : "activate"
            } this user?`
            : action.type === "role"
                ? `Are you sure you want to ${action.nextIsAdmin ? "set this user to admin" : "set this user as customer"
                }?`
                : "Are you sure you want to delete this user? This action cannot be undone.";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
                aria-label="Close confirmation modal"
            />

            <div className="relative w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6">
                <h3 className="text-2xl font-bold text-[#b81d24] mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

                <div className="rounded-2xl border border-gray-200 px-4 py-4 mb-6 bg-[#FAFAFA]">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        User
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                        {action.user.username}
                    </p>
                    <p className="text-xs text-gray-500 break-all mt-1">{action.user.id}</p>
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
                        className={`px-4 py-2 rounded-xl text-white transition disabled:opacity-50 ${action.type === "delete"
                                ? "bg-black hover:opacity-90"
                                : action.type === "status" && action.nextStatus === "suspended"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-[#C1121F] hover:opacity-90"
                            }`}
                    >
                        {loading ? "Processing..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="border border-gray-200 rounded-2xl px-4 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-900 break-all">{value}</p>
        </div>
    );
}