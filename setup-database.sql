-- NFTSol Database Setup Script
-- Run this script in your PostgreSQL instance

-- Create development database
CREATE DATABASE nftsol_dev;

-- Create production database
CREATE DATABASE nftsol_prod;

-- Create user (adjust username and password as needed)
CREATE USER nftsol_user WITH PASSWORD 'nftsol_secure_password_2024';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nftsol_dev TO nftsol_user;
GRANT ALL PRIVILEGES ON DATABASE nftsol_prod TO nftsol_user;

-- Connect to development database and grant schema permissions
\c nftsol_dev;
GRANT ALL ON SCHEMA public TO nftsol_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nftsol_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nftsol_user;

-- Connect to production database and grant schema permissions
\c nftsol_prod;
GRANT ALL ON SCHEMA public TO nftsol_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nftsol_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nftsol_user;

-- Show created databases
\l
