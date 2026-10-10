# LocalDB PowerShell Native Windows Seeder Script
# Uses System.Data.SqlClient to natively seed (localdb)\MSSQLLocalDB

$server = "(localdb)\MSSQLLocalDB"
$database = "teacottage_cms"
$masterConnStr = "Server=$server;Database=master;Integrated Security=True;TrustServerCertificate=True"
$dbConnStr = "Server=$server;Database=$database;Integrated Security=True;TrustServerCertificate=True"

Write-Host "Seeding CMS Admin Portal database in (localdb)\MSSQLLocalDB..." -ForegroundColor Cyan

try {
    # 1. Connect to Master and Create Database if Not Exists
    $masterConn = New-Object System.Data.SqlClient.SqlConnection($masterConnStr)
    $masterConn.Open()

    $createDbSql = "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$database') BEGIN CREATE DATABASE [$database]; END"
    $cmd = New-Object System.Data.SqlClient.SqlCommand($createDbSql, $masterConn)
    $cmd.ExecuteNonQuery() | Out-Null
    $masterConn.Close()

    Write-Host "Database [$database] created/verified in (localdb)\MSSQLLocalDB." -ForegroundColor Green

    # 2. Connect to teacottage_cms and Create Tables
    $dbConn = New-Object System.Data.SqlClient.SqlConnection($dbConnStr)
    $dbConn.Open()

    $createTablesSql = @"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sites')
BEGIN
    CREATE TABLE sites (
        id CHAR(36) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        global_role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
        mfa_enabled BIT NOT NULL DEFAULT 0,
        failed_login_attempts INT NOT NULL DEFAULT 0,
        locked_until DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
BEGIN
    CREATE TABLE user_sessions (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        session_token_hash VARCHAR(255) NOT NULL,
        client_ip VARCHAR(50) NULL,
        user_agent VARCHAR(500) NULL,
        expires_at DATETIME2 NOT NULL,
        is_revoked BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
ELSE IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('user_sessions') AND name = 'is_revoked')
BEGIN
    ALTER TABLE user_sessions ADD is_revoked BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'admin_audit_logs')
BEGIN
    CREATE TABLE admin_audit_logs (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NULL,
        event_type VARCHAR(100) NOT NULL,
        ip_address VARCHAR(50) NULL,
        user_agent VARCHAR(500) NULL,
        metadata NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE roles (
        id CHAR(36) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_site_roles')
BEGIN
    CREATE TABLE user_site_roles (
        user_id CHAR(36) NOT NULL,
        site_id CHAR(36) NOT NULL,
        role_id CHAR(36) NOT NULL,
        PRIMARY KEY (user_id, site_id, role_id)
    );
END
"@
    $cmd = New-Object System.Data.SqlClient.SqlCommand($createTablesSql, $dbConn)
    $cmd.ExecuteNonQuery() | Out-Null

    # 3. Seed Default Admin User & Default Site
    $siteId = "00000000-0000-0000-0000-000000000001"
    $userId = "00000000-0000-0000-0000-000000000001"
    $email = "admin@teacottage.com"
    $hash = '$argon2id$v=19$m=65536,t=3,p=4$XtyB88gawXmwO9ysEy3kng$Ym/RPJ6elcPypbuJ4gdpjBQN7UHwe4z/L4NfCFBte2Q'

    $seedSql = @"
IF NOT EXISTS (SELECT * FROM sites WHERE id = '$siteId')
BEGIN
    INSERT INTO sites (id, slug, name, domain) VALUES ('$siteId', 'tea-cottage', 'Tea Cottage Website', 'teacottage.com');
END

IF NOT EXISTS (SELECT * FROM users WHERE email = '$email')
BEGIN
    INSERT INTO users (id, email, password_hash, first_name, last_name, status, global_role)
    VALUES ('$userId', '$email', '$hash', 'Super', 'Admin', 'ACTIVE', 'SUPER_ADMIN');
END
ELSE
BEGIN
    UPDATE users SET password_hash = '$hash', failed_login_attempts = 0, locked_until = NULL WHERE email = '$email';
END

IF NOT EXISTS (SELECT * FROM user_sessions WHERE session_token_hash = '5d409094f923e4f3054f15560b299e90098f62fa227091c0683ecf039a0fa065')
BEGIN
    INSERT INTO user_sessions (id, user_id, session_token_hash, expires_at, is_revoked)
    VALUES ('00000000-0000-0000-0000-000000000002', '$userId', '5d409094f923e4f3054f15560b299e90098f62fa227091c0683ecf039a0fa065', DATEADD(day, 7, GETDATE()), 0);
END
ELSE
BEGIN
    UPDATE user_sessions SET is_revoked = 0, expires_at = DATEADD(day, 7, GETDATE()) WHERE session_token_hash = '5d409094f923e4f3054f15560b299e90098f62fa227091c0683ecf039a0fa065';
END
"@
    $cmd = New-Object System.Data.SqlClient.SqlCommand($seedSql, $dbConn)
    $cmd.ExecuteNonQuery() | Out-Null
    $dbConn.Close()

    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "LOCALDB SEEDING COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "Admin Email:    admin@teacottage.com" -ForegroundColor Yellow
    Write-Host "Admin Password: SuperSecurePassword123!" -ForegroundColor Yellow
    Write-Host "Server:         (localdb)\MSSQLLocalDB" -ForegroundColor Yellow
    Write-Host "Database:       teacottage_cms" -ForegroundColor Yellow
    Write-Host "Admin Portal:   http://localhost:3000/admin/login" -ForegroundColor Yellow
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "`nLocalDB PowerShell Seeding Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
