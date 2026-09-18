import React, { useState, useEffect } from 'react';
import { User, Role, Complaint, IssueCluster, Department, AnalyticsData } from './types';
import { Navbar } from './components/common/Navbar';
import { GovFooter } from './components/common/GovFooter';
import { LoginPage } from './components/auth/LoginPage';
import { CitizenHome } from './components/citizen/CitizenHome';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminGISView } from './components/admin/AdminGISView';
import { IssueIntelligenceView } from './components/admin/IssueIntelligenceView';
import { ComplaintsManagement } from './components/admin/ComplaintsManagement';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { DepartmentDashboard } from './components/department/DepartmentDashboard';
import { fetchComplaints, fetchClusters, fetchDepartments, fetchAnalytics, resetDemoData, clearDemoData } from './api';

export function App() {
  // Authentication State with LocalStorage Persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('civicpulse_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // Core Datasets
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize user to LocalStorage
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('civicpulse_user', JSON.stringify(user));
    setSelectedClusterId(null);
    loadData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('civicpulse_user');
    setSelectedClusterId(null);
    loadData();
  };

  // Load all application data from backend API
  const loadData = async () => {
    try {
      setLoading(true);
      const [cmps, cls, depts, ana] = await Promise.all([
        fetchComplaints(),
        fetchClusters(),
        fetchDepartments(),
        fetchAnalytics()
      ]);
      setComplaints(cmps);
      setClusters(cls);
      setDepartments(depts);
      setAnalytics(ana);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, currentUser?.role]);

  const handleResetDemo = async () => {
    await resetDemoData();
    setSelectedClusterId(null);
    loadData();
  };

  const handleClearData = async () => {
    await clearDemoData();
    setSelectedClusterId(null);
    loadData();
  };

  const handleSelectCluster = (clusterId: string) => {
    setSelectedClusterId(clusterId);
  };

  // IF NOT AUTHENTICATED: Display Dedicated Login Portal
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Universal Top Navigation with Authenticated Identity and Role Enforcement */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetDemo={handleResetDemo}
        onClearData={handleClearData}
        activeTab={adminTab}
        onTabChange={(t) => {
          setAdminTab(t);
          setSelectedClusterId(null);
        }}
      />

      {/* Main Role-Restricted Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && complaints.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Connecting to CivicPulse AI Intelligence Engine...</p>
          </div>
        ) : (
          <>
            {/* ROLE 1: CITIZEN PORTAL (Strictly Citizen-Only Access) */}
            {currentUser.role === 'citizen' && (
              <CitizenHome
                citizenMobile={currentUser.mobile}
                onComplaintSubmitted={loadData}
              />
            )}

            {/* ROLE 2: CITY ADMIN DASHBOARD (Shows ALL Departments including PWD & WATER) */}
            {currentUser.role === 'admin' && (
              <>
                {selectedClusterId ? (
                  <IssueIntelligenceView
                    clusterId={selectedClusterId}
                    onBack={() => setSelectedClusterId(null)}
                  />
                ) : adminTab === 'dashboard' ? (
                  <AdminDashboard
                    clusters={clusters}
                    complaints={complaints}
                    analytics={analytics}
                    onSelectCluster={handleSelectCluster}
                    onNavigateToGIS={() => setAdminTab('gis')}
                    onNavigateToComplaints={() => setAdminTab('complaints')}
                    onRefresh={loadData}
                  />
                ) : adminTab === 'gis' ? (
                  <AdminGISView
                    complaints={complaints}
                    clusters={clusters}
                    onSelectCluster={handleSelectCluster}
                    onSelectComplaint={() => {}}
                  />
                ) : adminTab === 'complaints' ? (
                  <ComplaintsManagement
                    complaints={complaints}
                    onSelectCluster={handleSelectCluster}
                  />
                ) : (
                  <AnalyticsDashboard
                    analytics={analytics}
                    clusters={clusters}
                    onSelectCluster={handleSelectCluster}
                  />
                )}
              </>
            )}

            {/* ROLE 3: DEPARTMENT OFFICER WORKSPACE (Strictly Scoped to PWD or WATER Dashboard) */}
            {currentUser.role === 'officer' && (
              <>
                {selectedClusterId ? (
                  <IssueIntelligenceView
                    clusterId={selectedClusterId}
                    onBack={() => setSelectedClusterId(null)}
                  />
                ) : (
                  <DepartmentDashboard
                    departmentId={currentUser.department_id || 'PWD'}
                    departments={departments}
                    clusters={clusters}
                    complaints={complaints}
                    onRefresh={loadData}
                    onSelectClusterForIntelligence={handleSelectCluster}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
}

export default App;
