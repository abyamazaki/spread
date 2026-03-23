"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { AppUser } from "@/types/auth";

const Members: React.FC = () => {
  const { appUser } = useAuth();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Default invite form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch current tenant members
  useEffect(() => {
    if (!appUser?.tenantId) return;

    const q = query(
      collection(db, "users"),
      where("tenantId", "==", appUser.tenantId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(doc => doc.data() as AppUser));
      setLoading(false);
    });

    return unsub;
  }, [appUser?.tenantId]);

  const handleAddUser = async (uid: string) => {
    if (!appUser?.tenantId) return;
    try {
      if (!confirm("このユーザーを現在のテナントに追加しますか？")) return;
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { tenantId: appUser.tenantId });
      alert("ユーザーを追加しました！");
    } catch (error) {
      console.error("Error adding user to tenant:", error);
      alert("追加に失敗しました。");
    }
  };

  const handleRemoveUser = async (uid: string) => {
    try {
      if (!confirm("本当にこのユーザーをテナントから外しますか？")) return;
      if (uid === appUser?.uid) {
        alert("自分自身を外すことはできません。");
        return;
      }
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { tenantId: null });
      alert("テナントから外しました。");
    } catch (error) {
      console.error("Error removing user:", error);
      alert("操作に失敗しました。");
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.tenantId || !newEmail || !newPassword) return;

    setCreating(true);
    try {
      // Create a secondary app so the current admin does not get logged out
      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUid = userCredential.user.uid;
      
      await signOut(secondaryAuth);
      
      await setDoc(doc(db, "users", newUid), {
        uid: newUid,
        email: newEmail,
        name: newName || newEmail.split("@")[0],
        tenantId: appUser.tenantId,
        role: "user"
      });
      
      alert("新規ユーザーを作成し、テナントに追加しました！");
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    } catch (error: any) {
      console.error("Error creating user:", error);
      alert("アカウント作成に失敗しました: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">チームメンバー管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 現在のメンバー */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#2c3e50] border-b pb-2 flex justify-between items-center">
            <span>現在の所属メンバー</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{members.length}名</span>
          </h2>
          {members.length === 0 ? (
            <p className="text-gray-500 py-4">メンバーがいません。</p>
          ) : (
            <ul className="space-y-3">
              {members.map(user => (
                <li key={user.uid} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-bold text-[#2c3e50]">{user.name || "名称未設定"}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      権限: {user.role === 'superuser' ? 'スーパーユーザー' : (user.role === 'admin' ? '管理者' : '一般ユーザー')}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveUser(user.uid)}
                    disabled={user.uid === appUser?.uid}
                    className="text-xs px-3 py-1 text-red-500 border border-red-200 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    外す
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 新規メンバー作成 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#2ecc71]">
          <h2 className="text-lg font-semibold mb-4 text-[#2c3e50] border-b pb-2 flex justify-between items-center">
            <span>新しいメンバーを追加</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            ここでメールアドレスとパスワードを決めてアカウントを作ってあげると、相手は「待機画面」をスキップしていきなりこのテナントに参加できます。（パスワードは本人に伝えてください）
          </p>



          <form onSubmit={handleCreateNewUser} className="space-y-4 bg-gray-50 p-4 border rounded-lg">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">お名前</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="(任意) 山田太郎"
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">メールアドレス *</label>
              <input 
                type="email" 
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">初期パスワード (6文字以上) *</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="初回の仮パスワード"
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              />
            </div>
            <button 
              type="submit" 
              disabled={creating || !newEmail || newPassword.length < 6}
              className="w-full bg-[#3498db] text-white font-bold p-3 rounded-lg shadow-sm hover:bg-[#2980b9] transition disabled:opacity-50"
            >
              {creating ? "作成中..." : "＋ アカウントを作成して招待"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Members;
