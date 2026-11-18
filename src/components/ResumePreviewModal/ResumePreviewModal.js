import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { dataUrlToBlobUrl, openResumeInNewTab } from '../../lib/resumePdf';
import api from '../../api/axios';
import './ResumePreviewModal.css';

const ResumePreviewModal = ({ isOpen, onClose, application }) => {
  // Close on Escape key press and prevent background page scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    if (!isOpen || !application) {
      setPdfUrl('');
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const loadPdf = async () => {
      const appId = application._id || application.id;

      // 1. If backend has uploaded file or stored resume document, fetch it as blob
      if (appId) {
        try {
          const { data } = await api.get(`/applications/${appId}/resume`, { responseType: 'blob' });
          if (active && data && data.size > 0) {
            objectUrl = URL.createObjectURL(data);
            setPdfUrl(objectUrl);
            setLoading(false);
            return;
          }
        } catch {
          // If server file is not found, continue to local resumeData
        }
      }

      // 2. If raw uploaded base64 data is present on the application object
      if (
        typeof application.resumeData === 'string' &&
        application.resumeData.startsWith('data:') &&
        application.resumeData.length > 50
      ) {
        try {
          objectUrl = dataUrlToBlobUrl(application.resumeData);
          if (active) {
            setPdfUrl(objectUrl);
            setLoading(false);
          }
          return;
        } catch {}
      }

      // 3. No synthetic / fake template generation:
      // If no actual file was uploaded, set empty state
      if (active) {
        setPdfUrl('');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const fileName = application.resumeFileName || `${(application.applicantName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;

  const handleDownload = async () => {
    try {
      const appId = application._id || application.id;
      if (appId) {
        try {
          const { data } = await api.get(`/applications/${appId}/resume`, { responseType: 'blob' });
          if (data && data.size > 0) {
            const blobUrl = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(blobUrl);
            toast.success(`Downloaded ${fileName}`);
            return;
          }
        } catch {}
      }

      if (pdfUrl) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded ${fileName}`);
        return;
      }

      toast.error('No uploaded resume file is available to download.');
    } catch {
      toast.error('Unable to download file.');
    }
  };

  const handleNewTab = () => {
    if (pdfUrl) {
      const newTab = window.open(pdfUrl, '_blank');
      if (newTab) {
        newTab.focus();
        return;
      }
    }
    const opened = openResumeInNewTab(application);
    if (!opened) {
      toast.info('Popup blocked. Please allow popups to open resumes in another tab.');
    }
  };

  return (
    <AnimatePresence>
      <div className="rpm-backdrop" onClick={onClose}>
        <motion.div
          className="rpm-dialog"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Header Bar */}
          <div className="rpm-header">
            <div className="rpm-header-left">
              <div className="rpm-file-icon-box">
                <FileText size={20} className="rpm-file-icon" />
              </div>
              <div>
                <div className="rpm-filename-row">
                  <h3 className="rpm-filename" title={fileName}>
                    {fileName}
                  </h3>
                  <span className="rpm-badge-format">PDF</span>
                  {application.resumeFileSize && (
                    <span className="rpm-badge-size">({application.resumeFileSize})</span>
                  )}
                </div>
                <p className="rpm-subtitle">
                  Candidate: <strong>{application.applicantName}</strong>
                  {application.jobTitle && (
                    <span> • Applied for <strong>{application.jobTitle}</strong></span>
                  )}
                </p>
              </div>
            </div>

            <div className="rpm-header-actions">
              <button
                type="button"
                className="rpm-action-btn rpm-tab-btn"
                onClick={handleNewTab}
                title="Open resume in another browser tab"
              >
                <ExternalLink size={15} />
                <span>Open in New Tab</span>
              </button>

              <button
                type="button"
                className="rpm-action-btn rpm-download-btn"
                onClick={handleDownload}
                title="Download PDF"
              >
                <Download size={15} />
                <span>Download</span>
              </button>

              <button
                type="button"
                className="rpm-close-btn"
                onClick={onClose}
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="rpm-body">
            {loading ? (
              <div className="rpm-loading-box">
                <div className="rpm-spinner" />
                <p>Loading candidate resume...</p>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                title={`Resume - ${application.applicantName || 'Candidate'}`}
                className="rpm-pdf-frame"
              />
            ) : (
              <div className="rpm-empty">
                <FileText size={36} color="#94a3b8" />
                <p>No resume document could be loaded for this applicant.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResumePreviewModal;
