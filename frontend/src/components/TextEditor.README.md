# TextEditor Component

A beautiful, IDE-like text editor component for React Native that provides an enhanced experience for editing long text content like prompts, system instructions, and code.

## Features

- 🎨 **Beautiful UI** - Clean, modern design with proper typography
- 📏 **Line Numbers** - Optional line numbering for better text navigation
- 📊 **Statistics** - Character count, word count, and line count
- 🔍 **Fullscreen Mode** - Expandable editor for focused editing
- 🌓 **Theme Support** - Light and dark themes
- 📱 **Responsive** - Auto-resizing based on content with min/max height limits
- ⌨️ **IDE-like Experience** - Monospace font, proper keyboard handling
- 🔒 **Read-only Mode** - Display-only mode for showing content
- 📋 **Copy-friendly** - Easy text selection and copying

## Usage

### Basic Example

```tsx
import TextEditor from '../components/TextEditor';

const MyComponent = () => {
  const [text, setText] = useState('');

  return (
    <TextEditor
      value={text}
      onChangeText={setText}
      placeholder="Enter your text..."
    />
  );
};
```

### Advanced Example with All Features

```tsx
<TextEditor
  label="🚀 AI Prompt"
  value={prompt}
  onChangeText={setPrompt}
  placeholder="Write your prompt here..."
  minHeight={150}
  maxHeight={400}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={true}
  showLineNumbers={false}
  theme="light"
  language="plain"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | The text content |
| `onChangeText` | `(text: string) => void` | Required | Callback when text changes |
| `placeholder` | `string` | `'Enter your text...'` | Placeholder text |
| `label` | `string` | `undefined` | Label displayed above the editor |
| `showLineNumbers` | `boolean` | `false` | Show line numbers on the left |
| `showCharacterCount` | `boolean` | `true` | Show character count in stats |
| `showWordCount` | `boolean` | `true` | Show word count in stats |
| `minHeight` | `number` | `120` | Minimum height in pixels |
| `maxHeight` | `number` | `300` | Maximum height before scrolling |
| `allowFullscreen` | `boolean` | `true` | Enable fullscreen expand button |
| `autoFocus` | `boolean` | `false` | Auto-focus when component mounts |
| `editable` | `boolean` | `true` | Whether the text is editable |
| `style` | `StyleProp<ViewStyle>` | `undefined` | Additional container styles |
| `textStyle` | `StyleProp<TextStyle>` | `undefined` | Additional text styles |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `language` | `'plain' \| 'markdown' \| 'json'` | `'plain'` | Content type hint |

## Use Cases

### 1. Main Prompt Input
Perfect for AI prompt entry with full features enabled:
```tsx
<TextEditor
  label="What do you want the AI to do?"
  value={prompt}
  onChangeText={setPrompt}
  minHeight={140}
  maxHeight={400}
  allowFullscreen={true}
  showCharacterCount={true}
  showWordCount={true}
/>
```

### 2. System Instructions
Ideal for system prompts with line numbers for clarity:
```tsx
<TextEditor
  label="🤖 System Instructions"
  value={systemPrompt}
  onChangeText={setSystemPrompt}
  showLineNumbers={true}
  minHeight={120}
  maxHeight={300}
/>
```

### 3. Compact Notes
For brief descriptions without extra features:
```tsx
<TextEditor
  label="📝 Notes"
  value={notes}
  onChangeText={setNotes}
  minHeight={60}
  maxHeight={150}
  allowFullscreen={false}
  showCharacterCount={false}
  showWordCount={false}
/>
```

### 4. Code Editor
For code or structured text with line numbers:
```tsx
<TextEditor
  label="💻 Code"
  value={code}
  onChangeText={setCode}
  showLineNumbers={true}
  language="javascript"
  theme="dark"
/>
```

### 5. Read-only Display
For displaying generated content:
```tsx
<TextEditor
  label="📖 Generated Response"
  value={response}
  onChangeText={() => {}}
  editable={false}
  allowFullscreen={true}
/>
```

## Styling

The component uses a theme-based styling system. You can customize the appearance by:

1. **Using the theme prop**: Switch between `'light'` and `'dark'` themes
2. **Custom styles**: Pass `style` prop for container styling
3. **Text styling**: Pass `textStyle` prop for text customization

## Accessibility

- Proper keyboard navigation
- Screen reader friendly labels
- Touch-friendly expand button
- Accessible color contrast

## Performance

- Efficient re-renders with proper memoization
- Smooth auto-resizing
- Optimized fullscreen modal
- Responsive to content changes

## Browser Compatibility

Works on all platforms supported by React Native:
- iOS
- Android  
- Web (React Native Web)

## Future Enhancements

Planned features for future versions:
- Syntax highlighting
- Auto-completion
- Find/replace functionality
- Undo/redo support
- Plugin system for custom languages 