-- Remove sales summary function

DELETE FROM function_definitions 
WHERE id = 'func-neo4j-sales-summary' AND user_id = 'system'; 