// Exam Mode UI Module
// Handles the UI components and styling for exam mode

class ExamModeUI {
  static getExamModeStyles() {
    return `
      /* ============================================
         EXAM MODE STYLES
      ============================================ */
      
      #exam-container {
        width: 100%;
        height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        background: #f8f9fa;
      }
      
      /* Exam Header */
      #exam-header {
        background: white;
        border-bottom: 2px solid #dee2e6;
        padding: 15px 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      #exam-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .exam-control-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 0.9em;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .exam-control-btn:hover {
        background: #5a6268;
      }
      
      /* Timer Styles */
      .exam-timer {
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-family: 'Courier New', monospace;
        font-size: 1.2em;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.3s;
      }
      
      .exam-timer-warning {
        background: #ffc107;
        color: #212529;
        animation: pulse-warning 1s infinite;
      }
      
      .exam-timer-critical {
        background: #dc3545;
        color: white;
        animation: pulse-critical 0.5s infinite;
      }
      
      @keyframes pulse-warning {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes pulse-critical {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      /* Question Navigation */
      #exam-question-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: center;
      }
      
      .exam-question-nav-btn {
        width: 35px;
        height: 35px;
        border: 2px solid #dee2e6;
        background: white;
        border-radius: 6px;
        font-size: 0.9em;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }
      
      .exam-question-nav-btn:hover {
        border-color: #0078d7;
        background: #f0f8ff;
      }
      
      .exam-question-nav-btn.current {
        background: #0078d7;
        color: white;
        border-color: #0056b3;
      }
      
      .exam-question-nav-btn.answered {
        background: #28a745;
        color: white;
        border-color: #1e7e34;
      }
      
      .exam-question-nav-btn.answered.current {
        background: #155724;
        border-color: #0d3e1c;
      }
      
      .exam-question-nav-btn.bookmarked::after {
        content: '🔖';
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 12px;
        background: #ff8c00;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid white;
      }
      
      /* Main Content Area */
      #exam-content {
        flex: 1;
        display: flex;
        background: white;
        margin: 0 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      #exam-question-area {
        flex: 1;
        padding: 25px;
        border-right: 3px solid #dee2e6;
        overflow-y: auto;
      }
      
      #exam-divider {
        width: 3px;
        background: linear-gradient(to bottom, #0078d7, #42a5f5);
        position: relative;
      }
      
      #exam-divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: #0078d7;
        border-radius: 50%;
        border: 3px solid white;
      }
      
      #exam-answer-area {
        flex: 1;
        padding: 25px;
        overflow-y: auto;
        background: #f8f9fa;
      }
      
      /* Question Panel Styles */
      .exam-question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e9ecef;
      }
      
      .exam-question-header h3 {
        margin: 0;
        color: #0078d7;
        font-size: 1.3em;
      }
      
      .exam-question-type {
        background: #e9ecef;
        color: #495057;
        padding: 4px 12px;
        border-radius: 15px;
        font-size: 0.8em;
        font-weight: bold;
      }
      
      .exam-question-content {
        font-size: 1.1em;
        line-height: 1.6;
        color: #333;
        margin-bottom: 20px;
      }
      
      .exam-question-scenario {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 6px;
        padding: 15px;
        margin-top: 15px;
        font-size: 0.95em;
        line-height: 1.5;
      }
      
      /* Answer Panel Styles */
      .exam-answer-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #dee2e6;
      }
      
      .exam-answer-header h3 {
        margin: 0;
        color: #495057;
        font-size: 1.2em;
      }
      
      /* MCQ Options */
      .exam-mcq-options,
      .exam-tf-options,
      .exam-ar-options {
        margin-bottom: 20px;
      }
      
      .exam-option-label {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        margin-bottom: 8px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
      }
      
      .exam-option-label:hover {
        border-color: #0078d7;
        background: #f0f8ff;
      }
      
      .exam-option-label input[type="radio"] {
        margin: 0;
        margin-right: 12px;
        margin-top: 2px;
        transform: scale(1.2);
      }
      
      .exam-option-letter {
        font-weight: bold;
        color: #0078d7;
        margin-right: 10px;
        min-width: 25px;
      }
      
      .exam-option-text {
        flex: 1;
        line-height: 1.4;
      }
      
      /* Assertion-Reason Specific */
      .exam-assertion,
      .exam-reason {
        background: #f8f9fa;
        padding: 12px;
        margin-bottom: 15px;
        border-radius: 6px;
        border-left: 4px solid #0078d7;
      }
      
      .exam-reason {
        border-left-color: #28a745;
      }
      
      /* Matching Options */
      .exam-match-container {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
      }
      
      .exam-match-row {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
      }
      
      .exam-match-left {
        flex: 1;
        font-weight: 500;
        margin-right: 15px;
        color: #495057;
      }
      
      .exam-match-right {
        flex: 1;
      }
      
      .exam-match-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        background: white;
        font-size: 0.9em;
      }
      
      /* Clear Selection */
      .exam-clear-option {
        text-align: center;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #e9ecef;
      }
      
      .exam-clear-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.85em;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .exam-clear-btn:hover {
        background: #5a6268;
      }
      
      /* Navigation */
      #exam-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: white;
        border-top: 2px solid #dee2e6;
        margin: 0 20px;
        border-radius: 0 0 8px 8px;
      }
      
      .exam-nav-btn,
      .exam-finish-btn {
        background: #0078d7;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 1em;
        cursor: pointer;
        transition: background 0.2s;
        min-width: 100px;
      }
      
      .exam-nav-btn:hover,
      .exam-finish-btn:hover {
        background: #005ea3;
      }
      
      .exam-nav-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
      
      .exam-finish-btn {
        background: #28a745;
      }
      
      .exam-finish-btn:hover {
        background: #1e7e34;
      }
      
      #exam-question-info {
        text-align: center;
        font-weight: bold;
        color: #495057;
      }
      
      .exam-bookmark-btn {
        background: #ffc107;
        color: #212529;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.9em;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: bold;
      }
      
      .exam-bookmark-btn:hover {
        background: #e0a800;
      }
      
      .exam-bookmark-btn.bookmarked {
        background: #ff8c00;
        color: white;
      }
      
      /* Summary and Results */
      #exam-summary,
      #exam-results {
        max-width: 800px;
        margin: 40px auto;
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
      }
      
      #exam-summary h2,
      #exam-results h2 {
        color: #0078d7;
        margin-bottom: 30px;
        font-size: 2em;
      }
      
      .exam-summary-stats {
        display: flex;
        justify-content: space-around;
        margin: 30px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
      }
      
      .exam-stat {
        text-align: center;
      }
      
      .exam-stat-number {
        display: block;
        font-size: 2.5em;
        font-weight: bold;
        color: #0078d7;
        margin-bottom: 5px;
      }
      
      .exam-stat-label {
        font-size: 0.9em;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .exam-summary-actions,
      .exam-results-actions {
        margin-top: 30px;
      }
      
      .exam-action-btn {
        background: #0078d7;
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 6px;
        font-size: 1em;
        cursor: pointer;
        margin: 0 10px;
        transition: background 0.2s;
        font-weight: bold;
      }
      
      .exam-action-btn:hover {
        background: #005ea3;
      }
      
      .exam-action-btn.exam-submit {
        background: #28a745;
      }
      
      .exam-action-btn.exam-submit:hover {
        background: #1e7e34;
      }
      
      .exam-summary-warning {
        margin-top: 20px;
        padding: 15px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 6px;
        color: #856404;
      }
      
      /* Results Specific */
      .exam-results-summary {
        margin: 30px 0;
      }
      
      .exam-result-card {
        background: linear-gradient(135deg, #0078d7, #42a5f5);
        color: white;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .exam-result-score {
        font-size: 3em;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .exam-result-fraction {
        font-size: 1.2em;
        opacity: 0.9;
        margin-bottom: 5px;
      }
      
      .exam-result-label {
        font-size: 0.9em;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .exam-result-stats {
        display: flex;
        justify-content: space-around;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .exam-result-stat {
        text-align: center;
      }
      
      .exam-result-stat-value {
        display: block;
        font-size: 1.8em;
        font-weight: bold;
        color: #495057;
        margin-bottom: 5px;
      }
      
      .exam-result-stat-label {
        font-size: 0.85em;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        #exam-content {
          flex-direction: column;
          margin: 0 10px;
        }
        
        #exam-question-area {
          border-right: none;
          border-bottom: 3px solid #dee2e6;
          padding: 15px;
        }
        
        #exam-divider {
          width: auto;
          height: 3px;
        }
        
        #exam-divider::before {
          left: 50%;
          top: 50%;
        }
        
        #exam-answer-area {
          padding: 15px;
        }
        
        #exam-navigation {
          flex-direction: column;
          gap: 15px;
          padding: 15px;
          margin: 0 10px;
        }
        
        .exam-summary-stats,
        .exam-result-stats {
          flex-direction: column;
          gap: 20px;
        }
        
        #exam-question-nav {
          gap: 3px;
        }
        
        .exam-question-nav-btn {
          width: 30px;
          height: 30px;
          font-size: 0.8em;
        }
      }
      
      @media (max-width: 480px) {
        #exam-summary,
        #exam-results {
          margin: 20px;
          padding: 20px;
        }
        
        .exam-result-score {
          font-size: 2.5em;
        }
        
        .exam-action-btn {
          display: block;
          width: 100%;
          margin: 10px 0;
        }
      }
    `;
  }

  // Inject exam mode styles into the document
  static injectStyles() {
    // Check if styles are already injected
    if (document.getElementById('exam-mode-styles')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'exam-mode-styles';
    styleElement.textContent = this.getExamModeStyles();
    document.head.appendChild(styleElement);
  }

  // Remove exam mode styles
  static removeStyles() {
    const styleElement = document.getElementById('exam-mode-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Auto-inject styles when module loads
ExamModeUI.injectStyles();

// Export for global access
window.ExamModeUI = ExamModeUI;