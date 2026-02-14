package tasks

import (
	"encoding/json"
	"testing"

	"gogent/internal/types"
)

// --- State Machine Tests (pure unit, no DB) ---

func TestValidTransitions(t *testing.T) {
	tests := []struct {
		name     string
		from     types.TaskState
		to       types.TaskState
		expected bool
	}{
		// defining transitions
		{"defining→compiling", types.TaskStateDefining, types.TaskStateCompiling, true},
		{"defining→compiled", types.TaskStateDefining, types.TaskStateCompiled, true},
		{"defining→failed", types.TaskStateDefining, types.TaskStateFailed, true},
		{"defining→in_progress (invalid)", types.TaskStateDefining, types.TaskStateInProgress, false},
		{"defining→completed (invalid)", types.TaskStateDefining, types.TaskStateCompleted, false},

		// compiling transitions
		{"compiling→compiled", types.TaskStateCompiling, types.TaskStateCompiled, true},
		{"compiling→failed", types.TaskStateCompiling, types.TaskStateFailed, true},
		{"compiling→defining", types.TaskStateCompiling, types.TaskStateDefining, true},
		{"compiling→in_progress (invalid)", types.TaskStateCompiling, types.TaskStateInProgress, false},
		{"compiling→completed (invalid)", types.TaskStateCompiling, types.TaskStateCompleted, false},

		// compiled transitions
		{"compiled→in_progress", types.TaskStateCompiled, types.TaskStateInProgress, true},
		{"compiled→failed", types.TaskStateCompiled, types.TaskStateFailed, true},
		{"compiled→defining (invalid)", types.TaskStateCompiled, types.TaskStateDefining, false},
		{"compiled→compiling (invalid)", types.TaskStateCompiled, types.TaskStateCompiling, false},
		{"compiled→completed (invalid)", types.TaskStateCompiled, types.TaskStateCompleted, false},

		// in_progress transitions
		{"in_progress→completed", types.TaskStateInProgress, types.TaskStateCompleted, true},
		{"in_progress→failed", types.TaskStateInProgress, types.TaskStateFailed, true},
		{"in_progress→compiled", types.TaskStateInProgress, types.TaskStateCompiled, true},
		{"in_progress→defining (invalid)", types.TaskStateInProgress, types.TaskStateDefining, false},
		{"in_progress→compiling (invalid)", types.TaskStateInProgress, types.TaskStateCompiling, false},

		// completed is terminal
		{"completed→defining (invalid)", types.TaskStateCompleted, types.TaskStateDefining, false},
		{"completed→failed (invalid)", types.TaskStateCompleted, types.TaskStateFailed, false},
		{"completed→in_progress (invalid)", types.TaskStateCompleted, types.TaskStateInProgress, false},

		// failed transitions
		{"failed→defining", types.TaskStateFailed, types.TaskStateDefining, true},
		{"failed→compiling (invalid)", types.TaskStateFailed, types.TaskStateCompiling, false},
		{"failed→compiled (invalid)", types.TaskStateFailed, types.TaskStateCompiled, false},
		{"failed→in_progress (invalid)", types.TaskStateFailed, types.TaskStateInProgress, false},
		{"failed→completed (invalid)", types.TaskStateFailed, types.TaskStateCompleted, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			allowed := validTransitions[tt.from]
			found := false
			for _, s := range allowed {
				if s == tt.to {
					found = true
					break
				}
			}
			if found != tt.expected {
				t.Errorf("transition %s → %s: got allowed=%v, want %v", tt.from, tt.to, found, tt.expected)
			}
		})
	}
}

func TestAllStatesHaveTransitionEntries(t *testing.T) {
	allStates := []types.TaskState{
		types.TaskStateDefining,
		types.TaskStateCompiling,
		types.TaskStateCompiled,
		types.TaskStateInProgress,
		types.TaskStateCompleted,
		types.TaskStateFailed,
	}

	for _, state := range allStates {
		if _, ok := validTransitions[state]; !ok {
			t.Errorf("state %s has no entry in validTransitions map", state)
		}
	}
}

