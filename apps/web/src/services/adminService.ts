import { apiClient } from "./apiConfig";

const ADMIN_KEY = "admin_password";

export interface UploadResponse {
  filename: string;
  chunks: number;
  ids: string[];
}

export interface DocumentStats {
  total_documents: number;
  index_name: string;
  dimension: number;
  metric: string;
  embedding_model: string;
  endpoint: string;
}

export const adminService = {
  login: async (password: string): Promise<{ authenticated: boolean }> => {
    const response = await apiClient.post("/admin/auth", { password });
    return response.data;
  },

  setAdminPassword: (password: string) => {
    localStorage.setItem(ADMIN_KEY, password);
  },

  getAdminPassword: (): string | null => {
    return localStorage.getItem(ADMIN_KEY);
  },

  clearAdminPassword: () => {
    localStorage.removeItem(ADMIN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(ADMIN_KEY);
  },

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const password = localStorage.getItem(ADMIN_KEY);
    if (!password) {
      throw new Error("Not authenticated");
    }

    const response = await apiClient.post<UploadResponse>(
      "/admin/documents/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Admin-Password": password,
        },
      }
    );
    return response.data;
  },

  getDocumentStats: async (): Promise<DocumentStats> => {
    const password = localStorage.getItem(ADMIN_KEY);
    if (!password) {
      throw new Error("Not authenticated");
    }

    const response = await apiClient.get<DocumentStats>("/admin/documents", {
      headers: {
        "X-Admin-Password": password,
      },
    });
    return response.data;
  },

  deleteDocument: async (docId: string): Promise<{ deleted: boolean }> => {
    const password = localStorage.getItem(ADMIN_KEY);
    if (!password) {
      throw new Error("Not authenticated");
    }

    const response = await apiClient.delete<{ deleted: boolean }>(
      `/admin/documents/${docId}`,
      {
        headers: {
          "X-Admin-Password": password,
        },
      }
    );
    return response.data;
  },
};
