"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tenant } from "@/types/auth";
import { useAuth } from "@/lib/AuthContext";

const SuperAdminTenants: React.FC = () => {
  const { appUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTenantName, setNewTenantName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setTenants(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tenant)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    
    setCreating(true);
    try {
      await addDoc(collection(db, "tenants"), {
        name: newTenantName,
        createdAt: Timestamp.now(),
      });
      setNewTenantName("");
    } catch (error) {
      console.error("Error creating tenant:", error);
      alert("テナント作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTenant = async (tenantId: string) => {
    if (!appUser) return;
    const userRef = doc(db, "users", appUser.uid);
    try {
      await updateDoc(userRef, { tenantId });
      alert("テナントに入室しました。画面をリロードまたは他のメニューをクリックしてください。");
    } catch (error) {
      console.error("Error joining tenant:", error);
      alert("入室に失敗しました。");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right duration-500 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">テナント管理 (SaaSスーパーユーザー)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[#34495e]">新しいテナントの作成</h2>
        <form onSubmit={handleCreateTenant} className="flex gap-4">
          <input
            type="text"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            placeholder="企業名 または 組織名"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newTenantName.trim()}
            className="px-6 py-3 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] disabled:opacity-50 min-w-[120px]"
          >
            {creating ? "作成中..." : "＋ 作成する"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#34495e]">登録済みテナント一覧</h2>
        {loading ? (
          <p className="text-gray-500 py-10 text-center">読み込み中...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-4 border-b">テナントID</th>
                  <th className="p-4 border-b">企業・組織名</th>
                  <th className="p-4 border-b text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className={`hover:bg-gray-50 border-b transition ${appUser?.tenantId === t.id ? 'bg-blue-50' : ''}`}>
                    <td className="p-4 font-mono text-xs text-gray-500">{t.id}</td>
                    <td className="p-4 font-bold text-[#2c3e50]">
                      {t.name}
                      {appUser?.tenantId === t.id && <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">現在のテナント</span>}
                    </td>
                    <td className="p-4 text-center">
                      {appUser?.tenantId !== t.id && (
                        <button 
                          onClick={() => handleJoinTenant(t.id)}
                          className="px-4 py-2 border border-[#3498db] text-[#3498db] rounded text-sm font-medium hover:bg-[#3498db] hover:text-white transition"
                        >
                          このテナントに入る
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-gray-400">
                      テナントが一つも登録されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminTenants;
