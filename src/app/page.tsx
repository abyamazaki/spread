"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/components/sections/Dashboard";
import Customers from "@/components/sections/Customers";
import Deals from "@/components/sections/Deals";
import Analytics from "@/components/sections/Analytics";
import Sales from "@/components/sections/Sales";
import Masters from "@/components/sections/Masters";
import Agents from "@/components/sections/Agents";
import SuperAdminTenants from "@/components/sections/SuperAdminTenants";
import PendingTenant from "@/components/sections/PendingTenant";
import Members from "@/components/sections/Members";
import { Login } from "@/components/auth/Login";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

function MainApp() {
  const { user, appUser, loading } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3498db]"></div>
      </div>
    );
  }

  // Intercept unauthorized users
  if (!user || !appUser) {
    return <Login />;
  }

  // Intercept SuperUser tenant management override
  if (appUser.role === 'superuser' && activeSection === 'tenants') {
    return (
      <div className="flex bg-[#f5f7fa] min-h-screen">
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
          collapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          role={appUser.role} // Assume sidebar uses this to show conditional links
        />
        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarCollapsed ? "pl-20" : "pl-10"} overflow-y-auto`}>
          <SuperAdminTenants />
        </main>
      </div>
    );
  }

  // Normal Users must belong to a tenant to see the app
  if (!appUser.tenantId && appUser.role !== 'superuser') {
    return <PendingTenant />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard": return <Dashboard />;
      case "customers": return <Customers />;
      case "agents": return <Agents />;
      case "deals": return <Deals />;
      case "analytics": return <Analytics />;
      case "sales": return <Sales />;
      case "masters": return <Masters />;
      case "members": return <Members />;
      case "tenants": return <SuperAdminTenants />; // Only superadmin sees this active
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex bg-[#f5f7fa] min-h-screen">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        collapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={appUser.role} 
      />
      <main 
        className={`flex-1 p-8 transition-all duration-300 ${
          sidebarCollapsed ? "pl-20" : "pl-10"
        } overflow-y-auto`}
      >
        {renderSection()}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
