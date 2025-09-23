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
// DUPLICATE DELETION HELPER FUNCTIONS
// ============================================

// Helper function to delete duplicate options (exact same text and correctness)
function deleteDuplicateOptions(questionId) {
  console.log(`Deleting duplicate options for question ${questionId}`);
  
  // Find duplicates and keep only the first occurrence (lowest id)
  const deleteDuplicatesSQL = `
    DELETE FROM options 
    WHERE question_id = ${questionId} 
    AND id NOT IN (
      SELECT MIN(id) 
      FROM options 
      WHERE question_id = ${questionId}
      GROUP BY option_text, is_correct
    )
  `;
  
  const result = AppState.database.exec(deleteDuplicatesSQL);
  const changes = AppState.database.getRowsModified();
  console.log(`Deleted ${changes} duplicate options for question ${questionId}`);
  return changes;
}

// Helper function to delete conflicting options (same text, different correctness)
function deleteConflictingOptions(questionId, reason) {
  console.log(`Deleting conflicting options for question ${questionId}`);
  
  // Extract the option text from the reason string
  const optionMatch = reason.match(/"([^"]+)"/);
  if (!optionMatch) {
    throw new Error('Could not extract option text from reason');
  }
  const optionText = optionMatch[1];
  
  // Keep only the first occurrence (by id) of the conflicting option
  const deleteConflictsSQL = `
    DELETE FROM options 
    WHERE question_id = ${questionId} 
    AND option_text = ?
    AND id NOT IN (
      SELECT MIN(id) 
      FROM options 
      WHERE question_id = ${questionId} 
      AND option_text = ?
    )
  `;
  
  // Use prepared statement to handle special characters in option text
  const stmt = AppState.database.prepare(deleteConflictsSQL);
  stmt.bind([optionText, optionText]);
  const result = stmt.step();
  const changes = AppState.database.getRowsModified();
  stmt.free();
  
  console.log(`Deleted ${changes} conflicting options for question ${questionId}`);
  return changes;
}

