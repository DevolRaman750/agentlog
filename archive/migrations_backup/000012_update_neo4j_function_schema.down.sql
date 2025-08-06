BEGIN;

UPDATE function_definitions
SET parameters_schema = '{
  "type": "object",
  "required": ["label"],
  "properties": {
    "label": {
      "type": "string",
      "description": "Node label to search"
    },
    "props": {
      "type": "object",
      "description": "Filter properties (optional)"
    },
    "limit": {
      "type": "integer",
      "description": "Max rows (optional)",
      "default": 50
    }
  }
}'
WHERE name = 'neo4j_node_lookup' AND user_id = 'system';

COMMIT; 