import type { ReactNode } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h1" color="primary" gutterBottom>
            Task Tracker
          </Typography>
          <Typography variant="h2" gutterBottom>
            {title}
          </Typography>
          {children}
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            {footer}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
