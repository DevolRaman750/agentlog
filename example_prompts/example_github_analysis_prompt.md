# Example GitHub Issue Analysis & Fix Prompt

## Best General Purpose Prompt ⭐

```
Please help me address the open issues in the GitHub repository `imran31415/agentlog`. 

You MUST automatically call the appropriate GitHub functions in sequence. Do not ask me to provide function calls - execute them yourself immediately.

1. **Issue Discovery**: Call github_read_issues to read the current open issues

2. **Code Investigation**: For EVERY issue you find, automatically call github_read_code to:
   - Read specific files mentioned in the issue (like cmd/gogent directory)
   - Examine the codebase structure and patterns  
   - Look at existing implementations for guidance

3. **Solution Development**: For each issue, provide:
   - Specific, actionable steps to address the issue
   - Complete code examples with exact file paths
   - Full file templates for new code (tests, documentation, etc.)
   - Clear explanation of the approach and why it solves the issue

4. **Implementation Guidance**: Give practical next steps for implementing the solutions

Start by calling github_read_issues, then immediately call github_read_code for whatever directories or files are mentioned in the issues. Do not stop to ask for permission - execute all necessary function calls automatically.
```

## For Testing/Quality Issues 🧪

If you specifically want help with testing (like the issue in your repo):

```
I need help addressing testing and code quality issues in the GitHub repository `imran31415/agentlog`. Please:

1. **Issue Analysis**: Read the open issues to understand what testing/quality improvements are needed

2. **Current State Review**: Examine the existing codebase to see:
   - What tests already exist (if any)
   - What testing frameworks are used
   - What areas of code need test coverage
   - Current testing patterns and structure

3. **Solution Implementation**: Provide specific deliverables:
   - Complete test files with full implementation
   - Testing setup and configuration files
   - Examples of different types of tests (unit, integration, etc.)
   - Documentation on how to run the tests

4. **Best Practices**: Include guidance on testing patterns and maintaining test quality

Start by reading the issues, then examine the codebase structure to understand what testing approach would work best.
```

## For Any Repository 🌟

The most flexible approach - works with any type of issues:

```
Help me work through the issues in the GitHub repository `imran31415/agentlog`. 

Please read the open issues and then examine whatever code is needed to understand and address each issue. Provide specific implementations, code examples, and clear guidance for whatever needs to be done.
```

## Usage Instructions

To use these prompts effectively:

1. **Replace repository details**: Change `imran31415/agentlog` to your target repository
2. **Customize focus areas**: Modify the specific areas you want to investigate
3. **Enable function calling**: Make sure GitHub functions are enabled in your execution
4. **Provide API access**: Ensure your GitHub API key has read access to the repository

## Expected Function Call Flow

The AI should automatically:
1. Call `github_repo_info` to understand the repository
2. Call `github_read_issues` to get current issues  
3. Call `github_read_code` for files mentioned in issues
4. Potentially call `github_read_code` again for related files
5. Provide analysis and fix recommendations

## Tips for Better Results

- **Let the AI discover the issues first** - Don't assume what type of issues exist
- **Ask for complete implementations** - Request full file contents, not just snippets  
- **Request practical guidance** - Ask for setup instructions and how to run/test the solutions
- **Be specific about deliverables** - If you need tests, ask for complete test files with examples
- **Ask for patterns** - Request explanations of best practices and code organization 