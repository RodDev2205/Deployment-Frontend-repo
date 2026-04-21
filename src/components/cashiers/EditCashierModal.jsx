import React, { useState } from 'react';

export default function EditCashierModal({ cashier, onClose, onSave }) {
    const [formData, setFormData] = useState({ 
        ...cashier,
        first_name: cashier.first_name || '',
        middle_name: cashier.middle_name || '',
        last_name: cashier.last_name || '',
        username: cashier.username || '',
        contact_number: cashier.contact_number || ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-lg w-96">
                <h3 className="text-xl font-bold mb-4">Edit Cashier Details</h3>
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white/40 backdrop-blur-sm" required />
                    <input type="text" name="middle_name" placeholder="Middle Initial" value={formData.middle_name} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white/40 backdrop-blur-sm" />
                    <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white/40 backdrop-blur-sm" required />
                    <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white/40 backdrop-blur-sm" required />
                    <input type="tel" name="contact_number" placeholder="Contact Number" value={formData.contact_number} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white/40 backdrop-blur-sm" />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" className="px-4 py-2 bg-gray-200 rounded-lg" onClick={onClose}>Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
