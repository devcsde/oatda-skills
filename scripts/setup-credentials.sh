#!/usr/bin/env bash
# OATDA Credentials Setup
# Securely stores your OATDA API key in ~/.oatda/credentials.json
#
# Usage:
#   bash scripts/setup-credentials.sh
#   bash scripts/setup-credentials.sh <api_key>
#   bash scripts/setup-credentials.sh <api_key> <profile_name>

set -euo pipefail

CONFIG_DIR="$HOME/.oatda"
CREDENTIALS_FILE="$CONFIG_DIR/credentials.json"

echo "🔑 OATDA Credentials Setup"
echo "=========================="
echo ""

# Get API key from argument or prompt
API_KEY="${1:-}"
if [[ -z "$API_KEY" ]]; then
  echo "Enter your OATDA API key (get one at https://oatda.com):"
  read -r -s API_KEY
  echo ""
fi

if [[ -z "$API_KEY" ]]; then
  echo "❌ No API key provided. Aborting."
  exit 1
fi

# Validate key format
if [[ ${#API_KEY} -lt 20 ]]; then
  echo "⚠️  Warning: API key seems short (${#API_KEY} chars). Typical keys are 30+ characters."
fi

# Get profile name
PROFILE="${2:-default}"

# Create config directory
if [[ ! -d "$CONFIG_DIR" ]]; then
  mkdir -p "$CONFIG_DIR"
  chmod 700 "$CONFIG_DIR"
  echo "✅ Created $CONFIG_DIR"
fi

# Build or update credentials file
TIMESTAMP=$(date +%s)

if [[ -f "$CREDENTIALS_FILE" ]]; then
  # Update existing file - add/update profile
  if command -v jq &>/dev/null; then
    UPDATED=$(jq \
      --arg profile "$PROFILE" \
      --arg apiKey "$API_KEY" \
      --arg timestamp "$TIMESTAMP" \
      '.profiles[$profile] = {
        "name": $profile,
        "apiKey": $apiKey,
        "createdAt": (.profiles[$profile].createdAt // ($timestamp | tonumber)),
        "lastUsed": ($timestamp | tonumber)
      }' "$CREDENTIALS_FILE")
    echo "$UPDATED" > "$CREDENTIALS_FILE"
    echo "✅ Updated profile \"$PROFILE\" in $CREDENTIALS_FILE"
  else
    echo "⚠️  jq not found. Overwriting credentials file."
    cat > "$CREDENTIALS_FILE" <<EOF
{
  "version": 1,
  "defaultProfile": "$PROFILE",
  "profiles": {
    "$PROFILE": {
      "name": "$PROFILE",
      "apiKey": "$API_KEY",
      "createdAt": $TIMESTAMP,
      "lastUsed": $TIMESTAMP
    }
  }
}
EOF
    echo "✅ Created $CREDENTIALS_FILE"
  fi
else
  # Create new file
  cat > "$CREDENTIALS_FILE" <<EOF
{
  "version": 1,
  "defaultProfile": "$PROFILE",
  "profiles": {
    "$PROFILE": {
      "name": "$PROFILE",
      "apiKey": "$API_KEY",
      "createdAt": $TIMESTAMP,
      "lastUsed": $TIMESTAMP
    }
  }
}
EOF
  echo "✅ Created $CREDENTIALS_FILE"
fi

# Set secure permissions
chmod 600 "$CREDENTIALS_FILE"
echo "✅ Set permissions to 600 (owner read/write only)"

echo ""
echo "Done! Your OATDA API key is stored in:"
echo "  $CREDENTIALS_FILE"
echo ""
echo "Profile: $PROFILE"
echo "Key:     ${API_KEY:0:8}..."
echo ""
echo "You can also set the key as an environment variable:"
echo "  export OATDA_API_KEY=your_key_here"
