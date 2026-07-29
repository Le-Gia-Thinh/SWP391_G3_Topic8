import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

let mermaid = 'erDiagram\n';

const tables = {};
for (const col of schema.tables) {
  if (!tables[col.TableName]) {
    tables[col.TableName] = [];
  }
  tables[col.TableName].push(col);
}

for (const tableName in tables) {
  mermaid += `    ${tableName} {\n`;
  for (const col of tables[tableName]) {
    let type = col.DataType;
    if (col.MaxLength > 0) type += `_${col.MaxLength}`;
    let pk = col.IsIdentity ? ' PK' : '';
    mermaid += `        ${type} ${col.ColumnName}${pk}\n`;
  }
  mermaid += `    }\n`;
}

if (schema.fks) {
  const printed = new Set();
  for (const fk of schema.fks) {
    const rel = `    ${fk.ReferencedTable} ||--o{ ${fk.ParentTable} : "${fk.ParentColumn}"\n`;
    if (!printed.has(rel)) {
      mermaid += rel;
      printed.add(rel);
    }
  }
}

fs.writeFileSync('mermaid.txt', mermaid);
console.log("Mermaid diagram saved to mermaid.txt");
