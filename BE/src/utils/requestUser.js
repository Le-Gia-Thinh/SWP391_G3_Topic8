export function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

export function getRoleNameFromToken(req) {
  return req.user?.RoleName || req.user?.roleName;
}