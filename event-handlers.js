/**
 * ============================================================================
 * EVENT COORDINATION MODULE
 * ============================================================================
 * 
 * Purpose:
 * This module manages all event listeners and user interactions for the
 * MockTest application, providing centralized event coordination, proper
 * cleanup mechanisms, and workflow management for both JSON and database modes.
 * 
 * Key Responsibilities:
 * • Application Event Management: Initialize and coordinate all UI event listeners
 * • File Input Handling: Manage JSON file uploads and database file selection
 * • Navigation Events: Handle button clicks for workflow navigation
 * • State Transitions: Coordinate state changes between modes (JSON/DB)
 * • Memory Management: Provide proper event listener cleanup to prevent memory leaks
 * • Workflow Coordination: Manage transitions between test states and option screens
 * 
 * Core Functions:
 * • initializeEventListeners() - Set up all application event handlers
 * • addEventListenerWithCleanup() - Track event listeners for proper cleanup
 * • removeAllEventListeners() - Clean up event listeners to prevent memory leaks
 * • handleFileInput() - Process JSON file uploads
 * • handleDatabaseSelection() - Process database file selection
 * • handleNavigationEvents() - Manage workflow navigation buttons
 * 
 * Dependencies:
 * • core-utils.js - For DOM manipulation and utility functions
 * • app-state.js - For state management and persistence
 * • database-manager.js - For database operations and initialization
 * • filter-panels.js - For building filter interfaces
 * • test-engine.js - For starting and managing tests
 * • ui-layout.js - For layout initialization
 * 
 * Technical Features:
 * • WeakMap-based event listener tracking for efficient memory management
 * • Centralized error handling for file operations
 * • Mode-aware event handling (JSON vs Database)
 * • Proper cleanup mechanisms to prevent memory leaks
 * • Coordinated state transitions with UI updates
 * • File validation and error reporting
 * 
 * Event Categories:
 * • File Operations: JSON upload, database selection
 * • Navigation: Back to start, restart test, new test, back to options
 * • Test Flow: Start test, restart with same options, new questions
 * • Layout: Window resize, DOM content loaded
 * 
 * Integration Points:
 * • Called during application initialization to set up all event handling
 * • Coordinates with all other modules for complete application functionality
 * • Manages workflow transitions and state synchronization
 * 
 * @author MockTest Application
 * @version 1.0.0
 * @since 2025-09-21
 */

// ============================================================================
// EVENT LISTENER MANAGEMENT
// ============================================================================

// Store event listeners for proper cleanup
const eventListeners = new WeakMap();

/**
 * Add event listener with cleanup tracking
 * @param {Element} element - DOM element to attach listener to
 * @param {string} event - Event type (click, change, etc.)
 * @param {Function} handler - Event handler function
 * @param {Object} options - Event listener options
 */
function addEventListenerWithCleanup(element, event, handler, options) {
  element.addEventListener(event, handler, options);
  
  if (!eventListeners.has(element)) {
    eventListeners.set(element, []);
  }
  eventListeners.get(element).push({ event, handler, options });
}

/**
 * Remove all tracked event listeners to prevent memory leaks
 */
function removeAllEventListeners() {
  // This would be called when resetting the workflow
  // In practice, removing DOM elements automatically removes their listeners
  // but this structure allows for manual cleanup if needed
  document.querySelectorAll('.question-card').forEach(card => {
    card.remove(); // This removes all associated event listeners
  });
}

// ============================================================================
// FILE HANDLING EVENTS
// ============================================================================

/**
 * Check if returning from exam mode and restore database session
 */
