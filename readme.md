Tải node , visual , yarn, git , vite
Kiểm tra node version trong terminal : node -v
Trong FE : khởi tạo yarn + vite : yarn create vite ==> đặt tên ==> chọn react ==> chọn javascript và react và nhấn yes
    + chạy Lệnh :   yarn install , yarn dev (nhớ cd đúng thư mục)
                    yarn add -D @eslint/js globals eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh 
                    (nếu lỗi thì trong file package json  xóa dòng này : "babel-plugin-react-compilexr": "..." : r yarn install và câu lệnh trên)
                    yarn lint là kiểm tra lỗi cú pháp , ..., làm clean code 
                   
Trong BE :
                    Chạy lệnh yarn install trước 
                    chạy lệnh trong sql
                    chạy yarn dev , chạy yarn install axios    
                    Chạy lệnh yarn add express cors dotenv mssql cookie-parser jsonwebtoken bcryptjs axios google-auth-library ms http-status-codes cài đặt thư viện
                    ==> chạy test yarn dev                