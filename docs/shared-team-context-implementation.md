# Shared Team Context Implementation

## Overview
Add functionality to allow users to specify a "Shared Team Context" when deploying teams from the marketplace. This context should be appended to each agent's template context during team creation, providing shared knowledge and instructions for all agents in the team.

## Current Flow Analysis
1. **Frontend**: `AgentMarketplaceScreen` → `TeamResumeModal` → `handleHireTeam()` → `goGentAPI.createTeamWithAgents()`
2. **Backend**: `createTeamWithAgents()` → Creates team → Creates agents with templates → Agents execute using template context
3. **Context Usage**: Agent templates have `context_template` field used during execution via `template.ContextTemplate`

## Implementation Plan

### ✅ Phase 1: Analysis & Design (COMPLETED)
- [x] Analyze current team deployment flow
- [x] Understand context handling in templates and execution
- [x] Design context appending strategy
- [x] Choose implementation approach (Option A: Modify during creation)

### ✅ Phase 2: Frontend Changes (COMPLETED)
- [x] **Task 1**: Add shared team context input field to TeamResumeModal component
- [x] **Task 2**: Update frontend API interfaces to include sharedTeamContext field
- [x] **Task 3**: Update handleHireTeam function to pass shared context

### ✅ Phase 3: Backend Changes (COMPLETED)
- [x] **Task 4**: Update backend types to include sharedTeamContext in TeamWithAgentsCreateRequest
- [x] **Task 5**: Modify team creation logic to append shared context to agent templates
- [x] **Task 6**: Implement context appending logic that preserves template context

### ✅ Phase 4: Database & Execution (COMPLETED)
- [x] **Task 7**: Add effective_context field to agents table via migration
- [x] **Task 8**: Update execution logic to use effective context

### 🔄 Phase 5: Testing & Validation
- [ ] **Task 9**: Test the complete flow to ensure context is properly appended to all agents
- [ ] **Task 10**: Validate edge cases (empty context, long context, special characters)

## Technical Details

### Frontend Changes
```typescript
interface TeamWithAgentsCreateRequest {
  name: string;
  description?: string;
  maxTokensPerDay: number;
  teamConfigId?: string;
  sharedTeamContext?: string; // NEW FIELD
  agents: AgentCreateRequestForTeam[];
}
```

### Backend Changes
```go
type TeamWithAgentsCreateRequest struct {
    Name               string                      `json:"name" validate:"required,min=1,max=100"`
    Description        *string                     `json:"description,omitempty" validate:"omitempty,max=500"`
    MaxTokensPerDay    int32                       `json:"maxTokensPerDay" validate:"required,min=1000"`
    TeamConfigId       *string                     `json:"teamConfigId,omitempty"`
    SharedTeamContext  *string                     `json:"sharedTeamContext,omitempty" validate:"omitempty,max=2000"`
    Agents             []AgentCreateRequestForTeam `json:"agents" validate:"required,min=1"`
}
```

### Context Appending Strategy
```go
func appendSharedContextToTemplate(template *types.ExecutionTemplate, sharedContext string) string {
    if sharedContext == "" {
        return template.ContextTemplate
    }
    
    if template.ContextTemplate == "" {
        return sharedContext
    }
    
    // Append shared context with proper formatting
    return template.ContextTemplate + "\n\n--- SHARED TEAM CONTEXT ---\n" + sharedContext
}
```

## Implementation Approach
**Option A: Modify Template Context During Creation (RECOMMENDED)**
- Append shared context to each agent's template context during team creation
- Store the modified context in a new database field
- Pros: Clean separation, doesn't affect original templates, no runtime overhead
- Cons: Requires database schema changes

## Potential Challenges & Solutions
1. **Context length limits**: Add validation (max 2000 characters)
2. **Context formatting**: Use clear separators and formatting
3. **Template parameter substitution**: Apply to both original and shared context
4. **Backward compatibility**: Make shared context optional

## Progress Log
- **2024-12-19**: Created implementation plan and started analysis
- **2024-12-19**: Completed feasibility analysis and design phase
- **2024-12-19**: Completed frontend changes (UI, API interfaces, and team creation flow)
- **2024-12-19**: Completed backend changes (types, team creation logic, context appending)
- **2024-12-19**: Completed database migration for effective_context column
- **2024-12-19**: Completed execution logic to use effective context
- **2024-12-19**: PENDING: Testing and validation of complete flow

## Notes
- Feature is highly feasible and aligns with existing architecture
- Implementation follows established patterns in the codebase
- Clear separation of concerns between frontend UI and backend logic
- No breaking changes to existing functionality
