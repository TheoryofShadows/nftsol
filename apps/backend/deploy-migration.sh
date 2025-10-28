#!/bin/bash

# NFTSol Database Migration Script
# Run this on your production database

echo "🚀 Running NFTSol Database Migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    exit 1
fi

# Run the migration
echo "📊 Executing migration: 20251028_add_withdrawals.sql"
psql "$DATABASE_URL" -f migrations/20251028_add_withdrawals.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "📋 New tables created:"
    echo "   - withdrawals (with indexes)"
    echo "   - wallets columns (available_lamports, pending_withdrawal_lamports)"
else
    echo "❌ Migration failed!"
    exit 1
fi

echo "🎉 Database is ready for withdrawal system!"
