# Contributing to EPICON Guard

Thank you for your interest in contributing to EPICON Guard! 🛡️

## Code of Conduct

Be respectful, inclusive, and constructive. We're building infrastructure for better software, and that starts with better community.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/kaizencycle/epicon.git
cd epicon

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## Making Changes

### 1. Fork the Repository
Click the "Fork" button on GitHub to create your own copy.

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes
- Write clear, documented code
- Add tests for new functionality
- Update documentation as needed

### 4. Commit Your Changes

**IMPORTANT:** We dogfood EPICON! All commits should follow our intent publication format:

```bash
git commit -m "feat: Add feature description

EPICON INTENT PUBLICATION

ledger_id: epicon:contributor:feature-name
scope: core | docs | tests | infra
mode: normal
issued_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
expires_at: $(date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%SZ")

justification: |
  Brief explanation of WHY this change is needed.
  
  CONTEXT: What problem does this solve?
  DECISION: What approach did you choose?
  IMPACT: Who/what does this affect?
  
counterfactuals:
  - If this breaks CI, revert
  - If tests fail, investigate before merge
  - If community feedback is negative, reconsider"
```

### 5. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 6. Submit a Pull Request
- Go to the original repository
- Click "New Pull Request"
- Select your fork and branch
- Fill in the PR template (includes EPICON intent)

## PR Requirements

All pull requests must:
- ✅ Include EPICON intent block in description
- ✅ Pass all tests (`npm test`)
- ✅ Pass linting (`npm run lint`)
- ✅ Pass type checking (`npm run type-check`)
- ✅ Include relevant documentation updates
- ✅ Follow conventional commit format

## Project Structure

```
epicon/
├── packages/
│   ├── core/           # Intent validation engine
│   ├── github-app/     # GitHub App integration
│   ├── api/            # REST API
│   └── dashboard/      # Web dashboard
├── docs/               # Documentation
├── examples/           # Example configurations
└── website/            # Landing page (epicon.dev)
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code style (Prettier enforced)
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing
- Write tests for all new features
- Maintain >80% code coverage
- Use descriptive test names
- Test both success and failure cases

### Documentation
- Update README.md if adding features
- Add JSDoc for public APIs
- Include examples in docs/
- Update CHANGELOG.md

## Types of Contributions

We welcome:
- 🐛 **Bug fixes** - Fix issues, improve stability
- ✨ **Features** - Add new functionality
- 📝 **Documentation** - Improve docs, add examples
- 🎨 **Design** - UI/UX improvements
- 🧪 **Tests** - Increase coverage, add edge cases
- 🔧 **Tooling** - CI/CD, build improvements

## Community

- 💬 **Discussions:** [GitHub Discussions](https://github.com/kaizencycle/epicon/discussions)
- 🐛 **Issues:** [GitHub Issues](https://github.com/kaizencycle/epicon/issues)
- 📧 **Email:** hello@epicon.dev
- 🐦 **Twitter:** [@epiconguard](https://twitter.com/epiconguard)

## Recognition

All contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor report

Significant contributions may result in:
- Core contributor badge
- Early access to new features
- Lifetime Pro tier discount

## License

By contributing, you agree that your contributions will be licensed under CC0 1.0 Universal (public domain).

## Need Help?

- Read the [documentation](./docs/)
- Ask in [Discussions](https://github.com/kaizencycle/epicon/discussions)
- Email us at hello@epicon.dev

## First-Time Contributors

Look for issues labeled `good first issue` - these are beginner-friendly tasks perfect for getting started!

---

**Thank you for helping build the Intent Layer for Git!** 🛡️

*Part of Mobius Systems | Built with Integrity*
