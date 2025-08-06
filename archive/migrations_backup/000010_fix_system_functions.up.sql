-- Fix all system function configurations and clean up test data

-- 1. Clean up test functions from smoke tests
DELETE FROM function_definitions 
WHERE is_system_resource = 0 
AND is_active = 0 
AND (name LIKE '%test%' OR name LIKE '%smoke%' OR name LIKE '%critical_path%');

-- 2. Add missing fallback data and mock response for get_current_weather function
UPDATE function_definitions 
SET 
    fallback_data = JSON_OBJECT(
        'coord', JSON_OBJECT('lon', -122.08, 'lat', 37.39),
        'weather', JSON_ARRAY(JSON_OBJECT(
            'id', 800,
            'main', 'Clear',
            'description', 'clear sky',
            'icon', '01d'
        )),
        'base', 'stations',
        'main', JSON_OBJECT(
            'temp', 282.55,
            'feels_like', 281.86,
            'temp_min', 280.37,
            'temp_max', 284.26,
            'pressure', 1023,
            'humidity', 100
        ),
        'visibility', 10000,
        'wind', JSON_OBJECT('speed', 1.5, 'deg', 350),
        'clouds', JSON_OBJECT('all', 1),
        'dt', 1560350645,
        'sys', JSON_OBJECT(
            'type', 1,
            'id', 5122,
            'country', 'US',
            'sunrise', 1560343627,
            'sunset', 1560396563
        ),
        'timezone', -25200,
        'id', 420006353,
        'name', 'Mountain View',
        'cod', 200,
        '_metadata', JSON_OBJECT(
            'error', 'OpenWeather API unavailable, showing mock data for Mountain View, CA',
            'source', 'fallback'
        )
    ),
    mock_response = JSON_OBJECT(
        'coord', JSON_OBJECT('lon', -122.08, 'lat', 37.39),
        'weather', JSON_ARRAY(JSON_OBJECT(
            'id', 800,
            'main', 'Clear',
            'description', 'clear sky',
            'icon', '01d'
        )),
        'base', 'stations',
        'main', JSON_OBJECT(
            'temp', 282.55,
            'feels_like', 281.86,
            'temp_min', 280.37,
            'temp_max', 284.26,
            'pressure', 1023,
            'humidity', 100
        ),
        'visibility', 10000,
        'wind', JSON_OBJECT('speed', 1.5, 'deg', 350),
        'clouds', JSON_OBJECT('all', 1),
        'dt', 1560350645,
        'sys', JSON_OBJECT(
            'type', 1,
            'id', 5122,
            'country', 'US',
            'sunrise', 1560343627,
            'sunset', 1560396563
        ),
        'timezone', -25200,
        'id', 420006353,
        'name', 'Mountain View',
        'cod', 200
    )
WHERE name = 'get_current_weather';

-- 3. Fix normalize_attributes function by removing unsupported "examples" fields
UPDATE function_definitions 
SET 
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'node_label', JSON_OBJECT(
                'type', 'string',
                'description', 'The Neo4j node label to query (e.g., "Product", "Person", "Company")'
            ),
            'attribute_name', JSON_OBJECT(
                'type', 'string',
                'description', 'The attribute/property name to normalize (e.g., "category", "title", "industry")'
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
                'description', 'Custom mapping rules as key-value pairs where key is raw value pattern and value is normalized form'
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
    )
WHERE name = 'normalize_attributes';

-- 4. Fix neo4j_node_lookup function parameter schema to use proper field names
UPDATE function_definitions 
SET 
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'node_label', JSON_OBJECT(
                'type', 'string',
                'description', 'The node label to search for (e.g., Person, Company, Product)'
            ),
            'properties', JSON_OBJECT(
                'type', 'object',
                'description', 'Key-value pairs to match against node properties'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of nodes to return',
                'minimum', 1,
                'maximum', 100,
                'default', 25
            )
        ),
        'required', JSON_ARRAY('node_label')
    )
WHERE name = 'neo4j_node_lookup';

-- 5. Update Neo4j functions to use proper Neo4j connection URL
UPDATE function_definitions 
SET endpoint_url = 'neo4j://localhost:7687'
WHERE name IN ('neo4j_node_lookup', 'sales_summary', 'normalize_attributes') 
AND endpoint_url != 'neo4j://localhost:7687';

-- 6. Ensure all system functions have proper HTTP method set
UPDATE function_definitions 
SET http_method = 'CYPHER'
WHERE name IN ('neo4j_node_lookup', 'sales_summary', 'normalize_attributes') 
AND http_method != 'CYPHER';

-- 7. Add missing mock_response for Neo4j functions if they don't have one
UPDATE function_definitions 
SET mock_response = JSON_OBJECT(
    'nodes', JSON_ARRAY(JSON_OBJECT(
        'id', 'mock_node_1',
        'labels', JSON_ARRAY('MockNode'),
        'properties', JSON_OBJECT(
            'name', 'Sample Node',
            'category', 'Mock Data'
        )
    )),
    'summary', JSON_OBJECT(
        'totalNodes', 1,
        'executionTime', '0ms',
        'source', 'mock'
    )
)
WHERE name = 'neo4j_node_lookup' 
AND (mock_response IS NULL OR JSON_LENGTH(mock_response) = 0);

UPDATE function_definitions 
SET mock_response = JSON_OBJECT(
    'sales_summary', JSON_ARRAY(
        JSON_OBJECT(
            'standard_category', 'Sales Enablement',
            'avg_annualized_amount_usd', 125000.00,
            'document_count', 15,
            'total_item_count', 45
        ),
        JSON_OBJECT(
            'standard_category', 'Revenue Operations', 
            'avg_annualized_amount_usd', 98000.00,
            'document_count', 8,
            'total_item_count', 24
        )
    ),
    'summary', JSON_OBJECT(
        'total_categories', 2,
        'executionTime', '0ms',
        'source', 'mock'
    )
)
WHERE name = 'sales_summary' 
AND (mock_response IS NULL OR JSON_LENGTH(mock_response) = 0);

UPDATE function_definitions 
SET mock_response = JSON_OBJECT(
    'attribute_mappings', JSON_ARRAY(
        JSON_OBJECT(
            'raw_value', 'software engineering',
            'normalized_value', 'Software Engineering',
            'confidence', 1.0
        ),
        JSON_OBJECT(
            'raw_value', 'data science',
            'normalized_value', 'Data Science', 
            'confidence', 1.0
        )
    ),
    'summary', JSON_OBJECT(
        'total_raw_values', 2,
        'total_unique_normalized', 2,
        'executionTime', '0ms',
        'source', 'mock'
    )
)
WHERE name = 'normalize_attributes' 
AND (mock_response IS NULL OR JSON_LENGTH(mock_response) = 0); 