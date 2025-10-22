import React from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEye, FiCreditCard, FiSettings } from 'react-icons/fi';

const UserProfile = () => {
  // Sample user data - in real app, this would come from props or context
  const userData = {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, Suite 45, New York, NY 10001",
    joinDate: "January 15, 2022",
    membership: "Premium",
    prescription: {
      right: "-2.50",
      left: "-2.75",
      pd: "62mm"
    },
    billing: {
      method: "Credit Card",
      lastPayment: "March 15, 2024"
    }
  };

  return (
    <div className=" bg-white py-8 px-4 sm:px-6 lg:px-8 shadow-sm rounded-md">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                <FiUser className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{userData.name}</h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <FiMail className="w-4 h-4 mr-2" />
                  {userData.email}
                </p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              {userData.membership}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiUser className="w-5 h-5 mr-2 text-gray-600" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <FiPhone className="w-4 h-4 mr-3 text-gray-500" />
                <span>{userData.phone}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <FiMapPin className="w-4 h-4 mr-3 text-gray-500" />
                <span>{userData.address}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <FiCalendar className="w-4 h-4 mr-3 text-gray-500" />
                <span>Member since {userData.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiEye className="w-5 h-5 mr-2 text-gray-600" />
              Prescription Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Right Eye</p>
                <p className="text-lg font-semibold text-gray-800">{userData.prescription.right}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Left Eye</p>
                <p className="text-lg font-semibold text-gray-800">{userData.prescription.left}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg col-span-2">
                <p className="text-sm text-gray-600">Pupillary Distance</p>
                <p className="text-lg font-semibold text-gray-800">{userData.prescription.pd}</p>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiCreditCard className="w-5 h-5 mr-2 text-gray-600" />
              Billing Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-800">{userData.billing.method}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Last Payment</span>
                <span className="font-medium text-gray-800">{userData.billing.lastPayment}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-medium text-gray-800">Monthly</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiSettings className="w-5 h-5 mr-2 text-gray-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors duration-200">
                Update Prescription
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors duration-200">
                Payment Methods
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors duration-200">
                Order History
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors duration-200">
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="text-gray-800">Prescription Updated</p>
                <p className="text-sm text-gray-500">March 10, 2024</p>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Completed</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="text-gray-800">Monthly Payment</p>
                <p className="text-sm text-gray-500">March 1, 2024</p>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Paid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;