-- Remove additional Neo4j functions

DELETE FROM function_definitions WHERE id IN (
    'func-neo4j-normalize-attributes',
    'func-neo4j-query-graph'
); 