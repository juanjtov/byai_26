#!/bin/bash

# Run database migration for chat feature
# Usage: ./run_migration.sh <database_url>
#
# Get your database URL from:
# Supabase Dashboard → Settings → Database → Connection string → URI
#
# Example:
# ./run_migration.sh "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

if [ -z "$1" ]; then
    echo "Usage: ./run_migration.sh <database_url>"
    echo ""
    echo "Get your database URL from Supabase Dashboard:"
    echo "Settings → Database → Connection string → URI"
    exit 1
fi

DATABASE_URL="$1"
MIGRATION_FILE="$(dirname "$0")/../migrations/001_chat_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "Running migration: 001_chat_schema.sql"
echo "======================================="

# First enable pgvector extension
echo "Enabling pgvector extension..."
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1

if [ $? -ne 0 ]; then
    echo "Warning: Could not enable pgvector. It may already be enabled or require dashboard activation."
fi

# Run the migration
echo "Running migration..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "Migration completed successfully!"
else
    echo ""
    echo "Migration failed. Check the error messages above."
    exit 1
fi
