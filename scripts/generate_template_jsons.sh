#!/bin/bash

# Script to generate JSON files for all system execution templates

cd /Users/arsheenali/dev/agentlog/system/execution_templates

# Get all system execution templates from database and create JSON files
mysql -u root -pPassword123! gogent -N -B -e "
SELECT 
    et.id,
    et.name,
    et.description,
    et.template_prompt,
    et.context_template,
    et.enable_function_calling,
    et.preferred_configuration_id,
    et.category,
    et.tags,
    et.execution_timeout_seconds,
    et.rate_limit_per_hour,
    et.rate_limit_per_day,
    et.rate_limit_burst,
    GROUP_CONCAT(etf.function_id ORDER BY etf.execution_order) as function_ids,
    GROUP_CONCAT(etp.parameter_name ORDER BY etp.display_order) as parameter_names
FROM execution_templates et
LEFT JOIN execution_template_functions etf ON et.id = etf.template_id
LEFT JOIN execution_template_parameters etp ON et.id = etp.template_id
WHERE et.user_id = 'system' OR et.is_public = 1
GROUP BY et.id
ORDER BY et.category, et.name
" | while IFS=$'\t' read -r id name description template_prompt context_template enable_function_calling preferred_configuration_id category tags execution_timeout_seconds rate_limit_per_hour rate_limit_per_day rate_limit_burst function_ids parameter_names; do
    
    # Create category folder if it doesn't exist
    mkdir -p "$category"
    
    echo "Creating $category/${id}.json"
    
    # Convert function_ids to JSON array
    if [ -n "$function_ids" ] && [ "$function_ids" != "NULL" ]; then
        function_array=$(echo "$function_ids" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')
        function_array="[$function_array]"
    else
        function_array="[]"
    fi
    
    # Convert parameter_names to JSON array
    if [ -n "$parameter_names" ] && [ "$parameter_names" != "NULL" ]; then
        param_array=$(echo "$parameter_names" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')
        param_array="[$param_array]"
    else
        param_array="[]"
    fi
    
    # Handle NULL values
    description=${description:-"System execution template"}
    context_template=${context_template:-""}
    tags=${tags:-"[]"}
    execution_timeout_seconds=${execution_timeout_seconds:-300}
    rate_limit_per_hour=${rate_limit_per_hour:-100}
    rate_limit_per_day=${rate_limit_per_day:-1000}
    rate_limit_burst=${rate_limit_burst:-10}
    
    # Create JSON file
    cat > "$category/${id}.json" << EOF
{
  "id": "$id",
  "name": "$name",
  "description": "$description",
  "category": "$category",
  "template_prompt": "$template_prompt",
  "context_template": "$context_template",
  "enable_function_calling": $([ "$enable_function_calling" = "1" ] && echo "true" || echo "false"),
  "preferred_configuration_id": "$preferred_configuration_id",
  "function_ids": $function_array,
  "parameter_names": $param_array,
  "settings": {
    "execution_timeout_seconds": $execution_timeout_seconds,
    "rate_limit_per_hour": $rate_limit_per_hour,
    "rate_limit_per_day": $rate_limit_per_day,
    "rate_limit_burst": $rate_limit_burst
  },
  "tags": $tags,
  "is_system": true,
  "is_public": true
}
EOF
done

echo "Execution template JSON generation complete!"
echo "Generated files:"
find . -name "*.json" -type f | sort
