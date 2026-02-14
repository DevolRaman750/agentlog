package tasks

import (
	"encoding/json"
	"fmt"

	"gogent/internal/types"
)

// ValidateContextSource validates a context source has required fields for its type
func ValidateContextSource(cs types.ContextSource) error {
	switch cs.Type {
	case types.ContextGitHub:
		var gh types.GitHubContext
		if err := json.Unmarshal(cs.Data, &gh); err != nil {
			return fmt.Errorf("invalid github context data: %w", err)
		}
		if gh.Owner == "" || gh.Repo == "" {
			return fmt.Errorf("github context requires owner and repo")
		}
		return nil

	case types.ContextSlack:
		var sl types.SlackContext
		if err := json.Unmarshal(cs.Data, &sl); err != nil {
			return fmt.Errorf("invalid slack context data: %w", err)
		}
		if sl.Channel == "" {
			return fmt.Errorf("slack context requires channel")
		}
		return nil

	case types.ContextJira:
		var ji types.JiraContext
		if err := json.Unmarshal(cs.Data, &ji); err != nil {
			return fmt.Errorf("invalid jira context data: %w", err)
		}
		if ji.ProjectKey == "" {
			return fmt.Errorf("jira context requires project_key")
		}
		return nil

	case types.ContextCustom:
		var cu types.CustomContext
		if err := json.Unmarshal(cs.Data, &cu); err != nil {
			return fmt.Errorf("invalid custom context data: %w", err)
		}
		if cu.Name == "" {
			return fmt.Errorf("custom context requires name")
		}
		return nil

	default:
		return fmt.Errorf("unknown context source type: %s", cs.Type)
	}
}

// ValidateAllContextSources validates all context sources on a task
func ValidateAllContextSources(sources []types.ContextSource) error {
	for i, cs := range sources {
		if err := ValidateContextSource(cs); err != nil {
			return fmt.Errorf("context source [%d]: %w", i, err)
		}
	}
	return nil
}

// ParseContextSourceData parses the raw JSON data of a context source into its typed struct
func ParseContextSourceData(cs types.ContextSource) (interface{}, error) {
	switch cs.Type {
	case types.ContextGitHub:
		var gh types.GitHubContext
		if err := json.Unmarshal(cs.Data, &gh); err != nil {
			return nil, fmt.Errorf("failed to parse github context: %w", err)
		}
		return &gh, nil

	case types.ContextSlack:
		var sl types.SlackContext
		if err := json.Unmarshal(cs.Data, &sl); err != nil {
			return nil, fmt.Errorf("failed to parse slack context: %w", err)
		}
		return &sl, nil

	case types.ContextJira:
		var ji types.JiraContext
		if err := json.Unmarshal(cs.Data, &ji); err != nil {
			return nil, fmt.Errorf("failed to parse jira context: %w", err)
		}
		return &ji, nil

	case types.ContextCustom:
		var cu types.CustomContext
		if err := json.Unmarshal(cs.Data, &cu); err != nil {
			return nil, fmt.Errorf("failed to parse custom context: %w", err)
		}
		return &cu, nil

	default:
		return nil, fmt.Errorf("unknown context source type: %s", cs.Type)
	}
}
