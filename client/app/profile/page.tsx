
'use client';
import { getStoredUser } from "@/lib/auth";
import { useEffect, useState } from "react";

const ProfilePage = () => {
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const updateUser = () => setUser(getStoredUser());
    window.addEventListener("authChanged", updateUser);
    window.addEventListener("storage", updateUser);
    return () => {
      window.removeEventListener("authChanged", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  if (!user) {
    return <div className="p-8 text-center">You are not logged in.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="mb-2">
        <span className="font-semibold">Name:</span> {user.name || "N/A"}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Email:</span> {user.email || "N/A"}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Role:</span> {user.role}
      </div>
      {/* Role-specific content */}
      {user.role === "super_admin" && (
        <div className="mt-4 p-4 bg-blue-100 rounded">Super Admin controls and stats go here.</div>
      )}
      {user.role === "area_manager" && (
        <div className="mt-4 p-4 bg-green-100 rounded">Area Manager dashboard and region info go here.</div>
      )}
      {user.role === "worker" && (
        <div className="mt-4 p-4 bg-yellow-100 rounded">Worker job stats and profile info go here.</div>
      )}
      {user.role === "client" && (
        <div className="mt-4 p-4 bg-purple-100 rounded">Client job postings and account info go here.</div>
      )}
    </div>
  );
};

export default ProfilePage;
