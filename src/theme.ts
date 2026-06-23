import { createTheme } from '@mui/material/styles';

// Cream Theme Palette
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#C89F5A', // Accent Color (Gold/Bronze)
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EAE0D5', // Secondary Cream / Sand
      contrastText: '#2A2A2A',
    },
    background: {
      default: '#FDFBF7', // Primary Cream
      paper: '#FFFFFF', // Surface
    },
    text: {
      primary: '#2A2A2A', // Dark Charcoal
      secondary: '#5A5A5A',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // More rounded like LogKaro
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #EAE0D5',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        }
      }
    }
  },
});

export default theme;
