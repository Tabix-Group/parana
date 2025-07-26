import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      contrastText: '#fff',
    },
    secondary: {
      main: '#22336b',
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6fb',
      paper: '#fff',
    },
    error: {
      main: '#e53935',
    },
    info: {
      main: '#2563eb',
    },
    success: {
      main: '#43a047',
    },
    warning: {
      main: '#ffa726',
    },
    divider: '#e0e3e7',
    text: {
      primary: '#22336b',
      secondary: '#2563eb',
      disabled: '#b6c2d2',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: 36, letterSpacing: 0.5 },
    h2: { fontWeight: 700, fontSize: 30, letterSpacing: 0.3 },
    h3: { fontWeight: 700, fontSize: 24 },
    h4: { fontWeight: 700, fontSize: 20 },
    h5: { fontWeight: 700, fontSize: 18 },
    h6: { fontWeight: 700, fontSize: 16 },
    button: { fontWeight: 600, fontSize: 16 },
    body1: { fontSize: 16 },
    body2: { fontSize: 15 },
    subtitle1: { fontWeight: 500, fontSize: 15 },
    subtitle2: { fontWeight: 500, fontSize: 14 },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 8px 0 rgba(34,51,107,0.10)',
    '0 4px 32px 0 rgba(34,51,107,0.08)',
    ...Array(22).fill('0 2px 8px 0 rgba(34,51,107,0.10)')
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: '0 2px 8px 0 rgba(34,51,107,0.10)',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          padding: '8px 20px',
          transition: 'background 0.2s, box-shadow 0.2s',
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #2563eb 80%, #22336b 100%)',
        },
        outlined: {
          borderColor: '#e0e3e7',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 32px 0 rgba(34,51,107,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 15,
          color: '#22336b',
        },
        head: {
          fontWeight: 700,
          fontSize: 16,
          background: '#f6f8fa',
          color: '#2563eb',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 8px 32px 0 rgba(34,51,107,0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          background: '#fff',
          borderRadius: 8,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 4,
          borderRadius: 2,
          background: 'linear-gradient(90deg, #2563eb 80%, #22336b 100%)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: 16,
          color: '#22336b',
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
