import React, { useState } from 'react';
import { DashboardLayout, DashboardTab } from './DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { KiosksPage } from './pages/KiosksPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { StaffPage } from './pages/StaffPage';
import { AttendancePage } from './pages/AttendancePage';
import { BranchesPage } from './pages/BranchesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export const ManagementDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Indiranagar Flagship');

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedBranch={selectedBranch}
      onSelectBranch={setSelectedBranch}
    >
      {currentTab === 'overview' && (
        <OverviewPage 
          onNavigateTab={setCurrentTab} 
          selectedBranch={selectedBranch} 
        />
      )}

      {currentTab === 'orders' && (
        <OrdersPage selectedBranch={selectedBranch} />
      )}

      {currentTab === 'menu' && (
        <MenuPage />
      )}

      {currentTab === 'kiosks' && (
        <KiosksPage />
      )}

      {currentTab === 'payments' && (
        <PaymentsPage />
      )}

      {currentTab === 'reports' && (
        <ReportsPage />
      )}

      {currentTab === 'staff' && (
        <StaffPage />
      )}

      {currentTab === 'attendance' && (
        <AttendancePage selectedBranch={selectedBranch} />
      )}

      {currentTab === 'branches' && (
        <BranchesPage 
          selectedBranch={selectedBranch} 
          onSelectBranch={setSelectedBranch} 
        />
      )}

      {currentTab === 'notifications' && (
        <NotificationsPage />
      )}

      {currentTab === 'audit' && (
        <AuditLogsPage />
      )}

      {currentTab === 'settings' && (
        <SettingsPage />
      )}
    </DashboardLayout>
  );
};

export default ManagementDashboard;
