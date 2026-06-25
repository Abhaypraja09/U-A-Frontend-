import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Divider, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGetProjectByIdQuery } from '../../store/apiSlice';

interface TopbarProps {
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

const Topbar: React.FC<TopbarProps> = ({ handleDrawerToggle, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Parse path to see if we are on a project/crm details page
  const match = location.pathname.match(/\/(crm|projects)\/([a-fA-F0-9-]+|[0-9a-fA-F]{24})/);
  const isProjectPage = !!match;
  const pageType = match ? match[1] : ''; // 'crm' or 'projects'
  const projectId = match ? match[2] : '';

  // Query project status to know where the active step lies
  const { data: project } = useGetProjectByIdQuery(projectId, { skip: !projectId });
  const isProjectActive = project ? ['shop_drawing', 'material_planning', 'production', 'work_order', 'completed'].includes(project.status) : false;

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider'
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
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Unnati Arts ERP
        </Typography>
        <Box>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {isProjectPage && (
              <>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(pageType === 'crm' ? '/crm' : '/projects');
                }} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <ListItemText primary={pageType === 'crm' ? "← Back to Pipeline" : "← Back to Projects"} />
                </MenuItem>
                <Divider />
                {/* CRM/Enquiry stages always go to /crm/:id?view=... */}
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(`/crm/${projectId}?view=0`);
                }}>
                  <ListItemText primary="View Enquiry Details" />
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(`/crm/${projectId}?view=1`);
                }}>
                  <ListItemText primary="View Reference Design" />
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(`/crm/${projectId}?view=2`);
                }}>
                  <ListItemText primary="View Costing" />
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(`/crm/${projectId}?view=3`);
                }}>
                  <ListItemText primary="View Advance Payment" />
                </MenuItem>
                {/* Back to Active Step goes to /projects/:id if active, else /crm/:id */}
                {location.search.includes('view=') && (
                  <MenuItem onClick={() => {
                    handleMenuClose();
                    navigate(isProjectActive ? `/projects/${projectId}` : `/crm/${projectId}`);
                  }} sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                    <ListItemText primary="Back to Active Step" />
                  </MenuItem>
                )}
                <Divider />
              </>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
