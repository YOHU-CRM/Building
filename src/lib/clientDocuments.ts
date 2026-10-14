export interface ClientDocument {
  id?: string;
  clientId: string;
  title: string;
  url: string;
  createdAt: any;
}

export const addClientDocument = async (doc: ClientDocument) => {
  const res = await fetch("/api/client-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc)
  });
  if (!res.ok) throw new Error("Failed to add client document");
  return await res.json();
};

export const getClientDocuments = async (clientId: string) => {
  try {
    const res = await fetch(`/api/client-documents/${encodeURIComponent(clientId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching client documents:", err);
    return [];
  }
};
