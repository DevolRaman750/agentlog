# DatePicker Component

A cross-platform date picker component for React Native with proper backend integration.

## Features

- **Cross-platform**: Works on iOS, Android, and Web
- **Proper date formatting**: Automatically formats dates as RFC3339 for backend compatibility
- **User-friendly interface**: Native date picker with clear button and calendar icon
- **Flexible**: Supports date, time, and datetime modes
- **Validation**: Built-in support for minimum/maximum dates and error states
- **Accessibility**: Proper labels, descriptions, and required field indicators

## Usage

```tsx
import DatePicker, { formatDateForAPI, parseDateFromAPI } from '../components/DatePicker';

// Basic date picker
<DatePicker
  label="Expiration Date"
  value={selectedDate}
  onChange={(date) => setSelectedDate(date)}
/>

// With validation and constraints
<DatePicker
  label="Event Date"
  description="Select when the event will occur"
  value={eventDate}
  onChange={setEventDate}
  minimumDate={new Date()} // Can't select past dates
  maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Max 1 year from now
  required={true}
  error={dateError}
/>

// For API integration
const handleSave = async () => {
  const data = {
    name: formData.name,
    expiresAt: formatDateForAPI(selectedDate), // Converts to RFC3339
  };
  
  await api.post('/endpoint', data);
};

// When loading from API
useEffect(() => {
  const loadData = async () => {
    const response = await api.get('/endpoint');
    setSelectedDate(parseDateFromAPI(response.data.expiresAt));
  };
  loadData();
}, []);
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above the picker |
| `description` | `string` | - | Helper text displayed below the label |
| `value` | `Date \| null` | - | Current selected date |
| `onChange` | `(date: Date \| null) => void` | - | Callback when date changes |
| `placeholder` | `string` | "Select date" | Text shown when no date is selected |
| `minimumDate` | `Date` | - | Earliest selectable date |
| `maximumDate` | `Date` | - | Latest selectable date |
| `mode` | `'date' \| 'time' \| 'datetime'` | `'date'` | Picker mode |
| `required` | `boolean` | `false` | Shows required indicator (*) |
| `error` | `string` | - | Error message to display |

## Utility Functions

### `formatDateForAPI(date: Date | null): string | undefined`

Converts a Date object to RFC3339 format for backend API calls.

```tsx
const isoString = formatDateForAPI(new Date()); // "2024-12-31T23:59:59.000Z"
```

### `parseDateFromAPI(dateString: string | null): Date | null`

Parses a date string from backend response into a Date object.

```tsx
const date = parseDateFromAPI("2024-12-31T23:59:59.000Z"); // Date object
```

## Backend Integration

The component automatically handles date formatting to ensure compatibility with Go's `time.Time` type:

- **Frontend**: Uses native Date objects
- **API**: Sends/receives RFC3339 formatted strings (`2024-12-31T23:59:59.000Z`)
- **Backend**: Properly parsed into Go `time.Time` or `*time.Time` fields

### Example Backend Struct

```go
type Token struct {
    Name      string     `json:"name"`
    ExpiresAt *time.Time `json:"expiresAt,omitempty"` // Optional expiration
}
```

## Design

The component follows iOS design principles:

- Clean, minimalist interface
- Native date picker on each platform
- Clear visual hierarchy with labels and descriptions
- Proper color coding for different states
- Accessible touch targets and interactions

## Error Handling

The component includes robust error handling:

- Invalid date parsing is gracefully handled
- Backend date format mismatches are prevented
- User-friendly error messages can be displayed
- Validation states are visually indicated

## Platform Differences

- **iOS**: Uses spinner-style picker
- **Android**: Uses default system date picker
- **Web**: Uses HTML input type="date" for native browser date picker experience

The component abstracts these differences while maintaining native feel on each platform. On web, it provides a fully functional HTML date input with proper validation and constraints. 