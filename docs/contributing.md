# Contributing Guidelines

Thank you for your interest in contributing to the Interactive Story Engine!

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project standards

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/PPD-example.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/my-feature`
5. Make your changes
6. Test thoroughly
7. Commit and push
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev:all

# Run tests
npm run test

# Run linter
npm run lint

# Build for production
npm run build
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all props and state
- Avoid `any` type when possible
- Use strict null checks

### React

- Use functional components
- Use hooks (not class components)
- Memoize callbacks with `useCallback`
- Memoize derived values with `useMemo`

### CSS

- Use CSS custom properties for theming
- BEM naming convention for classes
- Mobile-first responsive design
- Support dark mode

### Naming Conventions

- **Files**: PascalCase for components (e.g., `ThemeToggle.tsx`)
- **Variables**: camelCase (e.g., `currentTheme`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_THEME`)
- **Interfaces**: PascalCase with `Props` suffix (e.g., `ButtonProps`)
- **Types**: PascalCase (e.g., `ThemeMode`)

## Testing

### Unit Tests

Write tests for:
- Utility functions
- State logic
- Complex calculations

```typescript
// Example test
describe('StoryEngine', () => {
  it('should navigate to target node on choice', () => {
    const engine = new StoryEngine();
    // ... setup
    engine.choose('choice1');
    expect(engine.currentNode?.id).toBe('targetNode');
  });
});
```

### Component Tests

Test components with React Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('ThemeToggle', () => {
  it('should render theme options', () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
  });
});
```

### Test Coverage

- Aim for 80%+ coverage
- Test edge cases
- Test error states
- Test accessibility

## Commit Messages

Use conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semi colons, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(themes): add UCSC theme with official colors

fix(player): resolve video loading error on Safari
docs(readme): update installation instructions
style(components): fix indentation in ThemeToggle
test(engine): add tests for choice validation
```

## Pull Request Process

1. **Before submitting:**
   - Run all tests: `npm run test`
   - Run linter: `npm run lint`
   - Build successfully: `npm run build`
   - Update documentation if needed

2. **PR Description should include:**
   - What changed and why
   - Testing performed
   - Screenshots (for UI changes)
   - Breaking changes (if any)
   - Related issues

3. **PR Checklist:**
   - [ ] Tests pass
   - [ ] Code follows style guide
   - [ ] Documentation updated
   - [ ] No console errors
   - [ ] Mobile responsive (if UI)
   - [ ] Accessibility checked (if UI)

4. **Review Process:**
   - At least one reviewer approval required
   - Address review feedback
   - Keep PR focused and small (< 400 lines preferred)
   - Squash commits before merge

## Documentation

### Code Comments

- Document complex logic
- Explain "why" not "what"
- Use JSDoc for public APIs

```typescript
/**
 * Calculates the completion percentage of a story.
 * @param visitedNodes - Array of visited node IDs
 * @param totalNodes - Total number of nodes in story
 * @returns Percentage as number (0-100)
 */
function calculateCompletion(visitedNodes: string[], totalNodes: number): number {
  // Avoid division by zero
  if (totalNodes === 0) return 0;
  return (visitedNodes.length / totalNodes) * 100;
}
```

### README Updates

When adding features:
- Update relevant docs/ files
- Add to feature list if significant
- Update API reference if changed

## Issue Reporting

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Browser/device info
- Screenshots (if applicable)

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Mockups (if UI-related)

## Project Structure

```
src/
├── components/       # React components
│   ├── *.tsx        # Component files
│   └── *.css        # Component styles
├── contexts/         # React contexts
├── engine/          # Core state machine
├── hooks/           # Custom React hooks
├── types/           # TypeScript definitions
├── utils/           # Utility functions
└── config/          # Configuration files
```

Add new files in appropriate directories.

## Performance Guidelines

- Avoid unnecessary re-renders
- Use React.memo for pure components
- Lazy load heavy components
- Optimize images and videos
- Use CSS transforms over position changes

## Accessibility Guidelines

- Use semantic HTML
- Add aria-labels to interactive elements
- Ensure keyboard navigation
- Maintain 4.5:1 contrast ratio
- Test with screen readers

## Questions?

- Check existing documentation
- Search closed issues
- Ask in discussions
- Join community chat

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing! 🎉
