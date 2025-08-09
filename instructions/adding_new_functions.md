# Adding New Functions

This guide provides step-by-step instructions for adding new functions to GoGent. Functions are automatically synced to the database on server startup - no migrations required!

## Overview

Functions are defined as JSON specifications in `system/functions/` and automatically loaded into the database when the server starts.

## Step 1: Create Function Specification

Create a new JSON file in `system/functions/{function_name}.json`:

```json
{
  "name": "provider_function_name",
  "provider": "provider_name",
  "display_name": "Human Readable Function Name",
  "description": "Detailed description of what this function does, including expected inputs and outputs. Be specific about the API it calls and data it returns.",
  "endpoint": {
    "path": "/api/endpoint/path",
    "method": "GET"
  },
  "parameters": {
    "required": ["param1", "param2"],
    "optional": ["param3", "param4"],
    "schema": {
      "type": "object",
      "properties": {
        "param1": {
          "type": "string",
          "description": "Description of parameter 1"
        },
        "param2": {
          "type": "string",
          "description": "Description of parameter 2"
        },
        "param3": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 10,
          "description": "Optional parameter with constraints"
        }
      },
      "required": ["param1", "param2"]
    }
  },
  "examples": [
    {
      "name": "Basic usage example",
      "parameters": {
        "param1": "example_value",
        "param2": "another_value"
      }
    }
  ]
}
```

### Required Fields

- `name`: Unique function identifier (format: `{provider}_{action}_{object}`)
- `provider`: Must match an existing provider name
- `display_name`: Human-readable function name
- `description`: Detailed description for LLM usage
- `endpoint.path`: API endpoint path (can include `{parameter}` placeholders)
- `endpoint.method`: HTTP method (GET, POST, PUT, DELETE, PATCH)
- `parameters.required`: Array of required parameter names
- `parameters.schema`: JSON Schema defining all parameters

### Optional Fields

- `parameters.optional`: Array of optional parameter names
- `parameter_dependencies`: Auto-parameter extraction rules
- `response_transformer`: Response processing configuration
- `provides_to_functions`: Data flow to other functions
- `examples`: Usage examples

## Step 2: Parameter Schema Guidelines

Use JSON Schema format for parameter validation:

### String Parameters
```json
{
  "param_name": {
    "type": "string",
    "description": "Parameter description",
    "enum": ["option1", "option2"],  // For limited choices
    "pattern": "^[a-zA-Z0-9]+$",    // Regex validation
    "minLength": 1,
    "maxLength": 100
  }
}
```

### Integer Parameters
```json
{
  "count": {
    "type": "integer",
    "description": "Number of items to return",
    "minimum": 1,
    "maximum": 1000,
    "default": 10
  }
}
```

### Boolean Parameters
```json
{
  "include_archived": {
    "type": "boolean",
    "description": "Include archived items",
    "default": false
  }
}
```

### Array Parameters
```json
{
  "tags": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "List of tags to filter by"
  }
}
```

## Step 3: Parameter Dependencies (Function Chaining)

For functions that depend on data from other functions:

```json
{
  "parameter_dependencies": {
    "channel": {
      "source_function": "slack_find_channel",
      "extraction_path": "channels[0].id",
      "description": "Auto-extract channel ID from slack_find_channel results"
    }
  }
}
```

### Supported Extraction Paths
- `field` - Direct field access
- `array[0].field` - First array element field
- `nested.field.path` - Nested object field
- `data.results[0].id` - Complex nested path

## Step 4: Endpoint Configuration

### Static Endpoints
```json
{
  "endpoint": {
    "path": "/api/users",
    "method": "GET"
  }
}
```

### Dynamic Endpoints with Parameters
```json
{
  "endpoint": {
    "path": "/api/users/{user_id}/posts",
    "method": "GET"
  }
}
```

### Full URL Override
```json
{
  "endpoint": {
    "path": "https://api.provider.com/v2/custom/endpoint",
    "method": "POST"
  }
}
```

## Step 5: Function Naming Conventions

Follow this pattern: `{provider}_{action}_{object}`

### Examples
- `github_read_issues` - Read issues from GitHub
- `slack_send_message` - Send message via Slack
- `discord_create_channel` - Create Discord channel
- `notion_update_page` - Update Notion page
- `openai_generate_text` - Generate text with OpenAI