// Helper function to delete duplicate match_pairs
function deleteDuplicateMatchPairs(questionId) {
  console.log(`Deleting duplicate match_pairs for question ${questionId}`);
  
  // Find duplicates and keep only the first occurrence (lowest id)
  const deleteDuplicatesSQL = `
    DELETE FROM match_pairs 
    WHERE question_id = ${questionId} 
    AND id NOT IN (
      SELECT MIN(id) 
      FROM match_pairs 
      WHERE question_id = ${questionId}
      GROUP BY left_text, right_text
    )
  `;
  
  const result = AppState.database.exec(deleteDuplicatesSQL);
  const changes = AppState.database.getRowsModified();
  console.log(`Deleted ${changes} duplicate match_pairs for question ${questionId}`);
  return changes;
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

// Function to delete individual duplicate row
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
      
      try {
        let deletedCount = 0;
        let errorMessage = '';
        
        // Determine what type of duplicate to delete based on reason
        if (reason.includes('Duplicate option (exact)')) {
          // Remove duplicate options with exact same text and correctness
          deletedCount = deleteDuplicateOptions(questionId);
        } else if (reason.includes('Conflicting option correctness')) {
          // Remove conflicting options (same text, different correctness)
          deletedCount = deleteConflictingOptions(questionId, reason);
        } else if (reason.includes('Duplicate left') || reason.includes('Duplicate right') || reason.includes('Duplicate match pair')) {
          // Remove duplicate match_pairs
          deletedCount = deleteDuplicateMatchPairs(questionId);
        } else {
          throw new Error(`Unknown duplicate type: ${reason}`);
        }
        
        if (deletedCount > 0) {
          // Success - update button and row
          button.style.background = '#4caf50';
          button.innerHTML = '✅ Deleted!';
          
          // Update the entire row to show the fix
          const reasonCell = row.cells[5]; // Last column with reason
          const originalText = reasonCell.firstChild.textContent;
          
          // Update reason to show deleted status
          reasonCell.innerHTML = `
            <span style="text-decoration: line-through; opacity: 0.6;">${originalText}</span><br>
            <strong style="color: #4caf50;">✅ CLEANED: ${deletedCount} duplicate entr${deletedCount === 1 ? 'y' : 'ies'} removed</strong>
          `;
          
          // Add visual effect to the row
          row.style.background = '#e8f5e8';
          row.style.border = '2px solid #4caf50';
          
          showFloatingMessage(`✅ Cleaned Question ${questionId}: ${deletedCount} duplicate entr${deletedCount === 1 ? 'y' : 'ies'} removed`, 'success');
          
        } else {
          // No duplicates found (possibly already cleaned)
          button.style.background = '#2196f3';
          button.innerHTML = '✅ Already Clean';
          showFloatingMessage(`ℹ️ Question ${questionId}: No duplicates found to remove`, 'info');
        }
        
      } catch (error) {
        console.error('Error deleting duplicates:', error);
        
        // Error - restore button
        button.disabled = false;
        button.style.background = '#f44336';
        button.innerHTML = '❌ Error';
        showFloatingMessage(`❌ Error cleaning Question ${questionId}: ${error.message}`, 'error');
        
        setTimeout(() => {
          button.style.background = '#f44336';
          button.innerHTML = '🗑️ Delete This';
        }, 3000);
      }
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

// Function to clear database duplicates - Complete implementation
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
      
      try {
        let totalDeleted = 0;
        let operationResults = [];
        
        // 1. Delete duplicate options (exact same text and correctness)
        console.log('Step 1: Deleting duplicate options...');
        const deleteDuplicateOptionsSQL = `
          DELETE FROM options 
          WHERE id NOT IN (
            SELECT MIN(id) 
            FROM options 
            GROUP BY question_id, option_text, is_correct
          )
        `;
        
        AppState.database.exec(deleteDuplicateOptionsSQL);
        const optionsDeleted = AppState.database.getRowsModified();
        totalDeleted += optionsDeleted;
        operationResults.push(`${optionsDeleted} duplicate options`);
        console.log(`Deleted ${optionsDeleted} duplicate options`);
        
        // 2. Delete conflicting options (same text, different correctness) - keep first occurrence
        console.log('Step 2: Deleting conflicting options...');
        const deleteConflictingOptionsSQL = `
          DELETE FROM options 
          WHERE id NOT IN (
            SELECT MIN(id) 
            FROM options 
            GROUP BY question_id, option_text
          )
        `;
        
        AppState.database.exec(deleteConflictingOptionsSQL);
        const conflictingDeleted = AppState.database.getRowsModified() - optionsDeleted; // Subtract previous to get just this operation
        totalDeleted += conflictingDeleted;
        if (conflictingDeleted > 0) {
          operationResults.push(`${conflictingDeleted} conflicting options`);
        }
        console.log(`Deleted ${conflictingDeleted} conflicting options`);
        
        // 3. Delete duplicate match_pairs
        console.log('Step 3: Deleting duplicate match_pairs...');
        const deleteDuplicateMatchPairsSQL = `
          DELETE FROM match_pairs 
          WHERE id NOT IN (
            SELECT MIN(id) 
            FROM match_pairs 
            GROUP BY question_id, left_text, right_text
          )
        `;
        
        AppState.database.exec(deleteDuplicateMatchPairsSQL);
        const matchPairsDeleted = AppState.database.getRowsModified() - (optionsDeleted + conflictingDeleted);
        totalDeleted += matchPairsDeleted;
        if (matchPairsDeleted > 0) {
          operationResults.push(`${matchPairsDeleted} duplicate match_pairs`);
        }
        console.log(`Deleted ${matchPairsDeleted} duplicate match_pairs`);
        
        // Success - update button and show results
        if (deleteBtn) {
          deleteBtn.style.background = '#4caf50';
          deleteBtn.innerHTML = '✅ All Cleaned!';
          deleteBtn.disabled = true; // Keep disabled since all duplicates are now gone
        }
        
        // Create detailed success message
        let detailMessage = '';
        if (totalDeleted > 0) {
          detailMessage = `Successfully removed ${totalDeleted} duplicate entries:\n• ${operationResults.join('\n• ')}`;
        } else {
          detailMessage = 'No duplicates found to remove. Database is already clean!';
        }
        
        showFloatingMessage(`✅ Bulk cleanup completed: ${totalDeleted} entries removed`, 'success');
        
        // Also show a more detailed modal with results
        setTimeout(() => {
          createResultModal('Bulk Delete Complete', detailMessage, totalDeleted);
        }, 1000);
        
        // Update the duplicates section in the popup to reflect changes
        setTimeout(() => {
          const duplicatesSection = document.querySelector('.question-card'); // Find the duplicates section
          if (duplicatesSection) {
            // Update the header to show completion
            const header = duplicatesSection.querySelector('div[style*="background: #f44336"]');
            if (header) {
              header.style.background = '#4caf50';
              header.innerHTML = `
                <div>
                  <h3 style="margin: 0; font-size: 1.2em;">✅ Duplicates Cleaned</h3>
                  <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
                    Successfully removed ${totalDeleted} duplicate entries.
                  </p>
                </div>
                <div style="color: #e8f5e8; font-size: 1.2em;">✓</div>
              `;
            }
          }
        }, 1500);
        
      } catch (error) {
        console.error('Error during bulk delete:', error);
        
        // Error - restore button
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

// Helper function to create a detailed results modal
function createResultModal(title, message, totalDeleted) {
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 10003; display: flex;
    align-items: center; justify-content: center;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; border-radius: 8px; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    max-width: 600px; width: 90%; animation: slideIn 0.3s ease-out;
  `;
  
  const bgColor = totalDeleted > 0 ? '#4caf50' : '#2196f3';
  const icon = totalDeleted > 0 ? '🧹' : 'ℹ️';
  
  modal.innerHTML = `
    <style>
      @keyframes slideIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    </style>
    <div style="background: ${bgColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h3 style="margin: 0; font-size: 1.3em;">${icon} ${title}</h3>
    </div>
    <div style="padding: 25px;">
      <div style="white-space: pre-line; line-height: 1.6; margin-bottom: 20px; font-size: 1.05em;">
        ${message}
      </div>
      <div style="text-align: center;">
        <button id="result-modal-close" style="
          background: ${bgColor}; color: white; border: none; padding: 12px 24px;
          border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1em;
        ">Close</button>
      </div>
    </div>
  `;
  
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
  
  // Event handlers
  const closeBtn = modal.querySelector('#result-modal-close');
  
  const closeModal = () => {
    modal.style.animation = 'slideIn 0.2s ease-in reverse';
    setTimeout(() => document.body.removeChild(modalOverlay), 200);
  };
  
  closeBtn.onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };
  
  // Focus close button
  setTimeout(() => closeBtn.focus(), 100);
}