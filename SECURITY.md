# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send details to [security@agentlog.dev](mailto:security@agentlog.dev)
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature
3. **Direct Message**: Contact the maintainer directly if you have their contact information

### What to Include

When reporting a vulnerability, please include:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

After you submit a report, we will:

1. **Acknowledge** your report within 48 hours
2. **Investigate** the issue and confirm the vulnerability
3. **Develop** a fix for the latest supported version
4. **Release** the fix as soon as possible
5. **Credit** you in our security advisories (unless you prefer to remain anonymous)

### Security Best Practices

When using AgentLog, please follow these security best practices:

#### Backend Security

- **Environment Variables**: Never commit sensitive data like API keys, database passwords, or encryption keys to version control
- **Database Security**: Use strong passwords and enable SSL/TLS for database connections
- **API Keys**: Rotate API keys regularly and use the principle of least privilege
- **Authentication**: Always use HTTPS in production and implement proper JWT token validation
- **Input Validation**: Validate all user inputs and sanitize data before processing

#### Frontend Security

- **HTTPS Only**: Always use HTTPS in production environments
- **Content Security Policy**: Implement CSP headers to prevent XSS attacks
- **Secure Headers**: Use security headers like HSTS, X-Frame-Options, etc.
- **Dependencies**: Keep frontend dependencies updated and scan for vulnerabilities

#### Deployment Security

- **Container Security**: Use minimal base images and scan for vulnerabilities
- **Kubernetes Security**: Implement proper RBAC, network policies, and pod security standards
- **Secrets Management**: Use Kubernetes secrets or external secret management systems
- **Monitoring**: Implement security monitoring and alerting

### Security Features

AgentLog includes several built-in security features:

- **Graceful Shutdown**: Proper handling of termination signals to prevent data corruption
- **Health Checks**: Kubernetes-ready health and readiness probes
- **Vulnerability Scanning**: Automated security scanning in CI/CD pipeline
- **Dependency Auditing**: Regular checks for vulnerable dependencies
- **Code Security Analysis**: Static analysis for security issues

### Security Updates

We regularly update dependencies and address security issues. To stay informed:

- Watch this repository for security releases
- Subscribe to our security mailing list
- Follow our security advisories on GitHub

### Responsible Disclosure Timeline

- **Day 0**: Vulnerability reported
- **Day 1**: Initial response and acknowledgment
- **Day 7**: Status update and initial assessment
- **Day 30**: Target fix release (may be extended for complex issues)
- **Day 45**: Public disclosure (if not fixed)

### Bug Bounty

We appreciate security researchers who help improve AgentLog's security. While we don't currently have a formal bug bounty program, we do acknowledge security researchers in our advisories and may provide other forms of recognition.

### Contact

For security-related questions or concerns, please contact:

- **Security Team**: [security@agentlog.dev](mailto:security@agentlog.dev)
- **Maintainer**: [arsheenali](https://github.com/arsheenali)

Thank you for helping keep AgentLog and its users safe!
