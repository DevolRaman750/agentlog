-- Remove agent memory functions from development support templates

DELETE FROM execution_template_functions WHERE id IN (
    'etf-slack-responder-16',
    'etf-slack-responder-17', 
    'etf-slack-responder-18',
    'etf-slack-responder-19',
    'etf-github-enhancer-7',
    'etf-github-enhancer-8',
    'etf-github-enhancer-9', 
    'etf-github-enhancer-10',
    'etf-slack-reporter-13',
    'etf-slack-reporter-14',
    'etf-slack-reporter-15',
    'etf-slack-reporter-16'
);
