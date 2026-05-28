// src/services/crudService.js

import { getPool, sql } from "../config/db.js";

const allowed = {
  roles: "Roles",
  permissions: "Permissions",
  rolePermissions: "RolePermissions",
  users: "Users",
  vehicleTypes: "VehicleTypes",
  pricingPolicies: "PricingPolicies",
  buildings: "Buildings",
  floors: "Floors",
  zones: "Zones",
  parkingSlots: "ParkingSlots",
  parkingSessions: "ParkingSessions",
  payments: "Payments",
  reservations: "Reservations",
  incidents: "Incidents",
  feedbacks: "Feedbacks",
};

export function tableName(key) {
  const name = allowed[key];
  if (!name) throw Object.assign(new Error("Invalid table"), { status: 400 });
  return name;
}

export async function list(key) {
  const pool = await getPool();
  const result = await pool.request()
    .query(`SELECT * FROM ${tableName(key)} ORDER BY 1 DESC`);
  return result.recordset;
}

export async function getById(key, idColumn, id) {
  const pool = await getPool();
  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM ${tableName(key)} WHERE ${idColumn}=@id`);
  return result.recordset[0];
}