import React from 'react';

const StatCard = ({ label, value, unit, icon }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{unit}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-blue-600">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
