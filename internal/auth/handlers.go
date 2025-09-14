package auth

import (
	"encoding/json"
	"net/http"
)

// LoginRequest represents the request payload for user login
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token     string `json:"token"`
	User      User   `json:"user"`
	ExpiresAt string `json:"expiresAt"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

type CreateTemporaryUserRequest struct {
	SessionID string `json:"sessionId"`
}

type CreateTemporaryUserResponse struct {
	User              User   `json:"user"`
	TemporaryPassword string `json:"temporaryPassword"`
	Token             string `json:"token"`
}

type SaveTemporaryAccountRequest struct {
	Username        string `json:"username"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	CurrentPassword string `json:"currentPassword"`
}

type SaveTemporaryAccountResponse struct {
	User User `json:"user"`
}

type ConnectTemporaryAccountRequest struct {
	Email       string `json:"email"`
	NewPassword string `json:"newPassword"`
}

type ConnectTemporaryAccountResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

type VerifyEmailRequest struct {
	Token string `json:"token"`
}

type VerifyEmailResponse struct {
	Success  bool `json:"success"`
	User     User `json:"user"`
	Verified bool `json:"verified"`
}

type GetCurrentUserResponse struct {
	User User `json:"user"`
}

// AuthHandlers provides HTTP handlers for authentication endpoints
type AuthHandlers struct {
	authService *AuthService
}

// NewAuthHandlers creates a new AuthHandlers instance
func NewAuthHandlers(authService *AuthService) *AuthHandlers {
	return &AuthHandlers{
		authService: authService,
	}
}

// RegisterHandler handles user registration requests
func (h *AuthHandlers) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, token, err := h.authService.Register(req.Username, req.Email, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := RegisterResponse{
		User:  *user,
		Token: token,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// LoginHandler handles user login requests
func (h *AuthHandlers) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, token, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	response := LoginResponse{
		Token:     token,
		User:      *user,
		ExpiresAt: "2024-12-31T23:59:59Z", // TODO: Get actual expiry from token
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CreateTemporaryUserHandler handles temporary user creation
func (h *AuthHandlers) CreateTemporaryUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateTemporaryUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, tempPassword, token, err := h.authService.CreateTemporaryUser(req.SessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := CreateTemporaryUserResponse{
		User:              *user,
		TemporaryPassword: tempPassword,
		Token:             token,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// VerifyEmailHandler handles email verification
func (h *AuthHandlers) VerifyEmailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.authService.VerifyEmail(req.Token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := VerifyEmailResponse{
		Success:  true,
		User:     *user,
		Verified: true,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetCurrentUserHandler handles getting current user info
func (h *AuthHandlers) GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	response := GetCurrentUserResponse{
		User: *user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// SaveTemporaryAccountHandler handles saving temporary accounts
func (h *AuthHandlers) SaveTemporaryAccountHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req SaveTemporaryAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedUser, err := h.authService.SaveTemporaryAccount(user.ID, req.Email, req.CurrentPassword)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := SaveTemporaryAccountResponse{
		User: *updatedUser,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ConnectTemporaryAccountHandler handles connecting temporary accounts
func (h *AuthHandlers) ConnectTemporaryAccountHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req ConnectTemporaryAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedUser, token, err := h.authService.ConnectTemporaryAccount(user.ID, req.Email, req.NewPassword)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := ConnectTemporaryAccountResponse{
		User:  *updatedUser,
		Token: token,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
