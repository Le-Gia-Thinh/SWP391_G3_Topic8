INSERT INTO Users (
    FullName, Email, PasswordHash, RoleID, 
    IsActive, IsEmailVerified
)
VALUES (
    N'Khách Vãng Lai', 
    'walkin.guest@system.local', 
    NULL, 
    1,
    1, 1
);

SELECT UserID, FullName, Email FROM Users 
WHERE Email = 'walkin.guest@system.local';