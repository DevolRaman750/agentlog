#!/bin/bash

# Script to generate JSON files for all functions that don't have them yet

cd /Users/arsheenali/dev/agentlog/system/functions

# Get all functions from database and create JSON files
mysql -u root -pPassword123! gogent -N -B -e "
SELECT 
    id,
    name,
    CASE 
        WHEN name LIKE 'agent_%' THEN 'agent'
        WHEN name LIKE 'team_%' THEN 'team'
        WHEN name LIKE 'github_%' THEN 'github'
        WHEN name LIKE 'slack_%' THEN 'slack'
        WHEN function_group = 'github' THEN 'github'
        WHEN function_group = 'communication' AND name LIKE 'slack_%' THEN 'slack'
        WHEN function_group = 'slack' THEN 'slack'
        WHEN function_group = 'weather' THEN 'weather'
        ELSE 'other'
    END as folder,
    display_name,
    COALESCE(description, 'Function description not available') as description,
    COALESCE(endpoint_url, '/api/function/' || name) as endpoint_url,
    COALESCE(http_method, 'POST') as http_method,
    COALESCE(parameters_schema, '{}') as parameters_schema
FROM function_definitions 
WHERE is_system_resource = 1
ORDER BY folder, name
" | while IFS=$'\t' read -r id name folder display_name description endpoint_url http_method parameters_schema; do
    
    # Create folder if it doesn't exist
    mkdir -p "$folder"
    
    # Check if JSON file already exists
    if [ ! -f "$folder/${name}.json" ]; then
        echo "Creating $folder/${name}.json"
        
        # Determine provider based on folder
        case $folder in
            "agent"|"team") provider="internal" ;;
            "github") provider="github" ;;
            "slack") provider="slack" ;;
            "weather") provider="weather" ;;
            *) provider="api" ;;
        esac
        
        # Create JSON file
        cat > "$folder/${name}.json" << EOF
{
  "id": "$id",
  "name": "$name",
  "provider": "$provider",
  "display_name": "$display_name",
  "description": "$description",
  "endpoint": {
    "path": "$endpoint_url",
    "method": "$http_method"
  },
  "parameters": {
    "required": [],
    "optional": [],
    "schema": $parameters_schema
  },
  "examples": [
    {
      "name": "Basic usage",
      "parameters": {}
    }
  ]
}
EOF
    else
        echo "Skipping $folder/${name}.json - already exists"
    fi
done

echo "Function JSON generation complete!"
echo "Generated files:"
find . -name "*.json" -type f | sort
