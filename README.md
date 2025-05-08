# PaycheckBuddy

A financial budgeting application that organizes finances by time periods rather than traditional monthly cycles.

## Features

- User authentication (login/register)
- Time period-based financial organization
- Track expenses and paychecks
- Visualize income vs expenses
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, React Router, Context API, Chart.js
- **Backend**: Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Marshmallow

## Project Structure

The project is organized into a client-server architecture:

- `src/`: Frontend React components and logic
- `server/`: Flask backend API and database models

## Getting Started

### Prerequisites

- Node.js 14+ installed
- Python 3.7+ installed
- pip package manager

### Installation & Setup

1. Clone the repository:
   git clone <repository-url>
   cd paycheck-buddy

2. Install frontend dependencies:
   npm install

3. Start the backend server:
   cd server
   python app.py

4. In a new terminal, start the frontend development server:
   npm start

5. Open your browser and navigate to:
   http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get access token
- `POST /api/auth/refresh`: Refresh access token

### Time Periods

- `GET /api/time_periods`: Get all time periods (shared resource)
- `POST /api/time_periods`: Create a new time period
- `GET /api/time_periods/:id`: Get a specific time period

### Expenses & Paychecks

- Full CRUD operations for both expenses and paychecks
- Nested under time periods (e.g., `/api/time_periods/:id/expenses`)

### User Data

- `GET /api/user_data`: Get all user data in a single request (efficient loading)
