# Deployment Security Setup

## Overview

This deployment setup uses a secure configuration approach where sensitive deployment files are gitignored and managed separately from the public codebase.

## File Structure

```
frontend/
├── *.example                    # Template files (committed to git)
├── setup-deployment.sh          # Automated setup script (committed)
├── secrets/                     # Sensitive files (gitignored)
│   └── README.md               # Documentation only (committed)
├── store-assets/               # App store assets
│   ├── */README.md             # Documentation (committed)
│   └── */*.{png,jpg}           # Actual assets (gitignored)
└── [actual config files]       # Generated files (gitignored)
```

## Security Features

### 🔒 Gitignored Files
These files contain sensitive information and are automatically excluded from git:

- `eas.json` - EAS build configuration with Apple/Google credentials
- `app.json` - App configuration with bundle IDs and project IDs
- `privacy-policy.md` - Privacy policy with actual contact information
- `app-store-review-guidelines.md` - Review guidelines with app-specific info
- `.env.local` - Environment variables with API endpoints
- `secrets/` - All deployment secrets and certificates
- Store assets (actual images, but not documentation)

### 📋 Example Files (Always Available)
Template files that team members can use to set up their own deployment:

- `eas.json.example` - EAS configuration template
- `app.json.example` - App configuration template  
- `privacy-policy.md.example` - Privacy policy template
- `app-store-review-guidelines.md.example` - Review guidelines template
- `env.example` - Environment variables template

## Setup Process

### For New Team Members

1. **Clone the repository**
   ```bash
   git clone [repository]
   cd frontend
   ```

2. **Run automated setup**
   ```bash
   ./setup-deployment.sh
   ```

3. **Obtain deployment secrets**
   - Get certificates and keys from team lead
   - Place in `secrets/` directory following the structure in `secrets/README.md`

4. **Test configuration**
   ```bash
   eas build --profile development
   ```

### For Existing Projects

If you're adding this security setup to an existing project:

1. **Backup existing config files**
   ```bash
   cp eas.json eas.json.backup
   cp app.json app.json.backup
   ```

2. **Create example files**
   ```bash
   cp eas.json eas.json.example
   cp app.json app.json.example
   # Replace sensitive values with placeholders in .example files
   ```

3. **Update .gitignore**
   ```bash
   # Add the gitignore entries from our setup
   ```

4. **Commit example files**
   ```bash
   git add *.example .gitignore
   git commit -m "Add secure deployment setup"
   ```

## Security Best Practices

### ✅ Do's

- **Use the setup script** for consistent configuration
- **Keep secrets/ directory local** and never commit
- **Regularly rotate** API keys and certificates
- **Use different configurations** for different environments
- **Share secrets securely** (encrypted file sharing, password managers)
- **Document** any custom setup steps in team documentation

### ❌ Don'ts

- **Never commit** actual configuration files
- **Don't share secrets** via email or chat
- **Don't use production credentials** for development
- **Don't skip** the gitignore setup
- **Don't hardcode** sensitive values in source code

## Environment Management

### Development Environment
```bash
# Use development profile
eas build --profile development
```
- Uses debug configuration
- Internal distribution only
- Can use test/staging API endpoints

### Production Environment
```bash
# Use production profile  
eas build --profile production
```
- Uses release configuration
- App store ready
- Uses production API endpoints and credentials

## Troubleshooting

### Common Issues

**Problem**: "EAS project ID not found"
**Solution**: Run `eas init` first, then update the project ID in your config files

**Problem**: "Certificate not found"
**Solution**: Ensure certificates are properly placed in `secrets/` directory and referenced correctly in `eas.json`

**Problem**: "Bundle identifier mismatch"
**Solution**: Verify bundle IDs in `app.json` match your Apple Developer/Google Play Console setup

**Problem**: "Git accidentally committed sensitive files"
**Solution**: 
```bash
# Remove from git but keep local file
git rm --cached sensitive-file.json
git commit -m "Remove sensitive file from git"

# Update .gitignore to prevent future commits
echo "sensitive-file.json" >> .gitignore
git add .gitignore
git commit -m "Update gitignore"
```

### Getting Help

1. **Check documentation** in `DEPLOYMENT_GUIDE.md`
2. **Verify setup** by running `setup-deployment.sh` again
3. **Review logs** from `eas build` for specific error messages
4. **Contact team lead** for access to deployment secrets

## Compliance Notes

This setup helps ensure:

- **GDPR compliance** by keeping personal data out of public repositories
- **SOC 2 compliance** by securing deployment credentials
- **App store compliance** by maintaining proper review documentation
- **Team security** by preventing accidental credential exposure

## Updating This Setup

When updating the deployment setup:

1. **Update example files** with new required fields
2. **Update setup script** to handle new configuration
3. **Update documentation** to reflect changes
4. **Test setup** with a clean environment
5. **Notify team** of any manual steps required

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing or sharing any deployment-related files.