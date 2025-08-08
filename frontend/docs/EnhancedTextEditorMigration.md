# Enhanced Text Editor Migration Guide

## Overview

The `EnhancedTextEditor` component is a comprehensive replacement for the existing `TextEditor` and basic `TextInput` components used for long-form text input. It provides a superior mobile and web experience with advanced features like full-screen editing, rich toolbars, markdown support, and accessibility enhancements.

## Key Features

### 🏗️ Architecture
- **Mobile-First Design**: Automatically switches to full-screen mode on mobile for better UX
- **Responsive Layout**: Optimized for mobile, tablet, and desktop screen sizes
- **Performance Optimized**: Efficient rendering for large text content

### ✨ Enhanced UX
- **Smart Auto-Resize**: Content-based height adjustment with min/max constraints
- **Full-Screen Mode**: Distraction-free editing experience with toolbar
- **Rich Toolbar**: Common formatting actions (bold, italic, lists, quotes, code, etc.)
- **Undo/Redo**: Full history management with keyboard shortcuts

### 🎨 Styling & Themes
- **Light/Dark Themes**: Built-in theme support
- **Customizable**: Extensive styling props and theme colors
- **Consistent**: Matches app design system

### ♿ Accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling and indicators

### 🔧 Developer Experience
- **TypeScript**: Full type safety with comprehensive interfaces
- **Backward Compatible**: Drop-in replacement for existing TextEditor
- **Extensive Props**: Flexible configuration options

## Migration Guide

### Basic TextInput Replacement

**Before:**
```tsx
<TextInput
  style={styles.textInput}
  value={text}
  onChangeText={setText}
  placeholder="Enter your text..."
  multiline={true}
  textAlignVertical="top"
/>
```

**After:**
```tsx
<EnhancedTextEditor
  value={text}
  onChangeText={setText}
  placeholder="Enter your text..."
  label="Text Input"
  minHeight={100}
  maxHeight={300}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={false}
  showToolbar={false}
/>
```

### Existing TextEditor Replacement

**Before:**
```tsx
<TextEditor
  value={description}
  onChangeText={onDescriptionChange}
  placeholder="Notes about this execution..."
  minHeight={100}
  maxHeight={250}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={false}
  showLineNumbers={false}
/>
```

**After:**
```tsx
<EnhancedTextEditor
  value={description}
  onChangeText={onDescriptionChange}
  placeholder="Notes about this execution..."
  label="Description"
  minHeight={100}
  maxHeight={250}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={false}
  showLineNumbers={false}
  showToolbar={true}
  enableMarkdown={true}
  helperText="Add notes about this execution"
/>
```

## Props Reference

### Core Props (Required)
| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current text value |
| `onChangeText` | `(text: string) => void` | Text change handler |

### Basic Configuration
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `"Enter your text..."` | Placeholder text |
| `label` | `string` | `undefined` | Field label |
| `minHeight` | `number` | `120` | Minimum height in pixels |
| `maxHeight` | `number` | `300` | Maximum height in pixels |
| `allowFullscreen` | `boolean` | `true` | Enable full-screen mode |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |
| `editable` | `boolean` | `true` | Whether text is editable |

### Display Features
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `showCharacterCount` | `boolean` | `true` | Show character count |
| `showWordCount` | `boolean` | `true` | Show word count |
| `showToolbar` | `boolean` | `true` | Show formatting toolbar |

### Enhanced Features
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableMarkdown` | `boolean` | `false` | Enable markdown formatting |
| `maxLength` | `number` | `undefined` | Maximum character limit |
| `required` | `boolean` | `false` | Mark field as required |
| `errorMessage` | `string` | `undefined` | Error message to display |
| `helperText` | `string` | `undefined` | Helper text below field |
| `autoExpandOnFocus` | `boolean` | `true` | Auto-expand to full-screen on focus (mobile) |

### Styling & Themes
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `language` | `'plain' \| 'markdown' \| 'json' \| 'sql'` | `'plain'` | Syntax highlighting |
| `style` | `any` | `undefined` | Container style override |
| `textStyle` | `any` | `undefined` | Text style override |

### Event Handlers
| Prop | Type | Description |
|------|------|-------------|
| `onFocus` | `() => void` | Focus event handler |
| `onBlur` | `() => void` | Blur event handler |

## Usage Examples

### AI Prompt Editor
```tsx
<EnhancedTextEditor
  value={prompt}
  onChangeText={setPrompt}
  placeholder="Describe what you want the AI to do..."
  label="AI Prompt"
  minHeight={150}
  maxHeight={400}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={true}
  showToolbar={true}
  enableMarkdown={true}
  required={true}
  helperText="Write clear, detailed instructions for the AI"
