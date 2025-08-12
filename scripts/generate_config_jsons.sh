#!/bin/bash

# Script to generate JSON files for all system configurations

cd /Users/arsheenali/dev/agentlog/system/configurations

# Get all system configurations from database and create JSON files
mysql -u root -pPassword123! gogent -N -B -e "
SELECT 
    id,
    variation_name,
    model_name,
    COALESCE(system_prompt, 'System prompt not configured') as system_prompt,
    COALESCE(temperature, 0.5) as temperature,
    COALESCE(max_tokens, 2048) as max_tokens,
    COALESCE(top_p, 0.9) as top_p,
    COALESCE(top_k, 40) as top_k,
    COALESCE(safety_settings, '{}') as safety_settings,
    COALESCE(generation_config, '{}') as generation_config,
    COALESCE(tools, '[]') as tools,
    COALESCE(tool_config, '{}') as tool_config
FROM api_configurations 
WHERE user_id = 'system'
ORDER BY variation_name
" | while IFS=$'\t' read -r id variation_name model_name system_prompt temperature max_tokens top_p top_k safety_settings generation_config tools tool_config; do
    
    echo "Creating ${id}.json"
    
    # Create JSON file
    cat > "${id}.json" << EOF
{
  "id": "$id",
  "name": "$variation_name",
  "model": "$model_name",
  "description": "System configuration: $variation_name",
  "system_prompt": "$system_prompt",
  "parameters": {
    "temperature": $temperature,
    "max_tokens": $max_tokens,
    "top_p": $top_p,
    "top_k": $top_k
  },
  "safety_settings": $safety_settings,
  "generation_config": $generation_config,
  "tools": $tools,
  "tool_config": $tool_config,
  "is_system": true,
  "provider": "$(echo "$model_name" | cut -d'/' -f1)"
}
EOF
done

echo "Configuration JSON generation complete!"
echo "Generated files:"
ls -la *.json
