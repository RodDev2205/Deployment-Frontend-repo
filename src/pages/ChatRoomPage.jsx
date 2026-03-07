import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, LogOut, Users, Link } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from '../config/api';

export default function ChatRoom() {
  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");

  // ======== DECODE JWT TO GET CURRENT USER ========
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, [token]);

  // ======== SOCKET.IO SETUP ========
  useEffect(() => {
    if (!token) {
      console.error("No token found");
      return;
    }

    // Connect socket
    socketRef.current = io(API_BASE_URL, {
      auth: { token },
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Listen for incoming messages
    socketRef.current.on("receiveMessage", (msg) => {
      console.log("📨 Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for user join/leave notifications
    socketRef.current.on("userJoined", (data) => {
      console.log("✅ User joined:", data);
    });

    socketRef.current.on("userLeft", (data) => {
      console.log("❌ User left:", data);
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  // ======== FETCH BRANCHES WITH MESSAGES ========
  useEffect(() => {
    const fetchBranches = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/chat/branches-with-messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("📦 Branches fetched:", data);
        setBranches(data || []);
        if (data && data.length > 0 && !activeBranchId) {
          setActiveBranchId(data[0].branch_id);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [token, activeBranchId]);

  // ======== JOIN ROOM & FETCH MESSAGES WHEN BRANCH CHANGES ========
  useEffect(() => {
    if (!activeBranchId || !socketRef.current) return;

    // Join branch room
    socketRef.current.emit("joinBranchRoom", { branch_id: activeBranchId });
    console.log(`📍 Joining branch room: ${activeBranchId}`);

    // Fetch last messages from backend
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/chat/branch/${activeBranchId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        console.log("💬 Messages fetched:", data);
        setMessages(data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [activeBranchId, token]);

  // ======== SCROLL TO BOTTOM ========
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ======== SEND MESSAGE ========
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !file) || !activeBranchId) {
      console.warn("Nothing to send or no branch selected");
      return;
    }

    let attachment_url = null;
    let message_type = "text";
    let attachment_name = attachmentName || null;

    // if a file is selected, upload first
    if (file) {
      try {
        const token = localStorage.getItem("token");
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${API_BASE_URL}/api/chat/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) {
          console.error("Upload failed");
        } else {
          const data = await res.json();
          attachment_url = data.url;
          message_type = data.message_type;
          // backend may return original name too
          if (data.attachment_name) attachment_name = data.attachment_name;
        }
      } catch (err) {
        console.error("Error uploading file", err);
      }
    }

    const payload = {
      branch_id: activeBranchId,
      message: message.trim(),
      message_type,
      attachment_url,
      attachment_name,
    };

    console.log("📤 Sending message:", payload);

    socketRef.current.emit("sendMessage", payload);

    setMessage("");
    setFile(null);
    setAttachmentName("");
    // clear file input by resetting form element
    if (e.target && typeof e.target.reset === 'function') {
      e.target.reset();
    }
  };

  const activeBranch = branches.find((b) => b.branch_id === activeBranchId) || {};

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-100">
      <div className="flex flex-1 gap-2 p-2 min-h-0 overflow-hidden">
        {/* Chat Area */}
        <div className="flex flex-col flex-1 bg-white rounded-xl shadow-sm min-h-0 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-700 to-green-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {activeBranch.branch_name || "Select a Branch"}
                </h1>
                <p className="text-xs text-emerald-100">
                  {activeBranch.sender_name && `Last: ${activeBranch.sender_name}`}
                </p>
              </div>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isCurrentUser = msg.sender_id === currentUser.user_id;
                return (
                  <div
                    key={msg.message_id || idx}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2.5 ${
                        isCurrentUser
                          ? "bg-green-800 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {!isCurrentUser && (
                        <p className="text-xs font-medium mb-1 text-green-800">
                          {msg.full_name || msg.username || "Unknown"}
                        </p>
                      )}
                      {/* Display text and/or attachment */}
                      {msg.message && <p className="text-sm break-words">{msg.message}</p>}
                      {msg.attachment_url && msg.message_type === 'image' && (
                        <img
                          src={`${API_BASE_URL}${msg.attachment_url}`}
                          alt="attachment"
                          className="mt-2 max-w-xs rounded cursor-pointer"
                          onClick={() => setSelectedImage(`${API_BASE_URL}${msg.attachment_url}`)}
                        />
                      )}
                      {msg.attachment_url && msg.message_type === 'file' && (
                        <a
                          href={`${API_BASE_URL}${msg.attachment_url}`}
                          className="mt-2 inline-block text-blue-600 underline"
                          download
                        >
                          {msg.attachment_name || 'Download file'}
                        </a>
                      )}
                      <div className="text-xs mt-1 opacity-70 text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <footer className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              />
              <label className="ml-2 cursor-pointer text-gray-500 hover:text-gray-700">
                <Link className="w-5 h-5" />
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files[0] || null;
                    setFile(f);
                    setAttachmentName(f ? f.name : "");
                  }}
                  className="hidden"
                />
              </label>
              {attachmentName && <span className="text-xs text-gray-600 ml-2">{attachmentName}</span>}
              <button
                type="submit"
                disabled={(!message.trim() && !file) || !activeBranchId}
                className="p-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </footer>
        </div>

        {/* Sidebar - Branch List */}
        <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm min-h-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-800 px-6 py-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-white">Branch Chats</h2>
            <p className="text-xs text-green-100">
              {isLoading ? "Loading..." : `${branches.length} branch${branches.length !== 1 ? "es" : ""}`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {branches.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>No branches available</p>
              </div>
            ) : (
              branches.map((branch) => {
                const isActive = branch.branch_id === activeBranchId;
                return (
                  <button
                    key={branch.branch_id}
                    onClick={() => setActiveBranchId(branch.branch_id)}
                    className={`w-full px-4 py-3 border-b text-left hover:bg-green-50 transition ${
                      isActive ? "bg-green-50 border-l-4 border-l-green-700" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-green-100 text-green-800 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {branch.branch_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className="font-medium text-sm truncate">
                            {branch.branch_name}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {branch.lastTime}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {branch.sender_name && (
                            <span className="font-semibold text-emerald-600">
                              {branch.sender_name}:{" "}
                            </span>
                          )}
                          {branch.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-[95vw] max-h-[95vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
