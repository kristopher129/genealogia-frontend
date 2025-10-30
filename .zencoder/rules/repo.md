---
description: Repository Information Overview
alwaysApply: true
---

# Genealogía Frontend Information

## Summary
A React-based genealogy application for visualizing family trees. The project uses D3.js and specialized libraries (d3-dtree, dtree-seed) to render interactive family tree visualizations.

## Structure
- **public/**: Static assets and HTML template
- **src/**: Source code
  - **components/**: React components including FamilyTree
  - **styles/**: CSS styling including dtree.css
  - **utils/**: Utility functions

## Language & Runtime
**Language**: JavaScript (React)
**Version**: React 19.2.0
**Build System**: Create React App
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- react: ^19.2.0
- react-dom: ^19.2.0
- d3: ^4.13.0
- d3-dtree: ^2.4.1
- dtree-seed: ^1.0.0
- lodash: ^4.17.21

**Development Dependencies**:
- @testing-library/jest-dom: ^6.9.1
- @testing-library/react: ^16.3.0
- @testing-library/user-event: ^13.5.0
- react-scripts: 5.0.1

## Build & Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## External Libraries
The application loads several libraries via CDN in the HTML template:
- D3.js (v4)
- Lodash
- d3-dtree
- dtree-seed

## Main Components
**FamilyTree.js**: Core component that renders the genealogical tree using D3.js and dTree libraries.

## Testing
**Framework**: Jest with React Testing Library
**Test Location**: src/App.test.js and potentially other test files
**Configuration**: src/setupTests.js imports Jest DOM extensions
**Run Command**:
```bash
npm test
```

## Styling
**Main CSS**: src/styles/dtree.css contains styling for the genealogy tree visualization
**Features**:
- Custom node styling
- Connection line styling
- Interactive hover effects