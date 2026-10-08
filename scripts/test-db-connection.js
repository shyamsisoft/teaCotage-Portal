const mssql = require('mssql/msnodesqlv8');

const DRIVERS = [
  'Driver={ODBC Driver 18 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=teacottage_cms;Trusted_Connection=yes;TrustServerCertificate=yes;',
  'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=teacottage_cms;Trusted_Connection=yes;',
  'Driver={SQL Server Native Client 11.0};Server=(localdb)\\MSSQLLocalDB;Database=teacottage_cms;Trusted_Connection=yes;',
  'Driver={SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=teacottage_cms;Trusted_Connection=yes;',
];

async function testConnection() {
  console.log('Testing Node.js native msnodesqlv8 connection to (localdb)\\MSSQLLocalDB...\n');

  for (const connectionString of DRIVERS) {
    try {
      console.log(`Trying Connection String: ${connectionString}`);
      const pool = await mssql.connect({ connectionString });
      const result = await pool.request().query('SELECT id, email, first_name, last_name, global_role FROM users');
      console.log('\n====================================================');
      console.log('🎉 NATIVE LOCALDB CONNECTION SUCCESSFUL!');
      console.log('====================================================');
      console.log('User Records Found:', result.recordset);
      await pool.close();
      return;
    } catch (err) {
      console.log(`Failed with driver: ${err.message}\n`);
    }
  }

  console.error('❌ Could not connect using any ODBC driver.');
}

testConnection();
