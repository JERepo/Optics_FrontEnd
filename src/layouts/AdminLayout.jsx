import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';


export default function AdminLayout() {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="p-4 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