async function checkAndRestoreDatabaseSession() {
  const returnToOptions = sessionStorage.getItem('returnToOptions');
  
  if (returnToOptions === 'true') {
    
    // Clear the flag
    sessionStorage.removeItem('returnToOptions');
    
    try {
      // First, check for database state in sessionStorage
      const dbStateStr = sessionStorage.getItem('dbState');
      if (dbStateStr) {
        const dbState = JSON.parse(dbStateStr);
        
        
        // Restore AppState
        AppState.dbFileName = dbState.dbFileName;
        AppState.dbTopics = dbState.dbTopics;
        AppState.dbTypes = dbState.dbTypes;
        AppState.isDbMode = dbState.isDbMode;
        
        // Clear the session storage state
        sessionStorage.removeItem('dbState');
      }
      
      // Check if we have database state preserved in AppState or restored from session
      if (AppState.dbFileName && AppState.dbTopics && AppState.dbTypes) {
        
        
        // Hide the database selection guide
        const guide = document.getElementById("guide");
        if (guide) {
          guide.style.display = "none";
        }
        
        // Need to reload the database file since connection might be lost
        if (!AppState.database) {
          // ...removed debug log...
          document.getElementById("file-chosen").innerHTML = 
            `Restoring database session for <strong>${AppState.dbFileName}</strong>...`;
          
          // Show a message that we need to reload the database
          document.getElementById("file-chosen").innerHTML = 
            `Please select the database file again to continue: <strong>${AppState.dbFileName}</strong>`;
          
          // Show the guide so user can select database again
          if (guide) {
            guide.style.display = "block";
          }
          return;
        }
        
        // Restore file chosen message
        const totalQuestions = AppState.database ? 
          AppState.database.exec("SELECT COUNT(*) FROM questions")[0]?.values[0][0] || 0 : 'Unknown';
        
        document.getElementById("file-chosen").innerHTML = 
          `Database ready. Total questions: <strong>${totalQuestions}</strong>. Please select filters and number of questions.`;
        
        // Rebuild the database filter panel with existing topics and types
  // ...removed debug log...
        if (typeof buildDbFilterPanel === 'function') {
          buildDbFilterPanel(AppState.dbTopics, AppState.dbTypes, false); // Don't skip restore
        } else {
          console.error('buildDbFilterPanel function not found');
        }
        
  // ...removed debug log...
        
      } else {
        console.warn('Database state not found, showing database selection');
        // Show database selection if state is missing
        const guide = document.getElementById("guide");
        if (guide) {
          guide.style.display = "block";
        }
        document.getElementById("file-chosen").innerHTML = "";
      }
      
    } catch (error) {
      console.error('Error restoring database session:', error);
      // If restoration fails, show the guide again
      const guide = document.getElementById("guide");
      if (guide) {
        guide.style.display = "block";
      }
      document.getElementById("file-chosen").innerHTML = 
        "Error restoring session. Please select database file again.";
    }
  }
}

/**
 * Handle JSON file input and loading
 * @param {Event} e - File input change event
 */
