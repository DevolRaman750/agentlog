-- Remove attribute normalization function

DELETE FROM function_definitions 
WHERE id = 'func-neo4j-normalize-attributes' AND user_id = 'system'; 