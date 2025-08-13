import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import AdminPage from './pages/Admin'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/admin', element: <AdminPage /> },
])
