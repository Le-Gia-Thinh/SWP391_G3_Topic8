const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages', 'staff');
// We already did StaffCheckIn and StaffCreateIncident
const skipFiles = ['StaffCheckIn.jsx', 'StaffCreateIncident_refactored.jsx'];

fs.readdir(directoryPath, (err, files) => {
    if (err) return console.log('Unable to scan directory: ' + err); 

    files.forEach((file) => {
        if (!file.endsWith('.jsx') || skipFiles.includes(file)) return;
        const filePath = path.join(directoryPath, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Layout Containers
        content = content.replace(/rounded-xl/g, 'rounded-3xl');
        content = content.replace(/shadow-sm/g, 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]');
        content = content.replace(/border-gray-200/g, 'border-slate-100');
        content = content.replace(/border-gray-100/g, 'border-slate-50');
        
        // Colors
        content = content.replace(/gray-/g, 'slate-');
        
        // Buttons
        content = content.replace(/rounded-lg/g, 'rounded-xl');
        content = content.replace(/bg-blue-600 text-white/g, 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40');
        content = content.replace(/bg-orange-600 text-white/g, 'bg-orange-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/40');
        content = content.replace(/bg-emerald-600 text-white/g, 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40');
        content = content.replace(/bg-red-600 text-white/g, 'bg-red-600 text-white shadow-md shadow-red-500/20 hover:shadow-red-500/40');
        
        // Typography & Spacing
        content = content.replace(/text-gray-500/g, 'text-slate-500 font-medium');
        content = content.replace(/text-gray-700/g, 'text-slate-700 font-bold');
        content = content.replace(/text-gray-800/g, 'text-slate-800 font-black');

        // Add some backdrop blur to fixed footers
        content = content.replace(/bg-white border-t/g, 'bg-white/80 backdrop-blur-xl border-t');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Refactored ${file}`);
    });
});
