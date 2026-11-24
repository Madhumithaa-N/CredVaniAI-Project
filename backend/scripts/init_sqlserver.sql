-- CredVaniAI Microsoft SQL Server Initialization Script
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CredVaniAI_DB')
BEGIN
    CREATE DATABASE [CredVaniAI_DB];
END
GO

USE [CredVaniAI_DB];
GO

IF OBJECT_ID(N'dbo.SupportedLanguages', N'U') IS NULL
CREATE TABLE dbo.SupportedLanguages (
    language_id INT IDENTITY(1,1) PRIMARY KEY,
    language_code VARCHAR(16) NOT NULL UNIQUE,
    language_name NVARCHAR(64) NOT NULL,
    native_name NVARCHAR(64) NOT NULL,
    is_enabled BIT NOT NULL DEFAULT 1,
    is_rtl BIT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 100
);
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    preferred_language VARCHAR(16) NOT NULL DEFAULT 'kn',
    is_verified BIT NOT NULL DEFAULT 0,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.UserProfiles', N'U') IS NULL
CREATE TABLE dbo.UserProfiles (
    profile_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    age INT NULL,
    occupation NVARCHAR(120) NULL,
    monthly_income DECIMAL(14,2) NULL,
    employment_type VARCHAR(64) NULL,
    location NVARCHAR(120) NULL,
    user_category VARCHAR(64) NULL DEFAULT 'general',
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.LoanCategories', N'U') IS NULL
CREATE TABLE dbo.LoanCategories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_slug VARCHAR(64) NOT NULL UNIQUE,
    category_name NVARCHAR(120) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    icon VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active'
);
GO

IF OBJECT_ID(N'dbo.LoanProducts', N'U') IS NULL
CREATE TABLE dbo.LoanProducts (
    loan_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL FOREIGN KEY REFERENCES dbo.LoanCategories(category_id) ON DELETE CASCADE,
    lender_name NVARCHAR(150) NOT NULL,
    loan_name NVARCHAR(180) NOT NULL,
    interest_rate FLOAT NOT NULL,
    minimum_amount DECIMAL(14,2) NOT NULL,
    maximum_amount DECIMAL(14,2) NOT NULL,
    maximum_tenure INT NOT NULL,
    eligibility_criteria NVARCHAR(MAX) NOT NULL,
    processing_fee NVARCHAR(120) NOT NULL,
    official_source_url VARCHAR(500) NOT NULL,
    last_verified_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.UserLoanPreferences', N'U') IS NULL
CREATE TABLE dbo.UserLoanPreferences (
    preference_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    loan_category VARCHAR(64) NOT NULL,
    requested_amount DECIMAL(14,2) NOT NULL,
    loan_purpose NVARCHAR(255) NULL,
    preferred_tenure INT NOT NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.ChatConversations', N'U') IS NULL
CREATE TABLE dbo.ChatConversations (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL FOREIGN KEY REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    language VARCHAR(16) NOT NULL DEFAULT 'kn',
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.ChatMessages', N'U') IS NULL
CREATE TABLE dbo.ChatMessages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT NOT NULL FOREIGN KEY REFERENCES dbo.ChatConversations(conversation_id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    language VARCHAR(16) NOT NULL DEFAULT 'kn',
    timestamp DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
CREATE TABLE dbo.RefreshTokens (
    token_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIMEOFFSET NOT NULL,
    revoked_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.OtpVerificationTokens', N'U') IS NULL
CREATE TABLE dbo.OtpVerificationTokens (
    otp_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    channel VARCHAR(16) NOT NULL,
    target VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL,
    purpose VARCHAR(32) NOT NULL DEFAULT 'verify_account',
    expires_at DATETIMEOFFSET NOT NULL,
    consumed_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NULL
CREATE TABLE dbo.PasswordResetTokens (
    reset_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
