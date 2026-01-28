import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { documentApi } from '@/lib/api';
import { DashboardLayout, OrganizationSetup } from '@/components/dashboard';
import { DropZone } from '@/components/ui/DropZone';
import { DocumentCard, EmptyState } from '@/components/dashboard/documents';
import { fadeInUp, staggerContainer, staggerList, listItem } from '@/lib/animations';

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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const fetchDocuments = async () => {
    if (!organization?.id || !accessToken) return;

    try {
      const data = (await documentApi.list(organization.id, accessToken)) as Document[];
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

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
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [documents, organization, accessToken]);

  // Handle file selection (append to existing)
  const handleFilesSelect = (files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
    setError('');
  };

  // Handle removing a specific file
  const handleRemoveFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload a single file
  const uploadSingleFile = async (file: File): Promise<void> => {
    if (!organization?.id || !accessToken) throw new Error('Not authenticated');

    // Get upload URL
    const uploadData = (await documentApi.getUploadUrl(
      organization.id,
      file.name,
      file.type || 'application/pdf',
      accessToken
    )) as { upload_url: string; file_path: string };

    // Upload file to Supabase Storage
    const uploadResponse = await fetch(uploadData.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/pdf' },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${file.name}`);
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
  };

  // Handle uploading all files
  const handleUpload = async () => {
    if (pendingFiles.length === 0 || !organization?.id || !accessToken) return;

    setError('');
    setUploading(true);
    setUploadProgress({ current: 0, total: pendingFiles.length });

    const failedFiles: string[] = [];

    // Upload files sequentially
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      setUploadProgress({ current: i + 1, total: pendingFiles.length });

      try {
        await uploadSingleFile(file);
      } catch {
        failedFiles.push(file.name);
      }
    }

    // Clear pending files
    setPendingFiles([]);
    setUploadProgress({ current: 0, total: 0 });
    setUploading(false);

    // Refresh documents list from backend
    await fetchDocuments();

    if (failedFiles.length > 0) {
      setError(`Failed to upload: ${failedFiles.join(', ')}`);
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
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'processing' } : d))
      );

      const maxAttempts = 30;
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const doc = (await documentApi.get(
            organization.id,
            docId,
            accessToken
          )) as Document;
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

  const getTypeLabel = (type: string) => {
    return documentTypes.find((t) => t.value === type)?.label || type;
  };

  const getUploadButtonText = () => {
    if (uploading) {
      return `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`;
    }
    if (pendingFiles.length === 0) {
      return 'Upload Document';
    }
    if (pendingFiles.length === 1) {
      return 'Upload Document';
    }
    return `Upload ${pendingFiles.length} Documents`;
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
      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="font-display text-3xl text-ivory">Documents</h1>
          <p className="mt-1 text-body">
            Upload contracts, cost sheets, and addendums to train the estimation system.
          </p>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            variants={fadeInUp}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Upload Section */}
        <motion.div
          variants={fadeInUp}
          className="bg-ivory/5 border border-ivory/10 rounded-xl p-6"
        >
          <h2 className="font-display text-xl text-ivory mb-3">Upload Documents</h2>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* DropZone */}
            <div className="flex-1">
              <DropZone
                onFilesSelect={handleFilesSelect}
                onRemoveFile={handleRemoveFile}
                selectedFiles={pendingFiles}
                uploading={uploading}
                disabled={uploading}
                multiple={true}
              />
            </div>

            {/* Type Selector + Upload Button */}
            <div className="sm:w-52 flex flex-col">
              <label
                htmlFor="docType"
                className="block text-sm text-ivory/80 mb-2"
              >
                Document Type
              </label>
              <select
                id="docType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={uploading}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory focus:outline-none focus:border-copper transition-colors disabled:opacity-50"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-obsidian">
                    {type.label}
                  </option>
                ))}
              </select>
              {pendingFiles.length > 1 && (
                <p className="mt-1 text-xs text-body/60">
                  All files will be uploaded as {getTypeLabel(selectedType)}
                </p>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={pendingFiles.length === 0 || uploading}
                className={`
                  mt-3 w-full px-4 py-3 rounded-lg font-medium transition-colors
                  ${
                    pendingFiles.length > 0 && !uploading
                      ? 'bg-copper text-obsidian hover:bg-copper/90 cursor-pointer'
                      : 'bg-ivory/10 text-ivory/40 cursor-not-allowed'
                  }
                `}
              >
                {getUploadButtonText()}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Documents List */}
        <motion.div
          variants={fadeInUp}
          className="bg-ivory/5 border border-ivory/10 rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-ivory/10">
            <h2 className="font-display text-xl text-ivory">
              Uploaded Documents
              {documents.length > 0 && (
                <span className="ml-2 text-body font-normal">({documents.length})</span>
              )}
            </h2>
          </div>

          {documents.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              key={documents.length}
              variants={staggerList}
              initial="hidden"
              animate="visible"
            >
              {documents.map((doc) => (
                <motion.div key={doc.id} variants={listItem}>
                  <DocumentCard
                    document={doc}
                    onReprocess={() => handleReprocess(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    isReprocessing={reprocessingIds.has(doc.id)}
                    typeLabel={getTypeLabel(doc.type)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
