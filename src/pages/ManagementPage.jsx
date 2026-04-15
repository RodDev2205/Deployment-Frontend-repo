import React, {useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Store, UserCircle, Users } from 'lucide-react';
import BranchList from '../components/management/BranchList';
import EmployeeTable from '../components/management/EmployeeTable';

export default function ManagementPage() {
    const { branches = [], admins = [], cashiers = [] } = useOutletContext() || {};
    const [activeTab, setActiveTab] = useState('branches');

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('branches')}
                            className={`py-4 border-b-2 font-medium text-sm ${
                                activeTab === 'branches'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Store className="w-4 h-4 inline mr-2" />
                            Branch Management
                        </button>
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`py-4 border-b-2 font-medium text-sm ${
                                activeTab === 'admins'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <UserCircle className="w-4 h-4 inline mr-2" />
                            Admin Management
                        </button>
                        <button
                            onClick={() => setActiveTab('cashiers')}
                            className={`py-4 border-b-2 font-medium text-sm ${
                                activeTab === 'cashiers'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Cashier Management
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'branches' && <BranchList branches={branches} />}
                    {activeTab === 'admins' && <EmployeeTable employees={admins} type="Admin" />}
                    {activeTab === 'cashiers' && <EmployeeTable employees={cashiers} type="Cashier" />}
                </div>
            </div>
        </div>
        </div>
    );
}