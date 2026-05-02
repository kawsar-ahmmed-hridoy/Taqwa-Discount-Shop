import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Expenses from './pages/Expenses';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProfileInfoPage from './pages/ProfileInfoPage';
import Refunds from './pages/Refunds';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<ProfileInfoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}

export default App;