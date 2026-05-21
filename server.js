const express = require('express');

const app = express();
const PORT = 3000;

// Cho phép server đọc dữ liệu JSON từ request body
app.use(express.json());

// Route test
app.get('/', (req, res) => {
    res.send('SWP391 backend is running');
});

// Chạy server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});