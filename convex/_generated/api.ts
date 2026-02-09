// TEMPORARY SHIM - This file will be auto-generated when `npx convex dev` runs
// DO NOT COMMIT - Add to .gitignore

export const api = {
  documents: {
    listDocuments: {} as any,
    getDocument: {} as any,
    getDocumentsByStatus: {} as any,
    searchDocuments: {} as any,
    getDocumentStats: {} as any,
    getDocumentsByPeriodo: {} as any,
    createDocument: {} as any,
    updateDocument: {} as any,
    classifyDocument: {} as any,
    deleteDocument: {} as any,
    bulkImportDocuments: {} as any,
  },
  clients: {
    listClientes: {} as any,
    getCliente: {} as any,
    createCliente: {} as any,
    updateCliente: {} as any,
    deleteCliente: {} as any,
  },
  f29: {
    listSubmissions: {} as any,
    getSubmission: {} as any,
    createSubmission: {} as any,
    updateSubmissionStatus: {} as any,
    getSubmissionValidations: {} as any,
    deleteSubmission: {} as any,
  },
  bots: {
    listJobs: {} as any,
    getJob: {} as any,
    createJob: {} as any,
    updateJobStatus: {} as any,
    getJobSteps: {} as any,
    getActiveJobs: {} as any,
    listBotDefinitions: {} as any,
  },
  notifications: {
    listNotifications: {} as any,
    getUnreadCount: {} as any,
    markAsRead: {} as any,
    createNotification: {} as any,
  },
  chat: {
    listSessions: {} as any,
    getSession: {} as any,
    createSession: {} as any,
    listMessages: {} as any,
    createMessage: {} as any,
  },
  profiles: {
    getProfile: {} as any,
    updateProfile: {} as any,
  },
  banks: {
    listTransactions: {} as any,
    createTransaction: {} as any,
  },
  audit: {
    createAuditLog: {} as any,
    listAuditLogs: {} as any,
  },
} as const;
