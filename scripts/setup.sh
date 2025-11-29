#!/bin/bash

echo "🚀 Shopify Wholesale Pricing - Setup Script"
echo "==========================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher"
    echo "   Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

echo "📦 Installing root dependencies..."
npm install

echo ""
echo "📦 Installing frontend dependencies..."
cd web/frontend
npm install
cd ../..

echo ""
echo "🗄️  Initializing database..."
if [ -f "database.db" ]; then
    echo "⚠️  Database already exists. Skipping..."
else
    node -e "const { initializeDatabase } = require('./web/database/database.js'); initializeDatabase();"
    echo "✅ Database created successfully"
fi

echo ""
echo "📝 Checking .env file..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << EOL
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags
HOST=
DATABASE_PATH=./database.db
NODE_ENV=development
EOL
    echo "✅ .env file created. Please fill in your Shopify credentials."
else
    echo "✅ .env file exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in your .env file with Shopify credentials"
echo "2. Run: npm run dev"
echo "3. In another terminal: cd web/frontend && npm run dev"
echo "4. Open the URL shown by Shopify CLI"
echo ""
echo "For more info, see QUICKSTART.md"

