# DermaView Client

A desktop application for efficient medical image management, focusing on dermatological images.

## Project Overview

DermaView Client is a cross-platform desktop application built with React and Electron, designed to help medical professionals efficiently manage and analyze patient skin images. With its intuitive user interface and powerful features, DermaView enhances workflow efficiency for dermatologists and medical practitioners.

## Key Features

### Image Management
- **Search & Filtering**: Browse images by date or patient ID
- **Upload & Download**: Transfer images between local system and server
- **Patient Integration**: Link images with patient information

### Patient Management
- **Patient Information**: Register and manage patient basic info
- **Visit History**: Track patient visits and diagnostic information
- **Image Association**: Connect images taken during visits

### Image Viewer
- **High-Quality Display**: Clearly visualize medical images
- **Zoom & Pan**: Examine details with precision
- **Image Comparison**: Compare multiple images simultaneously

### Analysis Features
- **Clustering**: Group similar images together
- **Metadata Management**: Manage image properties and additional information
- **History Tracking**: Monitor changes and access logs

### Security Features
- **User Authentication**: Secure login and permission management
- **Data Protection**: Encryption for patient information and medical images
- **Activity Logging**: Record user activity for audit purposes

## Technology Stack

- **Framework**: React + Electron
- **Language**: TypeScript
- **State Management**: Jotai
- **Styling**: TailwindCSS
- **Routing**: React Router
- **Database**: SQLite (better-sqlite3)
- **HTTP Client**: Axios

## Architecture

DermaView Client follows a structured architecture:

### Main Process (Electron)
- Application window management
- File system access control
- IPC communication handling
- Local database connection

### Renderer Process (React)
- User interface components
- State management
- API communication
- Routing

### Communication Flow
- IPC for process-to-process communication
- REST API for server communication
- Local file system protocol handling

## Installation & Setup

### Requirements
- Node.js 16.x or higher
- npm or yarn

### Development Setup

```bash
# Clone repository
git clone https://github.com/efforthye/dermaview-client-test.git
cd dermaview-client-test

# Install dependencies
npm install
# or
yarn install

# Run in development mode
npm run dev
# or
yarn dev

# Build for production
npm run build
# or
yarn build
```

## Project Structure

```
dermaview-client/
├── electron/            # Electron main process
│   ├── main.ts          # Application entry point
│   ├── preload.mjs      # Preload script
│   ├── database.ts      # Database connection management
│   └── image-reader.ts  # Image metadata processing
├── src/
│   ├── api/             # API connection modules
│   ├── atoms/           # Jotai state management
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # React entry point
├── public/              # Static files
├── dist-electron/       # Electron build output
└── package.json         # Project metadata
```

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

Project Maintainer: [GitHub Profile](https://github.com/efforthye)

---

DermaView - The Future of Medical Image Management