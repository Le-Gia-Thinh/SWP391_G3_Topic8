import { getPool, sql } from './src/config/db.js';
import fs from 'fs';

async function getSchema() {
  const pool = await getPool();
  try {
    const result = await pool.request().query(`
      SELECT 
        t.name AS TableName,
        c.name AS ColumnName,
        ty.name AS DataType,
        c.max_length AS MaxLength,
        c.is_identity AS IsIdentity,
        c.is_nullable AS IsNullable
      FROM sys.tables t
      INNER JOIN sys.columns c ON t.object_id = c.object_id
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      ORDER BY t.name, c.column_id
    `);
    
    const fks = await pool.request().query(`
      SELECT 
        fk.name AS FK_Name,
        tp.name AS ParentTable,
        cp.name AS ParentColumn,
        tr.name AS ReferencedTable,
        cr.name AS ReferencedColumn
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
      INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
      INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
      INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    `);
    
    fs.writeFileSync('schema.json', JSON.stringify({ tables: result.recordset, fks: fks.recordset }, null, 2));
    console.log("Schema saved to schema.json");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
getSchema();
