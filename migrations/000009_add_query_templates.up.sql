-- Add query template and result transformation support to function definitions

ALTER TABLE function_definitions 
ADD COLUMN query_template TEXT,
ADD COLUMN result_transformer VARCHAR(50) DEFAULT 'default',
ADD COLUMN fallback_data JSON;

-- Update existing Neo4j functions with their query templates

-- Neo4j Node Lookup
UPDATE function_definitions 
SET 
    query_template = 'MATCH (n:{{node_label}}) {{where_clause}} RETURN n LIMIT {{limit}}',
    result_transformer = 'neo4j_nodes',
    fallback_data = JSON_OBJECT(
        'nodes', JSON_ARRAY(JSON_OBJECT(
            'id', 'mock_node_1',
            'labels', JSON_ARRAY('Error'),
            'properties', JSON_OBJECT('error', 'Neo4j connection unavailable')
        )),
        'relationships', JSON_ARRAY(),
        'summary', JSON_OBJECT(
            'totalNodes', 1,
            'totalRelationships', 0,
            'executionTime', '0ms',
            'error', 'Neo4j connection unavailable, showing mock data'
        )
    )
WHERE name = 'neo4j_node_lookup';

-- Sales Summary Analytics
UPDATE function_definitions 
SET 
    query_template = 'MATCH (p:Product)-[:HAS_DOCUMENT]->(d:Document)
OPTIONAL MATCH (d)-[:HAS_ITEM]->(i:Item)
WITH 
  p.category AS raw_category,
  coalesce(d.total_amount, d.total_discounted_amount) AS amount,
  d.currency_code AS currency,
  d.service_duration_month AS duration_months,
  count(i) AS item_count_per_document
WHERE duration_months IS NOT NULL AND duration_months > 0 {{currency_filter}}

WITH 
  raw_category,
  currency,
  amount / duration_months * 12 AS annualized_amount,
  item_count_per_document,
  CASE 
    WHEN toLower(raw_category) IN [''e-signature''] THEN ''E-Signature''
    WHEN toLower(raw_category) IN [''direct-mail-marketing'', ''direct mail marketing''] THEN ''Direct Mail Marketing''
    WHEN toLower(raw_category) IN [''rev ops'', ''revenue ops''] THEN ''Revenue Operations''
    WHEN toLower(raw_category) IN [''sales engagement'', ''sales intelligence'', ''sales training'', ''sales communication'', ''sales productivity''] THEN ''Sales Enablement''
    WHEN toLower(raw_category) = ''commission-management'' THEN ''Compensation Management''
    WHEN toLower(raw_category) = ''lead-generation'' THEN ''Lead Management''
    WHEN toLower(raw_category) = ''event-services'' THEN ''Event Services''
    WHEN toLower(raw_category) = ''security training'' THEN ''Security Training''
    ELSE raw_category
  END AS standard_category,

  CASE 
    WHEN currency = ''USD'' THEN 1.0
    WHEN currency = ''EUR'' THEN 1.1
    WHEN currency = ''GBP'' THEN 1.3
    ELSE 1.0
  END AS conversion_rate

WITH 
  standard_category,
  round(avg(annualized_amount * conversion_rate), 2) AS avg_annualized_amount_usd,
  count(*) AS document_count,
  sum(item_count_per_document) AS total_item_count
WHERE 1=1 {{min_amount_filter}}
RETURN 
  standard_category,
  avg_annualized_amount_usd,
  document_count,
  total_item_count
ORDER BY avg_annualized_amount_usd DESC
LIMIT {{limit}}',
    result_transformer = 'sales_summary',
    fallback_data = JSON_OBJECT(
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
            'error', 'Neo4j connection unavailable, showing mock sales data'
        )
    )
WHERE name = 'sales_summary';

-- Normalize Attributes
UPDATE function_definitions 
SET 
    query_template = 'MATCH (n:{{node_label}})
WHERE n.{{attribute_name}} IS NOT NULL AND n.{{attribute_name}} <> ''''
RETURN DISTINCT n.{{attribute_name}} AS raw_value
ORDER BY raw_value
LIMIT {{limit}}',
    result_transformer = 'normalize_attributes',
    fallback_data = JSON_OBJECT(
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
            'error', 'Neo4j connection unavailable, showing mock normalization data'
        )
    )
WHERE name = 'normalize_attributes'; 