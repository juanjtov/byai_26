import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documentApi } from '@/lib/api';
import { DashboardLayout, OrganizationSetup } from '@/components/dashboard';

interface Document {
  id: string;
  name: string;
  type: string;
  file_path: string;
  file_size: number | null;
  status: string;
  created_at: string;
}

const documentTypes = [
  { value: 'contract', label: 'Contract' },
  { value: 'cost_sheet', label: 'Cost Sheet' },
  { value: 'addendum', label: 'Addendum' },
  { value: 'other', label: 'Other' },
];

export function DocumentsPage() {
  const { organization, accessToken } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('contract');
  const [reprocessingIds, setReprocessingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!organization?.id || !accessToken) return;

    try {
      const data = await documentApi.list(organization.id, accessToken) as Document[];
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    // Exit loading if organization is explicitly null
    if (organization === null) {
      setLoading(false);
      return;
    }

    if (!organization?.id) return;

    fetchDocuments();
  }, [organization, accessToken]);

  // Auto-refresh when there are documents being processed
  useEffect(() => {
    const hasProcessingDocs = documents.some(
      (d) => d.status === 'processing' || d.status === 'pending'
    );

    if (!hasProcessingDocs || !organization?.id || !accessToken) return;

    const pollInterval = setInterval(() => {
      fetchDocuments();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [documents, organization, accessToken]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization?.id || !accessToken) return;

    setError('');
    setUploading(true);

    try {
      // Get upload URL
      const uploadData = await documentApi.getUploadUrl(
        organization.id,
        file.name,
        file.type || 'application/pdf',
        accessToken
      ) as { upload_url: string; file_path: string };

      // Upload file to Supabase Storage
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Create document record
      await documentApi.create(
        organization.id,
        {
          name: file.name,
          type: selectedType,
          file_path: uploadData.file_path,
          file_size: file.size,
          mime_type: file.type || 'application/pdf',
        },
        accessToken
      );

      // Refresh documents list
      await fetchDocuments();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!organization?.id || !accessToken) return;

    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentApi.delete(organization.id, docId, accessToken);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleReprocess = async (docId: string) => {
    if (!organization?.id || !accessToken) return;

    setReprocessingIds((prev) => new Set(prev).add(docId));
    setError('');

    try {
      await documentApi.reprocess(organization.id, docId, accessToken);
      // Update local state to show processing status
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: 'processing' } : d
        )
      );

      // Poll for completion (check every 2 seconds, up to 60 seconds)
      const maxAttempts = 30;
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const doc = await documentApi.get(organization.id, docId, accessToken) as Document;
          if (doc.status !== 'processing' || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setDocuments((prev) =>
              prev.map((d) => (d.id === docId ? { ...d, status: doc.status } : d))
            );
            setReprocessingIds((prev) => {
              const next = new Set(prev);
              next.delete(docId);
              return next;
            });
          }
        } catch {
          clearInterval(pollInterval);
          setReprocessingIds((prev) => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprocess document');
      setReprocessingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      processed: 'bg-green-500/20 text-green-400',
      error: 'bg-red-500/20 text-red-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ivory/10 rounded w-1/3"></div>
          <div className="h-64 bg-ivory/10 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return <OrganizationSetup />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-ivory">Documents</h1>
          <p className="mt-2 text-body">
            Upload contracts, cost sheets, and addendums to train the estimation system.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Upload section */}
        <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
          <h2 className="font-display text-xl text-ivory mb-4">Upload Document</h2>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="docType" className="block text-sm text-ivory/80 mb-2">
                Document Type
              </label>
              <select
                id="docType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory focus:outline-none focus:border-copper transition-colors"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-obsidian">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleUpload}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className={`inline-flex items-center gap-2 px-6 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">&#9696;</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Upload File
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Documents list */}
        <div className="bg-ivory/5 border border-ivory/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-ivory/10">
            <h2 className="font-display text-xl text-ivory">Uploaded Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-body">
              No documents uploaded yet. Upload your first document above.
            </div>
          ) : (
            <div className="divide-y divide-ivory/10">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-ivory/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-copper/20 rounded-lg flex items-center justify-center text-copper">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-ivory font-medium">{doc.name}</div>
                      <div className="text-sm text-body">
                        {documentTypes.find((t) => t.value === doc.type)?.label || doc.type} &middot; {formatFileSize(doc.file_size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(doc.status)}
                    {(doc.status === 'error' || doc.status === 'pending' || doc.status === 'processed') && (
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        disabled={reprocessingIds.has(doc.id)}
                        className={`text-copper hover:text-copper/80 transition-colors ${
                          reprocessingIds.has(doc.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {reprocessingIds.has(doc.id) ? 'Reprocessing...' : 'Reprocess'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
