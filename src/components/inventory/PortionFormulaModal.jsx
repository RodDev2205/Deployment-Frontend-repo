import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useAlert } from "@/context/AlertContext";

const PortionFormulaModal = ({ portion, inventory, onSave, onClose }) => {
  const [portionName, setPortionName] = useState("");
  const { error: alertError } = useAlert();
  const [formula, setFormula] = useState([]); // [{ raw_item_id, qty }]

  // Pre-fill fields if editing
  useEffect(() => {
    if (portion) {
      setPortionName(portion.portion_name || "");
      setFormula(
        portion.formula?.map((f) => ({
          raw_item_id: f.raw_item_id,
          qty: f.qty,
        })) || []
      );
    } else {
      setPortionName("");
      setFormula([]);
    }
  }, [portion]);

  // Add ingredient to formula
  const addIngredient = () => {
    setFormula([...formula, { raw_item_id: inventory[0]?.raw_item_id || null, qty: 0 }]);
  };

  // Remove ingredient
  const removeIngredient = (index) => {
    setFormula(formula.filter((_, i) => i !== index));
  };

  // Update ingredient
  const updateIngredient = (index, key, value) => {
    const newFormula = [...formula];
    if (key === "qty") value = parseFloat(value) || 0;
    newFormula[index][key] = value;
    setFormula(newFormula);
  };

  // Save handler
  const saveHandler = () => {
    if (!portionName) {
      alertError("Validation", "Portion name is required!");
      return;
    }
    if (formula.length === 0) {
      alertError("Validation", "Add at least one ingredient!");
      return;
    }
    onSave({ portion_name: portionName, formula });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/20 z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {portion ? "Edit Portion Formula" : "Add Portion Formula"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Portion Name"
            value={portionName}
            onChange={(e) => setPortionName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="space-y-3">
          {formula.map((f, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={f.raw_item_id}
                onChange={(e) => updateIngredient(index, "raw_item_id", parseInt(e.target.value))}
                className="flex-1 px-2 py-1 border rounded-lg"
              >
                {inventory.map((i) => (
                  <option key={i.raw_item_id} value={i.raw_item_id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={f.qty}
                onChange={(e) => updateIngredient(index, "qty", e.target.value)}
                placeholder="Qty"
                className="w-20 px-2 py-1 border rounded-lg"
              />
              <button
                className="text-red-600"
                onClick={() => removeIngredient(index)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addIngredient}
          className="mt-3 flex items-center gap-2 text-green-700 font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Ingredient
        </button>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={saveHandler}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortionFormulaModal;
