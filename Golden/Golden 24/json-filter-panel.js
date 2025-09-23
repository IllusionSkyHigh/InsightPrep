/**
 * ============================================================================
 * FILTER PANEL SYSTEM MODULE
 * ============================================================================
 * 
 * Purpose:
 * This module manages the comprehensive filter panel system for the MockTest
 * application, providing both JSON and database-based question filtering
 * capabilities with sophisticated hierarchical topic/subtopic selection,
 * question type filtering, and test configuration options.
 * 
 * Key Responsibilities:
 * • JSON Mode Filtering: Build dynamic filter panels for JSON-loaded questions
 * • Database Mode Filtering: Create advanced database query-based filters
 * • Hierarchical Selection: Manage topic/subtopic checkbox hierarchies with
 *   indeterminate states and cascading selection logic
 * • Question Validation: Perform comprehensive validation with segregation of
 *   duplicates vs anomalies for database questions
 * • Dynamic Count Updates: Real-time updates of available question counts
 *   based on current filter selections
 * • Test Configuration: Handle explanation modes, behavior options, selection
 *   modes (random vs balanced), and question count limits
 * • State Management: Save/restore filter states and integrate with AppState
 * • UI Coordination: Manage button states, tooltips, and interactive elements
 * 
 * Core Functions:
 * • buildFilterPanel() - Creates JSON mode filter interface
 * • buildDbFilterPanel() - Creates database mode filter interface  
 * • setupTopicSubtopicCheckboxes() - Manages hierarchical checkbox logic
 * • setupAllCheckbox() - Handles "select all" functionality
 * • showInvalidQuestionsPopup() - Displays validation results
 * 
 * Dependencies:
 * • core-utils.js - For DOM manipulation, escapeSQL, shuffle utilities
 * • app-state.js - For state persistence and configuration management
 * • database-manager.js - For secure database operations and queries
 * • test-engine.js - For starting tests with filtered question sets
 * 
 * Technical Features:
 * • Smart question counting with validation-aware totals
 * • Balanced selection algorithms for diverse question distribution
 * • Comprehensive database validation with categorized issue reporting
 * • Dynamic UI updates based on filter selections
 * • Tooltip systems for complex selection modes
 * • Reset functionality with intelligent defaults
 * 
 * Integration Points:
 * • Called by main application when filter panels need to be built
 * • Integrates with test engine for question set delivery
 * • Coordinates with state management for option persistence
 * • Works with database manager for secure query execution
 * 
 * @author MockTest Application
 * @version 1.0.0
 * @since 2025-09-21
 */

// ============================================================================
// CHECKBOX HIERARCHY MANAGEMENT
// ============================================================================

function setupAllCheckbox(sectionDiv) {
  const checkboxes = sectionDiv.querySelectorAll("input[type=checkbox]");
  const allBox = checkboxes[0];
  const children = Array.from(checkboxes).slice(1);

  allBox.addEventListener("change", () => {
    children.forEach(cb => cb.checked = allBox.checked);
  });

  children.forEach(cb => {
    cb.addEventListener("change", () => {
      if (children.every(c => c.checked)) {
        allBox.checked = true;
      } else {
        allBox.checked = false;
      }
    });
  });
}

function setupTopicSubtopicCheckboxes(topicDiv) {
  const selectAllCheckbox = topicDiv.querySelector('#select-all-topics');
  const topicCheckboxes = topicDiv.querySelectorAll('.topic-checkbox');
  const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox');

  // Select All functionality
  selectAllCheckbox.addEventListener('change', () => {
    const isChecked = selectAllCheckbox.checked;
    topicCheckboxes.forEach(cb => cb.checked = isChecked);
    subtopicCheckboxes.forEach(cb => cb.checked = isChecked);
  });

  // Topic checkbox functionality
  topicCheckboxes.forEach(topicCb => {
    const topic = topicCb.value;
    const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
    
    topicCb.addEventListener('change', () => {
      const isChecked = topicCb.checked;
      relatedSubtopics.forEach(subtopicCb => subtopicCb.checked = isChecked);
      updateSelectAllState();
    });
  });

  // Subtopic checkbox functionality  
  subtopicCheckboxes.forEach(subtopicCb => {
    subtopicCb.addEventListener('change', () => {
      const topic = subtopicCb.dataset.topic;
      const topicCheckbox = topicDiv.querySelector(`.topic-checkbox[value="${topic}"]`);
      const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
      
      // Update parent topic checkbox based on subtopic states
      const allSubtopicsChecked = Array.from(relatedSubtopics).every(cb => cb.checked);
      const anySubtopicChecked = Array.from(relatedSubtopics).some(cb => cb.checked);
      
      topicCheckbox.checked = allSubtopicsChecked;
      topicCheckbox.indeterminate = anySubtopicChecked && !allSubtopicsChecked;
      
      updateSelectAllState();
    });
  });

  function updateSelectAllState() {
    const allTopicsChecked = Array.from(topicCheckboxes).every(cb => cb.checked);
    const anyTopicChecked = Array.from(topicCheckboxes).some(cb => cb.checked);
    
    selectAllCheckbox.checked = allTopicsChecked;
    selectAllCheckbox.indeterminate = anyTopicChecked && !allTopicsChecked;
  }
}

