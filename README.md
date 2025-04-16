# PaycheckBuddy Frontend

This is the React frontend for the PaycheckBuddy application.

## Features

- User authentication (login/register)
- View and manage time periods
- Track expenses and paychecks
- Visualize income vs expenses
- Responsive design for all devices

## Tech Stack

- React
- React Router for navigation
- Context API for state management
- Axios for API calls
- Chart.js for data visualization
- Tailwind CSS for styling

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── auth/           # Authentication related components
│   ├── dashboard/      # Dashboard components
│   ├── expenses/       # Expense management components
│   ├── paychecks/      # Paycheck management components
│   ├── time-periods/   # Time period components
│   └── ui/             # Shared UI components
├── context/            # React Context for state management
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service functions
├── utils/              # Utility functions
├── App.js              # Main app component
└── index.js            # Entry point
```

## Getting Started

### Prerequisites

- Node.js 14+ installed
- PaycheckBuddy backend running

### Installation

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:

   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Available Scripts

- `npm start`: Start the development server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run eject`: Eject from Create React App

## Development Guidelines

- Follow the component structure outlined above
- Use functional components with hooks
- Use the Context API for state management
- Use the API service functions for all backend communication
- Follow the BEM methodology for CSS class naming
