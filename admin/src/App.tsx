import { Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductsList from "./pages/products/ProductsList";
import ProductForm from "./pages/products/ProductForm";
import CategoriesList from "./pages/categories/CategoriesList";
import InventoryList from "./pages/inventory/InventoryList";
import InventoryHistory from "./pages/inventory/InventoryHistory";
import OrdersList from "./pages/orders/OrdersList";
import OrderDetail from "./pages/orders/OrderDetail";
import CustomersList from "./pages/customers/CustomersList";
import CustomerDetail from "./pages/customers/CustomerDetail";
import TicketsList from "./pages/tickets/TicketsList";
import TicketDetail from "./pages/tickets/TicketDetail";
import UsersList from "./pages/users/UsersList";
import Configuration from "./pages/settings/Configuration";
import Analytics from "./pages/analytics/Analytics";
import DeliveryPayments from "./pages/delivery/DeliveryPayments";
import Themes from "./pages/themes/Themes";
import Banner from "./pages/banner/Banner";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductsList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductForm />} />
        <Route path="/categories" element={<CategoriesList />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/:variantId/history" element={<InventoryHistory />} />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/customers" element={<CustomersList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/tickets" element={<TicketsList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/settings" element={<Configuration />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/delivery-payments" element={<DeliveryPayments />} />
        <Route path="/themes" element={<Themes />} />
        <Route path="/banner" element={<Banner />} />
      </Route>
    </Routes>
  );
}
