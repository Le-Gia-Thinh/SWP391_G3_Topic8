const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'src', 'pages', 'manager'),
    path.join(__dirname, 'src', 'pages', 'admin')
];

dirs.forEach(directoryPath => {
    fs.readdir(directoryPath, (err, files) => {
        if (err) return console.log('Unable to scan directory: ' + err); 

        files.forEach((file) => {
            if (!file.endsWith('.jsx')) return;
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // --- Layout Containers ---
            content = content.replace(/rounded-xl/g, 'rounded-3xl');
            content = content.replace(/shadow-sm/g, 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]');
            content = content.replace(/border-gray-200/g, 'border-slate-100');
            content = content.replace(/border-gray-100/g, 'border-slate-50');
            
            // --- Colors ---
            // Carefully replace gray- to slate- without breaking existing classes that use slate-
            content = content.replace(/text-gray-/g, 'text-slate-');
            content = content.replace(/bg-gray-/g, 'bg-slate-');
            content = content.replace(/border-gray-/g, 'border-slate-');
            content = content.replace(/hover:bg-gray-/g, 'hover:bg-slate-');
            content = content.replace(/ring-gray-/g, 'ring-slate-');
            content = content.replace(/shadow-gray-/g, 'shadow-slate-');
            content = content.replace(/from-gray-/g, 'from-slate-');
            content = content.replace(/to-gray-/g, 'to-slate-');
            
            // --- Buttons ---
            content = content.replace(/rounded-lg/g, 'rounded-xl');
            // Prevent double-replacing glowing buttons if script runs twice
            content = content.replace(/bg-blue-600 text-white(?![^"]*shadow-md)/g, 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40');
            content = content.replace(/bg-orange-600 text-white(?![^"]*shadow-md)/g, 'bg-orange-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/40');
            content = content.replace(/bg-emerald-600 text-white(?![^"]*shadow-md)/g, 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40');
            content = content.replace(/bg-red-600 text-white(?![^"]*shadow-md)/g, 'bg-red-600 text-white shadow-md shadow-red-500/20 hover:shadow-red-500/40');
            
            // --- Typography & Spacing ---
            // Try not to double-replace by checking for font-weight
            content = content.replace(/text-slate-500(?! font-)/g, 'text-slate-500 font-medium');
            content = content.replace(/text-slate-700(?! font-)/g, 'text-slate-700 font-bold');
            content = content.replace(/text-slate-800(?! font-)/g, 'text-slate-800 font-black');

            // --- Tables / Cards ---
            // Add hover effect to table rows
            content = content.replace(/className="hover:bg-slate-50"/g, 'className="hover:bg-slate-50/60 transition-colors"');
            content = content.replace(/className="hover:bg-slate-50 transition-colors"/g, 'className="hover:bg-slate-50/60 transition-colors"');

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Refactored ${file}`);
        });
    });
});
