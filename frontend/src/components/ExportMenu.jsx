import { useState, useRef, useEffect } from 'react';
import {
  exportConversationToMarkdown,
  exportStage3OnlyToMarkdown,
  downloadAsFile,
  generateFilename,
} from '../utils/exportMarkdown';
import './ExportMenu.css';

export default function ExportMenu({ conversation }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!conversation || conversation.messages.length === 0) {
    return null;
  }

  const handleExportFull = () => {
    const markdown = exportConversationToMarkdown(conversation);
    const filename = generateFilename(conversation, '-full');
    downloadAsFile(markdown, filename);
    setIsOpen(false);
  };

  const handleExportSummary = () => {
    const markdown = exportStage3OnlyToMarkdown(conversation);
    const filename = generateFilename(conversation, '-summary');
    downloadAsFile(markdown, filename);
    setIsOpen(false);
  };

  const handlePrint = () => {
    setIsOpen(false);
    
    // Add print-mode class to body to trigger CSS changes
    document.body.classList.add('printing-mode');
    
    // Small delay to let DOM update and menu close
    setTimeout(() => {
      window.print();
      // Remove the class after print dialog closes
      document.body.classList.remove('printing-mode');
    }, 150);
  };

  return (
    <div className="export-menu-container" ref={menuRef}>
      <button
        className="export-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Export conversation"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>

      {isOpen && (
        <div className="export-dropdown">
          <div className="export-dropdown-header">Export Conversation</div>
          
          <button className="export-option" onClick={handleExportFull}>
            <span className="export-option-icon">📄</span>
            <div className="export-option-text">
              <div className="export-option-title">Full Markdown</div>
              <div className="export-option-desc">
                All stages including individual responses & rankings
              </div>
            </div>
          </button>

          <button className="export-option" onClick={handleExportSummary}>
            <span className="export-option-icon">📝</span>
            <div className="export-option-text">
              <div className="export-option-title">Summary Only</div>
              <div className="export-option-desc">
                Just questions and final council answers
              </div>
            </div>
          </button>

          <div className="export-divider" />

          <button className="export-option" onClick={handlePrint}>
            <span className="export-option-icon">🖨️</span>
            <div className="export-option-text">
              <div className="export-option-title">Print / PDF</div>
              <div className="export-option-desc">
                Opens print dialog (Cmd/Ctrl+P)
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
