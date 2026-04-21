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

  const formatContactPerson = () => {
    if (
      branch.contactPersonFirstName &&
      branch.contactPersonLastName &&
      branch.contactPersonUsername
    ) {
      const contactInfo = `${branch.contactPersonFirstName} ${branch.contactPersonLastName} (${branch.contactPersonUsername})`;
      const contactNumber = branch.contactPersonContactNumber?.trim();
      return contactNumber ? `${contactInfo} - ${contactNumber}` : contactInfo;
    }
    return "No contact person assigned";
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
        <div className="p-4 min-h-[320px]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoItem label="Name" value={branch.name || branch.branchName} />
            <InfoItem label="Contact Person" value={formatContactPerson()} />
            <InfoItem label="Location" value={branch.locationText || "No saved location"} />
            <InfoItem label="Operating Days" value={
              branch.operatingDays && branch.operatingDays.length > 0
                ? Array.isArray(branch.operatingDays)
                  ? branch.operatingDays.join(", ")
                  : branch.operatingDays
                : "--"
            } />
            <InfoItem label="Opening Time" value={formatTime(branch.openingTime)} />
            <InfoItem label="Closing Time" value={formatTime(branch.closingTime)} />
            <InfoItem label="Status" value={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                branch.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {branch.status === 'active' ? 'Active' : 'Deactivated'}
              </span>
            } />
            <InfoItem label="Created By" value={branch.createdBy || "--"} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
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