### Action Verbs
- `read` / `get` / `fetch` - Retrieve data
- `create` / `add` - Create new resource
- `update` / `edit` / `modify` - Update existing resource
- `delete` / `remove` - Delete resource
- `search` / `find` - Search for resources
- `list` - List multiple resources
- `send` - Send/transmit data

## Step 6: Provider-Specific Examples

### GitHub Function
```json
{
  "name": "github_create_issue",
  "provider": "github",
  "display_name": "GitHub: Create Issue",
  "description": "Create a new issue in a GitHub repository. Requires repository access permissions.",
  "endpoint": {
    "path": "/repos/{owner}/{repo}/issues",
    "method": "POST"
  },
  "parameters": {
    "required": ["owner", "repo", "title"],
    "optional": ["body", "assignees", "labels"],
    "schema": {
      "type": "object",
      "properties": {
        "owner": {
          "type": "string",
          "description": "Repository owner"
        },
        "repo": {
          "type": "string", 
          "description": "Repository name"
        },
        "title": {
          "type": "string",
          "description": "Issue title"
        },
        "body": {
          "type": "string",
          "description": "Issue description/body"
        }
      },
      "required": ["owner", "repo", "title"]
    }
  }
}
```

### Slack Function
```json
{
  "name": "slack_send_message",
  "provider": "slack",
  "display_name": "Slack: Send Message",
  "description": "Send a message to a Slack channel or user. Requires channel ID or user ID.",
  "endpoint": {
    "path": "/chat.postMessage",
    "method": "POST"
  },
  "parameters": {
    "required": ["channel", "text"],
    "optional": ["attachments", "blocks", "thread_ts"],
    "schema": {
      "type": "object",
      "properties": {
        "channel": {
          "type": "string",
          "description": "Channel ID or user ID to send message to"
        },
        "text": {
          "type": "string",
          "description": "Message text content"
        },
        "thread_ts": {
          "type": "string",
          "description": "Timestamp of message to reply to (for threading)"
        }
      },
      "required": ["channel", "text"]
    }
  }
}
```

### Generic REST API Function
```json
{
  "name": "api_get_user_profile",
  "provider": "api_provider",
  "display_name": "API: Get User Profile", 
  "description": "Retrieve user profile information from the API.",
  "endpoint": {
    "path": "/users/{user_id}",
    "method": "GET"
  },
  "parameters": {
    "required": ["user_id"],
    "optional": ["include_details"],
    "schema": {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "string",
          "description": "Unique user identifier"
        },
        "include_details": {
          "type": "boolean",
          "default": false,
          "description": "Include detailed profile information"
        }
      },
      "required": ["user_id"]
    }
  }
}
```

## Step 7: Testing Your Function

1. **Restart server**: `make run-server`
2. **Check sync logs**: Look for `✅ Synced function: function_name`
3. **Test via API**: Use the function in a prompt or API call
4. **Check execution logs**: Verify the function executes correctly

## Step 8: Function Workflows

For multi-step workflows, define functions that work together:

```json
{
  "name": "slack_reply_in_thread",
  "parameter_dependencies": {
    "channel": {
      "source_function": "slack_find_channel",
      "extraction_path": "channels[0].id"
    },
    "thread_ts": {
      "source_function": "slack_read_messages", 
      "extraction_path": "messages[0].ts"
    }
  }
}
```

## Common Patterns

### Data Retrieval
- Get single item: `provider_get_item`
- List multiple items: `provider_list_items`
- Search items: `provider_search_items`

### Data Modification
- Create: `provider_create_item`
- Update: `provider_update_item`
- Delete: `provider_delete_item`

### Communication
- Send message: `provider_send_message`
- Create notification: `provider_create_notification`

## Error Handling

Functions automatically handle:
- Parameter validation
- HTTP errors
- JSON parsing errors
- Authentication failures

## Examples

See existing functions:
- `system/functions/github_read_issues.json` - GitHub API example
- `system/functions/slack_read_messages.json` - Slack API example
- `system/functions/slack_find_channel.json` - Function chaining example

## Advanced Features

### Response Transformers
```json
{
  "response_transformer": {
    "type": "filter_and_format",
    "filter_by": "status",
    "filter_value": "open",
    "format": "summary"
  }
}
```

### Function Relationships
```json
{
  "provides_to_functions": [
    {
      "function": "other_function_name",
      "parameter": "parameter_name",
      "extraction_path": "data.field"
    }
  ]
}
```

That's it! Your function will be automatically available in the system after server restart.