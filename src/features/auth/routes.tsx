import { RouteObject } from 'react-router-dom';
import Login from './pages/Login';
import ChangePasswordPage from './pages/ChangePasswordPage';

export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    element: <Login />,
  },
  {
    path: 'change-password',
    element: <ChangePasswordPage />,
  },
];

