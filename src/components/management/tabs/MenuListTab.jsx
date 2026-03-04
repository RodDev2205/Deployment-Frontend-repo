import { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../../config/api';

export default function MenuListTab() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkedIngredients, setLinkedIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // alert hook
  const { error, warning, success, info, confirm, danger } = useAlert();

  const ITEMS_PER_PAGE = 8;
  const API_URL = `${API_BASE_URL}/api/menu-superadmin/products`;
  const API_MENU_INVENTORY = `${API_BASE_URL}/api/menu-superadmin/menu-inventory`;

  // 🔹 Fetch from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Fetch error:", err);
        return;
      }

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  // 🔹 Update Status (with note)
  const updateStatus = async (status) => {
    if (!selectedProduct) return;

    if (status === "DECLINED" && note.trim() === "") {
      warning("Input Required", "Please provide a note when declining.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/${selectedProduct.product_id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approval_status: status,
            decline_reason: status === "DECLINED" ? note : null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error("Update error:", err);
        return;
      }

      await fetchProducts();
      setSelectedProduct(null);
      setNote("");
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filter Logic
  const filtered = products.filter((item) => {
    const matchesSearch = item.product_name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      item.approval_status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  const handleClear = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const fetchLinkedIngredients = async (productId) => {
    try {
      setLoadingIngredients(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_MENU_INVENTORY}/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch ingredients");
      const data = await res.json();
      setLinkedIngredients(data || []);
    } catch (err) {
      console.error("Failed to fetch linked ingredients:", err);
      setLinkedIngredients([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  return (
    <>
      {/* Search + Filter */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="border px-4 py-2 rounded-lg w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>

          <button
            onClick={handleClear}
            className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Clear
          </button>
        </div>

      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            « Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                page === i + 1 ? "bg-green-600 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next »
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {currentItems.map((item) => (
          <div
            key={item.product_id}
            onClick={() => {
              setSelectedProduct(item);
              setNote(item.decline_reason || "");
              fetchLinkedIngredients(item.product_id);
            }}
            className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition cursor-pointer"
          >
            <div className="h-24 bg-gray-100 rounded mb-4 flex items-center justify-center">
              {item.image_path ? (
                <img
                  src={`${API_BASE_URL}${item.image_path}`}
                  alt={item.product_name}
                  className="h-full object-cover rounded"
                />
              ) : (
                "No Image"
              )}
            </div>

            <h3 className="font-semibold">{item.product_name}</h3>
            <p className="text-sm text-gray-500">{item.category_name}</p>
            <p className="text-sm font-medium mt-1">₱ {item.price}</p>

            <p
              className={`text-sm font-medium mt-2 ${
                item.approval_status === "APPROVED"
                  ? "text-green-600"
                  : item.approval_status === "PENDING"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {item.approval_status}
            </p>
          </div>
        ))}
      </div>

      {/* Professional Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[650px] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">

            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Menu Review</h2>
              <span
                className={`px-3 py-1 text-sm rounded-full font-medium ${
                  selectedProduct.approval_status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : selectedProduct.approval_status === "DECLINED"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {selectedProduct.approval_status}
              </span>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Image */}
              <div className="bg-gray-50 rounded-xl flex items-center justify-center h-64 overflow-hidden">
                {selectedProduct.image_path ? (
                  <img
                    src={`${API_BASE_URL}${selectedProduct.image_path}`}
                    alt={selectedProduct.product_name}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <span className="text-gray-400">No Image Available</span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-2xl font-bold">
                    {selectedProduct.product_name}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {selectedProduct.category_name}
                  </p>
                </div>

                <div className="text-lg font-semibold text-green-600">
                  ₱ {selectedProduct.price}
                </div>

                <div className="text-sm space-y-1 text-gray-600 border-t pt-3">
                  <p>
                    <span className="font-medium text-gray-800">Created By:</span>{" "}
                    {selectedProduct.created_by_name}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Branch:</span>{" "}
                    {selectedProduct.branch_name}
                  </p>
                  {selectedProduct.reviewed_at && (
                    <p>
                      <span className="font-medium text-gray-800">Reviewed At:</span>{" "}
                      {new Date(selectedProduct.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {/* Linked Ingredients */}
                <div className="border-t pt-3">
                  <h4 className="font-medium text-gray-800 mb-2">Linked Ingredients:</h4>
                  {loadingIngredients ? (
                    <p className="text-sm text-gray-500">Loading ingredients...</p>
                  ) : linkedIngredients.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {linkedIngredients.map((ing, idx) => (
                        <div key={idx} className="bg-gray-100 p-2 rounded text-sm">
                          <p className="font-medium text-gray-800">{ing.item_name}</p>
                          <p className="text-gray-600">Servings Required: {ing.servings_required}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No ingredients linked</p>
                  )}
                </div>
                {selectedProduct.decline_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <span className="font-medium">Decline Reason:</span>
                    <p>{selectedProduct.decline_reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t">
                <textarea
                    placeholder="Add note (required if declining)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    disabled={selectedProduct.approval_status === "APPROVED" || selectedProduct.approval_status === "DECLINED"}
                />

                <div className="flex justify-end gap-3">
                    <button
                    onClick={() => {
                        setSelectedProduct(null);
                        setNote("");
                        setLinkedIngredients([]);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                    Cancel
                    </button>

                    {/* Decline Button */}
                    <button
                    onClick={() => updateStatus("DECLINED")}
                    disabled={selectedProduct.approval_status !== "PENDING" || loading}
                    className={`px-4 py-2 rounded-lg ${
                        selectedProduct.approval_status === "DECLINED"
                        ? "bg-red-600 text-white opacity-50 cursor-not-allowed" // stays red but disabled
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                    >
                    Decline
                    </button>

                    {/* Approve Button */}
                    <button
                    onClick={() => updateStatus("APPROVED")}
                    disabled={selectedProduct.approval_status !== "PENDING" || loading}
                    className={`px-4 py-2 rounded-lg ${
                        selectedProduct.approval_status === "APPROVED"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    >
                    Approve
                    </button>
                </div>

                {/* Optional small status label */}
                {(selectedProduct.approval_status === "APPROVED" ||
                    selectedProduct.approval_status === "DECLINED") && (
                    <p className="mt-2 text-sm text-gray-500 italic">
                    This menu has already been <strong>{selectedProduct.approval_status}</strong>.
                    </p>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
