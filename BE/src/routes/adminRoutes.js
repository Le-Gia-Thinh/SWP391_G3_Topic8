import express from 'express';
import { isAuthorized, isAdmin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(isAuthorized, isAdmin);

// Stats
router.get('/stats', adminController.getStats);

// Roles
router.get('/roles', adminController.getRoles);

// Users
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Permissions
router.get('/permissions', adminController.getPermissions);
router.get('/role-permissions', adminController.getRolePermissions);
router.put('/roles/:id/permissions', adminController.updateRolePermissions);

// Buildings
router.get('/buildings', adminController.getBuildings);
router.post('/buildings', adminController.createBuilding);
router.patch('/buildings/:id', adminController.updateBuilding);
router.delete('/buildings/:id', adminController.deleteBuilding);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
