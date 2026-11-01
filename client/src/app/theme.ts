import { createTheme } from '@mui/material/styles';

// Keeps the original look: blue primary, light grey page, white outlined cards.
export const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    error: { main: '#c62828' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
    text: { primary: '#1f2933', secondary: '#616e7c' },
    divider: '#d9e2ec',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    h3: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
