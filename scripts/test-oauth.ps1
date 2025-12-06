# Script para probar la configuración OAuth de la app en Windows

Write-Host ""
Write-Host "🧪 Testing Shopify OAuth Configuration" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe .env
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "   Create .env file with your Shopify credentials" -ForegroundColor Yellow
    Write-Host "   See INSTALL_OAUTH.md for instructions" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ .env file found" -ForegroundColor Green

# Cargar variables de entorno
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Función para verificar variables
function Test-EnvVariable {
    param([string]$VarName)
    
    $value = [Environment]::GetEnvironmentVariable($VarName, "Process")
    
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "❌ $VarName is not set" -ForegroundColor Red
        return $false
    } else {
        Write-Host "✓ $VarName is set" -ForegroundColor Green
        return $true
    }
}

Write-Host ""
Write-Host "Checking required environment variables:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$allVarsSet = $true

$allVarsSet = (Test-EnvVariable "SHOPIFY_API_KEY") -and $allVarsSet
$allVarsSet = (Test-EnvVariable "SHOPIFY_API_SECRET") -and $allVarsSet
$allVarsSet = (Test-EnvVariable "HOST") -and $allVarsSet
$allVarsSet = (Test-EnvVariable "SCOPES") -and $allVarsSet

if (-Not $allVarsSet) {
    Write-Host ""
    Write-Host "❌ Some required variables are missing" -ForegroundColor Red
    Write-Host "   Please update your .env file" -ForegroundColor Yellow
    exit 1
}

# Obtener valores
$apiKey = [Environment]::GetEnvironmentVariable("SHOPIFY_API_KEY", "Process")
$host = [Environment]::GetEnvironmentVariable("HOST", "Process")
$scopes = [Environment]::GetEnvironmentVariable("SCOPES", "Process")
$port = [Environment]::GetEnvironmentVariable("PORT", "Process")
if ([string]::IsNullOrEmpty($port)) { $port = "8081" }

# Verificar formato de HOST
if (-Not $host.StartsWith("https://")) {
    Write-Host "⚠️  Warning: HOST should use HTTPS in production" -ForegroundColor Yellow
    Write-Host "   Current: $host" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan
Write-Host "API Key: $($apiKey.Substring(0, [Math]::Min(10, $apiKey.Length)))..."
Write-Host "Host: $host"
Write-Host "Scopes: $scopes"
Write-Host "Port: $port"

# Verificar que la base de datos existe
Write-Host ""
Write-Host "Checking database:" -ForegroundColor Cyan
Write-Host "------------------" -ForegroundColor Cyan

if (Test-Path "database.db") {
    Write-Host "✓ database.db found" -ForegroundColor Green
    
    # Verificar tabla de sesiones usando sqlite3 si está disponible
    try {
        $tables = sqlite3 database.db "SELECT name FROM sqlite_master WHERE type='table' AND name='shopify_sessions';" 2>$null
        
        if ($tables -match "shopify_sessions") {
            Write-Host "✓ shopify_sessions table exists" -ForegroundColor Green
            
            # Contar sesiones
            $sessionCount = sqlite3 database.db "SELECT COUNT(*) FROM shopify_sessions;"
            Write-Host "  Stored sessions: $sessionCount"
            
            if ([int]$sessionCount -gt 0) {
                Write-Host ""
                Write-Host "  Stored shops:"
                $sessions = sqlite3 database.db "SELECT shop, created_at FROM shopify_sessions;"
                $sessions | ForEach-Object {
                    Write-Host "    - $_"
                }
            }
        } else {
            Write-Host "⚠️  shopify_sessions table not found" -ForegroundColor Yellow
            Write-Host "   Run the app once to create the table"
        }
    } catch {
        Write-Host "⚠️  sqlite3 not available to check table" -ForegroundColor Yellow
        Write-Host "   Install sqlite3 or run the app to verify"
    }
} else {
    Write-Host "⚠️  database.db not found" -ForegroundColor Yellow
    Write-Host "   Database will be created when you start the app"
}

# URLs de configuración
Write-Host ""
Write-Host "Shopify Partners Configuration:" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan
Write-Host "Make sure these URLs are configured in your Shopify Partners Dashboard:"
Write-Host ""
Write-Host "App URL:"
Write-Host "  $host/" -ForegroundColor White
Write-Host ""
Write-Host "Allowed redirection URLs:"
Write-Host "  $host/api/auth/callback" -ForegroundColor White
Write-Host "  $host/api/auth" -ForegroundColor White
Write-Host "  $host/" -ForegroundColor White

# Sugerir siguiente paso
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "-----------" -ForegroundColor Cyan

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port/api/auth/verify?shop=test.myshopify.com" -Method Get -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Server is running on port $port" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install the app on a shop, visit:"
    Write-Host "  http://localhost:$port/api/auth?shop=YOUR-SHOP.myshopify.com" -ForegroundColor White
} catch {
    Write-Host "⚠️  Server is not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Start the server:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. For local development with ngrok:" -ForegroundColor White
    Write-Host "   ngrok http $port" -ForegroundColor Cyan
    Write-Host "   Update HOST in .env with ngrok URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Install the app by visiting:" -ForegroundColor White
    Write-Host "   http://localhost:$port/api/auth?shop=YOUR-SHOP.myshopify.com" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Configuration check complete" -ForegroundColor Green
Write-Host ""

