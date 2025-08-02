# New GitHub System Functions

This document describes the three new GitHub system functions that have been added to extend the platform's GitHub integration capabilities.

## Overview

The following functions have been added to support more comprehensive GitHub workflow automation:

1. **GitHub Add Comment** - Add comments to issues and pull requests
2. **GitHub Create Branch** - Create new branches from existing refs
3. **GitHub Create/Update File** - Create or update files with automatic commits

These functions are designed to work seamlessly with Gemini function calling and follow the same patterns as existing GitHub functions.

## Functions

### 1. GitHub Add Comment (`github_add_comment`)

**Purpose**: Add comments to GitHub issues or pull requests with full Markdown support.

**Use Cases**:
- AI agents providing code analysis results
- Automated status updates on issues
- Cross-referencing related issues
- Adding investigation findings

**Key Parameters**:
- `owner`: Repository owner (username/organization)
- `repo`: Repository name
- `issue_number`: Issue or PR number to comment on
- `body`: Comment content (supports Markdown)
- `reaction`: Optional emoji reaction to add to your own comment

**Example**:
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "issue_number": 123,
  "body": "## Analysis Results\n\nI found the bug is in `src/auth.js` at line 45:\n\n```javascript\nif (user.isValid) {\n  // Missing return statement\n}\n```",
  "reaction": "eyes"
}
```

### 2. GitHub Create Branch (`github_create_branch`)

**Purpose**: Create new branches from existing branches, tags, or commits.

**Use Cases**:
- Starting new feature development
- Creating hotfix branches
- Experimental branch creation
- Automated branch creation for issue resolution

**Key Parameters**:
- `owner`: Repository owner
- `repo`: Repository name
- `branch_name`: Name for the new branch (use descriptive names)
- `source_branch`: Source to branch from (defaults to 'main')

**Example**:
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "branch_name": "feature/ai-code-analysis",
  "source_branch": "main"
}
```

### 3. GitHub Create/Update File (`github_create_update_file`)

**Purpose**: Create new files or update existing files with automatic commit creation.

**Use Cases**:
- AI-generated code modifications
- Documentation updates
- Configuration file changes
- Automated bug fixes

**Key Parameters**:
- `owner`: Repository owner
- `repo`: Repository name
- `path`: File path within the repository
- `content`: File content (will be base64 encoded automatically)
- `message`: Commit message
- `branch`: Target branch (optional, defaults to default branch)
- `sha`: Required when updating existing files (get from `github_read_code`)

**Example**:
```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "path": "src/utils/helper.js",
  "content": "// AI-generated helper function\nfunction validateUser(user) {\n  return user && user.isValid;\n}",
  "message": "Add AI-generated user validation helper",
  "branch": "feature/ai-code-analysis"
}
```

## Integration Notes

### Gemini Function Calling Compatibility

All functions are designed to work with Gemini's function calling system:

- **Parameter Schemas**: Follow OpenAPI/JSON Schema standards
- **Error Handling**: Include comprehensive fallback responses
- **Examples**: Rich examples provided for each parameter
- **Validation**: Built-in parameter validation and type checking

### API Token Requirements

All functions require a GitHub API token with appropriate scopes:

- **Read Operations**: Public repository access (or private with repo scope)
- **Write Operations**: Repository write access required
- **Specific Scopes**:
  - Issues: `repo` scope for private repos, none needed for public
  - Comments: `repo` scope for private repos, none needed for public
  - Branches: `repo` scope required
  - File Operations: `repo` scope required

### Workflow Recommendations

1. **Issue Analysis Workflow**:
   ```
   github_read_issues → github_read_code → github_add_comment
   ```

2. **Code Improvement Workflow**:
   ```
   github_analyze_repository → github_create_branch → github_create_update_file
   ```

3. **Bug Fix Workflow**:
   ```
   github_read_issues → github_read_code → github_create_branch → github_create_update_file → github_add_comment
   ```

## Database Schema

The functions are stored in the `function_definitions` table with:
- `function_group`: "github"
- `is_system_resource`: true
- `user_id`: "system"
- Comprehensive parameter schemas and fallback data

## Testing

To test these functions:

1. Ensure your GitHub API token has the required scopes
2. Use the mock responses for development/testing
3. Check the `_metadata.source` field to distinguish between real and fallback responses
4. Test with both public and private repositories

## Migration

The functions were added via migration `000011_add_extended_github_functions.up.sql` and can be removed using the corresponding down migration if needed. 