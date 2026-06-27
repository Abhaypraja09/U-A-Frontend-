import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { Box, Typography } from '@mui/material';

import CRM from './pages/CRM';
import Projects from './pages/Projects';
import Accounts from './pages/Accounts';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Dispatch from './pages/Dispatch';
import HR from './pages/HR';
import Approvals from './pages/Approvals';
import Dashboard from './pages/Dashboard';
import LiveFeed from './pages/LiveFeed';
import Machines from './pages/Machines';
import ProjectDetails from './pages/ProjectDetails';
import LogBook from './pages/LogBook';

import Login from './pages/Login';
import WorkerDashboard from './pages/WorkerDashboard';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/worker',
    element: <WorkerDashboard />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'live-feed',
        element: <LiveFeed />
      },
      {
        path: 'log-book',
        element: <LogBook />
      },
      {
        path: 'crm',
        element: <CRM />
      },
      {
        path: 'crm/:id',
        element: <ProjectDetails />
      },
      {
        path: 'projects',
        element: <Projects />
      },
      {
        path: 'projects/:id',
        element: <ProjectDetails />
      },
      {
        path: 'approvals',
        element: <Approvals />
      },
      {
        path: 'accounts',
        element: <Accounts />
      },
      {
        path: 'inventory',
        element: <Inventory />
      },
      {
        path: 'production',
        element: <Production />
      },
      {
        path: 'dispatch',
        element: <Dispatch />
      },
      {
        path: 'machines',
        element: <Machines />
      },
      {
        path: 'hr',
        element: <HR />
      }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