// Database-specific setup function for hierarchical checkboxes
function setupTopicSubtopicCheckboxesDb(topicDiv, updateMaxQuestions) {
  const selectAllCheckbox = topicDiv.querySelector('#select-all-topics-db');
  const topicCheckboxes = topicDiv.querySelectorAll('.topic-checkbox');
  const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox');

  // Select All functionality
  selectAllCheckbox.addEventListener('change', () => {
    const isChecked = selectAllCheckbox.checked;
    topicCheckboxes.forEach(cb => cb.checked = isChecked);
    subtopicCheckboxes.forEach(cb => cb.checked = isChecked);
    // Trigger update when select all changes
    if (typeof updateMaxQuestions === 'function') updateMaxQuestions();
  });

  // Topic checkbox functionality
  topicCheckboxes.forEach(topicCb => {
    const topic = topicCb.value;
    const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
    
    topicCb.addEventListener('change', () => {
      const isChecked = topicCb.checked;
      relatedSubtopics.forEach(subtopicCb => subtopicCb.checked = isChecked);
      updateSelectAllState();
      // Trigger update when topic changes
      if (typeof updateMaxQuestions === 'function') updateMaxQuestions();
    });
  });

  // Subtopic checkbox functionality  
  subtopicCheckboxes.forEach(subtopicCb => {
    subtopicCb.addEventListener('change', () => {
      const topic = subtopicCb.dataset.topic;
      const topicCheckbox = topicDiv.querySelector(`.topic-checkbox[value="${topic}"]`);
      const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
      
      // Update parent topic checkbox based on subtopic states
      const allSubtopicsChecked = Array.from(relatedSubtopics).every(cb => cb.checked);
      const anySubtopicChecked = Array.from(relatedSubtopics).some(cb => cb.checked);
      
      topicCheckbox.checked = allSubtopicsChecked;
      topicCheckbox.indeterminate = anySubtopicChecked && !allSubtopicsChecked;
      
      updateSelectAllState();
      // Trigger update when subtopic changes
      if (typeof updateMaxQuestions === 'function') updateMaxQuestions();
    });
  });

  function updateSelectAllState() {
    const allTopicsChecked = Array.from(topicCheckboxes).every(cb => cb.checked);
    const anyTopicChecked = Array.from(topicCheckboxes).some(cb => cb.checked);
    
    selectAllCheckbox.checked = allTopicsChecked;
    selectAllCheckbox.indeterminate = anyTopicChecked && !allTopicsChecked;
  }
}

// ============================================================================
// VALIDATION POPUP SYSTEM
// ============================================================================

