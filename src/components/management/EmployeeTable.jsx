import { useEffect, useState } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';
import { UserCircle, Users, Lock, Unlock, Eye, Pencil } from "lucide-react";
import AlertDialog from "../common/AlertDialog";

import AddAdminModal from "./AddAdmin";
import AddCashierModal from "./AddCashier";
import EditUserModal from "./EditUserModal";
import ViewUserModal from "./ViewUserModal";

export default function UserList({ type }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { error: alertError } = useAlert();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  // ==============================
  // Fetch users
  // ==============================
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/superadmin/get${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      
      // Restore middle_name from cache (backend may not return it)
      const usersWithMiddleNames = (data || []).map(user => {
        const cacheKey = `user_${user.username}_middle_name`;
        const cachedMiddleName = localStorage.getItem(cacheKey);
        return {
          ...user,
          middle_name: cachedMiddleName || user.middle_name || ""
        };
      });
      
      setUsers(usersWithMiddleNames || []);
      setFilteredUsers(usersWithMiddleNames || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Fetch all branches for filter
  // ==============================
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/branches/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();
      setBranches(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [type]);

  // ==============================
  // Search and filter logic
  // ==============================
  useEffect(() => {
    let temp = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      temp = temp.filter((user) => {
        // build a searchable name string (some APIs return first_name/last_name)
        const nameStr =
          (user.name || `${user.first_name || ""} ${user.middle_name || ""} ${user.last_name || ""}`)
            .toString()
            .toLowerCase();
        const usernameStr = (user.username || "").toString().toLowerCase();
        return nameStr.includes(term) || usernameStr.includes(term);
      });
    }

    if (filterBranch) {
      temp = temp.filter((user) => (user.branch || "").toString() === filterBranch);
    }

    setFilteredUsers(temp);
  }, [searchTerm, filterBranch, users]);

  // ==============================
  // Toggle user status
  // ==============================
  const showConfirmDialog = (user) => {
    setUserToDeactivate(user);
    setIsConfirmDialogOpen(true);
  };

  const toggleStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "Activate" ? "Deactivate" : "Activate";

    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/users/${userId}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      // Update user status locally
      setUsers((prev) =>
        prev.map((user) =>
          (user.id || user.user_id) === userId
            ? { ...user, status: data.user.status }
            : user
        )
      );

      // Show success dialog
      const userName = `${userToDeactivate?.first_name} ${userToDeactivate?.middle_name || ''} ${userToDeactivate?.last_name}`;
      const action = newStatus === "Deactivate" ? "deactivated" : "activated";
      setSuccessMessage(`${userName} has been ${action} successfully`);
      setIsSuccessDialogOpen(true);
      setIsConfirmDialogOpen(false);
      setUserToDeactivate(null);
    } catch (err) {
      alertError("Error", err.message);
    }
  };

  // ==============================
  // Add new user to list (from modal)
  // ==============================
  const handleAddUser = (newUser) => {
    // Cache the middle_name to preserve it (backend may not store it)
    const cacheKey = `user_${newUser.username}_middle_name`;
    if (newUser.middle_name) {
      localStorage.setItem(cacheKey, newUser.middle_name);
    }
    setUsers((prev) => [newUser, ...prev]); // add to top of list
  };

  // ==============================
  // Update a single user after edit
  // ==============================
  const handleUpdateUser = (updatedUser) => {
    // Cache the updated middle_name
    const cacheKey = `user_${updatedUser.username}_middle_name`;
    if (updatedUser.middle_name) {
      localStorage.setItem(cacheKey, updatedUser.middle_name);
    }
    
    const updatedId = updatedUser.id || updatedUser.user_id;

    // Update main users list
    setUsers((prev) =>
      prev.map((user) =>
        (user.id || user.user_id) === updatedId ? { ...user, ...updatedUser } : user
      )
    );

    // Also update filteredUsers immediately so UI reflects changes without waiting
    setFilteredUsers((prev) =>
      prev.map((user) =>
        (user.id || user.user_id) === updatedId ? { ...user, ...updatedUser } : user
      )
    );

    // Update selectedUser if it's the one being edited, so ViewUserModal shows updated data
    if (selectedUser && (selectedUser.id || selectedUser.user_id) === updatedId) {
      setSelectedUser((prev) => ({ ...prev, ...updatedUser }));
    }
  };

  // ==============================
  // Handle modals
  // ==============================
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  // ==============================
  // UI States
  // ==============================
  if (loading) return <p className="text-gray-600">Loading {type.toLowerCase()}s...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      {/* ===== Header ===== */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{type} List</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
        >
          {type === "Admin" ? (
            <UserCircle className="mr-2 h-4 w-4" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Add {type}
        </button>
      </div>

      {/* ===== Search & Filter ===== */}
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <input
          type="text"
          placeholder={`Search ${type.toLowerCase()} by name or username`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none md:w-3/4"
        />

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none md:w-1/4"
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.branch_id} value={branch.branch_name}>
              {branch.branch_name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearchTerm("");
            setFilterBranch("");
          }}
          className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Clear
        </button>
      </div>

      {/* ===== Table ===== */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-gray-500">
                  No {type.toLowerCase()} accounts found
                </td>
              </tr>
            ) : (
              filteredUsers
                .filter((u) => u != null)
                .map((user) => {
                  const userId = user.id || user.user_id;
                  const isActive = user.status === "Activate";

                return (
                  <tr key={userId || user.username || Math.random()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.first_name} {user.middle_name || ''} {user.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.branch || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.username}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isActive ? "Activated" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                          title="View user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleEditUser(user)}
                          className="rounded-full bg-yellow-100 p-2 text-yellow-600 hover:bg-yellow-200"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => showConfirmDialog(user)}
                          className={`rounded-full p-2 transition ${
                            isActive
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                          title={isActive ? "Deactivate user" : "Activate user"}
                        >
                          {isActive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Modals ===== */}
      {type === "Admin" && (
        <AddAdminModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddUser} // <-- directly add new user to list
        />
      )}

      {type === "Cashier" && (
        <AddCashierModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddUser} // <-- same pattern
        />
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        role={type}
        onClose={handleCloseEditModal}
        onUpdate={handleUpdateUser} // <-- instantly update edited user
      />

      <ViewUserModal
        isOpen={isViewModalOpen}
        user={selectedUser}
        onClose={handleCloseViewModal}
      />

      {/* Confirmation Dialog */}
      {userToDeactivate && (
        <AlertDialog
          isOpen={isConfirmDialogOpen}
          type={userToDeactivate?.status === "Activate" ? "warning" : "success"}
          title={userToDeactivate?.status === "Activate" ? "Confirm Deactivation" : "Confirm Activation"}
          message={userToDeactivate?.status === "Activate" 
            ? `Are you sure you want to deactivate ${userToDeactivate?.first_name} ${userToDeactivate?.middle_name || ''} ${userToDeactivate?.last_name}?`
            : `Are you sure you want to reactivate ${userToDeactivate?.first_name} ${userToDeactivate?.middle_name || ''} ${userToDeactivate?.last_name}?`
          }
          confirmText={userToDeactivate?.status === "Activate" ? "Deactivate" : "Reactivate"}
          cancelText="Cancel"
          onConfirm={() => {
            const userId = userToDeactivate?.id || userToDeactivate?.user_id;
            const currentStatus = userToDeactivate?.status;
            toggleStatus(userId, currentStatus);
          }}
          onClose={() => {
            setIsConfirmDialogOpen(false);
            setUserToDeactivate(null);
          }}
          showConfirmButton={true}
          showCancelButton={true}
          isDanger={userToDeactivate?.status === "Activate"}
        />
      )}

      {/* Success Dialog */}
      <AlertDialog
        isOpen={isSuccessDialogOpen}
        type="success"
        title="Success"
        message={successMessage}
        confirmText="OK"
        onClose={() => setIsSuccessDialogOpen(false)}
        showConfirmButton={true}
        showCancelButton={false}
      />
    </div>
  );
}
