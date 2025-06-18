# Contributing to Society Management System

Thank you for your interest in contributing to our project! This document provides guidelines and instructions for contributors.

## Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/society-management.git
   cd society-management
   npm install
   ```

2. **Set Up Environment**
   - Copy `.env.example` to `.env.local`
   - Fill in required environment variables
   - Ask maintainers for test credentials if needed

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Code Style

1. **JavaScript/TypeScript**
   - Use ES6+ features
   - Follow airbnb style guide
   - Use meaningful variable names
   - Add JSDoc comments for functions

2. **React Components**
   - One component per file
   - Use functional components
   - Follow React hooks best practices
   - Add prop-types documentation

3. **CSS/Styling**
   - Use Tailwind CSS utilities
   - Follow BEM naming convention for custom CSS
   - Maintain responsive design

### File Structure

```
components/
  ├── ComponentName/
  │   ├── index.js
  │   ├── ComponentName.js
  │   ├── ComponentName.test.js
  │   └── styles.module.css
```

### Commit Messages

Format: `type(scope): description`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Testing
- chore: Maintenance

Example:
```bash
git commit -m "feat(auth): add OTP verification"
```

## Testing

1. **Unit Tests**
   ```bash
   npm run test
   ```

2. **Integration Tests**
   ```bash
   npm run test:integration
   ```

3. **E2E Tests**
   ```bash
   npm run test:e2e
   ```

### Test Guidelines
- Write tests for new features
- Maintain 80% code coverage
- Test edge cases
- Mock external services

## Pull Request Process

1. **Before Submitting**
   - Update documentation
   - Add/update tests
   - Run linter checks
   - Test locally

2. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   Steps to test the changes

   ## Screenshots
   If applicable

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Code follows style guide
   - [ ] Reviewed own code
   ```

3. **Review Process**
   - Two approvals required
   - All checks must pass
   - No merge conflicts

## API Changes

1. **Documentation**
   - Update API_DOCS.md
   - Update Swagger/OpenAPI specs
   - Add example requests/responses

2. **Versioning**
   - Follow semantic versioning
   - Document breaking changes
   - Update CHANGELOG.md

## Database Changes

1. **Migrations**
   - Add migration scripts
   - Test migration rollback
   - Document changes

2. **Models**
   - Update schema validations
   - Add appropriate indexes
   - Document relationships

## Security

1. **Code Security**
   - No secrets in code
   - Validate all inputs
   - Follow OWASP guidelines

2. **API Security**
   - Rate limiting
   - Input sanitization
   - JWT validation

## Performance

1. **Frontend**
   - Optimize bundle size
   - Lazy load components
   - Minimize re-renders

2. **Backend**
   - Cache responses
   - Optimize queries
   - Handle race conditions

## Deployment

1. **Staging**
   - Test in staging environment
   - Check performance metrics
   - Verify all features

2. **Production**
   - Follow deployment checklist
   - Monitor logs
   - Backup data

## Getting Help

- Join our Discord channel
- Check existing issues
- Ask in discussions
- Contact maintainers

## Code of Conduct

1. **Be Respectful**
   - Inclusive language
   - Constructive feedback
   - Professional conduct

2. **Communication**
   - Clear and concise
   - English language
   - Use appropriate channels

## License

By contributing, you agree that your contributions will be licensed under the project's license. 