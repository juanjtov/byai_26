#!/usr/bin/env python3
"""
REMODLY Database Migration Runner

Runs all SQL migration files in the migrations/ folder in numeric order.
Connects directly to Supabase PostgreSQL database.

Usage:
    cd backend
    python run_migrations.py

Environment Variables Required:
    DATABASE_URL - Full PostgreSQL connection string

    OR

    SUPABASE_URL - Your Supabase project URL (to extract project ref)
    SUPABASE_DB_PASSWORD - Your database password (from Supabase dashboard)
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def get_database_url():
    """Get database connection URL from environment variables."""

    # Option 1: Direct DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    # Option 2: Construct from SUPABASE_URL and DB_PASSWORD
    supabase_url = os.getenv("SUPABASE_URL")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")

    if supabase_url and db_password:
        # Extract project ref from URL: https://xxxxx.supabase.co -> xxxxx
        # Database host is: db.xxxxx.supabase.co
        try:
            project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")
            database_url = f"postgresql://postgres.{project_ref}:{db_password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
            return database_url
        except Exception as e:
            print(f"Error constructing database URL: {e}")

    # Not configured
    print("Error: Database connection not configured.")
    print("\nPlease set one of the following in your .env file:")
    print("\nOption 1 - Direct connection string:")
    print("  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres")
    print("\nOption 2 - Supabase credentials:")
    print("  SUPABASE_URL=https://your-project.supabase.co")
    print("  SUPABASE_DB_PASSWORD=your-database-password")
    print("\nYou can find these in Supabase Dashboard > Project Settings > Database")
    sys.exit(1)


def get_migration_files():
    """Get all SQL migration files sorted by name."""
    if not MIGRATIONS_DIR.exists():
        print(f"Error: Migrations directory not found: {MIGRATIONS_DIR}")
        sys.exit(1)

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    if not sql_files:
        print("No migration files found")
        return []

    return sql_files


def execute_migration(conn, sql_content: str, filename: str) -> bool:
    """Execute a migration file's SQL content."""
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql_content)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"  Error: {e}")
        return False


def run_migrations():
    """Run all migrations in order."""
    print("=" * 60)
    print("REMODLY Database Migration Runner")
    print("=" * 60)

    # Check for psycopg2
    try:
        import psycopg2
    except ImportError:
        print("\nError: psycopg2 not installed.")
        print("Run: pip install psycopg2-binary")
        sys.exit(1)

    database_url = get_database_url()

    # Mask password in output
    display_url = database_url
    if "@" in database_url:
        parts = database_url.split("@")
        creds = parts[0].split(":")
        if len(creds) >= 3:
            display_url = f"{creds[0]}:{creds[1]}:****@{parts[1]}"

    print(f"\nConnecting to: {display_url}")
    print(f"Migrations dir: {MIGRATIONS_DIR}")

    migration_files = get_migration_files()

    if not migration_files:
        print("\nNo migrations to run.")
        return

    print(f"\nFound {len(migration_files)} migration(s):")
    for f in migration_files:
        print(f"  - {f.name}")

    print("\n" + "-" * 60)
    print("Connecting to database...")

    try:
        conn = psycopg2.connect(database_url)
        print("Connected successfully!\n")
    except Exception as e:
        print(f"\nError connecting to database: {e}")
        print("\nTroubleshooting:")
        print("1. Check your database password in Supabase Dashboard")
        print("2. Ensure your IP is not blocked (check Database > Connection Pooling)")
        print("3. Try using the connection string from Supabase Dashboard directly")
        sys.exit(1)

    success_count = 0
    failed_count = 0

    for migration_file in migration_files:
        print(f"Running: {migration_file.name}")

        sql_content = migration_file.read_text()

        success = execute_migration(conn, sql_content, migration_file.name)

        if success:
            print(f"  ✓ Success")
            success_count += 1
        else:
            print(f"  ✗ Failed")
            failed_count += 1
            # Ask whether to continue
            response = input("  Continue with remaining migrations? (y/n): ")
            if response.lower() != 'y':
                break

    conn.close()

    print("\n" + "=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"  Successful: {success_count}")
    print(f"  Failed: {failed_count}")

    if failed_count == 0:
        print("\nAll migrations completed successfully!")
    else:
        print(f"\n{failed_count} migration(s) failed. Check errors above.")


def print_migration_contents():
    """Print the contents of all migration files for easy copying."""
    migration_files = get_migration_files()

    print("\n" + "=" * 60)
    print("MIGRATION FILE CONTENTS (for manual execution)")
    print("=" * 60)

    for migration_file in migration_files:
        print(f"\n{'='*60}")
        print(f"-- FILE: {migration_file.name}")
        print("=" * 60)
        print(migration_file.read_text())
        print(f"\n-- END OF {migration_file.name}")


def check_tables():
    """Check which tables exist in the database."""
    try:
        import psycopg2
    except ImportError:
        print("Error: psycopg2 not installed.")
        return

    database_url = get_database_url()

    try:
        conn = psycopg2.connect(database_url)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
        conn.close()

        print("\nExisting tables in database:")
        if tables:
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("  (no tables found)")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="REMODLY Database Migration Runner")
    parser.add_argument(
        "--print",
        action="store_true",
        dest="print_sql",
        help="Print all migration SQL for manual execution"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check which tables exist in the database"
    )

    args = parser.parse_args()

    if args.print_sql:
        print_migration_contents()
    elif args.check:
        check_tables()
    else:
        run_migrations()
