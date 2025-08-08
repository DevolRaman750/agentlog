#!/bin/bash

# AgentLog Deployment Setup Script
# This script helps set up deployment configuration files from examples

set -e

echo "🚀 AgentLog Deployment Setup"
echo "================================"

# Function to copy example file if target doesn't exist
copy_if_not_exists() {
    local example_file="$1"
    local target_file="$2"
    
    if [ ! -f "$target_file" ]; then
        if [ -f "$example_file" ]; then
            cp "$example_file" "$target_file"
            echo "✅ Created $target_file from example"
        else
            echo "❌ Example file $example_file not found"
            exit 1
        fi
    else
        echo "⚠️  $target_file already exists, skipping"
    fi
}

# Function to prompt for required values
prompt_for_value() {
    local prompt="$1"
    local default="$2"
    local value
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -p "$prompt: " value
        echo "$value"
    fi
}

echo ""
echo "📋 Setting up configuration files..."

# Copy example files to actual configuration files
copy_if_not_exists "eas.json.example" "eas.json"
copy_if_not_exists "app.json.example" "app.json"
copy_if_not_exists "privacy-policy.md.example" "privacy-policy.md"
copy_if_not_exists "app-store-review-guidelines.md.example" "app-store-review-guidelines.md"
copy_if_not_exists "env.example" ".env.local"

echo ""
echo "🔧 Let's configure your app..."

# Prompt for essential configuration values
echo ""
echo "📱 App Configuration:"
APP_NAME=$(prompt_for_value "Enter your app name" "AgentLog")
BUNDLE_ID_IOS=$(prompt_for_value "Enter iOS bundle identifier" "com.yourcompany.yourapp")
BUNDLE_ID_ANDROID=$(prompt_for_value "Enter Android package name" "com.yourcompany.yourapp")

echo ""
echo "🏗️  EAS Configuration:"
EAS_PROJECT_ID=$(prompt_for_value "Enter EAS Project ID (get from 'eas init')")

echo ""
echo "🍎 Apple Developer (optional, can be filled later):"
APPLE_ID=$(prompt_for_value "Enter Apple ID email" "")
APPLE_TEAM_ID=$(prompt_for_value "Enter Apple Team ID" "")
ASC_APP_ID=$(prompt_for_value "Enter App Store Connect App ID" "")

echo ""
echo "📧 Contact Information:"
SUPPORT_EMAIL=$(prompt_for_value "Enter support email" "support@yourcompany.com")
COMPANY_NAME=$(prompt_for_value "Enter company name" "Your Company")

echo ""
echo "📝 Updating configuration files..."

# Update app.json with provided values
if [ -f "app.json" ]; then
    # Use sed to replace placeholders (works on both macOS and Linux)
    sed -i.bak "s/AgentLog/$APP_NAME/g" app.json
    sed -i.bak "s/com\.yourcompany\.yourapp/$BUNDLE_ID_IOS/g" app.json
    
    # For Android package, need to escape dots for sed
    BUNDLE_ID_ANDROID_ESCAPED=$(echo "$BUNDLE_ID_ANDROID" | sed 's/\./\\./g')
    sed -i.bak "s/com\.yourcompany\.yourapp/$BUNDLE_ID_ANDROID_ESCAPED/g" app.json
    
    if [ -n "$EAS_PROJECT_ID" ]; then
        sed -i.bak "s/YOUR_EAS_PROJECT_ID_HERE/$EAS_PROJECT_ID/g" app.json
    fi
    
    # Remove backup file
    rm app.json.bak
    echo "✅ Updated app.json"
fi

# Update eas.json with provided values
if [ -f "eas.json" ] && [ -n "$APPLE_ID" ]; then
    sed -i.bak "s/YOUR_APPLE_ID_HERE/$APPLE_ID/g" eas.json
    
    if [ -n "$ASC_APP_ID" ]; then
        sed -i.bak "s/YOUR_ASC_APP_ID_HERE/$ASC_APP_ID/g" eas.json
    fi
    
    if [ -n "$APPLE_TEAM_ID" ]; then
        sed -i.bak "s/YOUR_APPLE_TEAM_ID_HERE/$APPLE_TEAM_ID/g" eas.json
    fi
    
    # Remove backup file
    rm eas.json.bak
    echo "✅ Updated eas.json"
fi

# Update privacy policy
if [ -f "privacy-policy.md" ]; then
    sed -i.bak "s/\[APP_NAME\]/$APP_NAME/g" privacy-policy.md
    sed -i.bak "s/\[DATE_TO_BE_FILLED\]/$(date +%Y-%m-%d)/g" privacy-policy.md
    sed -i.bak "s/\[PRIVACY_EMAIL_TO_BE_FILLED\]/$SUPPORT_EMAIL/g" privacy-policy.md
    sed -i.bak "s/\[COMPANY_ADDRESS_TO_BE_FILLED\]/$COMPANY_NAME/g" privacy-policy.md
    
    # Remove backup file
    rm privacy-policy.md.bak
    echo "✅ Updated privacy-policy.md"
fi

# Update app store review guidelines
if [ -f "app-store-review-guidelines.md" ]; then
    sed -i.bak "s/\[APP_NAME\]/$APP_NAME/g" app-store-review-guidelines.md
    
    # Remove backup file
    rm app-store-review-guidelines.md.bak
    echo "✅ Updated app-store-review-guidelines.md"
fi

# Update environment file
if [ -f ".env.local" ]; then
    if [ -n "$EAS_PROJECT_ID" ]; then
        sed -i.bak "s/your-eas-project-id-here/$EAS_PROJECT_ID/g" .env.local
    fi
    sed -i.bak "s/support@agentlog\.com/$SUPPORT_EMAIL/g" .env.local
    sed -i.bak "s/com\.agentlog\.app/$BUNDLE_ID_ANDROID/g" .env.local
    
    # Remove backup file
    rm .env.local.bak
    echo "✅ Updated .env.local"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Review and customize the generated configuration files"
echo "2. For EAS builds, install required dependencies:"
echo "   npm install -g @expo/eas-cli"
echo "   yarn add expo-build-properties"
echo "   (then uncomment the plugin in app.json)"
echo "3. Run 'eas init' if you haven't already"
echo "4. Set up your secrets in the secrets/ directory"
echo "5. Test your configuration with 'eas build --profile development'"
echo "6. Follow the DEPLOYMENT_GUIDE.md for detailed deployment steps"
echo ""
echo "📁 Files created/updated:"
echo "  - app.json (Expo configuration)"
echo "  - eas.json (EAS build configuration)"
echo "  - privacy-policy.md (Privacy policy)"
echo "  - app-store-review-guidelines.md (Review guidelines)"
echo "  - .env.local (Environment variables)"
echo ""
echo "⚠️  Remember to:"
echo "  - Keep your secrets/ directory secure"
echo "  - Never commit actual configuration files to git"
echo "  - Review privacy policy with legal counsel"
echo "  - Test thoroughly before app store submission"
echo ""
echo "🔒 Security Note: Your actual configuration files are gitignored."
echo "   Only the .example files will be committed to version control."