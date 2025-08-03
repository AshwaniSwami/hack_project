
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function exportToPostgreSQL() {
  console.log('🚀 Starting PostgreSQL Data Export...');
  console.log('=======================================');
  
  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 Found ${tables.length} tables:`, tables.join(', '));
    
    let exportData = {
      database: 'smart_radio_hub',
      exportDate: new Date().toISOString(),
      tables: {},
      schema: {},
      metadata: {
        totalTables: tables.length,
        exportedBy: 'PostgreSQL Export Script'
      }
    };
    
    // Export schema and data for each table
    for (const tableName of tables) {
      console.log(`\n📋 Exporting table: ${tableName}`);
      
      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      exportData.schema[tableName] = schemaResult.rows;
      
      // Get table data
      const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
      exportData.tables[tableName] = {
        rowCount: dataResult.rows.length,
        data: dataResult.rows
      };
      
      console.log(`   ✅ Exported ${dataResult.rows.length} rows`);
    }
    
    // Generate PostgreSQL dump content
    const dumpContent = generatePostgreSQLDump(exportData);
    
    // Save to files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save JSON export
    const jsonFilename = `smart-radio-hub-export-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 JSON export saved: ${jsonFilename}`);
    
    // Save PostgreSQL dump
    const dumpFilename = `smart-radio-hub-dump-${timestamp}.sql`;
    fs.writeFileSync(dumpFilename, dumpContent);
    console.log(`💾 PostgreSQL dump saved: ${dumpFilename}`);
    
    // Generate summary report
    console.log('\n📊 Export Summary:');
    console.log('==================');
    
    for (const [tableName, tableData] of Object.entries(exportData.tables)) {
      console.log(`${tableName}: ${tableData.rowCount} records`);
    }
    
    console.log(`\n🎉 Export completed successfully!`);
    console.log(`📁 Files created:`);
    console.log(`   • ${jsonFilename} (JSON format)`);
    console.log(`   • ${dumpFilename} (PostgreSQL dump)`);
    
    return { jsonFile: jsonFilename, dumpFile: dumpFilename, data: exportData };
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

function generatePostgreSQLDump(exportData) {
  let dump = '';
  
  // Header
  dump += `--\n`;
  dump += `-- PostgreSQL database dump for SMART Radio Content Hub\n`;
  dump += `-- Export Date: ${exportData.exportDate}\n`;
  dump += `-- Total Tables: ${exportData.metadata.totalTables}\n`;
  dump += `--\n\n`;
  
  dump += `SET statement_timeout = 0;\n`;
  dump += `SET lock_timeout = 0;\n`;
  dump += `SET client_encoding = 'UTF8';\n`;
  dump += `SET standard_conforming_strings = on;\n`;
  dump += `SET check_function_bodies = false;\n`;
  dump += `SET xmloption = content;\n`;
  dump += `SET client_min_messages = warning;\n\n`;
  
  // Create tables and insert data
  for (const [tableName, tableData] of Object.entries(exportData.tables)) {
    const schema = exportData.schema[tableName];
    
    dump += `--\n-- Table: ${tableName}\n--\n\n`;
    
    // Create table
    dump += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`;
    const columns = schema.map(col => {
      let def = `    "${col.column_name}" ${col.data_type}`;
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      return def;
    });
    dump += columns.join(',\n');
    dump += `\n);\n\n`;
    
    // Insert data
    if (tableData.rowCount > 0) {
      dump += `--\n-- Data for table: ${tableName}\n--\n\n`;
      
      const columnNames = schema.map(col => `"${col.column_name}"`).join(', ');
      
      for (const row of tableData.data) {
        const values = schema.map(col => {
          const value = row[col.column_name];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          if (typeof value === 'boolean') return value ? 'true' : 'false';
          return value;
        }).join(', ');
        
        dump += `INSERT INTO public."${tableName}" (${columnNames}) VALUES (${values});\n`;
      }
      dump += '\n';
    }
  }
  
  dump += `--\n-- End of dump\n--\n`;
  
  return dump;
}

// Run the export
exportToPostgreSQL()
  .then(result => {
    console.log('\n🎯 Export files ready for Supabase import!');
    console.log('📋 Next steps:');
    console.log('   1. Download the generated .sql file');
    console.log('   2. In Supabase dashboard, go to SQL Editor');
    console.log('   3. Paste the SQL dump content');
    console.log('   4. Execute to recreate your database');
  })
  .catch(error => {
    console.error('Export failed:', error);
    process.exit(1);
  });
