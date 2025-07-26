// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Indigo-600
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a', // Slate-900
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fafb', // Gray-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#2563eb',
      disabled: '#94a3b8',
    },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    success: { main: '#10b981' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: 38, letterSpacing: -0.5 },
    h2: { fontWeight: 700, fontSize: 32, letterSpacing: -0.3 },
    h3: { fontWeight: 700, fontSize: 26 },
    h4: { fontWeight: 700, fontSize: 22 },
    h5: { fontWeight: 700, fontSize: 20 },
    h6: { fontWeight: 700, fontSize: 18 },
    body1: { fontSize: 16, fontWeight: 400 },
    body2: { fontSize: 15 },
    subtitle1: { fontSize: 15, fontWeight: 500 },
    subtitle2: { fontSize: 14, fontWeight: 500 },
    button: { fontSize: 15, fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 4px rgba(0,0,0,0.04)',
    '0 2px 8px rgba(0,0,0,0.08)',
    ...Array(22).fill('0 4px 16px rgba(0,0,0,0.06)'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontWeight: 600,
          fontSize: 15,
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #2563eb 0%, #1e3a8a 100%)',
          '&:hover': {
            background: '#1d4ed8',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          },
        },
        outlined: {
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#94a3b8',
            background: '#f1f5f9',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(15,23,42,0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 15,
          color: '#0f172a',
          borderBottom: '1px solid #e2e8f0',
        },
        head: {
          fontWeight: 700,
          fontSize: 15,
          background: '#f1f5f9',
          color: '#2563eb',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          background: '#fff',
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 4,
          borderRadius: 2,
          background: 'linear-gradient(90deg, #2563eb 0%, #1e3a8a 100%)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: 15,
          color: '#0f172a',
          textTransform: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 13,
          backgroundColor: '#334155',
        },
        arrow: {
          color: '#334155',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: '0 6px 24px rgba(15,23,42,0.1)',
        },
      },
    },
  },
});

export default theme;
