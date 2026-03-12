import React, { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import { Printer, Eye } from 'lucide-react';
import Modal from "./Modal/Modal";
import TransactionDetailModal from "../POScomponent/Modal/TransactionDetailModal";
import API_BASE_URL from '../../config/api';
import { printReceipt } from '../../utils/printUtils';

export default function Records () {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const { success, error } = useAlert();

    const fetchTransactions = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No auth token found");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/pos/user-transactions`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("Failed to fetch transactions:", res.status, res.statusText);
                return;
            }

            const data = await res.json();
            console.log("Fetched transactions:", data.length);
            setRecords(data);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        }
    };

    useEffect(() => {
        fetchTransactions();
        setLoading(false);
    }, []);

    const formatTime = isoString => {
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (_e) {
            return isoString;
        }
    };

    const handleView = async (transaction) => {
        setDetailLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/pos/transaction/${transaction.transaction_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setModalData(data);
                setIsModalOpen(true);
            } else {
                error("Load Error", data.message || "Failed to load transaction details");
            }
        } catch (err) {
            console.error("Detail fetch error", err);
            error("Load Error", "Failed to load transaction details");
        } finally {
            setDetailLoading(false);
        }
    };

    const handlePrint = async (transaction) => {
        setDetailLoading(true);
        try {
            const token = localStorage.getItem("token");
            // fetch transaction details first
            const res = await fetch(`${API_BASE_URL}/api/pos/transaction/${transaction.transaction_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to load transaction");
            }

            // Format data for printUtils
            const printData = {
                date: new Date(data.transaction.created_at).toLocaleString(),
                orderId: data.transaction.transaction_number,
                orderType: data.transaction.order_type || "Dine-in",
                paymentMethod: data.transaction.payment_method || "Cash",
                location: data.transaction.branch_address || "", // added branch info
                contact: data.transaction.branch_contact || "",
                cart: data.items.map(item => ({
                    qty: parseInt(item.quantity) || 0,
                    item: item.product_name,
                    price: parseFloat(item.price) || 0
                })),
                total: parseFloat(data.transaction.total_amount) || 0,
                given: parseFloat(data.transaction.amount_paid) || parseFloat(data.transaction.total_amount) || 0,
                change: (parseFloat(data.transaction.amount_paid) || 0) - (parseFloat(data.transaction.total_amount) || 0)
            };

            // Use printUtils to print directly
            await printReceipt(printData);
            success("Printing", "Receipt sent to printer");
        } catch (err) {
            console.error("Print error", err);
            error("Print Error", err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    // filter + pagination
    const filtered = records.filter(r => {
        const txnNum = r.transaction_number ? r.transaction_number.toLowerCase() : "";
        return (
            txnNum.includes(search.toLowerCase()) ||
            formatTime(r.created_at).includes(search)
        );
    });
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const currentRecords = filtered.slice(start, start + ITEMS_PER_PAGE);

    if (loading) {
        return <div className="p-6">Loading transactions...</div>;
    }

    return (
        <div className="flex-1 bg-white rounded-lg p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Transaction Records</h2>
                <input
                    type="text"
                    placeholder="Search by number or time..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring focus:border-blue-300"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-left text-sm text-gray-600 uppercase sticky top-0">
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Transaction #</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Paid</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                        {currentRecords.map((record, idx) => (
                            <tr
                                key={record.transaction_id}
                                className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                            >
                                <td className="px-4 py-3">{formatTime(record.created_at)}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">{record.transaction_number}</td>
                                <td className="px-4 py-3">₱ {Number(record.total_amount).toFixed(2)}</td>
                                <td className="px-4 py-3">₱ {Number(record.amount_paid).toFixed(2)}</td>
                                <td className="px-4 py-3 capitalize">
                                    {(() => {
                                        const statusLower = record.status ? record.status.toLowerCase() : '';
                                        let bgClass = 'bg-yellow-100 text-yellow-800';
                                        if (statusLower === 'completed') bgClass = 'bg-green-100 text-green-800';
                                        else if (statusLower === 'voided' || statusLower === 'partial voided') bgClass = 'bg-red-100 text-red-800';
                                        return (
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgClass}`}>
                                                {record.status || 'Unknown'}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button
                                        onClick={() => handleView(record)}
                                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handlePrint(record)}
                                        className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                                        title="Print Receipt"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {currentRecords.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-6 text-gray-500">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-end items-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {detailLoading ? (
                    <div className="p-4">Loading...</div>
                ) : (
                    <TransactionDetailModal
                        data={modalData}
                        onClose={() => setIsModalOpen(false)}
                        onVoid={(txId, status) => {
                            // Refresh data from server after a short delay to ensure void operation completes
                            setTimeout(() => {
                                fetchTransactions();
                            }, 500);
                            if (modalData && modalData.transaction.transaction_id === txId) {
                                setModalData({
                                    ...modalData,
                                    transaction: { ...modalData.transaction, status: status || 'Voided' }
                                });
                            }
                        }}
                        onRefund={(txId, status) => {
                            // Refresh data from server to ensure we have the latest status
                            fetchTransactions();
                            if (modalData && modalData.transaction.transaction_id === txId) {
                                setModalData({
                                    ...modalData,
                                    transaction: { ...modalData.transaction, status: status || 'Refunded' }
                                });
                            }
                        }}
                    />
                )}
            </Modal>
        </div>
    )
}