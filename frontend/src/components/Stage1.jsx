import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage1.css';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="stage stage1">
      <h3 className="stage-title">Stage 1: Individual Responses</h3>

      {/* Interactive tabs (hidden in print) */}
      <div className="tabs screen-only">
        {responses.map((resp, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {resp.model.split('/')[1] || resp.model}
          </button>
        ))}
      </div>

      {/* Active tab content (screen only) */}
      <div className="tab-content screen-only">
        <div className="model-name">{responses[activeTab].model}</div>
        <div className="response-text markdown-content">
          <ReactMarkdown>{responses[activeTab].response}</ReactMarkdown>
        </div>
      </div>

      {/* All responses linearized - ALWAYS in DOM, hidden on screen via CSS */}
      <div className="print-all-responses">
        {responses.map((resp, index) => (
          <div key={index} className="print-response-item">
            <h4 className="print-model-name">
              {resp.model.split('/')[1] || resp.model}
            </h4>
            <div className="print-model-full">{resp.model}</div>
            <div className="response-text markdown-content">
              <ReactMarkdown>{resp.response}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
