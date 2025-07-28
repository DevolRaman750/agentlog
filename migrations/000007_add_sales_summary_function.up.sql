-- Add sales summary function for Neo4j analytics

INSERT INTO function_definitions (
    id,
    user_id,
    name,
    display_name,
    description,
    parameters_schema,
    endpoint_url,
    http_method,
    headers,
    is_active,
    is_system_resource,
    created_at,
    updated_at
) VALUES (
    'func-neo4j-sales-summary',
    'system',
    'sales_summary',
    'Sales Summary Analytics',
    'Generate comprehensive sales analytics report showing annualized amounts by category, with currency conversion and item counts from Neo4j product and document data',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of categories to return in the summary',
                'minimum', 1,
                'maximum', 100,
                'default', 25
            ),
            'currency_filter', JSON_OBJECT(
                'type', 'string',
                'description', 'Filter results by specific currency code (USD, EUR, GBP)',
                'enum', JSON_ARRAY('USD', 'EUR', 'GBP')
            ),
            'min_amount', JSON_OBJECT(
                'type', 'number',
                'description', 'Minimum annualized amount threshold in USD',
                'minimum', 0
            )
        ),
        'required', JSON_ARRAY()
    ),
    'neo4j://localhost:7687',
    'CYPHER',
    JSON_OBJECT(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    ),
    true,
    true,
    NOW(),
    NOW()
); 