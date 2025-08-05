-- Add additional Neo4j functions for comprehensive graph database operations

-- 1. Add Neo4j Attribute Normalization function
INSERT INTO function_definitions (
    id,
    user_id,
    name,
    display_name,
    function_group,
    description,
    parameters_schema,
    mock_response,
    endpoint_url,
    http_method,
    headers,
    auth_config,
    is_active,
    is_system_resource,
    required_api_keys,
    api_key_validation,
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-neo4j-normalize-attributes',
    'system',
    'normalize_attributes',
    'Normalize Node Attributes',
    'database',
    'Standardize and normalize attributes from any Neo4j node type. Takes raw values like "software engineering" and "Software Engineering" and maps them to a standardized form. Useful for creating consistent category mappings and data analysis.',
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
    JSON_OBJECT(
        'normalized_values', JSON_ARRAY(
            JSON_OBJECT(
                'original', 'software engineering',
                'normalized', 'Software Engineering',
                'frequency', 45
            ),
            JSON_OBJECT(
                'original', 'SOFTWARE ENGINEERING',
                'normalized', 'Software Engineering',
                'frequency', 12
            ),
            JSON_OBJECT(
                'original', 'SoftwareEngineering',
                'normalized', 'Software Engineering',
                'frequency', 8
            )
        ),
        'summary', JSON_OBJECT(
            'total_original_values', 65,
            'total_normalized_values', 1,
            'consolidation_ratio', 65.0,
            'processing_time', '120ms'
        ),
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'neo4j://localhost:7687',
    'CYPHER',
    JSON_OBJECT('Content-Type', 'application/json', 'Accept', 'application/json'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('neo4jUrl', 'neo4jUsername', 'neo4jPassword'),
    JSON_OBJECT(
        'neo4jUrl', JSON_OBJECT('required', true, 'description', 'Neo4j database URL'),
        'neo4jUsername', JSON_OBJECT('required', true, 'description', 'Neo4j username'),
        'neo4jPassword', JSON_OBJECT('required', true, 'description', 'Neo4j password')
    ),
    JSON_OBJECT(
        'normalized_values', JSON_ARRAY(
            JSON_OBJECT(
                'original', 'sample category',
                'normalized', 'Sample Category',
                'frequency', 1
            )
        ),
        'summary', JSON_OBJECT(
            'total_original_values', 1,
            'total_normalized_values', 1,
            'consolidation_ratio', 1.0,
            'processing_time', '0ms'
        ),
        '_metadata', JSON_OBJECT('source', 'fallback', 'error', 'Neo4j connection unavailable')
    ),
    NOW(),
    NOW()
);

-- 2. Add Neo4j General Query function for custom Cypher queries
INSERT INTO function_definitions (
    id,
    user_id,
    name,
    display_name,
    function_group,
    description,
    parameters_schema,
    mock_response,
    endpoint_url,
    http_method,
    headers,
    auth_config,
    is_active,
    is_system_resource,
    required_api_keys,
    api_key_validation,
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-neo4j-query-graph',
    'system',
    'query_graph',
    'Query Neo4j Graph Database',
    'database',
    'Execute custom Cypher queries against a Neo4j graph database. Find nodes, relationships, and paths with full Cypher query support. Perfect for complex graph analysis and relationship discovery.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'query', JSON_OBJECT(
                'type', 'string',
                'description', 'Cypher query to execute against the Neo4j database. Use MATCH clauses to find patterns and RETURN to specify what data to retrieve.',
                'examples', JSON_ARRAY(
                    'MATCH (n:Person) RETURN n.name LIMIT 10',
                    'MATCH (p:Person)-[:WORKS_FOR]->(c:Company) RETURN p.name, c.name',
                    'MATCH (start:Location {name: "New York"})-[:CONNECTED_TO*1..3]-(end:Location) RETURN DISTINCT end.name'
                )
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of results to return (1-100)',
                'default', 25,
                'minimum', 1,
                'maximum', 100
            ),
            'include_relationships', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Whether to include relationship details in the response',
                'default', true
            ),
            'format', JSON_OBJECT(
                'type', 'string',
                'description', 'Response format preference',
                'enum', JSON_ARRAY('detailed', 'compact', 'raw'),
                'default', 'detailed'
            )
        ),
        'required', JSON_ARRAY('query')
    ),
    JSON_OBJECT(
        'nodes', JSON_ARRAY(
            JSON_OBJECT(
                'id', 'person1',
                'labels', JSON_ARRAY('Person'),
                'properties', JSON_OBJECT(
                    'name', 'John Doe',
                    'age', 30,
                    'city', 'New York'
                )
            ),
            JSON_OBJECT(
                'id', 'company1',
                'labels', JSON_ARRAY('Company'),
                'properties', JSON_OBJECT(
                    'name', 'Tech Corp',
                    'industry', 'Technology',
                    'founded', 2010
                )
            )
        ),
        'relationships', JSON_ARRAY(
            JSON_OBJECT(
                'id', 'rel1',
                'type', 'WORKS_FOR',
                'startNode', 'person1',
                'endNode', 'company1',
                'properties', JSON_OBJECT(
                    'since', '2020-01-15',
                    'position', 'Software Engineer'
                )
            )
        ),
        'summary', JSON_OBJECT(
            'totalNodes', 2,
            'totalRelationships', 1,
            'executionTime', '15ms',
            'query', 'MATCH (p:Person)-[:WORKS_FOR]->(c:Company) RETURN p, c LIMIT 25'
        ),
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'neo4j://localhost:7687',
    'CYPHER',
    JSON_OBJECT('Content-Type', 'application/json', 'Accept', 'application/json'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('neo4jUrl', 'neo4jUsername', 'neo4jPassword'),
    JSON_OBJECT(
        'neo4jUrl', JSON_OBJECT('required', true, 'description', 'Neo4j database URL'),
        'neo4jUsername', JSON_OBJECT('required', true, 'description', 'Neo4j username'),
        'neo4jPassword', JSON_OBJECT('required', true, 'description', 'Neo4j password')
    ),
    JSON_OBJECT(
        'nodes', JSON_ARRAY(
            JSON_OBJECT(
                'id', 'mock_node',
                'labels', JSON_ARRAY('MockNode'),
                'properties', JSON_OBJECT(
                    'name', 'Sample Node',
                    'category', 'Fallback Data'
                )
            )
        ),
        'relationships', JSON_ARRAY(),
        'summary', JSON_OBJECT(
            'totalNodes', 1,
            'totalRelationships', 0,
            'executionTime', '0ms',
            'query', 'Mock query execution'
        ),
        '_metadata', JSON_OBJECT('source', 'fallback', 'error', 'Neo4j connection unavailable')
    ),
    NOW(),
    NOW()
); 