import React, { useState } from "react";
import { Modal } from "./Modal";
import { useAgents, useMasters } from "@/lib/hooks";

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentFormModal: React.FC<AgentFormModalProps> = ({ isOpen, onClose }) => {
  const { addAgent } = useAgents();
  const { masters } = useMasters();

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    contactPoint: "",
    owner: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true);
    try {
      await addAgent(formData);
      setFormData({
        name: "",
        region: "",
        contactPoint: "",
        owner: "",
        email: "",
        phone: "",
        notes: "",
      });
      onClose();
    } catch (error) {
      console.error("Error adding agent:", error);
      alert("エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="代理店登録">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">代理店名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地域</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="">選択してください</option>
              {masters?.regions?.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">接点</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.contactPoint}
              onChange={(e) => setFormData({ ...formData, contactPoint: e.target.value })}
            >
              <option value="">選択してください</option>
              {masters?.contacts?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            >
              <option value="">選択してください</option>
              {masters?.owners?.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-100 mt-2 py-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#3498db] text-white rounded-md hover:bg-[#2980b9] disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
