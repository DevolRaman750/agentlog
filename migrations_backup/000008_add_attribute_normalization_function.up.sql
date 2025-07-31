-- Add attribute normalization function for standardizing node attributes

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
    'func-neo4j-normalize-attributes',
    'system',
    'normalize_attributes',
    'Normalize Node Attributes',
    'Standardize and normalize attributes from any Neo4j node type. Takes raw values like "software engineering" and "Software Engineering" and maps them to a standardized form like "Software Engineering". Useful for creating consistent category mappings for financial statements and data analysis.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'node_label', JSON_OBJECT(
                'type', 'string',
                'description', 'The Neo4j node label to query (e.g., "Product", "Person", "Company")',
                'examples', JSON_ARRAY('Product', 'Person', 'Company', 'Document')
            ),
            'attribute_name', JSON_OBJECT(
                'type', 'string',
                'description', 'The attribute/property name to normalize (e.g., "category", "title", "industry")',
                'examples', JSON_ARRAY('category', 'title', 'industry', 'department')
            ),
            'normalization_type', JSON_OBJECT(
                'type', 'string',
                'description', 'Type of normalization to apply',
                'enum', JSON_ARRAY('financial_categories', 'job_titles', 'industries', 'general', 'custom'),
                'default', 'general'
            ),
            'case_style', JSON_OBJECT(
                'type', 'string',
                'description', 'Preferred case style for output',
                'enum', JSON_ARRAY('title_case', 'lower_case', 'upper_case', 'preserve'),
                'default', 'title_case'
            ),
            'custom_mappings', JSON_OBJECT(
                'type', 'object',
                'description', 'Custom mapping rules as key-value pairs where key is raw value pattern and value is normalized form',
                'additionalProperties', JSON_OBJECT('type', 'string')
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of unique values to process',
                'minimum', 1,
                'maximum', 1000,
                'default', 100
            )
        ),
        'required', JSON_ARRAY('node_label', 'attribute_name')
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