function showInvalidQuestionsPopup(invalidQuestions, totalQuestions) {
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
    background: white; border-radius: 8px; max-width: 80vw; max-height: 80vh; 
    overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; flex-direction: column;
  `;
  
  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 20px; background: #ff9800; color: white; display: flex; 
    justify-content: space-between; align-items: center;
  `;
  
  const title = document.createElement("h3");
  title.style.margin = "0";
  title.textContent = `Invalid Questions Found: ${invalidQuestions.length}`;
  
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
    background: none; border: none; color: white; font-size: 24px; 
    cursor: pointer; padding: 0; width: 30px; height: 30px;
  `;
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Content
  const content = document.createElement("div");
  content.style.cssText = "padding: 20px; overflow-y: auto; flex: 1;";
  
  // Summary
  const validCount = totalQuestions - invalidQuestions.length;
  const summary = document.createElement("div");
  summary.style.cssText = "margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;";
  summary.innerHTML = `
    <strong>Summary:</strong><br>
    Valid Questions: ${validCount}<br>
    Invalid Questions: ${invalidQuestions.length}<br>
    Total Questions: ${totalQuestions}
  `;
  content.appendChild(summary);
  
  // Question list
  if (invalidQuestions.length > 0) {
    const questionsList = document.createElement("div");
    invalidQuestions.slice(0, 50).forEach((q, index) => {
      const item = document.createElement("div");
      item.style.cssText = "margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;";
      item.innerHTML = `
        <strong>Question ${q.id}:</strong> ${(q.question_text || '').substring(0, 100)}...<br>
        <em>Issue: ${q.reason || 'Unknown validation error'}</em>
      `;
      questionsList.appendChild(item);
    });
    
    if (invalidQuestions.length > 50) {
      const moreInfo = document.createElement("div");
      moreInfo.style.cssText = "padding: 10px; text-align: center; color: #666;";
      moreInfo.textContent = `... and ${invalidQuestions.length - 50} more questions`;
      questionsList.appendChild(moreInfo);
    }
    
    content.appendChild(questionsList);
  }
  
  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to get selected topic/subtopic combinations
function getSelectedTopicSubtopics(topicDiv) {
  const selectedCombinations = [];
  const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox:checked');
  
  subtopicCheckboxes.forEach(cb => {
    selectedCombinations.push({
      topic: cb.dataset.topic,
      subtopic: cb.value
    });
  });
  
  return selectedCombinations;
}

// Helper function to check if a question matches selected topic/subtopic criteria
function questionMatchesTopicSubtopicSelection(question, selectedCombinations) {
  return selectedCombinations.some(combo => {
    const questionSubtopic = question.subtopic || 'General';
    return question.topic === combo.topic && questionSubtopic === combo.subtopic;
  });
}

// Utility: Show total question count in DB in file-chosen area for debugging
function showTotalDbQuestions() {
  if (!AppState.database) return;
  const res = AppState.database.exec('SELECT COUNT(*) FROM questions');
  const total = res[0]?.values[0][0] || 0;
  document.getElementById('file-chosen').innerHTML = `<span style='color:#0078d7; font-weight:bold;'>Total questions in DB: ${total}</span>`;
}

// ============================================================================
// JSON MODE FILTER PANEL BUILDER
// ============================================================================

function buildFilterPanel(allQuestions, skipRestore = false) {
  const panel = document.getElementById("filter-panel");
  panel.innerHTML = "";

  // Hide the how-to-use guide when options page loads
  const guideElement = document.getElementById("how-to-use-guide");
  if (guideElement) {
    guideElement.style.display = "none";
  }

  // Show the Back to Start Page button when in options
  const backToStartButton = document.getElementById("backToStartFromOptions");
  if (backToStartButton) {
    backToStartButton.style.display = "inline-block";
  }

  // Hide extra buttons during options mode (only show Choose JSON, Choose DB, Back to Start Page)
  const backToOptionsButton = document.getElementById("backToOptions");
  const newQuestionsButton = document.getElementById("newTestSameOptions");
  if (backToOptionsButton) {
    backToOptionsButton.style.display = "none";
  }
  if (newQuestionsButton) {
    newQuestionsButton.style.display = "none";
  }

  // Show file selection buttons during options
  const chooseJsonLabel = document.querySelector('label[for="fileInput"]');
  const chooseDbButton = document.getElementById("chooseDb");
  if (chooseJsonLabel) {
    chooseJsonLabel.style.display = "inline-block";
  }
  if (chooseDbButton) {
    chooseDbButton.style.display = "inline-block";
  }

  // Debug: Log the first few questions to see their structure
  console.log("Sample questions for debugging:", allQuestions.slice(0, 3));

  // Build hierarchical topic-subtopic structure
  const topicSubtopicMap = new Map();
  allQuestions.forEach(q => {
    const topic = q.topic;
    const subtopic = q.subtopic || 'General'; // Use actual subtopic field from data
    
    if (!topicSubtopicMap.has(topic)) {
      topicSubtopicMap.set(topic, new Set());
    }
    topicSubtopicMap.get(topic).add(subtopic);
  });

  // Debug: Log the topic-subtopic mapping
  console.log("Topic-Subtopic Map:", topicSubtopicMap);

  const types = [...new Set(allQuestions.map(q => q.type))];

  const wrapper = document.createElement("div");
  wrapper.className = "filter-panel";

  // Topics with nested subtopics
  const topicDiv = document.createElement("div");
  topicDiv.className = "filter-section";
  topicDiv.innerHTML = "<h3>Select Topics & Subtopics</h3>";
  
  // Select All checkbox
  const selectAllDiv = document.createElement("div");
  selectAllDiv.style.marginBottom = "15px";
  selectAllDiv.style.borderBottom = "1px solid #ddd";
  selectAllDiv.style.paddingBottom = "10px";
  const selectAllLabel = document.createElement("label");
  selectAllLabel.style.fontWeight = "bold";
  selectAllLabel.innerHTML = `<input type="checkbox" id="select-all-topics" checked> Select All Topics & Subtopics`;
  selectAllDiv.appendChild(selectAllLabel);
  topicDiv.appendChild(selectAllDiv);

  // Create hierarchical structure
  const topicContainer = document.createElement("div");
  topicContainer.className = "topic-hierarchy";
  
  Array.from(topicSubtopicMap.keys()).sort().forEach(topic => {
    const subtopics = Array.from(topicSubtopicMap.get(topic)).sort();
    
    // Get question count for this topic
    const topicQuestionCount = allQuestions.filter(q => q.topic === topic).length;
    
    // Topic level container
    const topicItemDiv = document.createElement("div");
    topicItemDiv.className = "topic-item";
    topicItemDiv.style.marginBottom = "10px";
    
    // Topic checkbox with question count
    const topicLabel = document.createElement("label");
    topicLabel.style.fontWeight = "bold";
    topicLabel.style.display = "block";
    topicLabel.innerHTML = `<input type="checkbox" class="topic-checkbox" value="${topic}" checked> ${topic} <span style="color: #666; font-weight: normal;">(${topicQuestionCount} question${topicQuestionCount === 1 ? '' : 's'})</span>`;
    topicItemDiv.appendChild(topicLabel);
    
    // Subtopics container
    const subtopicsDiv = document.createElement("div");
    subtopicsDiv.className = "subtopics-container";
    subtopicsDiv.style.marginLeft = "20px";
    subtopicsDiv.style.marginTop = "5px";
    
    subtopics.forEach(subtopic => {
      // Get question count for this specific topic/subtopic combination
      const subtopicQuestionCount = allQuestions.filter(q => q.topic === topic && (q.subtopic || 'General') === subtopic).length;
      
      const subtopicLabel = document.createElement("label");
      subtopicLabel.style.display = "block";
      subtopicLabel.style.fontSize = "0.9em";
      subtopicLabel.style.marginBottom = "2px";
      subtopicLabel.innerHTML = `<input type="checkbox" class="subtopic-checkbox" data-topic="${topic}" value="${subtopic}" checked> ${subtopic} <span style="color: #666;">(${subtopicQuestionCount} question${subtopicQuestionCount === 1 ? '' : 's'})</span>`;
      subtopicsDiv.appendChild(subtopicLabel);
    });
    
    topicItemDiv.appendChild(subtopicsDiv);
    topicContainer.appendChild(topicItemDiv);
  });
  
  topicDiv.appendChild(topicContainer);
  setupTopicSubtopicCheckboxes(topicDiv);

  // Types
  const typeDiv = document.createElement("div");
  typeDiv.className = "filter-section";
  typeDiv.innerHTML = "<h3>Select Question Types</h3>";
  const allTypes = document.createElement("label");
  allTypes.innerHTML = `<input type="checkbox" value="ALL" checked> Selected Types <span style="color: #666; font-weight: normal;">(${allQuestions.length} question${allQuestions.length === 1 ? '' : 's'})</span>`;
  typeDiv.appendChild(allTypes);
  types.forEach(t => {
    const typeQuestionCount = allQuestions.filter(q => q.type === t).length;
    const l = document.createElement("label");
    l.style.display = "block";
    l.style.marginLeft = "20px"; // Indent the individual type checkboxes
    l.innerHTML = `<input type="checkbox" value="${t}" checked> ${t} <span style="color: #666; font-weight: normal;">(${typeQuestionCount} question${typeQuestionCount === 1 ? '' : 's'})</span>`;
    typeDiv.appendChild(l);
  });
  setupAllCheckbox(typeDiv);
  
  // Function to update "Selected Types" count based on checked question types (JSON mode)
  function updateSelectedTypesCountJSON() {
    console.log("updateSelectedTypesCountJSON called"); // Debug log
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    const allTypesCheckbox = typeChecks[0]; // First checkbox is "Selected Types"
    const allTypesLabel = typeDiv.querySelector('label:first-child span');
    
    console.log("Found", typeChecks.length, "checkboxes and label:", allTypesLabel); // Debug log
    
    if (!allTypesLabel) {
      console.log("Could not find label span, trying alternative selector"); // Debug log
      const allTypesLabelAlt = typeDiv.querySelector('span');
      if (!allTypesLabelAlt) {
        console.log("Could not find any span in typeDiv"); // Debug log
        return;
      }
      console.log("Found alternative span:", allTypesLabelAlt); // Debug log
    }
    
    const spanToUpdate = allTypesLabel || typeDiv.querySelector('span');
    let totalSelectedCount = 0;
    
    // Sum up all checked individual types (skip the first "Selected Types" checkbox)
    typeChecks.forEach((cb, i) => {
      if (i > 0 && cb.checked) { // Skip the first "Selected Types" checkbox
        const label = cb.parentElement;
        const span = label.querySelector('span');
        if (span) {
          // Extract count from text like "(40 questions)"
          const match = span.textContent.match(/\((\d+)\s+question/);
          if (match) {
            const count = parseInt(match[1]);
            totalSelectedCount += count;
            console.log("Adding", count, "from", cb.value); // Debug log
          }
        }
      }
    });
    
    console.log("Total selected count:", totalSelectedCount); // Debug log
    
    // Update the "Selected Types" count display
    if (spanToUpdate) {
      spanToUpdate.textContent = `(${totalSelectedCount} question${totalSelectedCount === 1 ? '' : 's'})`;
      console.log("Updated span to:", spanToUpdate.textContent); // Debug log
    } else {
      console.log("Could not find span to update"); // Debug log
    }
  }
  
  // Add event listeners to individual type checkboxes to update "Selected Types" count
  setTimeout(() => {
    console.log("Setting up JSON mode event listeners"); // Debug log
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    console.log("Found", typeChecks.length, "checkboxes to set up"); // Debug log
    typeChecks.forEach((cb, i) => {
      if (i > 0) { // Skip the first "Selected Types" checkbox
        console.log("Adding listener to", cb.value); // Debug log
        cb.addEventListener('change', () => {
          console.log("Individual type checkbox changed:", cb.value, cb.checked); // Debug log
          updateSelectedTypesCountJSON();
        });
      }
    });
  }, 200);

  // Dynamic max count update for JSON mode
  function updateMaxQuestionsJSON() {
    // Prevent recursive calls when we programmatically change the input value
    if (updateMaxQuestionsJSON.isUpdating) return;
    updateMaxQuestionsJSON.isUpdating = true;
    
    // Get selected topic/subtopic combinations (same logic as Start Test button)
    let selectedCombinations = [];
    const selectAllCheckbox = topicDiv.querySelector('#select-all-topics');
    
    if (selectAllCheckbox && selectAllCheckbox.checked) {
      // All topics and subtopics selected
      allQuestions.forEach(q => {
        const topic = q.topic;
        const subtopic = q.subtopic || 'General';
        const combo = { topic, subtopic };
        if (!selectedCombinations.some(c => c.topic === combo.topic && c.subtopic === combo.subtopic)) {
          selectedCombinations.push(combo);
        }
      });
    } else {
      // Get individual subtopic selections
      const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox:checked');
      subtopicCheckboxes.forEach(cb => {
        selectedCombinations.push({
          topic: cb.dataset.topic,
          subtopic: cb.value
        });
      });
    }
    
    // Get selected types
    let selectedTypes = [];
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    if (typeChecks[0].checked) {
      selectedTypes = types;
    } else {
      typeChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked) selectedTypes.push(cb.value);
      });
    }
    
    // Filter questions based on selected topic/subtopic combinations and types
    const filteredQuestions = allQuestions.filter(q => {
      const questionSubtopic = q.subtopic || 'General';
      const matchesTopicSubtopic = selectedCombinations.some(combo => 
        q.topic === combo.topic && questionSubtopic === combo.subtopic
      );
      const matchesType = selectedTypes.includes(q.type);
      return matchesTopicSubtopic && matchesType;
    });
    
    const maxQuestions = filteredQuestions.length;
    const numInput = document.getElementById("numQuestions");
    if (numInput) {
      numInput.max = maxQuestions;
      
      // Auto-adjust the value if it exceeds the new maximum
      const currentValue = parseInt(numInput.value) || 0;
      if (currentValue < 1) {
        numInput.value = Math.min(10, maxQuestions);
      } else if (currentValue > maxQuestions) {
        numInput.value = maxQuestions;
      }
    }
    
    // Update max info and answer all button
    const maxInfo = numDiv.querySelector("span");
    const answerAllBtn = document.getElementById("answerAllBtn");
    if (maxInfo) maxInfo.textContent = `Max: ${maxQuestions} question${maxQuestions === 1 ? '' : 's'} available for selection`;
    if (answerAllBtn) {
      answerAllBtn.textContent = `Answer all ${maxQuestions}`;
      answerAllBtn.title = `Set question count to maximum available (${maxQuestions})`;
      answerAllBtn.onclick = () => {
        document.getElementById("numQuestions").value = maxQuestions;
      };
    }
    
    // Update question type counts based on filtered questions
    types.forEach(t => {
      const typeCount = filteredQuestions.filter(q => q.type === t).length;
      const typeLabel = typeDiv.querySelector(`input[value="${t}"]`);
      if (typeLabel && typeLabel.parentElement) {
        const span = typeLabel.parentElement.querySelector('span');
        if (span) {
          span.textContent = `(${typeCount} question${typeCount === 1 ? '' : 's'})`;
        }
      }
    });
    
    // Update "Selected Types" count to reflect only checked types
    if (typeof updateSelectedTypesCountJSON === 'function') {
      updateSelectedTypesCountJSON();
    }
    
    if (startBtn) {
      startBtn.disabled = (maxQuestions < 1 || parseInt(numInput?.value || 0) < 1 || parseInt(numInput?.value || 0) > maxQuestions);
    }
    
    // Reset the flag
    updateMaxQuestionsJSON.isUpdating = false;
  }

  // Explanation display mode
  const expDiv = document.createElement("div");
  expDiv.className = "filter-section";
  expDiv.innerHTML = "<h3>Explanation & Reference Display</h3>";
  expDiv.innerHTML += `
    <label><input type="radio" name="expMode" value="1"> Only when wrong</label><br>
    <label><input type="radio" name="expMode" value="2" checked> Both when right and wrong</label><br>
    <label><input type="radio" name="expMode" value="3"> Do not display explanations</label>
  `;

  // Test behavior options
  const behaviorDiv = document.createElement("div");
  behaviorDiv.className = "filter-section";
  behaviorDiv.innerHTML = "<h3>Test Behavior Options</h3>";
  behaviorDiv.innerHTML += `
    <label><input type="checkbox" id="tryAgainOption" checked> Allow "Try Again" for incorrect answers</label><br>
    <label><input type="checkbox" id="topicRevealOption" checked> Show Topic/Subtopic when answering</label><br>
    <label><input type="checkbox" id="immediateResultOption" checked> Show result immediately after each answer</label><br>
    <label><input type="checkbox" id="correctAnswerOption" checked> Show correct answer when wrong</label>
    <div style="margin-top: 8px; padding: 8px; background: #f0f8ff; border-radius: 4px; font-size: 0.9em; color: #666;">
      <em>Note: If "immediate result" is OFF, results and selected options will be revealed after the final score</em>
    </div>
  `;

  // Add immediate result option change handler (JSON mode)
  setTimeout(() => {
    const immediateResultCheckbox = document.getElementById("immediateResultOption");
    const correctAnswerCheckbox = document.getElementById("correctAnswerOption");
    const tryAgainCheckbox = document.getElementById("tryAgainOption");
    const explanationRadios = expDiv.querySelectorAll('input[name="expMode"]');
    
    immediateResultCheckbox.addEventListener("change", () => {
      if (!immediateResultCheckbox.checked) {
        // When immediate result is turned OFF, disable "Try Again" (incompatible with delayed results)
        tryAgainCheckbox.checked = false;
        tryAgainCheckbox.disabled = true;
        // Keep other options available for user choice - they'll be applied after final score
      } else {
        // When turned back ON, re-enable "Try Again" and set reasonable defaults
        tryAgainCheckbox.disabled = false;
        if (!correctAnswerCheckbox.checked && !tryAgainCheckbox.checked) {
          // If both were unchecked, set reasonable defaults
          correctAnswerCheckbox.checked = true;
          tryAgainCheckbox.checked = true;
        }
        if (explanationRadios[2].checked) {
          // If explanations were set to "none", change to a reasonable default
          explanationRadios[1].checked = true; // "Both when right and wrong"
        }
      }
    });
  }, 0);

  // Number of questions
  const maxQuestions = allQuestions.length;
  const numDiv = document.createElement("div");
  numDiv.className = "filter-section";
  numDiv.innerHTML = `<h3>Number of Questions</h3><input type=\"number\" id=\"numQuestions\" min=\"1\" value=\"${Math.min(10, maxQuestions)}\" max=\"${maxQuestions}\"> <span style=\"margin-left:10px; color:#0078d7; font-weight:bold;\">Max: ${maxQuestions} question${maxQuestions === 1 ? '' : 's'} available for selection</span><button id=\"answerAllBtn\" style=\"margin-left:10px; background:#4caf50; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.85em; cursor:pointer; font-weight:bold;\" title=\"Set question count to maximum available (${maxQuestions})\">Answer all ${maxQuestions}</button>`;
  
  // Add click handler for the "Answer all" button
  document.getElementById("answerAllBtn").addEventListener("click", () => {
    document.getElementById("numQuestions").value = maxQuestions;
  });

  // Start button
  const startBtn = document.createElement("button");
  startBtn.textContent = "Start Test";
  startBtn.className = "custom-btn";
  
  startBtn.addEventListener("click", () => {
    // Save current options state before starting test
    saveOptionsState();
    
    // JSON mode: filter questions by selected topics/types and shuffle randomly
    const topics = [...new Set(allQuestions.map(q => q.topic))];
    
    let selectedTopics = [];
    let selectedTypes = [];
    const topicChecks = topicDiv.querySelectorAll("input[type=checkbox]");
    if (topicChecks[0].checked) {
      selectedTopics = topics;
    } else {
      topicChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked) selectedTopics.push(cb.value);
      });
    }
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    if (typeChecks[0].checked) {
      selectedTypes = types;
    } else {
      typeChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked) selectedTypes.push(cb.value);
      });
    }
    
    const expChoice = expDiv.querySelector("input[name=expMode]:checked");
    AppState.explanationMode = parseInt(expChoice.value);
    
    // Capture test behavior options
    AppState.allowTryAgain = document.getElementById("tryAgainOption").checked;
    AppState.showTopicSubtopic = document.getElementById("topicRevealOption").checked;
    AppState.showImmediateResult = document.getElementById("immediateResultOption").checked;
    AppState.showCorrectAnswer = document.getElementById("correctAnswerOption").checked;
    
    // Filter questions based on selection
    let filteredQuestions = allQuestions.filter(q => selectedTopics.includes(q.topic) && selectedTypes.includes(q.type));
    
    const numInput = document.getElementById("numQuestions");
    const maxQuestions = filteredQuestions.length;
    let numQuestions = Math.max(1, Math.min(parseInt(numInput.value) || 10, maxQuestions));
    
    if (numQuestions > maxQuestions) {
      document.getElementById("file-chosen").innerHTML = `<span style='color:red;'>You requested ${numQuestions} questions, but only ${maxQuestions} are available for the selected criteria. Please reduce the number.</span>`;
      return;
    }
    
    // Always use random selection in JSON mode
    filteredQuestions = shuffle(filteredQuestions);
    const chosenQuestions = filteredQuestions.slice(0, numQuestions);
    
    document.getElementById("file-chosen").innerHTML = `Loaded ${chosenQuestions.length} questions. Preparing test UI...`;
    setTimeout(() => {
      panel.innerHTML = "";
      document.getElementById("restart").style.display = "none";
      document.getElementById("restart-bottom").style.display = "none";
      startTest(chosenQuestions);
    }, 500);
  });
  
  // Dynamic max count update for JSON mode
  function updateMaxQuestionsJSON() {
    // Prevent recursive calls when we programmatically change the input value
    if (updateMaxQuestionsJSON.isUpdating) return;
    updateMaxQuestionsJSON.isUpdating = true;
    
    // Get selected topic/subtopic combinations (same logic as Start Test button)
    let selectedCombinations = [];
    const selectAllCheckbox = topicDiv.querySelector('#select-all-topics');
    
    if (selectAllCheckbox && selectAllCheckbox.checked) {
      // All topics and subtopics selected
      allQuestions.forEach(q => {
        const topic = q.topic;
        const subtopic = q.subtopic || 'General';
        const combo = { topic, subtopic };
        if (!selectedCombinations.some(c => c.topic === combo.topic && c.subtopic === combo.subtopic)) {
          selectedCombinations.push(combo);
        }
      });
    } else {
      // Get individual subtopic selections
      const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox:checked');
      subtopicCheckboxes.forEach(cb => {
        selectedCombinations.push({
          topic: cb.dataset.topic,
          subtopic: cb.value
        });
      });
    }
    
    // Get selected types
    let selectedTypes = [];
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    if (typeChecks[0].checked) {
      selectedTypes = types;
    } else {
      typeChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked) selectedTypes.push(cb.value);
      });
    }
    
    // Filter questions based on selected topic/subtopic combinations and types
    const filteredQuestions = allQuestions.filter(q => {
      const questionSubtopic = q.subtopic || 'General';
      const matchesTopicSubtopic = selectedCombinations.some(combo => 
        q.topic === combo.topic && questionSubtopic === combo.subtopic
      );
      const matchesType = selectedTypes.includes(q.type);
      return matchesTopicSubtopic && matchesType;
    });
    
    const maxQuestions = filteredQuestions.length;
    const numInput = document.getElementById("numQuestions");
    numInput.max = maxQuestions;
    
    // Auto-adjust the value if it exceeds the new maximum
    const currentValue = parseInt(numInput.value) || 0;
    if (currentValue < 1) {
      numInput.value = Math.min(10, maxQuestions);
    } else if (currentValue > maxQuestions) {
      numInput.value = maxQuestions;
    }
    
    // Update max info and answer all button with quick selection buttons
    const maxInfo = numDiv.querySelector("span");
    const answerAllBtn = document.getElementById("answerAllBtn");
    if (maxInfo) maxInfo.textContent = `Max: ${maxQuestions} question${maxQuestions === 1 ? '' : 's'} available for selection`;
    if (answerAllBtn) {
      answerAllBtn.textContent = `Answer all ${maxQuestions}`;
      answerAllBtn.title = `Set question count to maximum available (${maxQuestions})`;
      answerAllBtn.onclick = () => {
        document.getElementById("numQuestions").value = maxQuestions;
      };
      
      // Create quick selection buttons (10, 20, 30, 40, 50) next to "Answer all" button
      // Remove any existing quick selection buttons first
      const existingQuickButtons = document.querySelectorAll(".quick-select-btn-json");
      existingQuickButtons.forEach(btn => btn.remove());
      
      // Only create quick selection buttons if there are questions available
      if (maxQuestions > 0) {
        // Generate quick selection values in descending order
        const quickSelectionValues = [];
        if (maxQuestions > 50) {
          // If maxcount > 50, start from 50 and go down to 10 (already descending)
          for (let i = 50; i >= 10; i -= 10) {
            if (i <= maxQuestions) {
              quickSelectionValues.push(i);
            }
          }
        } else {
          // If maxcount <= 50, generate buttons for multiples of 10 in descending order
          for (let i = Math.floor(maxQuestions / 10) * 10; i >= 10; i -= 10) {
            quickSelectionValues.push(i);
          }
        }
        
        // Create and insert quick selection buttons
        quickSelectionValues.forEach(value => {
          const quickBtn = document.createElement("button");
          quickBtn.textContent = value.toString();
          quickBtn.className = "quick-select-btn-json";
          quickBtn.style.cssText = "margin-left: 5px; background: #4caf50; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; cursor: pointer; font-weight: bold;";
          quickBtn.title = `Set question count to ${value}`;
          quickBtn.onclick = () => {
            const numInput = document.getElementById("numQuestions");
            if (numInput) {
              numInput.value = value;
            }
          };
          
          // Insert button after the "Answer all" button
          answerAllBtn.parentNode.insertBefore(quickBtn, answerAllBtn.nextSibling);
        });
      }
    }
    
    // Update question type counts based on filtered questions
    types.forEach(t => {
      const typeCount = filteredQuestions.filter(q => q.type === t).length;
      const typeLabel = typeDiv.querySelector(`input[value="${t}"]`);
      if (typeLabel && typeLabel.parentElement) {
        const span = typeLabel.parentElement.querySelector('span');
        if (span) {
          span.textContent = `(${typeCount} question${typeCount === 1 ? '' : 's'})`;
        }
      }
    });
    
    // Update "Selected Types" count to reflect only checked types
    if (typeof updateSelectedTypesCountJSON === 'function') {
      updateSelectedTypesCountJSON();
    }
    
    startBtn.disabled = (maxQuestions < 1 || parseInt(numInput.value) < 1 || parseInt(numInput.value) > maxQuestions);
    
    // Reset the flag
    updateMaxQuestionsJSON.isUpdating = false;
  }
  
  topicDiv.addEventListener("change", updateMaxQuestionsJSON);
  typeDiv.addEventListener("change", updateMaxQuestionsJSON);
  setTimeout(() => {
    const numInput = document.getElementById("numQuestions");
    if (numInput) {
      numInput.addEventListener("input", function() {
        const maxQuestions = parseInt(this.max) || allQuestions.length;
        const currentValue = parseInt(this.value) || 0;
        
        console.log(`JSON Input validation: current=${currentValue}, max=${maxQuestions}`);
        
        // Enforce minimum value (must be at least 1)
        if (currentValue < 1) {
          console.log("JSON: Value too small, setting to 1");
          this.value = 1;
        }
        
        // Enforce maximum value (cannot exceed available questions)
        if (currentValue > maxQuestions) {
          console.log(`JSON: Value too large (${currentValue} > ${maxQuestions}), setting to ${maxQuestions}`);
          this.value = maxQuestions;
        }
        
        // Call original update function
        updateMaxQuestionsJSON();
      });
      
      // Also add blur event for additional validation
      numInput.addEventListener("blur", function() {
        const maxQuestions = parseInt(this.max) || allQuestions.length;
        const currentValue = parseInt(this.value) || 0;
        
        console.log(`JSON Blur validation: current=${currentValue}, max=${maxQuestions}`);
        
        if (currentValue < 1) {
          console.log("JSON Blur: Value too small, setting to 1");
          this.value = 1;
        } else if (currentValue > maxQuestions) {
          console.log(`JSON Blur: Value too large (${currentValue} > ${maxQuestions}), setting to ${maxQuestions}`);
          this.value = maxQuestions;
        }
      });
    }
    updateMaxQuestionsJSON();
    // Initialize the Selected Types count
    if (typeof updateSelectedTypesCountJSON === 'function') {
      updateSelectedTypesCountJSON();
    }
  }, 0);
  
  // Create button container for Start Test button
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginTop = "20px";
  buttonContainer.style.textAlign = "center";
  
  // Create Reset to Defaults button
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset to Defaults";
  resetBtn.className = "custom-btn";
  resetBtn.style.marginRight = "10px";
  resetBtn.style.backgroundColor = "#f5f5f5";
  resetBtn.style.color = "#333";
  resetBtn.style.border = "1px solid #ccc";
  
  resetBtn.addEventListener("click", () => {
    // Reset all selections to defaults
    
    // Reset topics - check "All Topics" and trigger change to select all individual topics
    const topicChecks = topicDiv.querySelectorAll("input[type=checkbox]");
    topicChecks.forEach((cb, i) => {
      if (i === 0) {
        // Check "All Topics" and trigger change event to select all individual topics
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      }
    });
    
    // Reset types - check "All Types" and trigger change to select all individual types
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    typeChecks.forEach((cb, i) => {
      if (i === 0) {
        // Check "All Types" and trigger change event to select all individual types
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      }
    });
    
    // Reset explanation mode to "Both when right and wrong" (value 2)
    const expRadios = expDiv.querySelectorAll("input[name=expMode]");
    expRadios.forEach(radio => {
      radio.checked = radio.value === "2";
    });
    
    // Reset behavior options to defaults
    document.getElementById("tryAgainOption").checked = true;
    document.getElementById("topicRevealOption").checked = true;
    document.getElementById("immediateResultOption").checked = true;
    document.getElementById("correctAnswerOption").checked = true;
    
    // Update AppState with default values
    AppState.allowTryAgain = true;
    AppState.showTopicSubtopic = true;
    AppState.showImmediateResult = true;
    AppState.showCorrectAnswer = true;
    AppState.explanationMode = 2; // "Both when right and wrong"
    
    // Clear persistent saved settings to prevent restoration
    AppState.savedJsonOptions = null;
    
    // Update immediate result option state (trigger change event to apply DOM logic)
    document.getElementById("immediateResultOption").dispatchEvent(new Event('change'));
    
    // Reset number of questions to default (10 or max available)
    const maxQuestions = allQuestions.length;
    document.getElementById("numQuestions").value = Math.min(10, maxQuestions);
    
    console.log("Reset all options to defaults");
  });
  
  buttonContainer.appendChild(resetBtn);
  buttonContainer.appendChild(startBtn);
  
  // Create placeholder for "View Invalid Questions" button (will be added dynamically after validation)
  const viewInvalidBtnPlaceholder = document.createElement("span");
  viewInvalidBtnPlaceholder.id = "viewInvalidBtnContainer";
  buttonContainer.appendChild(viewInvalidBtnPlaceholder);
  
  wrapper.appendChild(topicDiv);
  wrapper.appendChild(typeDiv);
  wrapper.appendChild(expDiv);
  wrapper.appendChild(behaviorDiv);
  wrapper.appendChild(numDiv);
  wrapper.appendChild(buttonContainer);
  panel.appendChild(wrapper);
  
  // Restore previously saved options state after all event listeners are set up
  if (!skipRestore) {
    setTimeout(() => {
      restoreOptionsState();
      // Update max questions count based on restored selections by triggering change event
      setTimeout(() => {
        const panel = document.getElementById('filter-panel');
        if (panel) {
          // Trigger change event on the topic div to update max questions
          const topicDiv = panel.querySelector('.filter-section');
          if (topicDiv) {
            topicDiv.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, 50);
    }, 100);
  }
}

// ============================================================================
// DATABASE MODE TOPIC/SUBTOPIC CHECKBOX MANAGEMENT
// ============================================================================

function setupTopicSubtopicCheckboxesDb(topicDiv, updateMaxQuestions) {
  const selectAllCheckbox = topicDiv.querySelector('#select-all-topics');
  const topicCheckboxes = topicDiv.querySelectorAll('.topic-checkbox');
  const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox');

  // Select All functionality
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      const isChecked = selectAllCheckbox.checked;
      topicCheckboxes.forEach(cb => cb.checked = isChecked);
      subtopicCheckboxes.forEach(cb => cb.checked = isChecked);
      // Trigger update when select all changes
      if (typeof updateMaxQuestions === 'function') updateMaxQuestions();
    });
  }

  // Topic checkbox functionality
  topicCheckboxes.forEach(topicCb => {
    const topic = topicCb.value;
    const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
    
    topicCb.addEventListener('change', () => {
      const isChecked = topicCb.checked;
      relatedSubtopics.forEach(subtopicCb => subtopicCb.checked = isChecked);
      updateSelectAllState();
      // Trigger update when topic changes
      if (typeof updateMaxQuestions === 'function') updateMaxQuestions();
    });
  });

  // Subtopic checkbox functionality  
  subtopicCheckboxes.forEach(subtopicCb => {
    subtopicCb.addEventListener('change', () => {
      const topic = subtopicCb.dataset.topic;
      const topicCheckbox = topicDiv.querySelector(`.topic-checkbox[value="${topic}"]`);
      const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
      
      // Update parent topic checkbox based on subtopic states
      const allSubtopicsChecked = Array.from(relatedSubtopics).every(cb => cb.checked);
      const anySubtopicChecked = Array.from(relatedSubtopics).some(cb => cb.checked);
      
      topicCheckbox.checked = allSubtopicsChecked;
      topicCheckbox.indeterminate = anySubtopicChecked && !allSubtopicsChecked;
      
      updateSelectAllState();
      // Trigger update when subtopic changes
      if (typeof updateMaxQuestions === 'function') updateMaxQuestions();
    });
  });

  function updateSelectAllState() {
    if (selectAllCheckbox) {
      const allTopicsChecked = Array.from(topicCheckboxes).every(cb => cb.checked);
      const anyTopicChecked = Array.from(topicCheckboxes).some(cb => cb.checked);
      
      selectAllCheckbox.checked = allTopicsChecked;
      selectAllCheckbox.indeterminate = anyTopicChecked && !allTopicsChecked;
    }
  }
}

// Helper function to get selected topic/subtopic combinations
function getSelectedTopicSubtopics(topicDiv) {
  const selectedCombinations = [];
  const subtopicCheckboxes = topicDiv.querySelectorAll('.subtopic-checkbox:checked');
  
  subtopicCheckboxes.forEach(cb => {
    selectedCombinations.push({
      topic: cb.dataset.topic,
      subtopic: cb.value
    });
  });
  
  return selectedCombinations;
}

// Helper function to check if a question matches selected topic/subtopic criteria
function questionMatchesTopicSubtopicSelection(question, selectedCombinations) {
  return selectedCombinations.some(combo => {
    const questionSubtopic = question.subtopic || 'General';
    return question.topic === combo.topic && questionSubtopic === combo.subtopic;
  });
}