function handleFileInput(e) {
  const file = e.target.files[0];
  if (!file) return;

  // If a test is already loaded, reset workflow instead of reload
  if (AppState.originalData !== null || AppState.questions.length > 0) {
    resetWorkflow();
  }
  
  // Don't hide the guide here - let buildFilterPanel handle it
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const raw = typeof event.target.result === 'string' ? event.target.result : '';
    const tryParse = (text) => {
      // Remove potential BOM
      const cleaned = text.replace(/^\uFEFF/, '').trim();
      return JSON.parse(cleaned);
    };
    const salvageParse = (text) => {
      // Try to extract the first valid JSON object/array substring
      const firstBrace = text.indexOf('{');
      const firstBracket = text.indexOf('[');
      let start = -1, end = -1;
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace; end = text.lastIndexOf('}');
      } else if (firstBracket !== -1) {
        start = firstBracket; end = text.lastIndexOf(']');
      }
      if (start !== -1 && end !== -1 && end > start) {
        const slice = text.slice(start, end + 1);
        return tryParse(slice);
      }
      throw new Error('Salvage parse failed');
    };
    const findQuestionsArray = (obj) => {
      if (Array.isArray(obj)) return obj;
      if (obj && typeof obj === 'object') {
        // Direct 'questions'
        if (Array.isArray(obj.questions)) return obj.questions;
        // Case-insensitive key
        const qKey = Object.keys(obj).find(k => k.toLowerCase() === 'questions');
        if (qKey) {
          const v = obj[qKey];
          if (Array.isArray(v)) return v;
          if (typeof v === 'string') {
            try { const parsed = JSON.parse(v); if (Array.isArray(parsed)) return parsed; } catch(_) {}
          }
        }
        // Nested common containers
        for (const key of ['data', 'payload', 'result']) {
          if (obj[key]) {
            const nested = findQuestionsArray(obj[key]);
            if (nested) return nested;
          }
        }
      }
      return null;
    };
    try {
      let data;
      try {
        data = tryParse(raw);
      } catch (e1) {
        console.warn('Primary JSON.parse failed, attempting salvage parse...');
        data = salvageParse(raw);
      }
      // Support array-root JSON by wrapping
      if (Array.isArray(data)) {
        data = { title: file.name.replace(/\.json$/i,'') || 'Imported Test', questions: data };
      }
      const questionsArr = findQuestionsArray(data);
      if (!questionsArr) {
        throw new Error('JSON must have a top-level "questions" array or be an array of questions.');
      }
      // Normalize to expected structure
      data = { title: data.title || file.name.replace(/\.json$/i,'') || 'Imported Test', questions: questionsArr };
      AppState.originalData = data;
      AppState.isDbMode = false; // Set JSON mode flag
      const chosen = document.getElementById('file-chosen');
      if (chosen) {
        chosen.innerHTML = `✅ Test loaded: <strong>${data.title || file.name}</strong>`;
      }
      // Reset options to defaults after successful JSON loading
      if (typeof resetOptionsToDefaults === 'function') {
        resetOptionsToDefaults();
      }
      // Go to JSON options screen
      buildFilterPanel(data.questions);
    } catch (err) {
      console.error('JSON import failed:', err);
  // ...removed debug alert...
    }
  };
  reader.readAsText(file);
  e.target.value = ""; // allow re-selecting the same file again
}

/**
 * Handle database file selection
 */
