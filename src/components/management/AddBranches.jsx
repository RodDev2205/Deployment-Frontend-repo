import { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';
import { ChevronDown, X, Plus, Trash2, Zap, Calendar } from "lucide-react";

// Format date to display only date (YYYY-MM-DD format)
const formatDate = (dateString) => {
  if (!dateString) return "";
  // If already in YYYY-MM-DD format, return as-is
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  // Otherwise parse and format
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid
  return date.toISOString().split('T')[0];
};

export default function AddBranchModal({ isOpen, onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState(null);
  const { success, error: alertError } = useAlert();

  // Basic Info
  const [branchName, setBranchName] = useState("");
  const [location, setLocation] = useState("");

  // Operating Period
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Weekly Schedule
  const [weeklySchedule, setWeeklySchedule] = useState({
    Monday: { open_time: "", close_time: "", is_closed: false },
    Tuesday: { open_time: "", close_time: "", is_closed: false },
    Wednesday: { open_time: "", close_time: "", is_closed: false },
    Thursday: { open_time: "", close_time: "", is_closed: false },
    Friday: { open_time: "", close_time: "", is_closed: false },
    Saturday: { open_time: "", close_time: "", is_closed: false },
    Sunday: { open_time: "", close_time: "", is_closed: true },
  });

  // Special Closures
  const [closures, setClosures] = useState([]);
  const [newClosure, setNewClosure] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleScheduleChange = (day, field, value) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === "is_closed" ? !prev[day][field] : value,
      },
    }));
  };

  const addClosure = () => {
    if (!newClosure.startDate || !newClosure.endDate) {
      alertError("Validation Error", "Please enter start and end dates");
      return;
    }
    setClosures([...closures, { ...newClosure, id: Date.now() }]);
    setNewClosure({ startDate: "", endDate: "", reason: "" });
  };

  const removeClosure = (id) => {
    setClosures(closures.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!branchName.trim()) {
      alertError("Validation Error", "Please enter branch name");
      return;
    }

    if (!location.trim()) {
      alertError("Validation Error", "Please enter location");
      return;
    }

    if (!startDate) {
      alertError("Validation Error", "Please enter operating start date");
      return;
    }

    // Check if at least one day has opening hours
    const hasSchedule = Object.values(weeklySchedule).some(
      (day) => !day.is_closed && day.open_time && day.close_time
    );

    if (!hasSchedule) {
      alertError("Validation Error", "Please set operating hours for at least one day");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Step 1: Create branch
      const branchRes = await fetch(`${API_BASE_URL}/api/branches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchName,
          address: location,
          openingTime: Object.values(weeklySchedule).find(
            (d) => !d.is_closed && d.open_time
          )?.open_time || "09:00",
          closingTime: Object.values(weeklySchedule).find(
            (d) => !d.is_closed && d.close_time
          )?.close_time || "18:00",
        }),
      });

      const branchData = await branchRes.json();

      if (!branchRes.ok) {
        alertError("Error", branchData.message || "Failed to create branch");
        return;
      }

      const newBranchId = branchData.branchId || branchData.branch?.branch_id;
      setBranchId(newBranchId);

      // Step 2: Set operating period
      if (startDate) {
        console.log("📅 Setting operating period:", { startDate, endDate });
        const periodRes = await fetch(`${API_BASE_URL}/api/branch-schedule/operating-period`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branchId: newBranchId,
            startDate: startDate,
            endDate: endDate && endDate.trim() ? endDate : null,
          }),
        });

        const periodData = await periodRes.json();
        console.log("Operating period response:", periodData);

        if (!periodRes.ok) {
          alertError("Operating Period Error", periodData.error || "Failed to set operating period");
          return;
        }
      }

      // Step 3: Set weekly schedule
      const scheduleData = days.map((day) => ({
        dayOfWeek: day,
        ...weeklySchedule[day],
      }));

      console.log("📅 Sending schedule data:", JSON.stringify(scheduleData, null, 2));

      const scheduleRes = await fetch(`${API_BASE_URL}/api/branch-schedule/weekly-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchId: newBranchId,
          schedules: scheduleData,
        }),
      });

      const scheduleResData = await scheduleRes.json();
      console.log("Schedule response:", scheduleResData);

      if (!scheduleRes.ok) {
        alertError("Schedule Error", scheduleResData.error || "Failed to save schedule");
        return;
      }

      // Step 4: Add special closures
      for (const closure of closures) {
        await fetch(`${API_BASE_URL}/api/branch-schedule/closures`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branchId: newBranchId,
            startDate: closure.startDate,
            endDate: closure.endDate,
            reason: closure.reason || null,
          }),
        });
      }

      success("Branch Created", "Branch and schedule created successfully ✅");

      if (onSubmit) {
        onSubmit(branchData.branch);
      }

      // Reset form
      resetForm();
      onClose();

    } catch (err) {
      console.error(err);
      alertError("Server Error", "An error occurred while creating branch");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBranchName("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setClosures([]);
    setNewClosure({ startDate: "", endDate: "", reason: "" });
    setActiveTab("basic");
    setWeeklySchedule({
      Monday: { open_time: "", close_time: "", is_closed: false },
      Tuesday: { open_time: "", close_time: "", is_closed: false },
      Wednesday: { open_time: "", close_time: "", is_closed: false },
      Thursday: { open_time: "", close_time: "", is_closed: false },
      Friday: { open_time: "", close_time: "", is_closed: false },
      Saturday: { open_time: "", close_time: "", is_closed: false },
      Sunday: { open_time: "", close_time: "", is_closed: true },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900">Add New Branch</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-8">
          {[
            { id: "basic", label: "Basic Info" },
            { id: "operating", label: "Operating Period" },
            { id: "schedule", label: "Weekly Schedule" },
            { id: "closures", label: "Special Closures" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter branch name"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Location
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Enter the branch address or location details
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Zamboanga City, Zamboanga del Sur, Philippines"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
            )}

            {/* Operating Period Tab */}
            {activeTab === "operating" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Operating Start Date
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    When does this branch start operations?
                  </p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Operating End Date (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave empty if branch operates indefinitely
                  </p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
            )}

            {/* Weekly Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                {/* Bulk Time Setting */}
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={20} className="text-blue-900" />
                    <h4 className="font-semibold text-blue-900">Quick Set: Apply Same Time to Multiple Days</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Open Time
                      </label>
                      <input
                        type="time"
                        id="bulkOpenTime"
                        defaultValue="09:00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Close Time
                      </label>
                      <input
                        type="time"
                        id="bulkCloseTime"
                        defaultValue="18:00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Select Days
                      </label>
                      <select
                        id="bulkDays"
                        multiple
                        defaultValue={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          const openTime = document.getElementById("bulkOpenTime").value;
                          const closeTime = document.getElementById("bulkCloseTime").value;
                          const selectedDays = Array.from(
                            document.getElementById("bulkDays").selectedOptions,
                            (option) => option.value
                          );

                          if (!openTime || !closeTime) {
                            alertError("Error", "Please set open and close times");
                            return;
                          }

                          const newSchedule = { ...weeklySchedule };
                          selectedDays.forEach((day) => {
                            newSchedule[day] = {
                              open_time: openTime,
                              close_time: closeTime,
                              is_closed: false,
                            };
                          });
                          setWeeklySchedule(newSchedule);
                          success("Applied!", `Successfully applied to ${selectedDays.join(", ")}`);
                        }}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                      >
                        Apply to Days
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual Day Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-gray-900" />
                    <h4 className="font-semibold text-gray-900">Individual Day Settings</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Adjust times for specific days or mark as closed
                  </p>
                  {days.map((day) => (
                    <div
                      key={day}
                      className="flex items-end gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                      <div className="flex-shrink-0 w-28">
                        <p className="font-semibold text-gray-800">{day}</p>
                      </div>

                      <label className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={weeklySchedule[day].is_closed}
                          onChange={() =>
                            handleScheduleChange(day, "is_closed", null)
                          }
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Closed</span>
                      </label>

                      {!weeklySchedule[day].is_closed && (
                        <>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Opens At
                            </label>
                            <input
                              type="time"
                              value={weeklySchedule[day].open_time}
                              onChange={(e) =>
                                handleScheduleChange(day, "open_time", e.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Closes At
                            </label>
                            <input
                              type="time"
                              value={weeklySchedule[day].close_time}
                              onChange={(e) =>
                                handleScheduleChange(day, "close_time", e.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                          </div>
                        </>
                      )}

                      {weeklySchedule[day].is_closed && (
                        <div className="flex-1 text-center">
                          <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded">
                            Branch Closed
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Closures Tab */}
            {activeTab === "closures" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-900">
                    Add Special Closure Period
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="date"
                      value={newClosure.startDate}
                      onChange={(e) =>
                        setNewClosure({ ...newClosure, startDate: e.target.value })
                      }
                      placeholder="Start Date"
                      className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                    <input
                      type="date"
                      value={newClosure.endDate}
                      onChange={(e) =>
                        setNewClosure({ ...newClosure, endDate: e.target.value })
                      }
                      placeholder="End Date"
                      className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                    <input
                      type="text"
                      value={newClosure.reason}
                      onChange={(e) =>
                        setNewClosure({ ...newClosure, reason: e.target.value })
                      }
                      placeholder="Reason (e.g., Holiday, Maintenance)"
                      className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addClosure}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors"
                  >
                    <Plus size={16} /> Add Closure
                  </button>
                </div>

                {/* List of closures */}
                {closures.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Closure Periods
                    </label>
                    {closures.map((closure) => (
                      <div
                        key={closure.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(closure.startDate)} to {formatDate(closure.endDate)}
                          </p>
                          {closure.reason && (
                            <p className="text-xs text-gray-600">{closure.reason}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeClosure(closure.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-8 py-6 bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Branch"}
          </button>
        </div>
      </div>
    </div>
  );
}