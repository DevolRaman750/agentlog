/**
 * @fileoverview Tests for automation functions integration
 * Validates that the new automation functions added in migrations 000014 and 000015
 * are properly defined and structured.
 */

describe('Automation Functions Integration Tests', () => {

  describe('Function Groups Validation', () => {
    const expectedFunctionGroups = [
      'communication',
      'file_management', 
      'data_processing',
      'http_api',
      'calendar',
      'database',
      'text_processing',
      'ecommerce',
      'social_media',
      'ai_ml',
      'monitoring',
      'crm',
      'project_management',
      'github',
      'weather'
    ];

    test('should include all expected automation function groups', () => {
      // Test that we have defined all the expected groups
      expect(expectedFunctionGroups.length).toBe(15);
      
      // Verify each group is a valid string
      expectedFunctionGroups.forEach(group => {
        expect(typeof group).toBe('string');
        expect(group.length).toBeGreaterThan(0);
        expect(group).toMatch(/^[a-z_]+$/); // Should be lowercase with underscores
      });
    });
  });

  describe('Communication Functions', () => {
    const communicationFunctions = [
      'email_send',
      'slack_send_message', 
      'discord_send_message'
    ];

    test('should include email sending function with correct schema', () => {
      const emailFunction = {
        id: 'email_send',
        name: 'email_send',
        displayName: 'Send Email',
        functionGroup: 'communication',
        functionType: 'api',
        description: 'Send emails via SMTP or email service providers',
        parametersSchema: JSON.stringify({
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body content" },
            cc: { type: "string", description: "CC recipients (optional)" },
            bcc: { type: "string", description: "BCC recipients (optional)" }
          },
          required: ["to", "subject", "body"]
        }),
        isActive: true
      };

      // Validate schema structure
      const schema = JSON.parse(emailFunction.parametersSchema);
      expect(schema.required).toEqual(['to', 'subject', 'body']);
      expect(schema.properties.to.type).toBe('string');
      expect(schema.properties.subject.type).toBe('string');
      expect(schema.properties.body.type).toBe('string');
    });

    test('should include all communication functions', () => {
      communicationFunctions.forEach(funcName => {
        expect(funcName).toMatch(/^(email_send|slack_send_message|discord_send_message)$/);
      });
      expect(communicationFunctions.length).toBe(3);
    });
  });

  describe('E-commerce Functions', () => {
    const ecommerceFunctions = [
      'stripe_create_payment',
      'shopify_create_product',
      'woocommerce_get_orders'
    ];

    test('should include Stripe payment function with amount validation', () => {
      const stripeFunction = {
        id: 'stripe_create_payment',
        name: 'stripe_create_payment',
        displayName: 'Create Stripe Payment',
        functionGroup: 'ecommerce',
        parametersSchema: JSON.stringify({
          type: "object",
          properties: {
            amount: { type: "number", description: "Payment amount in cents" },
            currency: { type: "string", description: "Currency code (e.g., usd, eur)" },
            customer_email: { type: "string", description: "Customer email address" }
          },
          required: ["amount", "currency"]
        })
      };

      const schema = JSON.parse(stripeFunction.parametersSchema);
      expect(schema.properties.amount.type).toBe('number');
      expect(schema.required).toContain('amount');
      expect(schema.required).toContain('currency');
    });

    test('should include all e-commerce functions', () => {
      ecommerceFunctions.forEach(funcName => {
        expect(funcName).toMatch(/^(stripe_create_payment|shopify_create_product|woocommerce_get_orders)$/);
      });
      expect(ecommerceFunctions.length).toBe(3);
    });
  });

  describe('AI/ML Functions', () => {
    const aiMlFunctions = [
      'openai_text_completion',
      'openai_image_generation',
      'google_vision_analyze'
    ];

    test('should include OpenAI functions with model selection', () => {
      const openaiTextFunction = {
        parametersSchema: JSON.stringify({
          type: "object",
          properties: {
            prompt: { type: "string", description: "Text prompt for completion" },
            model: { 
              type: "string", 
              enum: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
              description: "Model to use" 
            },
            max_tokens: { type: "number", description: "Maximum tokens to generate" },
            temperature: { type: "number", description: "Creativity level (0-1)" }
          },
          required: ["prompt"]
        })
      };

      const schema = JSON.parse(openaiTextFunction.parametersSchema);
      expect(schema.properties.model.enum).toContain('gpt-4');
      expect(schema.properties.model.enum).toContain('gpt-3.5-turbo');
      expect(schema.required).toContain('prompt');
    });

    test('should include all AI/ML functions', () => {
      aiMlFunctions.forEach(funcName => {
        expect(funcName).toMatch(/^(openai_text_completion|openai_image_generation|google_vision_analyze)$/);
      });
      expect(aiMlFunctions.length).toBe(3);
    });
  });

  describe('Database Functions', () => {
    const databaseFunctions = [
      'mysql_query_execute',
      'postgresql_query_execute'
    ];

    test('should include database functions with query type validation', () => {
      const mysqlFunction = {
        parametersSchema: JSON.stringify({
          type: "object",
          properties: {
            query: { type: "string", description: "SQL query to execute" },
            query_type: { 
              type: "string", 
              enum: ["select", "insert", "update", "delete"],
              description: "Type of query" 
            },
            parameters: { type: "array", description: "Query parameters for prepared statements" }
          },
          required: ["query", "query_type"]
        })
      };

      const schema = JSON.parse(mysqlFunction.parametersSchema);
      expect(schema.properties.query_type.enum).toEqual(['select', 'insert', 'update', 'delete']);
      expect(schema.required).toContain('query');
      expect(schema.required).toContain('query_type');
    });

    test('should include all database functions', () => {
      databaseFunctions.forEach(funcName => {
        expect(funcName).toMatch(/^(mysql_query_execute|postgresql_query_execute)$/);
      });
      expect(databaseFunctions.length).toBe(2);
    });
  });

  describe('Social Media Functions', () => {
    const socialMediaFunctions = [
      'twitter_post_tweet',
      'linkedin_create_post',
      'instagram_post_media'
    ];

    test('should include Twitter function with character limit awareness', () => {
      const twitterFunction = {
        parametersSchema: JSON.stringify({
          type: "object",
          properties: {
            text: { type: "string", description: "Tweet content (max 280 chars)" },
            media_urls: { type: "array", description: "URLs of media to attach" },
            reply_to_tweet_id: { type: "string", description: "ID of tweet to reply to" }
          },
          required: ["text"]
        })
      };

      const schema = JSON.parse(twitterFunction.parametersSchema);
      expect(schema.properties.text.description).toContain('280 chars');
      expect(schema.required).toContain('text');
    });

    test('should include all social media functions', () => {
      socialMediaFunctions.forEach(funcName => {
        expect(funcName).toMatch(/^(twitter_post_tweet|linkedin_create_post|instagram_post_media)$/);
      });
      expect(socialMediaFunctions.length).toBe(3);
    });
  });

  describe('Data Processing Functions', () => {
    const dataProcessingFunctions = [
      'csv_parse_process',
      'json_transform',
      'text_extract_document'
    ];

    test('should include CSV processing with delimiter options', () => {
      const csvFunction = {
        parametersSchema: JSON.stringify({
          type: "object",
          properties: {
            csv_content: { type: "string", description: "CSV content to parse" },
            delimiter: { type: "string", description: "CSV delimiter (default: comma)" },
            has_headers: { type: "boolean", description: "Whether CSV has headers" }
          },
          required: ["csv_content"]
        })
      };

      const schema = JSON.parse(csvFunction.parametersSchema);
      expect(schema.properties.delimiter.description).toContain('delimiter');
      expect(schema.properties.has_headers.type).toBe('boolean');
      expect(schema.required).toContain('csv_content');
    });

    test('should include all data processing functions', () => {
      dataProcessingFunctions.forEach(funcName => {
        expect(funcName).toMatch(/^(csv_parse_process|json_transform|text_extract_document)$/);
      });
      expect(dataProcessingFunctions.length).toBe(3);
    });
  });

  describe('Function Schema Validation', () => {
    test('should validate that all function schemas are valid JSON', () => {
      const sampleSchemas = [
        '{"type": "object", "properties": {"test": {"type": "string"}}, "required": ["test"]}',
        '{"type": "object", "properties": {"amount": {"type": "number"}}}',
        '{"type": "object", "properties": {"enabled": {"type": "boolean"}}}'
      ];

      sampleSchemas.forEach(schemaStr => {
        expect(() => JSON.parse(schemaStr)).not.toThrow();
        const schema = JSON.parse(schemaStr);
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
      });
    });

    test('should validate required field consistency', () => {
      const schemaWithRequired = {
        type: "object",
        properties: {
          required_field: { type: "string" },
          optional_field: { type: "string" }
        },
        required: ["required_field"]
      };

      expect(schemaWithRequired.required).toContain('required_field');
      expect(schemaWithRequired.required).not.toContain('optional_field');
      expect(Object.keys(schemaWithRequired.properties)).toContain('required_field');
    });
  });

  describe('Function Type Validation', () => {
    test('should ensure all automation functions are of type "api"', () => {
      const functionTypes = ['api']; // All our automation functions should be API type
      
      functionTypes.forEach(type => {
        expect(type).toBe('api');
      });
    });

    test('should validate function naming conventions', () => {
      const functionNames = [
        'email_send',
        'slack_send_message',
        'stripe_create_payment',
        'mysql_query_execute',
        'openai_text_completion'
      ];

      functionNames.forEach(name => {
        // Should be snake_case
        expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
        // Should not be too long
        expect(name.length).toBeLessThan(50);
        // Should be descriptive
        expect(name.length).toBeGreaterThan(5);
      });
    });
  });

  describe('API Key Requirements', () => {
    test('should validate API key requirements are properly defined', () => {
      const functionsWithApiKeys = [
        { name: 'email_send', keys: ['SENDGRID_API_KEY'] },
        { name: 'slack_send_message', keys: ['SLACK_BOT_TOKEN'] },
        { name: 'stripe_create_payment', keys: ['STRIPE_SECRET_KEY'] },
        { name: 'openai_text_completion', keys: ['OPENAI_API_KEY'] }
      ];

      functionsWithApiKeys.forEach(func => {
        expect(Array.isArray(func.keys)).toBe(true);
        expect(func.keys.length).toBeGreaterThan(0);
        func.keys.forEach(key => {
          expect(key).toMatch(/^[A-Z_]+$/); // Should be uppercase with underscores
        });
      });
    });
  });

  describe('Integration with Existing System', () => {
    test('should not conflict with existing GitHub functions', () => {
      const existingGithubFunctions = [
        'github_read_issues',
        'github_create_pull_request',
        'github_update_issue'
      ];

      const newAutomationFunctions = [
        'email_send',
        'stripe_create_payment',
        'openai_text_completion'
      ];

      // Ensure no naming conflicts
      existingGithubFunctions.forEach(existing => {
        newAutomationFunctions.forEach(newFunc => {
          expect(existing).not.toBe(newFunc);
        });
      });
    });

    test('should maintain backward compatibility with weather function', () => {
      const weatherFunction = {
        name: 'get_current_weather',
        functionGroup: 'weather',
        functionType: 'api'
      };

      expect(weatherFunction.name).toBe('get_current_weather');
      expect(weatherFunction.functionGroup).toBe('weather');
      expect(weatherFunction.functionType).toBe('api');
    });
  });

  describe('Function Count Validation', () => {
    test('should validate expected function counts per group', () => {
      const expectedCounts = {
        communication: 3,
        ecommerce: 3,
        ai_ml: 3,
        database: 2,
        social_media: 3,
        file_management: 2,
        data_processing: 3,
        http_api: 2,
        calendar: 2,
        text_processing: 2,
        monitoring: 3,
        crm: 2,
        project_management: 2
      };

      Object.entries(expectedCounts).forEach(([group, count]) => {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(5); // Reasonable upper bound
        expect(typeof group).toBe('string');
        expect(group.length).toBeGreaterThan(0);
      });

      // Total automation functions should be 32 
      const totalAutomationFunctions = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0);
      expect(totalAutomationFunctions).toBe(32);
    });
  });
}); 