async function handleDatabaseSelection() {
  // Ensure SQL.js is loaded before proceeding
  try {
    await loadSQLJS();
  } catch (error) {
  // ...removed debug alert...
    return;
  }
  
  // Prompt user to select the SQLite DB file
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".db";
  input.style.display = "none";
  document.body.appendChild(input);
  input.click();
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      // Keep guide visible if no file was selected
      document.body.removeChild(input);
      return;
    }
    
    // Clear all DOMs and reset state only after file is selected
    document.getElementById("test").innerHTML = "";
    document.getElementById("scoreboard").innerHTML = "";
    document.getElementById("restart").style.display = "none";
    document.getElementById("restart-bottom").style.display = "none";
    document.getElementById("newtest").style.display = "none";
    document.getElementById("file-chosen").innerHTML = "";
    document.getElementById("filter-panel").innerHTML = "";
    
    // Don't hide the guide here - let buildDbFilterPanel handle it
    
    // Store the database filename
    AppState.dbFileName = file.name;
    
    document.getElementById("file-chosen").innerHTML = "Loading database file...";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const SQL = await initSqlJs({ locateFile: fileName => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${fileName}` });
      
      // Close existing database connection if it exists
      if (AppState.database) {
  // ...removed debug log...
        AppState.database.close();
        AppState.database = null;
      }
      
      // Create new database connection
      AppState.database = new SQL.Database(new Uint8Array(arrayBuffer));
      AppState.isDbMode = true; // Set database mode flag
      document.getElementById("file-chosen").innerHTML = "Database loaded. Fetching topics and question types...";
      
      // Fetch topics and types
      const topicsRes = AppState.database.exec("SELECT DISTINCT topic FROM questions");
      const typesRes = AppState.database.exec("SELECT DISTINCT question_type FROM questions");
      const countRes = AppState.database.exec("SELECT COUNT(*) FROM questions");
      const totalQuestions = countRes[0]?.values[0][0] || 0;
      const topics = topicsRes[0]?.values.map(v => v[0]) || [];
      const allTypes = typesRes[0]?.values.map(v => v[0]) || [];
      
      // Debug: Show what types were found
  // ...removed debug logs...
      
      // Remove the filter that was excluding 'Cohort-05-Match' - let's include all types
      const types = allTypes.filter(type => type && type.trim() !== ''); // Only filter out empty/null types
      
  // ...removed debug logs...
      
      // Store for later use when going back to options
      AppState.dbTopics = topics;
      AppState.dbTypes = types;
      
      if (topics.length === 0 || types.length === 0) {
        document.getElementById("file-chosen").innerHTML = "No topics or question types found in the database.";
        return;
      }
      document.getElementById("file-chosen").innerHTML = `Database ready. Total questions: <strong>${totalQuestions}</strong>. Please select filters and number of questions.`;
      
      // Check if this is a restoration scenario (user returning from exam mode)
      const isRestoringFromExam = AppState.dbFileName === file.name && 
                                  AppState.dbTopics && 
                                  AppState.dbTopics.length > 0;
      
      if (isRestoringFromExam) {
  // ...removed debug log...
        // Don't reset options to defaults - keep existing settings
        // Build database filter panel and allow restoration of previous settings
        buildDbFilterPanel(topics, types, false); // false = allow restoration
      } else {
  // ...removed debug log...
        // Reset options to defaults after successful database loading
        resetOptionsToDefaults();
        // Build database filter panel, skip restore to ensure all types are checked by default
        buildDbFilterPanel(topics, types, true); // true = skip restoration
      }
    } catch (err) {
      document.getElementById("file-chosen").innerHTML = "Error loading database: " + err.message;
    }
    document.body.removeChild(input);
  };
}

// ============================================================================
// NAVIGATION EVENT HANDLERS
// ============================================================================

/**
 * Handle back to start page navigation
 */
function handleBackToStartPage() {
  resetWorkflow();
}

/**
 * Handle test restart with same questions
 */
function handleTestRestart() {
  // Use last filters and explanation mode for restart
  if (AppState.lastFilteredQuestions && AppState.lastFilteredQuestions.length > 0) {
    AppState.explanationMode = AppState.lastExplanationMode;
    startTest(AppState.lastFilteredQuestions);
  } else {
    startTest(AppState.originalData.questions);
  }
}

/**
 * Handle back to options navigation
 */
function handleBackToOptions() {
  // Clear test area and scoreboard but keep filter panel
  document.getElementById("test").innerHTML = "";
  document.getElementById("scoreboard").innerHTML = "";
  
  // Hide test-specific buttons
  document.getElementById("restart").style.display = "none";
  document.getElementById("restart-bottom").style.display = "none";
  document.getElementById("backToOptions").style.display = "none";
  document.getElementById("backToOptions-bottom").style.display = "none";
  document.getElementById("newTestSameOptions").style.display = "none";
  document.getElementById("newTestSameOptions-bottom").style.display = "none";
  document.getElementById("newtest").style.display = "none";
  
  // Reset the title - preserve logo using utility function
  updateHeaderTitle();
  
  // Show appropriate message based on mode
  if (AppState.isDbMode) {
    // For database mode, show the ready message with total questions
    const totalQuestions = AppState.dbTotalQuestions || "Unknown";
    document.getElementById("file-chosen").innerHTML = `Database ready. Total questions: <strong>${totalQuestions}</strong>. Please select filters and number of questions.`;
    
    // Rebuild the filter panel if we have the data
    if (AppState.dbTopics && AppState.dbTypes) {
      buildDbFilterPanel(AppState.dbTopics, AppState.dbTypes, false); // Allow restore during construction
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
    } else {
      // Fallback: fetch topics and types again
      try {
        const topicsRes = AppState.database.exec("SELECT DISTINCT topic FROM questions");
        const typesRes = AppState.database.exec("SELECT DISTINCT question_type FROM questions");
        const topics = topicsRes[0]?.values.map(v => v[0]) || [];
        const types = typesRes[0]?.values.map(v => v[0]) || [];
        AppState.dbTopics = topics;
        AppState.dbTypes = types;
        buildDbFilterPanel(topics, types, false); // Allow restore during construction
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
      } catch (err) {
        document.getElementById("file-chosen").innerHTML = "Error rebuilding filter panel: " + err.message;
      }
    }
  } else {
    // For JSON mode, show file loaded message
    const totalQuestions = AppState.originalData?.questions?.length || "Unknown";
    document.getElementById("file-chosen").innerHTML = `File loaded. Total questions: <strong>${totalQuestions}</strong>. Please select filters and number of questions.`;
    
    // Rebuild the filter panel for JSON mode
    if (AppState.originalData && AppState.originalData.questions) {
      buildFilterPanel(AppState.originalData.questions, false); // Allow restore during construction
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
    }
  }
  
  // Scroll to top to show the filter panel
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Handle new test with same options
 */
function handleNewTestSameOptions() {
  // Start a new test with the same filters but different question selection
  if (AppState.isDbMode) {
    // For database mode, re-run the database query to get a new set of questions
    rerunDatabaseTest();
  } else {
    // For JSON mode, restart with the same filters (questions will be reshuffled)
    if (AppState.lastFilteredQuestions && AppState.lastFilteredQuestions.length > 0) {
      AppState.explanationMode = AppState.lastExplanationMode;
      startTest(AppState.lastFilteredQuestions);
    } else {
      startTest(AppState.originalData.questions);
    }
  }
}

/**
 * Handle new test navigation (complete reset)
 */
function handleNewTest() {
  document.getElementById("test").innerHTML = "";
  document.getElementById("scoreboard").innerHTML = "";
  document.getElementById("restart").style.display = "none";
  document.getElementById("restart-bottom").style.display = "none";
  document.getElementById("backToOptions").style.display = "none";
  document.getElementById("backToOptions-bottom").style.display = "none";
  document.getElementById("newTestSameOptions").style.display = "none";
  document.getElementById("newTestSameOptions-bottom").style.display = "none";
  document.getElementById("newtest").style.display = "none";
  document.getElementById("file-chosen").innerHTML = "";
  document.getElementById("filter-panel").innerHTML = "";
  resetWorkflow();
}

// ============================================================================
// MAIN EVENT INITIALIZATION
// ============================================================================

// ============================================================================
// INITIALIZATION EVENT HANDLERS
// ============================================================================

/**
 * Check if returning from exam mode and restore database session
 */
async function checkAndRestoreDatabaseSession() {
  // Simplified - just clear any flags without complex restoration
  sessionStorage.removeItem('returnToOptions');
  sessionStorage.removeItem('dbState');
}

/**
 * Initialize all application event listeners
 * This is the main entry point for event coordination
 */
function initializeEventListeners() {
  // Check if returning from exam mode and restore database session
  checkAndRestoreDatabaseSession();
  
  // File input event listener for JSON files
  document.getElementById("fileInput").addEventListener("change", handleFileInput);
  
  // Choose DB button event listener
  document.getElementById("chooseDb").addEventListener("click", handleDatabaseSelection);
  
  // Back to Start Page button event listener
  document.getElementById("backToStartFromOptions").addEventListener("click", handleBackToStartPage);
  
  // Restart button event listeners
  document.getElementById("restart").addEventListener("click", handleTestRestart);
  document.getElementById("restart-bottom").addEventListener("click", handleTestRestart);

  // Back to Options button event listeners
  document.getElementById("backToOptions").addEventListener("click", handleBackToOptions);
  document.getElementById("backToOptions-bottom").addEventListener("click", handleBackToOptions);

  // New Test Same Options button event listeners
  document.getElementById("newTestSameOptions").addEventListener("click", handleNewTestSameOptions);
  document.getElementById("newTestSameOptions-bottom").addEventListener("click", handleNewTestSameOptions);

  // New Test button event listener
  document.getElementById("newtest").addEventListener("click", handleNewTest);
  
  // Page unload cleanup - ensure database connections are closed
  window.addEventListener("beforeunload", function(e) {
    // If an intentional exam exit/navigation is in progress, skip any extra work
    if (window.__examExitInProgress) {
      return; // Do not interfere
    }
    if (AppState.database) {
      try {
        AppState.database.close();
  // ...removed debug log...
      } catch (error) {
        console.warn("Error closing database on page unload:", error);
      }
    }
  });
  
  // Initialize layout system
  initializeLayoutSystem();
  
  // ...removed debug log...
}