func TestCompletedIsTerminal(t *testing.T) {
	transitions := validTransitions[types.TaskStateCompleted]
	if len(transitions) != 0 {
		t.Errorf("completed state should be terminal (no transitions), but has %d: %v", len(transitions), transitions)
	}
}

// --- Context Validation Tests (pure unit, no DB) ---

func TestValidateContextSource_GitHub(t *testing.T) {
	tests := []struct {
		name    string
		data    types.GitHubContext
		wantErr bool
	}{
		{
			name:    "valid with owner and repo",
			data:    types.GitHubContext{Owner: "acme", Repo: "backend"},
			wantErr: false,
		},
		{
			name:    "valid with all fields",
			data:    types.GitHubContext{Owner: "acme", Repo: "backend", Branch: "main", IssueNumber: intPtr(42)},
			wantErr: false,
		},
		{
			name:    "missing owner",
			data:    types.GitHubContext{Repo: "backend"},
			wantErr: true,
		},
		{
			name:    "missing repo",
			data:    types.GitHubContext{Owner: "acme"},
			wantErr: true,
		},
		{
			name:    "both missing",
			data:    types.GitHubContext{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dataJSON, _ := json.Marshal(tt.data)
			cs := types.ContextSource{Type: types.ContextGitHub, Data: dataJSON}
			err := ValidateContextSource(cs)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateContextSource() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateContextSource_Slack(t *testing.T) {
	tests := []struct {
		name    string
		data    types.SlackContext
		wantErr bool
	}{
		{
			name:    "valid with channel",
			data:    types.SlackContext{Channel: "#general"},
			wantErr: false,
		},
		{
			name:    "missing channel",
			data:    types.SlackContext{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dataJSON, _ := json.Marshal(tt.data)
			cs := types.ContextSource{Type: types.ContextSlack, Data: dataJSON}
			err := ValidateContextSource(cs)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateContextSource() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateContextSource_Jira(t *testing.T) {
	tests := []struct {
		name    string
		data    types.JiraContext
		wantErr bool
	}{
		{
			name:    "valid with project_key",
			data:    types.JiraContext{ProjectKey: "PROJ"},
			wantErr: false,
		},
		{
			name:    "missing project_key",
			data:    types.JiraContext{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dataJSON, _ := json.Marshal(tt.data)
			cs := types.ContextSource{Type: types.ContextJira, Data: dataJSON}
			err := ValidateContextSource(cs)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateContextSource() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateContextSource_Custom(t *testing.T) {
	tests := []struct {
		name    string
		data    types.CustomContext
		wantErr bool
	}{
		{
			name:    "valid with name",
			data:    types.CustomContext{Name: "my-source", Fields: map[string]interface{}{"key": "val"}},
			wantErr: false,
		},
		{
			name:    "missing name",
			data:    types.CustomContext{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dataJSON, _ := json.Marshal(tt.data)
			cs := types.ContextSource{Type: types.ContextCustom, Data: dataJSON}
			err := ValidateContextSource(cs)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateContextSource() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateContextSource_UnknownType(t *testing.T) {
	cs := types.ContextSource{Type: "unknown", Data: json.RawMessage(`{}`)}
	err := ValidateContextSource(cs)
	if err == nil {
		t.Error("expected error for unknown context source type")
	}
}

func TestValidateContextSource_InvalidJSON(t *testing.T) {
	cs := types.ContextSource{Type: types.ContextGitHub, Data: json.RawMessage(`{not valid`)}
	err := ValidateContextSource(cs)
	if err == nil {
		t.Error("expected error for invalid JSON data")
	}
}

func TestValidateAllContextSources(t *testing.T) {
	ghData, _ := json.Marshal(types.GitHubContext{Owner: "o", Repo: "r"})
	slData, _ := json.Marshal(types.SlackContext{Channel: "#c"})

	// All valid
	err := ValidateAllContextSources([]types.ContextSource{
		{Type: types.ContextGitHub, Data: ghData},
		{Type: types.ContextSlack, Data: slData},
	})
	if err != nil {
		t.Errorf("expected no error for valid sources, got: %v", err)
	}

	// One invalid
	badData, _ := json.Marshal(types.GitHubContext{Owner: ""})
	err = ValidateAllContextSources([]types.ContextSource{
		{Type: types.ContextGitHub, Data: ghData},
		{Type: types.ContextGitHub, Data: badData},
	})
	if err == nil {
		t.Error("expected error when one source is invalid")
	}

	// Empty list is valid
	err = ValidateAllContextSources(nil)
	if err != nil {
		t.Errorf("expected no error for nil sources, got: %v", err)
	}
}

// --- Tree Path Tests (pure unit, no DB) ---

func TestParsePathIDs(t *testing.T) {
	tests := []struct {
		name     string
		path     string
		expected []string
	}{
		{"empty", "", nil},
		{"root slash", "/", nil},
		{"single ancestor", "/root-id/", []string{"root-id"}},
		{"two ancestors", "/root-id/parent-id/", []string{"root-id", "parent-id"}},
		{"three ancestors", "/a/b/c/", []string{"a", "b", "c"}},
		{"no trailing slash", "/a/b", []string{"a", "b"}},
		{"no leading slash", "a/b/", []string{"a", "b"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parsePathIDs(tt.path)
			if len(result) != len(tt.expected) {
				t.Errorf("parsePathIDs(%q) = %v (len %d), want %v (len %d)", tt.path, result, len(result), tt.expected, len(tt.expected))
				return
			}
			for i := range result {
				if result[i] != tt.expected[i] {
					t.Errorf("parsePathIDs(%q)[%d] = %q, want %q", tt.path, i, result[i], tt.expected[i])
				}
			}
		})
	}
}

func TestTreePathComputation(t *testing.T) {
	// Simulate path computation as done in CreateTask
	// Root task: depth=0, path="/"
	// Child of root: depth=1, path="/root_id/"
	// Grandchild: depth=2, path="/root_id/child_id/"

	rootID := "root-task-001"
	rootPath := "/"
	rootDepth := 0

	childPath := rootPath + rootID + "/"
	childDepth := rootDepth + 1

	if childPath != "/root-task-001/" {
		t.Errorf("child path = %q, want %q", childPath, "/root-task-001/")
	}
	if childDepth != 1 {
		t.Errorf("child depth = %d, want 1", childDepth)
	}

	childID := "child-task-002"
	grandchildPath := childPath + childID + "/"
	grandchildDepth := childDepth + 1

	if grandchildPath != "/root-task-001/child-task-002/" {
		t.Errorf("grandchild path = %q, want %q", grandchildPath, "/root-task-001/child-task-002/")
	}
	if grandchildDepth != 2 {
		t.Errorf("grandchild depth = %d, want 2", grandchildDepth)
	}

	// Verify ancestor extraction from grandchild path
	ancestors := parsePathIDs(grandchildPath)
	if len(ancestors) != 2 {
		t.Fatalf("expected 2 ancestors, got %d: %v", len(ancestors), ancestors)
	}
	if ancestors[0] != rootID {
		t.Errorf("ancestor[0] = %q, want %q", ancestors[0], rootID)
	}
	if ancestors[1] != childID {
		t.Errorf("ancestor[1] = %q, want %q", ancestors[1], childID)
	}
}

// --- SQL Helper Tests (pure unit, no DB) ---

func TestNullString(t *testing.T) {
	ns := nullString("")
	if ns.Valid {
		t.Error("nullString('') should be invalid")
	}

	ns = nullString("hello")
	if !ns.Valid || ns.String != "hello" {
		t.Errorf("nullString('hello') = {%q, %v}, want {'hello', true}", ns.String, ns.Valid)
	}
}

func TestNullStringPtr(t *testing.T) {
	ns := nullStringPtr(nil)
	if ns.Valid {
		t.Error("nullStringPtr(nil) should be invalid")
	}

	empty := ""
	ns = nullStringPtr(&empty)
	if ns.Valid {
		t.Error("nullStringPtr(&'') should be invalid")
	}

	val := "hello"
	ns = nullStringPtr(&val)
	if !ns.Valid || ns.String != "hello" {
		t.Errorf("nullStringPtr(&'hello') = {%q, %v}, want {'hello', true}", ns.String, ns.Valid)
	}
}

func TestNullTime(t *testing.T) {
	nt := nullTime(nil)
	if nt.Valid {
		t.Error("nullTime(nil) should be invalid")
	}
}

func TestNullFailureType(t *testing.T) {
	ns := nullFailureType(nil)
	if ns.Valid {
		t.Error("nullFailureType(nil) should be invalid")
	}

	ft := types.FailureExecutionError
	ns = nullFailureType(&ft)
	if !ns.Valid || ns.String != "execution_error" {
		t.Errorf("nullFailureType(&execution_error) = {%q, %v}, want {'execution_error', true}", ns.String, ns.Valid)
	}
}

// --- ParseContextSourceData Tests ---

func TestParseContextSourceData(t *testing.T) {
	ghData, _ := json.Marshal(types.GitHubContext{Owner: "acme", Repo: "app"})
	cs := types.ContextSource{Type: types.ContextGitHub, Data: ghData}

	parsed, err := ParseContextSourceData(cs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	gh, ok := parsed.(*types.GitHubContext)
	if !ok {
		t.Fatalf("expected *GitHubContext, got %T", parsed)
	}
	if gh.Owner != "acme" || gh.Repo != "app" {
		t.Errorf("parsed context = {Owner: %q, Repo: %q}, want {acme, app}", gh.Owner, gh.Repo)
	}
}

func TestParseContextSourceData_AllTypes(t *testing.T) {
	tests := []struct {
		name     string
		csType   types.ContextSourceType
		data     interface{}
		checkFn  func(t *testing.T, result interface{})
	}{
		{
			name:   "github",
			csType: types.ContextGitHub,
			data:   types.GitHubContext{Owner: "o", Repo: "r"},
			checkFn: func(t *testing.T, result interface{}) {
				gh := result.(*types.GitHubContext)
				if gh.Owner != "o" {
					t.Errorf("owner = %q, want 'o'", gh.Owner)
				}
			},
		},
		{
			name:   "slack",
			csType: types.ContextSlack,
			data:   types.SlackContext{Channel: "#ch"},
			checkFn: func(t *testing.T, result interface{}) {
				sl := result.(*types.SlackContext)
				if sl.Channel != "#ch" {
					t.Errorf("channel = %q, want '#ch'", sl.Channel)
				}
			},
		},
		{
			name:   "jira",
			csType: types.ContextJira,
			data:   types.JiraContext{ProjectKey: "PK"},
			checkFn: func(t *testing.T, result interface{}) {
				ji := result.(*types.JiraContext)
				if ji.ProjectKey != "PK" {
					t.Errorf("project_key = %q, want 'PK'", ji.ProjectKey)
				}
			},
		},
		{
			name:   "custom",
			csType: types.ContextCustom,
			data:   types.CustomContext{Name: "x", Fields: map[string]interface{}{"k": "v"}},
			checkFn: func(t *testing.T, result interface{}) {
				cu := result.(*types.CustomContext)
				if cu.Name != "x" {
					t.Errorf("name = %q, want 'x'", cu.Name)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dataJSON, _ := json.Marshal(tt.data)
			cs := types.ContextSource{Type: tt.csType, Data: dataJSON}
			result, err := ParseContextSourceData(cs)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			tt.checkFn(t, result)
		})
	}
}

// --- Helpers ---

func intPtr(n int) *int {
	return &n
}
