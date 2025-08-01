# GoGent Mobile - AI Multi-Variation Execution Platform

A React Native mobile app for the GoGent AI platform that allows you to configure, execute, and analyze multi-variation AI prompts using Google Gemini API.

## 🚀 Features

### Core Features
- **Configuration Management**: Set up your Gemini API key and backend connection
- **AI Configuration Builder**: Create and manage multiple AI configurations with different parameters
- **Multi-Variation Execution**: Run the same prompt across multiple AI configurations simultaneously
- **Real-time Results**: View and compare AI responses in real-time
- **Execution History**: Browse past executions with detailed analytics
- **Database Viewer**: Explore MySQL database statistics and table data
- **Mock Mode**: Test the app without real API calls

### UI/UX Features
- **Clean, Minimal Design**: iOS-inspired interface with smooth animations
- **Tab Navigation**: Easy access to Configure, Execute, History, and Database views
- **Responsive Layout**: Optimized for various mobile screen sizes
- **Real-time Connection Status**: Always know your backend connection status
- **Pull-to-Refresh**: Stay updated with the latest data

## 📱 Screenshots

The app features a 4-tab interface:
1. **Configure**: Manage API settings and AI configurations
2. **Execute**: Run multi-variation AI executions
3. **History**: View past execution results and analytics
4. **Database**: Explore MySQL database information

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- Yarn package manager
- Expo CLI
- iOS/Android simulator or physical device
- GoGent backend server running

### Quick Start

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Start Development Server**
   ```bash
   yarn start
   ```

3. **Run on Device/Simulator**
   ```bash
   # iOS
   yarn ios
   
   # Android 
   yarn android
   
   # Web (for testing)
   yarn web
   ```

### Backend Configuration

1. Make sure your GoGent backend is running (default: `http://localhost:8080`)
2. Have your Gemini API key ready
3. Ensure MySQL database is set up and accessible

## 📋 Usage Guide

### Initial Setup

1. **Configure Connection**
   - Open the Configure tab
   - Set your backend URL (default: `http://localhost:8080`)
   - Enter your Gemini API key
   - Enable/disable mock responses as needed
   - Save settings and test connection

2. **Create AI Configurations**
   - In Configure tab, tap the "+" icon
   - Set up different AI configurations:
     - Conservative (low temperature)
     - Balanced (medium temperature) 
     - Creative (high temperature)
   - Customize model, system prompt, and parameters

### Running Multi-Variation Executions

1. **Go to Execute Tab**
   - Enter your prompt and optional context
   - Select which configurations to use
   - Choose comparison metrics
   - Tap "Execute Multi-Variation"

2. **View Results**
   - See real-time execution progress
   - Compare responses across configurations
   - View detailed metrics and timing
   - Expand results for full analysis

### Viewing History

1. **Browse Past Executions**
   - All executions are saved automatically
   - Tap any execution to view full details
   - See success rates, timing, and comparisons
   - Delete executions you no longer need

### Database Exploration

1. **View Database Statistics**
   - Total executions, requests, responses
   - Average response times and success rates
   - Visual metrics with color coding

2. **Browse Table Data**
   - View all database tables
   - Tap any table to see row data
   - Horizontal scroll for wide tables
   - Formatted display for different data types

## 🔧 Configuration

### Environment Variables

The app stores configuration in AsyncStorage:
- `backendUrl`: GoGent backend server URL
- `geminiApiKey`: Your Google Gemini API key  
- `useMockResponses`: Enable mock mode for testing

### Default Configurations

The app comes with 3 pre-configured AI setups:
- **Conservative**: Temperature 0.2, focused on accuracy
- **Balanced**: Temperature 0.5, general purpose
- **Creative**: Temperature 0.8, for creative tasks

### API Endpoints

The mobile app connects to these backend endpoints:
- `GET /health` - Backend health check
- `POST /api/execute` - Multi-variation execution
- `GET /api/execution-runs` - Execution history
- `GET /api/database/stats` - Database statistics
- `GET /api/database/tables` - Table data

## 🏗️ Architecture

### Project Structure
```
frontend/
├── src/
│   ├── api/          # Backend API client
│   ├── types/        # TypeScript interfaces
│   ├── screens/      # Main app screens
│   ├── components/   # Reusable UI components
│   ├── navigation/   # Tab navigation setup
│   ├── context/      # React Context for state
│   └── utils/        # Utility functions
├── assets/           # Images, fonts, etc.
├── cursor.md         # Development guidelines
└── package.json      # Dependencies & scripts
```

### Key Technologies
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for tab navigation
- **AsyncStorage** for persistent data
- **Axios** for HTTP requests
- **React Context** for state management

### State Management

The app uses React Context with useReducer for:
- App configuration (API keys, settings)
- AI configurations management
- Connection status tracking
- Error handling
- Recent executions cache

## 🔍 Development

### Package Manager
This project uses **Yarn**. Do not use npm commands.

```bash
# From project root, use make commands:
make frontend-install      # Install dependencies
make frontend-start        # Start development server
make frontend-ios          # Run on iOS
make frontend-android      # Run on Android

# Or directly in frontend directory:
cd frontend
yarn install               # Install dependencies
yarn start                 # Start development
yarn type-check           # Type checking
yarn lint                 # Linting
```

### Code Style
- TypeScript for all components
- Functional components with hooks
- Clean, minimal iOS-inspired design
- Consistent color scheme and spacing
- Error boundaries and loading states

### Testing
Test the app in different scenarios:
- With/without backend connection
- With/without API key
- Mock vs real API responses
- Different screen sizes
- Network interruption handling

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify backend server is running on correct port
   - Check network connectivity
   - Ensure CORS is configured in backend

2. **API Key Issues**
   - Verify Gemini API key is valid
   - Check API quotas and limits
   - Enable mock responses for testing

3. **Database Connection**
   - Ensure MySQL is running and accessible
   - Verify database credentials in backend
   - Check network connectivity

4. **App Won't Start**
   - Run `yarn install` to ensure dependencies
   - Clear Expo cache: `expo start -c`
   - Restart Metro bundler

### Performance Tips
- Use mock responses during development
- Limit execution history to recent items
- Enable pull-to-refresh for data updates
- Monitor memory usage with large datasets

## 🤝 Contributing

1. Follow the yarn package manager requirement
2. Maintain TypeScript type safety
3. Keep UI consistent with existing design
4. Test on both iOS and Android
5. Update README for new features

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Projects

- [GoGent Backend](../README.md) - Go backend server
- [GoGent CLI](../cmd/gogent/) - Command line interface

---

Built with ❤️ using React Native, TypeScript, and Expo 