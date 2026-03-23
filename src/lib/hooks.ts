import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  doc,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { useEffect, useState } from "react";
import { Company, Deal, MasterData, Branch, Agent, AgentCustomer } from "@/types";
import { useAuth } from "./AuthContext";

// Helper to get Tenant Collection Reference safely
// E.g. tenants/{tenantId}/companies
const getCollectionRef = (tenantId: string | null | undefined, collectionName: string) => {
  if (!tenantId) return null;
  return collection(db, "tenants", tenantId, collectionName);
};
const getDocRef = (tenantId: string | null | undefined, collectionName: string, docId: string) => {
  if (!tenantId) return null;
  return doc(db, "tenants", tenantId, collectionName, docId);
};

// --- Masters ---
export const useMasters = () => {
  const { appUser } = useAuth();
  const [masters, setMasters] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.tenantId) {
      setLoading(false);
      return;
    }
    const dRef = getDocRef(appUser.tenantId, "config", "masters");
    if (!dRef) return;
    
    const unsub = onSnapshot(dRef, (docSnap) => {
      if (docSnap.exists()) {
        setMasters(docSnap.data() as MasterData);
      } else {
        setMasters(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [appUser?.tenantId]);

  const saveMasters = async (data: MasterData) => {
    if (!appUser?.tenantId) return;
    const dRef = getDocRef(appUser.tenantId, "config", "masters");
    if (dRef) {
      await setDoc(dRef, data);
    }
  };

  return { masters, loading, saveMasters };
};

// --- Companies ---
export const useCompanies = () => {
  const { appUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.tenantId) {
      setLoading(false);
      return;
    }
    const colRef = getCollectionRef(appUser.tenantId, "companies");
    if (!colRef) return;

    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
      setLoading(false);
    });
    return unsub;
  }, [appUser?.tenantId]);

  const addCompany = async (data: Omit<Company, "id" | "createdAt">) => {
    if (!appUser?.tenantId) throw new Error("No tenant");
    const colRef = getCollectionRef(appUser.tenantId, "companies");
    if (colRef) {
      await addDoc(colRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
    }
  };

  return { companies, loading, addCompany };
};

// --- Deals ---
export const useDeals = () => {
  const { appUser } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.tenantId) {
      setLoading(false);
      return;
    }
    const colRef = getCollectionRef(appUser.tenantId, "deals");
    if (!colRef) return;

    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setDeals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deal)));
      setLoading(false);
    });
    return unsub;
  }, [appUser?.tenantId]);

  const addDeal = async (data: Omit<Deal, "id" | "createdAt">) => {
    if (!appUser?.tenantId) throw new Error("No tenant");
    const colRef = getCollectionRef(appUser.tenantId, "deals");
    if (colRef) {
      await addDoc(colRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
    }
  };

  return { deals, loading, addDeal };
};

// --- Branches ---
export const useBranches = () => {
  const { appUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.tenantId) {
      setLoading(false);
      return;
    }
    const colRef = getCollectionRef(appUser.tenantId, "branches");
    if (!colRef) return;

    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setBranches(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
      setLoading(false);
    });
    return unsub;
  }, [appUser?.tenantId]);

  const addBranch = async (data: Omit<Branch, "id" | "createdAt">) => {
    if (!appUser?.tenantId) throw new Error("No tenant");
    const colRef = getCollectionRef(appUser.tenantId, "branches");
    if (colRef) {
      await addDoc(colRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
    }
  };

  return { branches, loading, addBranch };
};

// --- Agents ---
export const useAgents = () => {
  const { appUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.tenantId) {
      setLoading(false);
      return;
    }
    const colRef = getCollectionRef(appUser.tenantId, "agents");
    if (!colRef) return;

    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setAgents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Agent)));
      setLoading(false);
    });
    return unsub;
  }, [appUser?.tenantId]);

  const addAgent = async (data: Omit<Agent, "id" | "createdAt">) => {
    if (!appUser?.tenantId) throw new Error("No tenant");
    const colRef = getCollectionRef(appUser.tenantId, "agents");
    if (colRef) {
      await addDoc(colRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
    }
  };

  return { agents, loading, addAgent };
};

// --- Agent Customers ---
export const useAgentCustomers = () => {
  const { appUser } = useAuth();
  const [agentCustomers, setAgentCustomers] = useState<AgentCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.tenantId) {
      setLoading(false);
      return;
    }
    const colRef = getCollectionRef(appUser.tenantId, "agent_customers");
    if (!colRef) return;

    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setAgentCustomers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AgentCustomer)));
      setLoading(false);
    });
    return unsub;
  }, [appUser?.tenantId]);

  const addAgentCustomer = async (data: Omit<AgentCustomer, "id" | "createdAt">) => {
    if (!appUser?.tenantId) throw new Error("No tenant");
    const colRef = getCollectionRef(appUser.tenantId, "agent_customers");
    if (colRef) {
      await addDoc(colRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
    }
  };

  return { agentCustomers, loading, addAgentCustomer };
};
