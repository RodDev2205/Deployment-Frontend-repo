import { X } from "lucide-react";

export default function ViewBranchModal({ isOpen, onClose, branch }) {


  // ===== Conditional render after hooks =====
  if (!isOpen || !branch) return null;

  // ===== Helper =====
  const formatTime = (timeString) => {
    if (!timeString) return "--";
    const date = new Date(`1970-01-01T${timeString}`);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {branch.name || branch.branchName}
            </h2>
            <p className="text-sm text-gray-500">{branch.address}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500"
          >
            <X size={22} />
          </button>
        </div>

        {/* Heading */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">Branch Details</h3>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoItem label="Name" value={branch.name || branch.branchName} />
            <InfoItem label="Contact Number" value={branch.contact} />
            <InfoItem label="Address" value={branch.address} />
            <InfoItem label="Opening Time" value={formatTime(branch.openingTime)} />
            <InfoItem label="Closing Time" value={formatTime(branch.closingTime)} />
            <InfoItem label="Status" value={branch.status || "Active"} />
            <InfoItem label="Created By" value={branch.createdBy || "--"} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{value || "--"}</p>
    </div>
  );
}
