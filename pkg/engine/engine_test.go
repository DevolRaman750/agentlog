package engine

import (
	"context"
	"errors"
	"testing"
	"time"

	"gogent/internal/types"
)

type fakeProvider struct {
	resp *types.APIResponse
	err  error
}

func (f *fakeProvider) Generate(ctx context.Context, cfg *types.APIConfiguration, req *types.APIRequest) (*types.APIResponse, error) {
	// include a nominal response time for assertions
	r := f.resp
	if r == nil {
		r = &types.APIResponse{}
	}
	if r.ResponseTimeMs == 0 {
		r.ResponseTimeMs = 1
	}
	r.RequestID = req.ID
	return r, f.err
}

type fakeStore struct {
	loggedReq  bool
	loggedResp bool
}

func (s *fakeStore) LogAPIRequest(ctx context.Context, userID string, req *types.APIRequest) error {
	s.loggedReq = true
	return nil
}
func (s *fakeStore) LogAPIResponse(ctx context.Context, userID string, resp *types.APIResponse) error {
	s.loggedResp = true
	return nil
}

type fakeLogger struct{ events []string }

func (l *fakeLogger) FlowEvent(name string, seq int, status string, payload map[string]interface{}) {
	l.events = append(l.events, name+":"+status)
}

func TestEngine_ExecuteSingle_Success(t *testing.T) {
	fp := &fakeProvider{resp: &types.APIResponse{ResponseStatus: types.ResponseStatusSuccess, ResponseText: "ok", ResponseTimeMs: 2, CreatedAt: time.Now()}}
	fs := &fakeStore{}
	fl := &fakeLogger{}
	eng := &Engine{Provider: fp, Store: fs, Logger: fl}

	cfg := &types.APIConfiguration{ID: "cfg1", VariationName: "v1", ModelName: "gemini-1.5"}
	vr, err := eng.ExecuteSingle(context.Background(), "user1", "run1", cfg, "prompt", "ctx")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if vr.Response.ResponseStatus != types.ResponseStatusSuccess {
		t.Fatalf("expected success")
	}
	if !fs.loggedReq || !fs.loggedResp {
		t.Fatalf("expected store to log request and response")
	}
	if len(fl.events) < 2 {
		t.Fatalf("expected flow events, got %v", fl.events)
	}
}

func TestEngine_ExecuteSingle_Error(t *testing.T) {
	fp := &fakeProvider{err: errors.New("boom")}
	fs := &fakeStore{}
	fl := &fakeLogger{}
	eng := &Engine{Provider: fp, Store: fs, Logger: fl}

	cfg := &types.APIConfiguration{ID: "cfg2", VariationName: "v2", ModelName: "gemini-1.5"}
	vr, err := eng.ExecuteSingle(context.Background(), "user1", "run2", cfg, "prompt", "ctx")
	if err == nil {
		t.Fatalf("expected error")
	}
	if vr.Response.ResponseStatus != types.ResponseStatusError {
		t.Fatalf("expected error response status")
	}
	if !fs.loggedReq || !fs.loggedResp {
		t.Fatalf("expected store to log both")
	}
}
