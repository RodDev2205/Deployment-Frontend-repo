import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function AddNewCashierForm({ onAddCashier }) {
    const [formData, setFormData] = useState({ 
        first_name: '', 
        last_name: '', 
        username: '', 
        password: '',
        contact_number: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newCashier = {
            id: Date.now(),
            ...formData,
            role: 'Cashier',      // Automatically set role
            status: 'Active',
            lastLogin: 'Never',
        };
        onAddCashier(newCashier);
        setFormData({ first_name: '', last_name: '', username: '', password: '', contact_number: '' });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
            <h3 className="text-xl font-bold text-[#1B5E20] mb-4 flex items-center">
                <UserPlus className="w-5 h-5 mr-2" /> Register New Cashier Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                    type="text" 
                    name="first_name" 
                    placeholder="First Name" 
                    value={formData.first_name} 
                    onChange={handleChange} 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
                    required 
                />
                <input 
                    type="text" 
                    name="last_name" 
                    placeholder="Last Name" 
                    value={formData.last_name} 
                    onChange={handleChange} 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
                    required 
                />
                <input 
                    type="text" 
                    name="username" 
                    placeholder="Username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
                    required 
                />
                <div className="relative">
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" 
                        placeholder="Initial Password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        className="p-3 pr-11 w-full border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
                        required 
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-900"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <input 
                    type="tel" 
                    name="contact_number" 
                    placeholder="Contact Number (Optional)" 
                    value={formData.contact_number} 
                    onChange={handleChange} 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
                />
            </div>

            <button 
                type="submit" 
                className="mt-4 px-6 py-3 bg-[#1B5E20] text-white font-semibold rounded-lg shadow-md hover:bg-[#33691E] transition duration-200"
            >
                Create Cashier Account
            </button>
        </form>
    );
}
