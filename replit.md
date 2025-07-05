# Daily Planner - Replit Project Guide

## Overview

This is a Flask-based daily planner application that helps users organize their tasks into sections, track work sessions, and maintain productivity streaks. The application features a task management system with audio background music support, timer functionality, and daily statistics tracking.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database**: SQLAlchemy ORM with SQLite (default) or PostgreSQL support
- **Session Management**: Flask built-in sessions with configurable secret key
- **File Upload**: Werkzeug for secure file handling
- **Middleware**: ProxyFix for handling reverse proxy headers

### Frontend Architecture
- **Template Engine**: Jinja2 (Flask's default)
- **CSS Framework**: Bootstrap 5.3.0
- **Icons**: Font Awesome 6.4.0
- **JavaScript**: Vanilla JavaScript with modular organization
- **Audio Support**: HTML5 audio with JavaScript controls

### Database Schema
The application uses four main models:
- **DailyStats**: Tracks daily work metrics and streaks
- **Section**: Organizational containers for tasks
- **Task**: Individual work items with links and completion status
- **WorkingSession**: Time tracking for work periods

## Key Components

### Models (models.py)
- **DailyStats**: Stores working hours, completed tasks, and streak counts
- **Section**: Hierarchical task organization with cascade deletion
- **Task**: Full task details including priority, completion status, and resource links
- **WorkingSession**: Date-based work session tracking

### Routes (routes.py)
- Dashboard view with daily statistics
- Section management (CRUD operations)
- Task management within sections
- File upload handling for PDFs, spreadsheets, and audio files
- Audio file management and activation

### Frontend Features
- **Timer System**: Work timer and Pomodoro timer with customizable durations
- **Audio Player**: Background music with play/pause controls
- **Task Management**: Priority-based task organization
- **Statistics Dashboard**: Visual progress tracking
- **Responsive Design**: Mobile-friendly Bootstrap layout

## Data Flow

1. **User Authentication**: Session-based (no user accounts currently)
2. **Task Creation**: Section → Task hierarchy
3. **Progress Tracking**: Task completion updates daily statistics
4. **Timer Integration**: Work sessions logged to database
5. **Audio Management**: File upload, processing, and playback control

## External Dependencies

### Python Packages
- Flask: Web framework
- SQLAlchemy: Database ORM
- Werkzeug: WSGI utilities and file handling
- PyPDF2: PDF file processing
- Pandas: Spreadsheet data processing

### Frontend Libraries
- Bootstrap 5.3.0: UI framework
- Font Awesome 6.4.0: Icons
- JavaScript ES6+: Modern browser features

### File Support
- Documents: PDF, CSV, Excel files
- Audio: MP3, WAV, OGG, M4A formats
- File size limit: 16MB

## Deployment Strategy

### Environment Configuration
- **Database**: Configurable via `DATABASE_URL` environment variable
- **Session Security**: `SESSION_SECRET` for production security
- **File Storage**: Local filesystem with configurable upload directory

### Production Considerations
- SQLite for development, PostgreSQL recommended for production
- Session secret must be set for production
- File upload directory needs proper permissions
- Audio files stored in uploads directory

### Development Setup
1. Set environment variables for database and session secret
2. Flask app runs on port 5000 with debug mode
3. Auto-creation of database tables and upload directory
4. Hot reloading enabled for development

## Changelog

- July 04, 2025: Initial setup with complete Flask daily planner
- July 04, 2025: Enhanced UI with proper titles, date display, and improved typography
  - Added card headers with descriptive titles for stats (Total Working Hours, Tasks Completed, Current Streak)
  - Implemented real-time working time tracking that updates when timers are used
  - Added Inter font family for modern typography
  - Enhanced visual feedback with pulsing animations when stats are updated
  - Improved date display format on dashboard header
- July 04, 2025: Database integration and feature improvements
  - Configured PostgreSQL database with all tables properly created
  - Auto-activation of uploaded audio files (last uploaded becomes active)
  - Auto-streak generation based on task completion milestones (1, 3, 5, 10 tasks)

## User Preferences

Preferred communication style: Simple, everyday language.