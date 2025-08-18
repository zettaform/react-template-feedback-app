import React, { useEffect, useState } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import DeleteButton from '../../partials/actions/DeleteButton';
import DateSelect from '../../components/DateSelect';
import FilterButton from '../../components/DropdownFilter';
import CustomersTable from '../../partials/customers/CustomersTable';
import PaginationClassic from '../../components/PaginationClassic';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../services/api';
import AdminAddUserModal from '../../partials/customers/AdminAddUserModal';

function Customers() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const handleSelectedItems = (selectedItems) => {
    setSelectedItems([...selectedItems]);
  };

  const refreshUsers = async () => {
    if (user?.username !== 'admin') return;
    setLoading(true);
    try {
      const users = await adminApi.listUsers();
      const mapped = users.map((u, idx) => ({
        id: u.username || String(idx),
        image: u.avatar ? `/dbz/${u.avatar}` : null,
        name: u.full_name || u.username,
        email: u.email,
        onboardingCompleted: !!u.onboarding_completed,
        location: '-',
        orders: '-',
        lastOrder: '-',
        spent: '-',
        refunds: '-',
        fav: false,
      }));
      setRows(mapped);
    } catch (e) {
      console.error('Failed to load users', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Debug modal state changes
    console.log('[Customers] addOpen:', addOpen);
  }, [addOpen]);

  const handleCreateUser = async (payload) => {
    setCreating(true);
    try {
      await adminApi.createUser(payload);
      setAddOpen(false);
      await refreshUsers();
    } catch (e) {
      console.error('Failed to create user', e);
      // Keep modal open; AdminAddUserModal will show inline error if we wire it later
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">

              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">{user?.username === 'admin' ? 'Users' : 'Customers'} ✨</h1>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">

                {user?.username !== 'admin' ? (
                  <>
                    {/* Delete button */}
                    <DeleteButton selectedItems={selectedItems} />
                    {/* Dropdown */}
                    <DateSelect />
                    {/* Filter button */}
                    <FilterButton align="right" />
                    {/* Add customer button */}
                    <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white">
                      <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                        <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                      </svg>
                      <span className="hidden xs:block ml-2">Add Customer</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white" onClick={(e) => { e.stopPropagation(); console.log('[Customers] Add User click'); setAddOpen(true); }}>
                      <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                        <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                      </svg>
                      <span className="hidden xs:block ml-2">Add User</span>
                    </button>
                  </>
                )}
                
              </div>

            </div>

            {/* Table */}
            {user?.username === 'admin' ? (
              loading ? (
                <div className="text-slate-500">Loading users…</div>
              ) : (
                <CustomersTable selectedItems={handleSelectedItems} rows={rows || []} adminView />
              )
            ) : (
              <CustomersTable selectedItems={handleSelectedItems} />
            )}

            {/* Add User Modal */}
            {user?.username === 'admin' && (
              <AdminAddUserModal
                open={addOpen}
                setOpen={setAddOpen}
                onCreated={handleCreateUser}
                creating={creating}
              />
            )}

            {/* Pagination */}
            <div className="mt-8">
              <PaginationClassic />
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}

export default Customers;