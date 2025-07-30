# Voynich Manuscript Audio Analysis System

## Overview

This is a full-stack web application that analyzes Voynich manuscript glyphs and converts them into audio frequencies. The system allows users to input glyph sequences, upload manuscript images, and generate audio representations using various mapping algorithms and waveform types. It's built as a modern React application with an Express.js backend and uses TypeScript throughout.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query for server state and local React state for component state
- **Routing**: Wouter for lightweight client-side routing
- **Audio Processing**: Web Audio API through a custom AudioEngine class

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM using Neon serverless driver
- **File Processing**: Multer for file uploads, Sharp for image processing
- **Session Management**: Express sessions with PostgreSQL storage

## Key Components

### Core Analysis Engine
- **Pattern Analyzer**: Analyzes glyph sequences for complexity, patterns, and frequency mappings
- **Image Processor**: Processes manuscript images for glyph detection and pattern recognition
- **Audio Engine**: Converts glyph mappings to audio using Web Audio API
- **Glyph Mapper**: Maps glyphs to frequencies using various algorithms (unicode, phonetic, geometric, psycholinguistic)

### User Interface Components
- **Glyph Input Panel**: Text input for glyph sequences with configuration options
- **Frequency Visualizer**: Real-time audio visualization with canvas-based rendering
- **Manuscript Upload**: Drag-and-drop image upload with processing options
- **Analysis Results**: Statistical display of pattern analysis results
- **Preset Manager**: Save and load analysis configurations
- **Research Notes**: Auto-saving note-taking interface

### Data Models
- **Users**: Basic user authentication system
- **Analysis Sessions**: Saved analysis configurations and results
- **Glyph Presets**: User-defined glyph sequence templates
- **Manuscript Images**: Uploaded images with analysis metadata

## Data Flow

1. **Input Processing**: Users input glyph sequences or upload manuscript images
2. **Analysis Pipeline**: Backend processes glyphs through pattern analysis algorithms
3. **Frequency Mapping**: Glyphs are converted to audio frequencies using selected mapping algorithm
4. **Audio Generation**: Frontend audio engine synthesizes audio from frequency mappings
5. **Visualization**: Real-time frequency analysis displayed via canvas visualization
6. **Persistence**: Analysis sessions and presets saved to database for future reference

## External Dependencies

### Production Dependencies
- **Database**: PostgreSQL with Neon serverless driver
- **Image Processing**: Sharp for image manipulation, Canvas for glyph detection
- **Audio**: Web Audio API (browser native)
- **UI Components**: Radix UI primitives with Shadcn/ui styling
- **File Handling**: Multer for uploads

### Development Dependencies
- **Build Tools**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Styling**: Tailwind CSS with PostCSS
- **Development**: Replit-specific plugins for enhanced development experience

## Deployment Strategy

The application is designed for deployment on Replit with the following configuration:

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend builds to `dist` using esbuild
- Database migrations handled via Drizzle Kit

### Environment Configuration
- `NODE_ENV=development` for development server with Vite middleware
- `NODE_ENV=production` for production with static file serving
- Database URL required via `DATABASE_URL` environment variable

### Server Setup
- Express server serves both API routes and static files
- Vite middleware in development for hot reloading
- Production serves pre-built static files
- Error handling middleware for graceful error responses

The application emphasizes real-time analysis capabilities, user-friendly interfaces for complex audio synthesis, and persistent storage of research data. The modular architecture allows for easy extension of analysis algorithms and audio synthesis techniques.

## Recent Changes

### Database Integration (January 30, 2025)
- Added PostgreSQL database with Drizzle ORM
- Implemented DatabaseStorage class replacing in-memory MemStorage
- Created database schema with proper relations for users, analysis sessions, glyph presets, and manuscript images  
- Ran database migrations to create all tables
- Fixed copy/paste functionality issues in glyph input with performance optimizations