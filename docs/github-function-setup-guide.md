# GitHub Function Setup Guide

This guide explains how to properly configure and troubleshoot the `github_read_code` function in GoGent.

## The Problem

You're getting `HTTP 404 error for github_read_code` because the function requires proper authentication with GitHub's API.

## Root Cause Analysis

After reviewing the GitHub API documentation and Gemini function calling requirements, the main issues were:

1. **Missing GitHub API Key**: The function requires a valid GitHub Personal Access Token
2. **Incorrect API Headers**: Was using outdated GitHub API version headers
3. **Authentication Integration**: The API key needs to be properly configured in the system

## Solution Applied

I've created two database migrations to fix these issues:

### Migration 000020: Fixed GitHub Function Schema

- Updated headers to use correct GitHub API version (`application/vnd.github+json`)
- Added proper `X-GitHub-Api-Version: 2022-11-28` header
- Ensured function schema matches Gemini's function calling requirements
- Added helper function for setup guidance

### Migration 000021: Added API Key Management

- Created `user_api_keys` table for secure API key storage
- Added system for managing GitHub API keys
- Created setup documentation functions

## How to Configure GitHub API Access

### Step 1: Generate GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "GoGent API Access"
4. Select scopes:
   - `public_repo` (for public repositories)
   - `repo` (for private repositories, if needed)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### Step 2: Configure the API Key in GoGent

You'll need to add the GitHub API key to your GoGent configuration. The exact method depends on how your application manages API keys.

**Option A: Environment Variable**
Add to your `config.env` file:
```bash
GITHUB_API_KEY=your_github_token_here
```

**Option B: Database Configuration**
Insert directly into the database:
```sql
INSERT INTO user_api_keys (
    id,
    user_id,
    service_name,
    api_key_name,
    api_key_value_encrypted,
    is_active
) VALUES (
    'github-api-key',
    'system',
    'github',
    'githubApiKey',
    'your_github_token_here',
    TRUE
);
```

### Step 3: Test the Function

Try calling the function with a simple request:

```json
{
  "function": "github_read_code",
  "parameters": {
    "owner": "microsoft",
    "repo": "vscode",
    "path": ""
  }
}
```

This should return the root directory listing of the VSCode repository.

## Function Schema

The `github_read_code` function now follows this schema:

```json
{
  "name": "github_read_code",
  "description": "Read files and directory contents from a GitHub repository. This function retrieves file contents, directory listings, or repository structure information. IMPORTANT: Start by exploring the repository structure with path=\"\" (empty) to see available directories and files, then navigate to specific paths.",
  "parameters": {
    "type": "object",
    "properties": {
      "owner": {
        "type": "string",
        "description": "GitHub username or organization name (e.g., \"microsoft\", \"facebook\", \"google\")"
      },
      "repo": {
        "type": "string",
        "description": "Repository name (e.g., \"vscode\", \"react\", \"tensorflow\")"
      },
      "path": {
        "type": "string",
        "description": "File or directory path within the repo. Use empty string \"\" for root directory, \"src/\" for src directory, or \"README.md\" for specific files.",
        "default": ""
      },
      "ref": {
        "type": "string",
        "description": "Branch, tag, or commit SHA. Examples: \"main\", \"develop\", \"v1.0.0\". If not specified, uses the default branch.",
        "default": ""
      }
    },
    "required": ["owner", "repo"]
  }
}
```

## Troubleshooting

### HTTP 404 Errors

1. **Repository doesn't exist**: Check that the owner/repo combination is correct
2. **Private repository**: Ensure your API key has access to private repos if needed
3. **Invalid path**: Start with empty path (`""`) to explore the repository structure
4. **API key not configured**: Verify the GitHub API key is properly set

### HTTP 403 Errors

1. **Insufficient permissions**: API key may not have `repo` scope
2. **Rate limiting**: GitHub API has rate limits, wait and try again
3. **Repository access**: The API key user may not have access to the repository

### HTTP 401 Errors

1. **Invalid API key**: Check that the token is correct and not expired
2. **Missing authentication**: API key not being passed to GitHub API

## API Reference

The function uses GitHub's Contents API:
- **Endpoint**: `https://api.github.com/repos/{owner}/{repo}/contents/{path}`
- **Method**: GET
- **Authentication**: Bearer token in Authorization header
- **Headers**: 
  - `Accept: application/vnd.github+json`
  - `X-GitHub-Api-Version: 2022-11-28`
  - `User-Agent: GoGent-App`

## Gemini Function Calling Compatibility

The function schema is designed to work optimally with Google's Gemini AI:

1. **Clear descriptions**: Help Gemini understand when and how to use the function
2. **Proper parameter types**: Follow OpenAPI JSON Schema format
3. **Required vs optional**: Only owner and repo are required, path and ref are optional
4. **Default values**: Empty string defaults for optional parameters
5. **Examples in descriptions**: Help the AI understand expected input formats

## Next Steps

1. Configure your GitHub API key
2. Test with a simple repository call
3. Try more complex queries once basic functionality works
4. Monitor logs for any authentication issues

The function should now work correctly with both public and private repositories (depending on your API key permissions). 