/>
```

### Description Field
```tsx
<EnhancedTextEditor
  value={description}
  onChangeText={setDescription}
  placeholder="Enter a description..."
  label="Description"
  minHeight={100}
  maxHeight={250}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={false}
  showToolbar={true}
  enableMarkdown={true}
  helperText="Provide a detailed description"
/>
```

### Context Field with Limits
```tsx
<EnhancedTextEditor
  value={context}
  onChangeText={setContext}
  placeholder="Additional context..."
  label="Context"
  minHeight={120}
  maxHeight={300}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={false}
  showToolbar={true}
  maxLength={1000}
  helperText="Provide additional context (max 1000 characters)"
/>
```

### Parameter Input (Auto-detection)
```tsx
{/* For long parameter values, automatically use enhanced editor */}
{param.value.length > 100 || param.description?.toLowerCase().includes('long') ? (
  <EnhancedTextEditor
    value={param.value}
    onChangeText={(value) => updateParameter(param.name, value)}
    placeholder={`Enter value for ${param.name}...`}
    label={param.name}
    minHeight={80}
    maxHeight={200}
    allowFullscreen={true}
    showCharacterCount={true}
    showWordCount={false}
    showToolbar={false}
    required={param.isRequired}
    helperText={param.description}
  />
) : (
  <TextInput
    // ... regular text input for short values
  />
)}
```

## Toolbar Actions

### Available Actions
- **Undo/Redo**: History navigation with keyboard shortcuts
- **Bold**: `**text**` formatting
- **Italic**: `*text*` formatting  
- **Bullet Lists**: Toggle bullet points
- **Numbered Lists**: Toggle numbered lists
- **Links**: `[text](url)` format
- **Quotes**: `> text` format
- **Code**: Inline `code` or ```code blocks```
- **Headings**: `# ## ###` heading levels
- **Clear**: Clear all text

### Keyboard Shortcuts (Web)
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + K`: Link

## Mobile Optimizations

### Auto Full-Screen
- Automatically expands to full-screen when user taps into the input (mobile)
- Configurable via `autoExpandOnFocus` prop (default: true)
- Smooth transitions with proper animations
- Provides distraction-free editing experience

### Touch Optimizations
- Larger touch targets for mobile
- Optimized toolbar layout for small screens
- Proper keyboard avoidance

### Performance
- Efficient re-rendering with React.memo patterns
- Debounced history updates
- Optimized text measurement

## Accessibility Features

### Screen Reader Support
- Proper ARIA labels and roles
- Descriptive accessibility hints
- State announcements (disabled, required, etc.)

### Keyboard Navigation
- Full keyboard accessibility
- Focus management
- Keyboard shortcuts

### Visual Accessibility
- High contrast themes
- Clear focus indicators
- Readable font sizes

## Best Practices

### When to Use Enhanced Editor
✅ **Use for:**
- Long-form text input (prompts, descriptions, context)
- Content that benefits from formatting
- Mobile-first applications
- Accessibility-critical applications

❌ **Don't use for:**
- Short, single-line inputs
- Simple form fields
- Performance-critical rapid input

### Configuration Tips
1. **Enable toolbar** for content that benefits from formatting
2. **Set appropriate min/max heights** based on expected content
3. **Use character limits** for fields with constraints
4. **Provide helpful labels and helper text** for better UX
5. **Choose appropriate themes** to match your app design

### Performance Considerations
- Use `maxLength` for very long content to prevent performance issues
- Consider disabling toolbar for simple use cases
- Use debounced onChange handlers for expensive operations

## Migration Checklist

- [ ] Replace `TextInput` components used for long text
- [ ] Replace existing `TextEditor` components
- [ ] Add appropriate labels and helper text
- [ ] Configure toolbar settings based on use case
- [ ] Test full-screen mode on mobile devices
- [ ] Verify accessibility with screen readers
- [ ] Test keyboard shortcuts on web
- [ ] Validate character limits and error states
- [ ] Check responsive behavior across screen sizes
- [ ] Update any custom styling if needed

## Troubleshooting

### Common Issues
1. **Text not updating**: Ensure `onChangeText` is properly connected
2. **Toolbar not showing**: Check `showToolbar={true}` and `isFullscreen` state
3. **Height issues**: Verify `minHeight` and `maxHeight` settings
4. **Performance**: Consider `maxLength` limits for very long content
5. **Accessibility**: Ensure proper `label` and `helperText` props

### Debug Tips
- Use the demo component to test functionality
- Check console for accessibility warnings
- Test with screen readers enabled
- Verify keyboard shortcuts on web platform

## Support

For additional help or feature requests, please refer to the component documentation or create an issue in the project repository.