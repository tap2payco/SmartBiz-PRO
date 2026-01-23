# Supabase CLI Installation Guide for Windows

## Quick Installation Steps

### Option 1: Manual Download (Recommended for Windows)

1. **Download the latest release:**
   - Visit: https://github.com/supabase/cli/releases
   - Download: `supabase_windows_amd64.zip`

2. **Extract and Install:**
   ```powershell
   # Extract the zip file
   Expand-Archive -Path supabase_windows_amd64.zip -DestinationPath C:\supabase-cli
   
   # Add to PATH (run as Administrator)
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\supabase-cli", [EnvironmentVariableTarget]::Machine)
   ```

3. **Verify Installation:**
   ```powershell
   # Close and reopen PowerShell
   supabase --version
   ```

### Option 2: Using Scoop (If you have Scoop installed)

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 3: Using Chocolatey (If you have Chocolatey installed)

```powershell
choco install supabase
```

## After Installation

Once Supabase CLI is installed, initialize the project:

```powershell
cd "c:\Users\Pius\SmartBiz PRO"
supabase init
supabase start
```

This will:
- Create a `supabase/` directory with migrations and config
- Start local Supabase services (Postgres, Auth, Storage, etc.)
- Provide you with local API URLs and keys

## Useful Commands

```powershell
# Start Supabase services
supabase start

# Stop Supabase services
supabase stop

# Check status
supabase status

# Create a new migration
supabase migration new <migration_name>

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

## Connection Details

After running `supabase start`, you'll get:
- **API URL**: http://localhost:54321
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **Anon Key**: (provided in output)
- **Service Role Key**: (provided in output)

Save these for your `.env` file!
