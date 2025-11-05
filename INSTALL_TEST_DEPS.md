# Install Test Dependencies

## Quick Install Commands

### Backend (from project root)
```powershell
cd apps\backend
npm install
```

### Frontend (from project root)
```powershell
cd client
npm install
```

## Or from Root Directory

```powershell
# From C:\Users\KHK89\NFTSol

# Install backend test deps
cd apps\backend
npm install

# Install frontend test deps
cd ..\..\client
npm install
```

## Verify Installation

### Backend
```powershell
cd apps\backend
npm list jest
npm list supertest
```

### Frontend
```powershell
cd client
npm list vitest
npm list @testing-library/react
```

## Run Tests

### Backend
```powershell
cd apps\backend
npm test
```

### Frontend
```powershell
cd client
npm test
```

