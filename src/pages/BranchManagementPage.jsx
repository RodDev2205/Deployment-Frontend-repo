import React from 'react';
import { useOutletContext } from 'react-router-dom';
import BranchList from '../components/management/BranchList';

export default function BranchManagementPage() {
    const { branches = [] } = useOutletContext() || {};

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Branch Management</h1>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <BranchList branches={branches} />
                </div>
            </div>
        </div>
    );
}
