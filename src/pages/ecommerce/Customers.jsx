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
import { mockApi } from '../../services/mockApi';
import AdminAddUserModal from '../../partials/customers/AdminAddUserModal';
import AddCustomerModal from '../../partials/customers/AddCustomerModal';

function Customers() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [extraData, setExtraData] = useState({});
  const { user } = useAuth();

  const handleSelectedItems = (selectedItems) => {
    setSelectedItems([...selectedItems]);
  };

  const refreshUsers = async () => {
    setLoading(true);
    try {
      if (user?.username === 'admin') {
        // Admin view: fetch real users
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
      } else {
        // Regular view: use mock API for customers
        const response = await mockApi.getCustomers();
        const mapped = response.data.map(customer => ({
          id: customer.id,
          image: customer.avatar,
          name: customer.name,
          email: customer.email,
          location: customer.location,
          orders: customer.orders.toString(),
          lastOrder: customer.lastOrder,
          spent: `$${customer.spent.toLocaleString()}`,
          refunds: customer.refunds.toString(),
          fav: false,
        }));
        setRows(mapped);
      }
    } catch (e) {
      console.error('Failed to load data', e);
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
      if (user?.username === 'admin') {
        await adminApi.createUser(payload);
      } else {
        await mockApi.createCustomer(payload);
      }
      setAddOpen(false);
      await refreshUsers();
    } catch (e) {
      console.error('Failed to create user/customer', e);
      // Keep modal open; Modal will show inline error if we wire it later
    } finally {
      setCreating(false);
    }
  };

  const handleFetchData = async () => {
    if (!rows || rows.length === 0) return;
    
    setFetchingData(true);
    setExtraData({});
    
    try {
      // Sequential API calls for each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        console.log(`🔄 Fetching extra data for ${row.name} (${i + 1}/${rows.length})`);
        
        // Simulate API call with random delay
        const delay = 500 + Math.random() * 1500; // 500-2000ms
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Generate mock extra data
        const mockExtraData = {
          score: Math.floor(60 + Math.random() * 40), // 60-100
          status: Math.random() > 0.3 ? 'Active' : 'Inactive',
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };
        
        setExtraData(prev => ({
          ...prev,
          [row.id]: mockExtraData
        }));
        
        console.log(`✅ Extra data fetched for ${row.name}:`, mockExtraData);
      }
    } catch (e) {
      console.error('Failed to fetch extra data', e);
    } finally {
      setFetchingData(false);
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
                    {/* Fetch Data button */}
                    <button 
                      className="btn bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50" 
                      onClick={handleFetchData}
                      disabled={fetchingData || !rows || rows.length === 0}
                    >
                      {fetchingData ? (
                        <>
                          <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Fetching...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                            <path d="M13 7h-3V4c0-.6-.4-1-1-1s-1 .4-1 1v3H5c-.6 0-1 .4-1 1s.4 1 1 1h3v3c0 .6.4 1 1 1s1-.4 1-1V9h3c.6 0 1-.4 1-1s-.4-1-1-1z"/>
                          </svg>
                          <span className="hidden xs:block ml-2">Fetch Data</span>
                        </>
                      )}
                    </button>
                    {/* Add customer button */}
                    <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => setAddOpen(true)}>
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
            {loading ? (
              <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="ml-3 text-slate-500">Loading {user?.username === 'admin' ? 'users' : 'customers'}...</span>
                </div>
              </div>
            ) : (
              <CustomersTable 
                selectedItems={handleSelectedItems} 
                rows={null} 
                adminView={user?.username === 'admin'}
                extraData={extraData}
                fetchingData={fetchingData}
              />
            )}

            {/* Add User/Customer Modal */}
            {user?.username === 'admin' ? (
              <AdminAddUserModal
                open={addOpen}
                setOpen={setAddOpen}
                onCreated={handleCreateUser}
                creating={creating}
              />
            ) : (
              <AddCustomerModal
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