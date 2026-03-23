"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  collapsed: boolean;
  toggleSidebar: () => void;
  role?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, collapsed, toggleSidebar, role }) => {
  const { appUser } = useAuth();
  const [tenantName, setTenantName] = useState("営業CRM");

  useEffect(() => {
    if (appUser?.tenantId) {
      getDoc(doc(db, "tenants", appUser.tenantId)).then(snap => {
        if (snap.exists()) {
          setTenantName(snap.data().name || "テナント");
        }
      });
    } else {
      setTenantName("未所属テナント");
    }
  }, [appUser?.tenantId]);

  const menuItems = [
    { id: "dashboard", label: "📈 ダッシュボード" },
    { id: "customers", label: "👥 顧客管理" },
    { id: "agents", label: "🤝 代理店管理" },
    { id: "deals", label: "💼 商談管理" },
    { id: "analytics", label: "📊 分析" },
    { id: "sales", label: "💰 売上管理" },
    { id: "masters", label: "⚙ マスタ設定", borderTop: true },
  ];

  if (role === 'superuser' || role === 'admin') {
    menuItems.push({ id: "members", label: "🧑‍🤝‍🧑 メンバー管理", borderTop: true });
  }

  if (role === 'superuser') {
    menuItems.push({ id: "tenants", label: "🏢 テナント管理", borderTop: false });
  }

  return (
    <>
      <button
        className={`fixed p-2 rounded-md bg-[#2c3e50] text-white z-[1001] shadow-lg transition-all duration-300 ${
          collapsed ? "left-2.5 top-2.5" : "left-[260px] top-2.5"
        }`}
        onClick={toggleSidebar}
      >
        ☰
      </button>
      
      <aside
        className={`h-screen bg-[#2c3e50] text-white p-5 transition-all duration-300 flex-shrink-0 flex flex-col overflow-y-auto ${
          collapsed ? "w-0 p-0 overflow-hidden -translate-x-full" : "w-[250px] translate-x-0"
        }`}
      >
        <div className="text-xl font-bold mb-10 text-[#3498db] whitespace-nowrap overflow-hidden text-ellipsis px-2" title={tenantName}>
          🏢 {tenantName}
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                activeSection === item.id ? "bg-[#3498db]" : "hover:bg-[#34495e]"
              } ${item.borderTop ? "border-t border-[#3d5166] mt-2 pt-4" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-4 border-t border-[#3d5166]">
          <a
            href="/manual.html"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-left p-3 mb-2 rounded-lg hover:bg-[#34495e] text-[#ecf0f1] transition-colors whitespace-nowrap decoration-none"
          >
            📖 マニュアル
          </a>
          <button 
            onClick={() => signOut(auth)}
            className="w-full text-left p-3 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors whitespace-nowrap"
          >
            🚪 ログアウト
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
