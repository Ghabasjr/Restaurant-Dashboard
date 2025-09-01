"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useRouter } from "next/navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    // ✅ Protect route + fetch users
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) router.push("/");
        });

        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const unsubscribeUsers = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(data);

            // Build chart data (users per day)
            const grouped: Record<string, number> = {};
            data.forEach((u: any) => {
                if (u.createdAt) {
                    const date = u.createdAt.toDate().toLocaleDateString();
                    grouped[date] = (grouped[date] || 0) + 1;
                }
            });

            setChartData(
                Object.entries(grouped).map(([date, count]) => ({ date, count }))
            );
        });

        return () => {
            unsubscribeAuth();
            unsubscribeUsers();
        };
    }, []);

    // ✅ Logout
    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    // ✅ Delete User
    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            await deleteDoc(doc(db, "users", id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">📋 Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md"
                >
                    Logout
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-gray-500 text-sm">Total Users</h2>
                    <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                </div>
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-gray-500 text-sm">Latest User</h2>
                    <p className="text-lg text-gray-800">
                        {users[0]?.name || "No users yet"}
                    </p>
                </div>
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-gray-500 text-sm">Last Update</h2>
                    <p className="text-lg text-gray-800">
                        {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white shadow-md rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    📈 User Registrations (by day)
                </h3>
                <div className="w-full h-72">
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#f7b053" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white shadow-md rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    👥 Registered Users
                </h3>
                <ul className="space-y-3">
                    {users.map((user: any) => (
                        <li
                            key={user.id}
                            className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-4 rounded-lg shadow-sm"
                        >
                            <span>
                                <strong className="text-gray-800">
                                    {user.name || "No Name"}
                                </strong>{" "}
                                <span className="text-gray-500">({user.email})</span> –{" "}
                                <span className="text-sm text-gray-400">
                                    {user.createdAt?.toDate().toLocaleString()}
                                </span>
                            </span>
                            <button
                                onClick={() => handleDelete(user.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
