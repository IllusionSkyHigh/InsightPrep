// ============================================
// VALIDATION POPUP FUNCTIONALITY
// ============================================

// Global function to show invalid questions popup
function showInvalidQuestionsPopup(invalidQuestions, totalQuestions) {
  // Store invalid questions for cleanup functionality
  AppState.storedInvalidQuestions = invalidQuestions;
  
  // Segregate invalid questions into Duplicates vs Anomalies
  const segregatedIssues = segregateValidationIssues(invalidQuestions);
  
  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
    justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;
  `;
  
  // Create modal content
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: white; border-radius: 8px; max-width: 95vw; max-height: 85vh; 
    overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; flex-direction: column;
    min-width: 900px;
  `;
  
  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 20px; background: #2196f3; color: white; display: flex; 
    justify-content: space-between; align-items: center;
  `;
  
  const title = document.createElement("h3");
  title.style.margin = "0";
  title.textContent = `✅ Segregated Validation Report`;
  
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
    background: none; border: none; color: white; font-size: 24px; 
    cursor: pointer; padding: 0; width: 30px; height: 30px; border-radius: 50%;
  `;
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Summary
  const summary = document.createElement("div");
  summary.style.cssText = "padding: 15px; background: #e3f2fd; border-bottom: 1px solid #ddd;";
  const validCount = totalQuestions - invalidQuestions.length;
  summary.innerHTML = `
    <div style="text-align: center; margin-bottom: 15px;">
      <div style="font-size: 1.8em; font-weight: bold; color: #1976d2;">📊 Total Questions: ${totalQuestions}</div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 10px;">
      <div style="text-align: center; padding: 10px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #4caf50;">
        <div style="font-size: 1.4em; font-weight: bold; color: #2e7d32;">${validCount}</div>
        <div style="color: #2e7d32;">✅ Valid Questions</div>
      </div>
      <div style="text-align: center; padding: 10px; background: #ffebee; border-radius: 6px; border-left: 4px solid #f44336;">
        <div style="font-size: 1.4em; font-weight: bold; color: #c62828;">${segregatedIssues.duplicates.length}</div>
        <div style="color: #c62828;">🗑️ Dupes → Safe to Delete</div>
      </div>
      <div style="text-align: center; padding: 10px; background: #fff3e0; border-radius: 6px; border-left: 4px solid #ff9800; cursor: pointer; transition: background-color 0.2s;" 
           onclick="document.getElementById('anomalies-section').scrollIntoView({behavior: 'smooth'});"
           onmouseover="this.style.backgroundColor='#ffe0b2';" 
           onmouseout="this.style.backgroundColor='#fff3e0';">
        <div style="font-size: 1.4em; font-weight: bold; color: #ef6c00; text-decoration: underline;">${segregatedIssues.anomalies.length}</div>
        <div style="color: #ef6c00;">⚠️ Anomalies → Need Fixing</div>
      </div>
    </div>
    <div style="text-align: center; margin-top: 10px; font-size: 0.9em; color: #666;">
      Click "Anomalies → Need Fixing" to jump to anomalies section
    </div>
  `;
  
  // Content area
  const content = document.createElement("div");
  content.style.cssText = "flex: 1; overflow-y: auto; padding: 20px;";
  
  if (invalidQuestions.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; color: green; font-size: 1.2em; padding: 40px;">
        🎉 All questions are valid!<br>
        <span style="font-size: 0.9em; color: #666;">No questions were excluded from your selection.</span>
      </div>
    `;
  } else {
    // Create segregated sections
    createSegregatedSections(content, segregatedIssues, overlay);
  }
  
  modal.appendChild(header);
  modal.appendChild(summary);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
}

// Function to segregate validation issues into Duplicates vs Anomalies
function segregateValidationIssues(invalidQuestions) {
  const duplicates = [];
  const anomalies = [];
  
  invalidQuestions.forEach(q => {
    const reason = q.reason || "";
    
    // Check if this is a duplicate issue (safe to delete)
    if (reason.includes("Duplicate option") || 
        reason.includes("Duplicate left") || 
        reason.includes("Duplicate right") || 
        reason.includes("Duplicate match pair") ||
        reason.includes("Duplicate AssertionReason") ||
        reason.includes("Duplicate TrueFalse") ||
        reason.includes("Conflicting option correctness")) {
      duplicates.push({
        ...q,
        category: "duplicate",
        action: "delete"
      });
    } else {
      // Everything else is an anomaly (needs fixing)
      anomalies.push({
        ...q,
        category: "anomaly", 
        action: "fix"
      });
    }
  });
  
  return { duplicates, anomalies };
}

// Function to create the segregated sections in the popup
function createSegregatedSections(content, segregatedIssues, overlay) {
  // Section 1: Duplicates (Safe to Delete)
  if (segregatedIssues.duplicates.length > 0) {
    const duplicatesSection = document.createElement("div");
    duplicatesSection.style.cssText = `
      margin-bottom: 30px; border: 2px solid #f44336; border-radius: 8px; overflow: hidden;
    `;
    
    const duplicatesHeader = document.createElement("div");
    duplicatesHeader.style.cssText = `
      background: #f44336; color: white; padding: 15px; display: flex; 
      justify-content: space-between; align-items: center;
    `;
    duplicatesHeader.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 1.2em;">🗑️ Dupes → Safe to Delete</h3>
        <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
          Extra junk rows (duplicate/conflicting options & match_pairs). Questions remain intact after deletion.
        </p>
      </div>
      <button id="deleteDuplicatesBtn" style="
        background: #d32f2f; color: white; border: none; padding: 10px 20px; 
        border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em;
      ">🧹 Delete All Dupes</button>
    `;
    
    const duplicatesTable = createIssueTable(segregatedIssues.duplicates, "duplicates");
    duplicatesSection.appendChild(duplicatesHeader);
    duplicatesSection.appendChild(duplicatesTable);
    content.appendChild(duplicatesSection);
    
    // Add click handler for Delete Duplicates button
    setTimeout(() => {
      const deleteBtn = document.getElementById("deleteDuplicatesBtn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          clearDatabaseDuplicates(overlay);
        });
      }
    }, 100);
  }
  
  // Section 2: Anomalies (Need Fixing)
  if (segregatedIssues.anomalies.length > 0) {
    const anomaliesSection = document.createElement("div");
    anomaliesSection.id = "anomalies-section"; // Add ID for scroll target
    anomaliesSection.style.cssText = `
      margin-bottom: 20px; border: 2px solid #ff9800; border-radius: 8px; overflow: hidden;
    `;
    
    const anomaliesHeader = document.createElement("div");
    anomaliesHeader.style.cssText = `
      background: #ff9800; color: white; padding: 15px; display: flex; 
      justify-content: space-between; align-items: center;
    `;
    anomaliesHeader.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 1.2em;">⚠️ Anomalies → Need Fixing</h3>
        <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
          Broken logic (incomplete/invalid setups). Must be fixed, not deleted.
        </p>
      </div>
      <button id="exportAnomaliesBtn" style="
        background: #ef6c00; color: white; border: none; padding: 10px 20px; 
        border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em;
      ">📋 Export Fix List</button>
    `;
    
    const anomaliesTable = createIssueTable(segregatedIssues.anomalies, "anomalies");
    anomaliesSection.appendChild(anomaliesHeader);
    anomaliesSection.appendChild(anomaliesTable);
    content.appendChild(anomaliesSection);
    
    // Add click handler for Export Anomalies button
    setTimeout(() => {
      const exportBtn = document.getElementById("exportAnomaliesBtn");
      if (exportBtn) {
        exportBtn.addEventListener("click", () => {
          exportAnomaliesList(segregatedIssues.anomalies);
        });
      }
    }, 100);
  }
  
  // Add guidance section
  const guidanceSection = document.createElement("div");
  guidanceSection.style.cssText = `
    background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; 
    padding: 20px; margin-top: 20px;
  `;
  guidanceSection.innerHTML = `
    <h4 style="margin: 0 0 15px 0; color: #1976d2; display: flex; align-items: center;">
      <span style="margin-right: 10px;">🚦</span> Suggested Workflow
    </h4>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f44336;">
        <h5 style="margin: 0 0 10px 0; color: #d32f2f;">1. Handle Duplicates First</h5>
        <ul style="margin: 0; padding-left: 15px; font-size: 0.9em; color: #555;">
          <li>Click "Delete All Duplicates" to remove redundant entries</li>
          <li>These are safe to delete as they never add new meaning</li>
          <li>Backup your database first for safety</li>
        </ul>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff9800;">
        <h5 style="margin: 0 0 10px 0; color: #ef6c00;">2. Then Fix Anomalies</h5>
        <ul style="margin: 0; padding-left: 15px; font-size: 0.9em; color: #555;">
          <li>Export the fix list to analyze each issue</li>
          <li>Manually correct structural/data problems</li>
          <li>Don't delete these - they need proper fixing</li>
        </ul>
      </div>
    </div>
  `;
  content.appendChild(guidanceSection);
}

// Function to create tables for each issue type
function createIssueTable(issues, type) {
  const tableContainer = document.createElement("div");
  tableContainer.style.cssText = "background: white; padding: 15px; position: relative;";
  
  if (issues.length === 0) {
    tableContainer.innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px; font-style: italic;">
        No ${type} found
      </div>
    `;
    return tableContainer;
  }
  
  // Create a wrapper for the scrollable table
  const tableWrapper = document.createElement("div");
  tableWrapper.style.cssText = "max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;";
  
  const table = document.createElement("table");
  table.style.cssText = "width: 100%; border-collapse: collapse; position: relative;";
  
  // Table header
  const thead = document.createElement("thead");
  const issueColumnHeader = type === "duplicates" ? "Duplicate Records to Delete" : "Anomaly Details";
  thead.innerHTML = `
    <tr style="background: #f5f5f5; position: sticky; top: 0; z-index: 10;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 80px; background: #f5f5f5;">ID</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 100px; background: #f5f5f5;">Type</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 120px; background: #f5f5f5;">Topic</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 120px; background: #f5f5f5;">Subtopic</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; min-width: 250px; background: #f5f5f5;">Question Text</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 200px; background: #f5f5f5;">${issueColumnHeader}</th>
    </tr>
  `;
  
  // Table body
  const tbody = document.createElement("tbody");
  issues.forEach((issue, index) => {
    const row = document.createElement("tr");
    if (index % 2 === 1) row.style.backgroundColor = "#f9f9f9";
    
    const reasonColor = type === "duplicates" ? "#d32f2f" : "#ef6c00";
    
    // Create fix button HTML for anomalies or delete button for duplicates
    let actionButtonHtml = '';
    if (type === "anomalies") {
      actionButtonHtml = createFixButtonHtml(issue);
    } else if (type === "duplicates") {
      actionButtonHtml = `<br><button id="delete-btn-${issue.id}" onclick="deleteDuplicateRow(${issue.id}, '${issue.reason.replace(/'/g, "\\'")}', this)" 
                          style="background: #f44336; color: white; border: none; padding: 4px 8px; 
                                 border-radius: 3px; cursor: pointer; font-size: 0.8em; margin-top: 5px; min-width: 100px;">
                          🗑️ Delete This
                        </button>`;
    }
    
    row.innerHTML = `
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0078d7;">${issue.id}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.85em;">${issue.question_type}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.85em;">${issue.topic}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.85em;">${issue.subtopic}</td>
      <td style="border: 1px solid #ddd; padding: 8px; word-wrap: break-word; white-space: pre-wrap; max-width: 300px; font-size: 0.85em;">${issue.question_text}</td>
      <td style="border: 1px solid #ddd; padding: 8px; color: ${reasonColor}; word-wrap: break-word; font-size: 0.85em;">
        ${issue.reason}
        ${actionButtonHtml}
      </td>
    `;
    tbody.appendChild(row);
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  tableContainer.appendChild(tableWrapper);
  
  return tableContainer;
}

// Function to create appropriate fix button based on anomaly type
function createFixButtonHtml(issue) {
  const reason = issue.reason.toLowerCase();
  
  // Invalid question_type - can auto-suggest correct type
  if (reason.includes('invalid question_type')) {
    const suggestedType = suggestCorrectQuestionType(issue.question_type, issue.question_text);
    if (suggestedType) {
      return `<br><button id="fix-type-btn-${issue.id}" onclick="fixQuestionType(${issue.id}, '${suggestedType}')" 
                style="background: #4caf50; color: white; border: none; padding: 4px 8px; 
                       border-radius: 3px; cursor: pointer; font-size: 0.8em; margin-top: 5px; min-width: 120px;">
                🔧 Fix Type → ${suggestedType}
              </button>`;
    }
  }
  
  // MCQ with no correct options - show guidance message instead of button
  if (reason.includes('mcq with no correct options')) {
    return `<br><div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 8px; margin-top: 5px; font-size: 0.8em; border-radius: 3px;">
              <strong>Manual Fix Required:</strong><br>
              Use question editor to mark at least one option as correct. Multiple options can be marked correct for multi-select questions.
            </div>`;
  }
  
  // Match without dummy option - can add dummy
  if (reason.includes('match without dummy option')) {
    return `<br><button id="fix-dummy-btn-${issue.id}" onclick="fixMatchDummy(${issue.id})" 
              style="background: #2196f3; color: white; border: none; padding: 4px 8px; 
                     border-radius: 3px; cursor: pointer; font-size: 0.8em; margin-top: 5px; min-width: 120px;">
              ➕ Add Dummy Option
            </button>`;
  }
  
  // Orphan question - can guide to add missing data
  if (reason.includes('orphan question')) {
    const missingData = issue.question_type === 'Match' ? 'match_pairs' : 'options';
    return `<br><button onclick="fixOrphanQuestion(${issue.id}, '${missingData}')" 
              style="background: #9c27b0; color: white; border: none; padding: 4px 8px; 
                     border-radius: 3px; cursor: pointer; font-size: 0.8em; margin-top: 5px;">
              ➕ Add ${missingData}
            </button>`;
  }
  
  // AssertionReason with wrong option count - show guidance message instead of button
  if (reason.includes('assertionreason without 4 options')) {
    const currentCount = reason.match(/found (\d+)/)?.[1] || 'unknown';
    const action = parseInt(currentCount) < 4 ? 'add missing' : 'remove extra';
    return `<br><div style="background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 8px; margin-top: 5px; font-size: 0.8em; border-radius: 3px;">
              <strong>Manual Fix Required:</strong><br>
              AssertionReason needs exactly 4 options (found ${currentCount}). Use question editor to ${action} options.
            </div>`;
  }
  
  // Generic manual fix for other issues
  return `<br><button onclick="openManualFix(${issue.id})" 
            style="background: #607d8b; color: white; border: none; padding: 4px 8px; 
                   border-radius: 3px; cursor: pointer; font-size: 0.8em; margin-top: 5px;">
            📝 Manual Fix
          </button>`;
}

// Function to suggest correct question type based on patterns
function suggestCorrectQuestionType(currentType, questionText) {
  const text = questionText.toLowerCase();
  
  // Pattern matching for common question types
  if (text.includes('true or false') || text.includes('t/f') || text.includes('true/false')) {
    return 'TrueFalse';
  }
  if (text.includes('match') || text.includes('pair') || text.includes('connect')) {
    return 'Match';
  }
  if (text.includes('assertion') || text.includes('reason') || text.includes('both are correct')) {
    return 'AssertionReason';
  }
  if (text.includes('scenario') || text.includes('case study')) {
    return 'MCQ-Scenario';
  }
  if (text.includes('cohort') || currentType.toLowerCase().includes('cohort')) {
    return 'Cohort-05-MCQ';
  }
  
  // For any invalid MCQ types (including MCQ-Multiple), suggest MCQ
  if (currentType && (currentType.toLowerCase().includes('mcq') || currentType.toLowerCase().includes('multiple'))) {
    return 'MCQ';
  }
  
  // Default to MCQ for multiple choice patterns or unrecognized types
  return 'MCQ';
}

// ============================================
// FIX FUNCTION IMPLEMENTATIONS
// ============================================

// Fix function implementations with modal confirmations and row updates
window.fixQuestionType = function(questionId, suggestedType) {
  const button = document.getElementById(`fix-type-btn-${questionId}`);
  if (!button) return;
  
  createConfirmationModal(
    'Confirm Question Type Fix',
    `Are you sure you want to change Question ${questionId} type from "${button.closest('tr').cells[1].textContent}" to "${suggestedType}"?`,
    () => {
      // Disable button and show loading
      button.disabled = true;
      button.style.background = '#ccc';
      button.innerHTML = '🔄 Fixing...';
      
      try {
        AppState.database.exec(`UPDATE questions SET question_type = '${suggestedType}' WHERE id = ${questionId}`);
        
        // Success - update button and row
        button.style.background = '#4caf50';
        button.innerHTML = '✅ Fixed!';
        
        // Update the entire row to show the fix
        const row = button.closest('tr');
        const reasonCell = row.cells[5]; // Anomaly Details column
        const originalText = reasonCell.firstChild.textContent;
        
        // Update question type in the row
        row.cells[1].textContent = suggestedType;
        row.cells[1].style.color = '#4caf50';
        row.cells[1].style.fontWeight = 'bold';
        
        // Update reason to show fixed status
        reasonCell.innerHTML = `
          <span style="text-decoration: line-through; opacity: 0.6;">${originalText}</span><br>
          <strong style="color: #4caf50;">✅ FIXED: Type updated to ${suggestedType}</strong>
        `;
        
        // Add visual effect to the row
        row.style.background = '#e8f5e8';
        row.style.border = '2px solid #4caf50';
        
        showFloatingMessage(`✅ Question ${questionId} type successfully updated to "${suggestedType}"`, 'success');
        
      } catch (error) {
        // Error - restore button
        button.disabled = false;
        button.style.background = '#f44336';
        button.innerHTML = '❌ Error';
        showFloatingMessage(`❌ Error fixing question type: ${error.message}`, 'error');
        
        setTimeout(() => {
          button.style.background = '#4caf50';
          button.innerHTML = `🔧 Fix Type → ${suggestedType}`;
        }, 2000);
      }
    }
  );
};

window.fixMatchDummy = function(questionId) {
  const button = document.getElementById(`fix-dummy-btn-${questionId}`);
  if (!button) return;
  
  createConfirmationModal(
    'Confirm Dummy Option Addition',
    `Are you sure you want to add a dummy option "Refer to match pairs" to Question ${questionId}?`,
    () => {
      // Disable button and show loading
      button.disabled = true;
      button.style.background = '#ccc';
      button.innerHTML = '🔄 Adding...';
      
      try {
        AppState.database.exec(`INSERT INTO options (question_id, option_text, is_correct) VALUES (${questionId}, 'Refer to match pairs', 0)`);
        
        // Success - update button and row
        button.style.background = '#2196f3';
        button.innerHTML = '✅ Added!';
        
        // Update the entire row to show the fix
        const row = button.closest('tr');
        const reasonCell = row.cells[5]; // Anomaly Details column
        const originalText = reasonCell.firstChild.textContent;
        
        // Update reason to show fixed status
        reasonCell.innerHTML = `
          <span style="text-decoration: line-through; opacity: 0.6;">${originalText}</span><br>
          <strong style="color: #2196f3;">✅ FIXED: Dummy option "Refer to match pairs" added</strong>
        `;
        
        // Add visual effect to the row
        row.style.background = '#e3f2fd';
        row.style.border = '2px solid #2196f3';
        
        showFloatingMessage(`✅ Added dummy option to Question ${questionId}`, 'success');
        
      } catch (error) {
        // Error - restore button
        button.disabled = false;
        button.style.background = '#f44336';
        button.innerHTML = '❌ Error';
        showFloatingMessage(`❌ Error adding dummy option: ${error.message}`, 'error');
        
        setTimeout(() => {
          button.style.background = '#2196f3';
          button.innerHTML = '➕ Add Dummy Option';
        }, 2000);
      }
    }
  );
};

window.fixOrphanQuestion = function(questionId, missingData) {
  alert(`Question ${questionId} needs ${missingData}. Please use the question editor to add the missing ${missingData}.`);
};

// Function to delete individual duplicate row - NEEDS TO BE PROPERLY IMPLEMENTED
window.deleteDuplicateRow = function(questionId, reason, buttonElement) {
  console.log(`🗑️ DELETE ATTEMPT: Question ${questionId}, Reason: ${reason}`);
  
  createConfirmationModal(
    'Confirm Individual Delete',
    `Are you sure you want to remove duplicate entries for Question ${questionId}?<br><br>
     <strong>Issue:</strong> ${reason}<br><br>
     <div style="background: #fff3e0; padding: 10px; border-radius: 4px; border-left: 3px solid #ff9800; margin-top: 10px;">
       <strong>⚠️ Note:</strong> This will remove duplicate options/match_pairs, keeping only unique entries. The question itself will remain intact.
     </div>`,
    () => {
      const button = buttonElement;
      const row = button.closest('tr');
      
      // Show loading state
      button.disabled = true;
      button.style.background = '#ccc';
      button.innerHTML = '🔄 Deleting...';
      
      // TODO: Implement actual delete logic here
      console.log(`TODO: Implement delete logic for Question ${questionId}`);
      console.log(`Reason: ${reason}`);
      console.log(`Button element:`, button);
      console.log(`Row element:`, row);
      
      // For now, just show that it's not implemented
      setTimeout(() => {
        button.disabled = false;
        button.style.background = '#f44336';
        button.innerHTML = '❌ Not Implemented';
        showFloatingMessage(`❌ Delete function not yet implemented for Question ${questionId}`, 'error');
        
        setTimeout(() => {
          button.style.background = '#f44336';
          button.innerHTML = '🗑️ Delete This';
        }, 3000);
      }, 1000);
    }
  );
};

window.fixAssertionReasonOptions = function(questionId) {
  const currentOptionsResult = AppState.database.exec(`SELECT COUNT(*) as count FROM options WHERE question_id = ${questionId}`);
  const currentCount = currentOptionsResult[0]?.values?.[0]?.[0] || 0;
  
  if (currentCount < 4) {
    alert(`Question ${questionId} has ${currentCount} options but needs exactly 4 for AssertionReason. Please use the question editor to add the missing options.`);
  } else if (currentCount > 4) {
    alert(`Question ${questionId} has ${currentCount} options but needs exactly 4 for AssertionReason. Please use the question editor to remove extra options.`);
  }
};

window.openManualFix = function(questionId) {
  alert(`Question ${questionId} requires manual review. Please use the question editor to examine and fix this issue.`);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Create modal confirmation dialog
function createConfirmationModal(title, message, onConfirm) {
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 10002; display: flex;
    align-items: center; justify-content: center;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; border-radius: 8px; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    max-width: 500px; width: 90%; animation: slideIn 0.3s ease-out;
  `;
  
  modal.innerHTML = `
    <style>
      @keyframes slideIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    </style>
    <div style="background: #f44336; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h3 style="margin: 0; font-size: 1.2em;">⚠️ ${title}</h3>
    </div>
    <div style="padding: 20px;">
      <p style="margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="modal-cancel" style="
          background: #ccc; color: #333; border: none; padding: 10px 20px;
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">Cancel</button>
        <button id="modal-confirm" style="
          background: #f44336; color: white; border: none; padding: 10px 20px;
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">Confirm Delete</button>
      </div>
    </div>
  `;
  
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
  
  // Event handlers
  const confirmBtn = modal.querySelector('#modal-confirm');
  const cancelBtn = modal.querySelector('#modal-cancel');
  
  const closeModal = () => {
    modal.style.animation = 'slideIn 0.2s ease-in reverse';
    setTimeout(() => document.body.removeChild(modalOverlay), 200);
  };
  
  confirmBtn.onclick = () => {
    closeModal();
    onConfirm();
  };
  
  cancelBtn.onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };
  
  // Focus confirm button
  setTimeout(() => confirmBtn.focus(), 100);
}

function showFloatingMessage(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10001;
    padding: 15px 20px; border-radius: 8px; color: white; font-weight: bold;
    max-width: 350px; box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    transform: translateX(400px); transition: transform 0.3s ease-in-out;
    font-size: 14px; line-height: 1.4;
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span>${message}</span>
      <button onclick="this.parentNode.parentNode.remove()" style="
        background: rgba(255,255,255,0.3); border: none; color: white; 
        border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; font-size: 16px;
      ">×</button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.style.transform = 'translateX(0)', 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Function to export anomalies list for manual fixing
function exportAnomaliesList(anomalies) {
  const content = anomalies.map(a => {
    return `Question ID: ${a.id}
Question Type: ${a.question_type}
Topic: ${a.topic}
Subtopic: ${a.subtopic}
Issue: ${a.reason}
Question Text: ${a.question_text}
${'='.repeat(80)}`;
  }).join('\n\n');
  
  const blob = new Blob([`ANOMALIES FIX LIST
Generated: ${new Date().toLocaleString()}
Total Issues: ${anomalies.length}

${'='.repeat(80)}

${content}`], { type: 'text/plain' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anomalies_fix_list_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Function to clear database duplicates - NEEDS TO BE PROPERLY IMPLEMENTED
function clearDatabaseDuplicates(overlayToClose) {
  console.log(`🗑️ BULK DELETE ATTEMPT`);
  
  createConfirmationModal(
    "⚠️ Confirm Bulk Delete All Duplicates",
    `<div style="color: #d69e2e; font-weight: bold; margin-bottom: 15px;">
      This will permanently delete ALL duplicate entries from your database!
    </div>
    <div style="margin-bottom: 15px;">
      <strong>Have you backed up your database file?</strong>
    </div>
    <div style="background: #f8f4e6; padding: 10px; border-radius: 4px; border-left: 3px solid #d69e2e; margin-bottom: 15px;">
      <strong>⚠️ Important:</strong> This action cannot be undone. Click "Confirm" only if you have a backup.
    </div>
    <div style="background: #e3f2fd; padding: 10px; border-radius: 4px;">
      <strong>This will remove:</strong><br>
      • All duplicate options (keeping one unique copy of each)<br>
      • All duplicate match_pairs (keeping one unique copy of each)<br>
      • Questions themselves will remain intact
    </div>`,
    () => {
      // Show loading state on the delete button
      const deleteBtn = document.getElementById("deleteDuplicatesBtn");
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.style.background = '#ccc';
        deleteBtn.innerHTML = '🔄 Deleting All...';
      }
      
      // Implement actual bulk delete logic
      try {
        console.log('🗑️ Starting bulk deletion process...');
        
        // CRITICAL: Count ALL duplicates BEFORE doing ANY deletions
        // This prevents deletion operations from affecting each other's counts
        let totalDuplicatesToDelete = 0;
        
        console.log('=== PHASE 1: COUNTING ALL DUPLICATES ===');
        
        // Count duplicate GROUPS (same as validation logic), not individual records
        
        // 1. Count duplicate option groups (exact duplicates)
        let duplicateOptionGroups = 0;
        try {
          const duplicateOptionsQuery = `
            SELECT question_id, option_text, is_correct, COUNT(*) as dup_count
            FROM options
            GROUP BY question_id, option_text, is_correct
            HAVING COUNT(*) > 1
          `;
          const duplicateOptions = AppState.database.exec(duplicateOptionsQuery);
          if (duplicateOptions[0]?.values) {
            duplicateOptionGroups = duplicateOptions[0].values.length; // Count groups, not individual records
          }
          console.log(`Found ${duplicateOptionGroups} duplicate option groups`);
        } catch (e) {
          console.error('Error counting duplicate options:', e);
        }
        
        // 2. Count conflicting option groups (same text, different correctness)
        let conflictingOptionGroups = 0;
        try {
          const conflictingOptionsQuery = `
            SELECT question_id, option_text, COUNT(*) as total_count
            FROM options
            GROUP BY question_id, option_text
            HAVING COUNT(DISTINCT is_correct) > 1
          `;
          const conflictingOptions = AppState.database.exec(conflictingOptionsQuery);
          if (conflictingOptions[0]?.values) {
            conflictingOptionGroups = conflictingOptions[0].values.length; // Count groups
          }
          console.log(`Found ${conflictingOptionGroups} conflicting option groups`);
        } catch (e) {
          console.error('Error counting conflicting options:', e);
        }
        
        // 3. Count duplicate match pair groups
        let duplicateMatchGroups = 0;
        try {
          const duplicateMatchQuery = `
            SELECT question_id, left_text, right_text, COUNT(*) as dup_count
            FROM match_pairs
            GROUP BY question_id, left_text, right_text
            HAVING COUNT(*) > 1
          `;
          const duplicateMatches = AppState.database.exec(duplicateMatchQuery);
          if (duplicateMatches[0]?.values) {
            duplicateMatchGroups = duplicateMatches[0].values.length; // Count groups
          }
          console.log(`Found ${duplicateMatchGroups} duplicate match pair groups`);
        } catch (e) {
          console.error('Error counting duplicate match pairs:', e);
        }
        
        // 4. Count duplicate left text groups
        let duplicateLeftGroups = 0;
        try {
          const duplicateLeftQuery = `
            SELECT question_id, left_text, COUNT(*) as dup_count
            FROM match_pairs
            GROUP BY question_id, left_text
            HAVING COUNT(*) > 1
          `;
          const duplicateLeft = AppState.database.exec(duplicateLeftQuery);
          if (duplicateLeft[0]?.values) {
            duplicateLeftGroups = duplicateLeft[0].values.length; // Count groups
          }
          console.log(`Found ${duplicateLeftGroups} duplicate left text groups`);
        } catch (e) {
          console.error('Error counting duplicate left text:', e);
        }
        
        // 5. Count duplicate right text groups
        let duplicateRightGroups = 0;
        try {
          const duplicateRightQuery = `
            SELECT question_id, right_text, COUNT(*) as dup_count
            FROM match_pairs
            GROUP BY question_id, right_text
            HAVING COUNT(*) > 1
          `;
          const duplicateRight = AppState.database.exec(duplicateRightQuery);
          if (duplicateRight[0]?.values) {
            duplicateRightGroups = duplicateRight[0].values.length; // Count groups
          }
          console.log(`Found ${duplicateRightGroups} duplicate right text groups`);
        } catch (e) {
          console.error('Error counting duplicate right text:', e);
        }
        
        // Calculate total BEFORE any deletions (counting groups like validation does)
        totalDuplicatesToDelete = duplicateOptionGroups + conflictingOptionGroups + duplicateMatchGroups + duplicateLeftGroups + duplicateRightGroups;
        
        console.log('=== COUNTING SUMMARY (Groups, like validation) ===');
        console.log(`Duplicate option groups: ${duplicateOptionGroups}`);
        console.log(`Conflicting option groups: ${conflictingOptionGroups}`);
        console.log(`Duplicate match pair groups: ${duplicateMatchGroups}`);
        console.log(`Duplicate left text groups: ${duplicateLeftGroups}`);
        console.log(`Duplicate right text groups: ${duplicateRightGroups}`);
        console.log(`TOTAL DUPLICATE GROUPS TO RESOLVE: ${totalDuplicatesToDelete}`);
        console.log(`This should match the validation count of 23`);
        
        console.log('=== PHASE 2: PERFORMING DELETIONS ===');
        
        // Now perform the actual deletions (order matters to avoid conflicts)
        // Delete in reverse order of dependency
        
        // 5. Delete duplicate right text first
        if (duplicateRightGroups > 0) {
          AppState.database.exec(`
            DELETE FROM match_pairs 
            WHERE rowid NOT IN (
              SELECT MIN(rowid) 
              FROM match_pairs 
              GROUP BY question_id, right_text
            )
          `);
          console.log(`✅ Resolved ${duplicateRightGroups} duplicate right text groups`);
        }
        
        // 4. Delete duplicate left text
        if (duplicateLeftGroups > 0) {
          AppState.database.exec(`
            DELETE FROM match_pairs 
            WHERE rowid NOT IN (
              SELECT MIN(rowid) 
              FROM match_pairs 
              GROUP BY question_id, left_text
            )
          `);
          console.log(`✅ Resolved ${duplicateLeftGroups} duplicate left text groups`);
        }
        
        // 3. Delete duplicate match pairs
        if (duplicateMatchGroups > 0) {
          AppState.database.exec(`
            DELETE FROM match_pairs 
            WHERE rowid NOT IN (
              SELECT MIN(rowid) 
              FROM match_pairs 
              GROUP BY question_id, left_text, right_text
            )
          `);
          console.log(`✅ Resolved ${duplicateMatchGroups} duplicate match pair groups`);
        }
        
        // 2. Delete conflicting options
        if (conflictingOptionGroups > 0) {
          AppState.database.exec(`
            DELETE FROM options 
            WHERE rowid NOT IN (
              SELECT MIN(rowid) 
              FROM options 
              GROUP BY question_id, option_text
            )
          `);
          console.log(`✅ Resolved ${conflictingOptionGroups} conflicting option groups`);
        }
        
        // 1. Delete duplicate options last
        if (duplicateOptionGroups > 0) {
          AppState.database.exec(`
            DELETE FROM options 
            WHERE rowid NOT IN (
              SELECT MIN(rowid) 
              FROM options 
              GROUP BY question_id, option_text, is_correct
            )
          `);
          console.log(`✅ Resolved ${duplicateOptionGroups} duplicate option groups`);
        }
        
        const totalDeleted = totalDuplicatesToDelete;
        console.log(`✅ DELETION COMPLETE: ${totalDeleted} duplicate issues resolved`);
        
        // Update the duplicates section to show it's cleaned
        updateDuplicatesSectionAfterDeletion(totalDeleted);
        
        // Update button state and add save functionality
        if (deleteBtn) {
          if (totalDeleted > 0) {
            // Replace the delete button with save functionality
            deleteBtn.style.background = '#4caf50';
            deleteBtn.innerHTML = `💾 Save Cleaned Database`;
            deleteBtn.disabled = false;
            
            // Store database for saving
            const data = AppState.database.export();
            const buffer = new ArrayBuffer(data.length);
            const view = new Uint8Array(buffer);
            view.set(data);
            const blob = new Blob([buffer], { type: 'application/x-sqlite3' });
            
            // Generate filename with _dupes_removed suffix  
            let filename = 'database_dupes_removed.db';
            
            if (AppState.dbFileName) {
              const originalName = AppState.dbFileName;
              const nameWithoutExt = originalName.replace(/\.db$/i, '');
              filename = `${nameWithoutExt}_dupes_removed.db`;
            }
            
            // Remove old event listeners and replace with save functionality
            deleteBtn.replaceWith(deleteBtn.cloneNode(true));
            const newDeleteBtn = document.getElementById("deleteDuplicatesBtn");
            newDeleteBtn.onclick = async () => {
              try {
                // Try modern File System Access API first (Chrome/Edge)
                if ('showSaveFilePicker' in window) {
                  const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                      description: 'Database files',
                      accept: { 'application/x-sqlite3': ['.db'] }
                    }]
                  });
                  
                  const writable = await fileHandle.createWritable();
                  await writable.write(blob);
                  await writable.close();
                  
                  showFloatingMessage(`✅ Database saved to selected location`, 'success');
                } else {
                  // Fallback to automatic download
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  showFloatingMessage(`✅ Database downloaded as ${filename}`, 'success');
                }
                
                // Update button to show saved
                newDeleteBtn.style.background = '#2196f3';
                newDeleteBtn.innerHTML = `✅ Database Saved`;
                newDeleteBtn.disabled = true;
                
              } catch (error) {
                if (error.name === 'AbortError') {
                  showFloatingMessage('Save cancelled by user', 'info');
                } else {
                  console.error('Save error:', error);
                  showFloatingMessage('Error saving file - check console', 'error');
                }
              }
            };
            
            // Show success message with download info
            showFloatingMessage(`✅ Successfully deleted ${totalDeleted} duplicate entries! Click "Save" to download cleaned database.`, 'success');
            
          } else {
            deleteBtn.style.background = '#2196f3';
            deleteBtn.innerHTML = '✅ Already Clean';
            deleteBtn.disabled = true;
            showFloatingMessage('✅ No duplicates found - database is already clean!', 'success');
          }
        }
        
      } catch (error) {
        console.error('Error during bulk delete:', error);
        
        // Error state
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.style.background = '#f44336';
          deleteBtn.innerHTML = '❌ Error';
        }
        showFloatingMessage(`❌ Bulk delete error: ${error.message}`, 'error');
        
        setTimeout(() => {
          if (deleteBtn) {
            deleteBtn.style.background = '#d32f2f';
            deleteBtn.innerHTML = '🧹 Delete All Dupes';
          }
        }, 3000);
      }
    }
  );
}

// Function to update the duplicates section after successful deletion
function updateDuplicatesSectionAfterDeletion(deletedCount) {
  try {
    // Find the duplicates section header
    const duplicatesSection = document.querySelector('div[style*="background: #f44336"]');
    if (duplicatesSection) {
      // Update header to show completion
      duplicatesSection.style.background = '#4caf50';
      duplicatesSection.innerHTML = `
        <div>
          <h3 style="margin: 0; font-size: 1.2em;">✅ Duplicates Cleaned</h3>
          <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
            Successfully resolved ${deletedCount} duplicate issues. Database is now clean!
          </p>
        </div>
        <div style="color: #e8f5e8; font-size: 1.4em;">✓</div>
      `;
    }
    
    // Clear the table content and show "no duplicates" message
    const dupTableSection = document.getElementById('duplicates-section');
    if (dupTableSection) {
      const tableBody = dupTableSection.querySelector('tbody');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #4caf50; font-size: 1.1em;">
              🎉 All duplicates have been successfully removed!<br>
              <span style="font-size: 0.9em; color: #666; margin-top: 10px; display: block;">
                No duplicate records remain in the database.
              </span>
            </td>
          </tr>
        `;
      }
    }
    
    // Update the summary counts in the header
    const summaryElements = document.querySelectorAll('div[style*="text-align: center"]');
    summaryElements.forEach(element => {
      if (element.textContent.includes('Dupes → Safe to Delete')) {
        const countElement = element.querySelector('div[style*="font-size: 1.4em"]');
        if (countElement) {
          countElement.textContent = '0';
          countElement.style.color = '#4caf50';
        }
        const labelElement = element.querySelector('div[style*="color: #c62828"]');
        if (labelElement) {
          labelElement.innerHTML = '✅ All Clean';
          labelElement.style.color = '#4caf50';
        }
        element.style.background = '#e8f5e8';
        element.style.borderLeftColor = '#4caf50';
      }
    });
    
    console.log(`Updated UI to reflect ${deletedCount} deletions completed`);
  } catch (error) {
    console.error('Error updating duplicates section:', error);
  }
}