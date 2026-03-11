import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Divider, useMediaQuery, Avatar } from '@mui/material';
import { Brightness4, Brightness7, Dashboard, People, CheckCircle, BarChart, Menu as MenuIcon, Church } from '@mui/icons-material';

import DashboardPage from './pages/Dashboard';
import DepartmentManagePage from './pages/DepartmentManage';
import AttendanceCheckPage from './pages/AttendanceCheck';
import StatisticsPage from './pages/Statistics';

const drawerWidth = 260;

function Layout({ toggleColorMode, mode }: { toggleColorMode: () => void, mode: 'light' | 'dark' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: '대시보드', icon: <Dashboard />, path: '/' },
    { text: '부서/부서원 관리', icon: <People />, path: '/manage' },
    { text: '출석 체크', icon: <CheckCircle />, path: '/attendance' },
    { text: '통계 모니터링', icon: <BarChart />, path: '/statistics' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, py: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <Church fontSize="small" />
          </Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            청년회 출석
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ opacity: 0.5 }} />
      <List sx={{ px: 2, pt: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={isSelected}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' }
                  },
                  '&:hover': {
                    bgcolor: mode === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.16)',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40, 
                  color: isSelected ? 'inherit' : (mode === 'light' ? 'text.secondary' : 'text.primary') 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontWeight: isSelected ? 700 : 500 }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {menuItems.find(m => m.path === location.pathname)?.text || '출석 관리 앱'}
          </Typography>
          <IconButton 
            sx={{ ml: 1, bgcolor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }} 
            onClick={toggleColorMode} 
            color="inherit"
          >
            {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRightStyle: 'dashed' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, maxWidth: '1200px', mx: 'auto' }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/manage" element={<DepartmentManagePage />} />
          <Route path="/attendance" element={<AttendanceCheckPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#4f46e5', light: '#e0e7ff', dark: '#4338ca' }, // Indigo
          secondary: { main: '#10b981', light: '#d1fae5', dark: '#059669' }, // Emerald
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
          divider: mode === 'light' ? '#e2e8f0' : '#334155',
          text: {
            primary: mode === 'light' ? '#0f172a' : '#f8fafc',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
          }
        },
        shape: { borderRadius: 16 },
        typography: {
          fontFamily: '"Pretendard", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 800, letterSpacing: '-0.02em' },
          h5: { fontWeight: 700, letterSpacing: '-0.01em' },
          h6: { fontWeight: 700 },
          subtitle1: { fontWeight: 600 },
          subtitle2: { fontWeight: 600 },
          button: { fontWeight: 600, textTransform: 'none' },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 10, padding: '8px 20px', boxShadow: 'none' },
              contained: { '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: { backgroundImage: 'none' },
              elevation1: { boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.3)' },
              elevation3: { boxShadow: mode === 'light' ? '0 4px 20px -2px rgba(0,0,0,0.05)' : '0 4px 20px -2px rgba(0,0,0,0.4)' },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(12px)',
                color: mode === 'light' ? '#0f172a' : '#f8fafc',
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: { 
                fontWeight: 700, 
                backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a', 
                borderBottom: `2px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
                color: mode === 'light' ? '#475569' : '#cbd5e1'
              },
              root: { borderBottom: `1px solid ${mode === 'light' ? '#f1f5f9' : '#1e293b'}` }
            }
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: { borderRadius: 10 }
            }
          }
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout toggleColorMode={colorMode.toggleColorMode} mode={mode} />
      </Router>
    </ThemeProvider>
  );
}
