import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WorkIcon from '@mui/icons-material/Work';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShieldIcon from '@mui/icons-material/Shield';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EngineeringIcon from '@mui/icons-material/Engineering';
import GroupIcon from '@mui/icons-material/Group';

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Live Feed', icon: <LiveTvIcon />, path: '/live-feed' },
  { text: 'Enquiries Pipeline', icon: <FilterAltIcon />, path: '/crm' },
  { text: 'Active Work Orders', icon: <WorkIcon />, path: '/projects' },
  { text: 'Approvals', icon: <PendingActionsIcon />, path: '/approvals' },
  { text: 'Machine Master', icon: <PrecisionManufacturingIcon />, path: '/machines' },
  { text: 'Worker Dashboard', icon: <EngineeringIcon />, path: '/worker-dashboard' },
  { text: 'Factory Attendance', icon: <GroupIcon />, path: '/attendance-dashboard' },
  { text: 'Production Log', icon: <ReceiptLongIcon />, path: '/production' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Accounts', icon: <AttachMoneyIcon />, path: '/accounts' },
  { text: 'HR & Payroll', icon: <GroupsIcon />, path: '/hr' },
];

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const drawer = (
    <Box sx={{ 
      backgroundColor: '#2A2A2A', // Dark sidebar
      height: '100%', 
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', p: 3, mt: 1 }}>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2, mr: 2 }}>
          <ShieldIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        </Box>
        <Box>
           <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FFFFFF', lineHeight: 1.1 }}>UNNATI ARTS</Typography>
           <Typography variant="caption" sx={{ color: 'primary.main', letterSpacing: 1 }}>ENTERPRISE</Typography>
        </Box>
      </Toolbar>
      
      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton component={NavLink} to={item.path} sx={{ 
              borderRadius: 3,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
              '&.active': { 
                backgroundColor: 'primary.main', 
                color: '#FFFFFF', 
                '& .MuiListItemIcon-root': { color: '#FFFFFF' } 
              } 
            }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.text}</Typography>} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, mb: 2 }}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 4, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
           <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>A</Avatar>
           <Box>
             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Admin User</Typography>
             <Typography variant="caption" sx={{ color: 'primary.main', display: 'block' }}>• Online</Typography>
           </Box>
        </Box>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, mt: 1, color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>Logout</Typography>} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', backgroundColor: '#2A2A2A' },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', backgroundColor: '#2A2A2A' },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
