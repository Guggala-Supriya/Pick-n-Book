import { Outlet } from 'react-router-dom';
import AdminSidebar from './SIDEBAR ADMIN/sidebar_admin';
import './adminlayout.css';

function AdminLayout({ topbar }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="main-area">
        {topbar}
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
