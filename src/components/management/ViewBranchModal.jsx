import { useState, useEffect } from "react";
import { X, MapPin, Clipboard, Calendar, Clock, AlertCircle } from "lucide-react";
import API_BASE_URL from '../../config/api';

export default function ViewBranchModal({ isOpen, onClose, branch }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch schedule data
  useEffect(() => {
    if (isOpen && branch?.branch_id) {
      fetchScheduleData();
    }
  }, [isOpen, branch?.branch_id]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No token found");
        return;
      }

      console.log("🔄 Fetching schedule data for branch:", branch.branch_id);

      const res = await fetch(
        `${API_BASE_URL}/api/branch-schedule/schedule-info/${branch.branch_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("📡 Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Schedule data received:", data);
        setScheduleData(data);
      } else {
        console.warn("⚠️ Failed to fetch schedule data:", res.status);
      }
    } catch (error) {
      console.error("❌ Error fetching schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===== Conditional render after hooks =====
  if (!isOpen || !branch) return null;

  // ===== Helper Functions =====
  const formatTime = (timeString) => {
    if (!timeString) return "--";
    const date = new Date(`1970-01-01T${timeString}`);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const getAddress = () => {
    return branch.address || branch.locationText || "No address available";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {branch.name || branch.branchName}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} />
              {getAddress()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Section 1: Basic Details */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clipboard size={20} className="text-gray-800" />
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Branch Name" value={branch.name || branch.branchName} />
              <InfoItem label="Address" value={getAddress()} />
              <InfoItem label="Contact Person" value={formatContactPerson()} />
              <InfoItem
                label="Status"
                value={
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      branch.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {branch.status === "active" ? "Active" : "Deactivated"}
                  </span>
                }
              />
              <InfoItem label="Created By" value={branch.createdBy || "--"} />
            </div>
          </div>

          {/* Section 2: Operating Period */}
          {scheduleData?.operatingPeriod && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-gray-800" />
                <h3 className="text-lg font-semibold text-gray-800">Operating Period</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem
                  label="Start Date"
                  value={formatDate(scheduleData.operatingPeriod.start_date)}
                />
                <InfoItem
                  label="End Date"
                  value={
                    scheduleData.operatingPeriod.end_date
                      ? formatDate(scheduleData.operatingPeriod.end_date)
                      : "Indefinite"
                  }
                />
              </div>
            </div>
          )}

          {/* Section 3: Weekly Schedule */}
          {scheduleData?.weeklySchedule && scheduleData.weeklySchedule.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-gray-800" />
                <h3 className="text-lg font-semibold text-gray-800">Weekly Schedule</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Day
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Opening Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Closing Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.weeklySchedule.map((schedule, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {schedule.day_of_week}
                        </td>
                        <td className="px-4 py-3">
                          {schedule.is_closed ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Open
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {schedule.is_closed ? "--" : formatTime(schedule.open_time)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {schedule.is_closed ? "--" : formatTime(schedule.close_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Special Closures */}
          {scheduleData?.closures && scheduleData.closures.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-gray-800" />
                <h3 className="text-lg font-semibold text-gray-800">Special Closures</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.closures.map((closure) => (
                  <div
                    key={closure.closure_id}
                    className="rounded-lg border border-gray-200 bg-orange-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {formatDate(closure.start_date)} to{" "}
                          {formatDate(closure.end_date)}
                        </p>
                        {closure.reason && (
                          <p className="text-sm text-gray-600">
                            Reason: {closure.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Schedule Data */}
          {!loading && !scheduleData && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
              <p>No scheduling information available for this branch.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-800">
        {value || "--"}
      </p>
    </div>
  );
}
