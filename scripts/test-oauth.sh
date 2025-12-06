#!/bin/bash

# Script para probar la configuración OAuth de la app

echo "🧪 Testing Shopify OAuth Configuration"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que existe .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "   Create .env file with your Shopify credentials"
    echo "   See INSTALL_OAUTH.md for instructions"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Cargar variables de entorno
export $(cat .env | grep -v '^#' | xargs)

# Verificar variables requeridas
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name is not set${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $var_name is set${NC}"
        return 0
    fi
}

echo ""
echo "Checking required environment variables:"
echo "----------------------------------------"

all_vars_set=true

check_var "SHOPIFY_API_KEY" || all_vars_set=false
check_var "SHOPIFY_API_SECRET" || all_vars_set=false
check_var "HOST" || all_vars_set=false
check_var "SCOPES" || all_vars_set=false

if [ "$all_vars_set" = false ]; then
    echo ""
    echo -e "${RED}❌ Some required variables are missing${NC}"
    echo "   Please update your .env file"
    exit 1
fi

# Verificar formato de HOST
if [[ ! $HOST =~ ^https:// ]]; then
    echo -e "${YELLOW}⚠️  Warning: HOST should use HTTPS in production${NC}"
    echo "   Current: $HOST"
fi

echo ""
echo "Configuration Summary:"
echo "----------------------"
echo "API Key: ${SHOPIFY_API_KEY:0:10}..."
echo "Host: $HOST"
echo "Scopes: $SCOPES"
echo "Port: ${PORT:-8081}"

# Verificar que la base de datos existe
echo ""
echo "Checking database:"
echo "------------------"

if [ -f database.db ]; then
    echo -e "${GREEN}✓ database.db found${NC}"
    
    # Verificar tabla de sesiones
    if sqlite3 database.db "SELECT name FROM sqlite_master WHERE type='table' AND name='shopify_sessions';" | grep -q "shopify_sessions"; then
        echo -e "${GREEN}✓ shopify_sessions table exists${NC}"
        
        # Contar sesiones
        session_count=$(sqlite3 database.db "SELECT COUNT(*) FROM shopify_sessions;")
        echo "  Stored sessions: $session_count"
        
        if [ $session_count -gt 0 ]; then
            echo ""
            echo "  Stored shops:"
            sqlite3 database.db "SELECT shop, created_at FROM shopify_sessions;" | while read line; do
                echo "    - $line"
            done
        fi
    else
        echo -e "${YELLOW}⚠️  shopify_sessions table not found${NC}"
        echo "   Run the app once to create the table"
    fi
else
    echo -e "${YELLOW}⚠️  database.db not found${NC}"
    echo "   Database will be created when you start the app"
fi

# URLs de configuración
echo ""
echo "Shopify Partners Configuration:"
echo "-------------------------------"
echo "Make sure these URLs are configured in your Shopify Partners Dashboard:"
echo ""
echo "App URL:"
echo "  $HOST/"
echo ""
echo "Allowed redirection URLs:"
echo "  $HOST/api/auth/callback"
echo "  $HOST/api/auth"
echo "  $HOST/"

# Sugerir siguiente paso
echo ""
echo "Next Steps:"
echo "-----------"

# Check if server is running
if curl -s "http://localhost:${PORT:-8081}/api/auth/verify?shop=test.myshopify.com" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running on port ${PORT:-8081}${NC}"
    echo ""
    echo "To install the app on a shop, visit:"
    echo "  http://localhost:${PORT:-8081}/api/auth?shop=YOUR-SHOP.myshopify.com"
else
    echo -e "${YELLOW}⚠️  Server is not running${NC}"
    echo ""
    echo "1. Start the server:"
    echo "   npm run dev"
    echo ""
    echo "2. For local development with ngrok:"
    echo "   ngrok http ${PORT:-8081}"
    echo "   Update HOST in .env with ngrok URL"
    echo ""
    echo "3. Install the app by visiting:"
    echo "   http://localhost:${PORT:-8081}/api/auth?shop=YOUR-SHOP.myshopify.com"
fi

echo ""
echo -e "${GREEN}✅ Configuration check complete${NC}"
echo ""

