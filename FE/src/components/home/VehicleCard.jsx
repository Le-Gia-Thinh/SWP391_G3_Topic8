import React from 'react';

const VehicleCard = ({ title, desc, icon, progress }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
      <div className="absolute top-6 right-6 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Cho Phép</div>
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 mb-6 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-blue-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{desc}</p>
      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div className={`bg-blue-600 h-full rounded-full ${progress}`}></div>
      </div>
    </div>
  );
};

export default VehicleCard;
