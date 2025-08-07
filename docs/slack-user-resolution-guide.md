# Slack User Resolution Guide

This guide explains how the Slack bot handles ambiguous user references using the new user search capabilities.

## Overview

When users make requests like "send a message to John" or "get Sarah's status", the bot needs to resolve which specific user they're referring to. The new user search functions provide this capability.

## Available User Functions

### Core User Functions

1. **`slack_search_users`** - Search for users by name, email, or display name
2. **`slack_list_users`** - Get complete user directory
3. **`slack_get_user_info`** - Get detailed info for specific user
4. **`slack_get_user_presence`** - Get user's online status
5. **`slack_get_team_info`** - Get workspace information

## User Resolution Flow

### 1. Simple Cases (Direct Match)
```
User: "Send message to @johndoe"
→ Direct user ID extraction from mention
→ Use slack_send_message with user ID
```

### 2. Ambiguous Cases (Search Required)
```
User: "Send message to John"
→ Use slack_search_users(query="John")
→ Present options if multiple matches
→ Use slack_send_message with resolved user ID
```

## Example Scenarios

### Scenario 1: Multiple Johns
**User Input:** "Send a message to John saying hello"

**Bot Process:**
1. Recognize ambiguous user reference "John"
2. Call `slack_search_users(query="John")`
3. Find multiple matches:
   - John Smith (john.smith@company.com) - Engineering
   - John Doe (j.doe@company.com) - Marketing  
   - John Wilson (jwilson@company.com) - Sales
4. Ask user to clarify: "I found 3 users named John. Which one did you mean?"
5. User selects: "John Smith from Engineering"
6. Call `slack_send_message` with John Smith's user ID

### Scenario 2: Email-based Search
**User Input:** "What's Sarah's status?"

**Bot Process:**
1. Call `slack_search_users(query="Sarah")`
2. Find: Sarah Connor (s.connor@company.com)
3. Call `slack_get_user_presence(user="U12345")`
4. Response: "Sarah Connor is currently active"

### Scenario 3: Partial Name Match
**User Input:** "Send urgent message to Mike from sales"

**Bot Process:**
1. Call `slack_search_users(query="Mike")`
2. Filter by department context ("sales")
3. Find: Michael Johnson (Sales team)
4. Call `slack_send_message` with urgent message

## Function Usage Examples

### Search Users
```json
{
  "function": "slack_search_users",
  "args": {
    "query": "John",
    "limit": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "members": [
      {
        "id": "U12345",
        "name": "john.smith",
        "real_name": "John Smith",
        "profile": {
          "email": "john.smith@company.com",
          "title": "Senior Engineer"
        }
      }
    ]
  }
}
```

### Get User Presence
```json
{
  "function": "slack_get_user_presence",
  "args": {
    "user": "U12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "presence": "active",
    "online": true,
    "auto_away": false
  }
}
```

## Best Practices

### 1. Graceful Disambiguation
- Always present clear options when multiple users match
- Include relevant context (department, title, email)
- Allow users to refine their search

### 2. Context Awareness
- Use conversation history to remember recent user references
- Consider department/team context when available
- Prioritize active users over inactive ones

### 3. Error Handling
- Handle cases where no users are found
- Provide helpful suggestions for misspelled names
- Fall back to asking for email or user ID

### 4. Privacy Considerations
- Only search within users the bot has access to
- Respect workspace privacy settings
- Don't expose sensitive user information

## Integration with Other Functions

The user search functions work seamlessly with all other Slack functions:

- **`slack_send_message`** - Send to resolved users
- **`slack_get_channel_members`** - Find users in specific channels
- **`slack_read_messages`** - Filter messages by resolved users
- **`slack_add_reaction`** - React to messages from specific users

## Technical Implementation

All user search functions use the generic API approach:
- **Endpoint:** `https://slack.com/api/users.list` (with client-side filtering for search)
- **Authentication:** Bearer token via `{SLACK_BOT_TOKEN}` placeholder
- **Response Processing:** Automatic via `api_source: "slack_api"`
- **Error Handling:** Fallback data when API unavailable

## Future Enhancements

Potential improvements to user resolution:
- Fuzzy name matching for typos
- Integration with Active Directory/LDAP
- User nickname recognition
- Team/department-based filtering
- Presence-aware user suggestions

---

This user resolution system makes your Slack bot much more intelligent and user-friendly by handling the ambiguity that naturally occurs in human communication.