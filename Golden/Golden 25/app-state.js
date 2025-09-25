/**
 * ====================================================================
 * APPLICATION STATE MODULE
 * ====================================================================
 * 
 * Purpose: Centralized state management and persistence for InsightPrep MockTest
 * 
 * This module provides comprehensive state management functionality for the
 * MockTest application. It serves as the single source of truth for all
 * application state and handles state persistence across user sessions.
 * 
 * Key Responsibilities:
 * 
 * 1. GLOBAL STATE MANAGEMENT:
 *    - Application configuration and runtime state
 *    - Test session data (questions, scores, results)
 *    - User preferences and behavior options
 *    - Database connection and query state
 * 
 * 2. STATE PERSISTENCE:
 *    - Save/restore user options for JSON and Database modes
 *    - Maintain filter selections across sessions
 *    - Preserve behavior settings and preferences
 * 
 * 3. SESSION MANAGEMENT:
 *    - Test execution state tracking
 *    - Question results and scoring history
 *    - Last used filters and configuration
 * 
 * 4. CONFIGURATION MANAGEMENT:
 *    - Test behavior options (Try Again, Immediate Results, etc.)
 *    - UI preferences (Topic/Subtopic display, Answer reveal)
 *    - Explanation modes and display settings
 * 
 * 5. WORKFLOW CONTROL:
 *    - Application reset and cleanup
 *    - Event listener management
 *    - Memory leak prevention
 * 
 * State Categories:
 * - Test Data: Questions, answers, scoring
 * - User Preferences: Behavior options, display settings
 * - Database State: Connection, query parameters, metadata
 * - UI State: Filter selections, mode tracking
 * - Persistence: Saved states for different modes
 * 
 * Dependencies: core-utils.js (DOM manipulation functions)
 * Used by: All application modules that need state access
 * 
 * Author: InsightPrep Development Team
 * Version: 2.0.0
 * Last Updated: September 2025
 * ====================================================================
 */

// ============================================
// GLOBAL APPLICATION STATE
// ============================================

/**
 * Central application state object containing all runtime data
 * and configuration settings for the MockTest application
 */
const AppState = {
  // Test execution state
  questions: [],
  originalData: null,
  score: 0,
  questionResults: [], // Track correct/incorrect for each question
  
  // Configuration state
  explanationMode: 1,
  lastExplanationMode: 1,
  
  // Database state
  database: null,
  isDbMode: false,
  dbTotalQuestions: 0,
  dbTopics: null,
  dbTypes: null,
  dbFileName: null,
  lastDbQueryParams: null,
  
  // Filter and session state
  lastFilteredQuestions: null,
  
  // Test behavior options with sensible defaults
  allowTryAgain: true,
  showTopicSubtopic: true,
  showImmediateResult: true,
  showCorrectAnswer: true,
  
  // Persistent option states for different modes
  savedJsonOptions: null,
  savedDbOptions: null,
  
  // Invalid questions tracking for refresh functionality
  storedInvalidQuestions: null,
  currentInvalidQuestions: null,
  lastQueryAllQuestions: null,
  
  /**
   * Resets all state variables to their initial values
   * Used when starting a new session or switching modes
   */
  reset() {
    this.questions = [];
    this.originalData = null;
    this.score = 0;
    this.explanationMode = 2;
    this.database = null;
    this.lastFilteredQuestions = null;
    this.lastExplanationMode = 2;
    this.lastDbQueryParams = null;
    this.isDbMode = false;
    this.dbTotalQuestions = 0;
    this.dbTopics = null;
    this.dbTypes = null;
    this.dbFileName = null;
    this.questionResults = [];
    
    // Reset behavior options to defaults
    this.allowTryAgain = true;
    this.showTopicSubtopic = true;
    this.showImmediateResult = true;
    this.showCorrectAnswer = true;
    
    // Clear persistent saved settings
    this.savedJsonOptions = null;
    this.savedDbOptions = null;
    this.storedInvalidQuestions = null;
    this.currentInvalidQuestions = null;
    this.lastQueryAllQuestions = null;
  }
};

// ============================================
// STATE PERSISTENCE FUNCTIONS
// ============================================

/**
 * Saves current form state and user preferences
 * Automatically detects mode (JSON vs Database) and saves accordingly
 */
function saveOptionsState() {
  // Auto-detect mode based on the presence of DB-specific elements
  const isDbMode = !!document.getElementById('select-all-topics-db') || AppState.isDbMode;
  
  const state = {
    selectedTopics: [],
    selectedSubtopics: [],
    selectedTypes: [],
    explanationMode: 1,
    behaviorOptions: {
      allowTryAgain: true,
      showTopicSubtopic: true,
      showImmediateResult: true,
      showCorrectAnswer: true
    },
    numQuestions: 10,
    selectionMode: 'random', // Only for DB mode
    testMode: 'learning' // Default to learning mode
  };
  
  // Get current form values
  const panel = document.getElementById("filter-panel");
  if (!panel) return;
  
  // Save topic/subtopic selections
  const selectAllTopics = panel.querySelector(isDbMode ? '#select-all-topics-db' : '#select-all-topics');
  if (selectAllTopics) {
    state.allTopicsSelected = selectAllTopics.checked;
  }
  
  // Always save individual selections for fallback
  const topicCheckboxes = panel.querySelectorAll('.topic-checkbox');
  topicCheckboxes.forEach(cb => {
    if (cb.checked) state.selectedTopics.push(cb.value);
  });
  
  const subtopicCheckboxes = panel.querySelectorAll('.subtopic-checkbox');
  subtopicCheckboxes.forEach(cb => {
    if (cb.checked) {
      state.selectedSubtopics.push({
        topic: cb.dataset.topic,
        subtopic: cb.value
      });
    }
  });
  
  // Save type selections - look in the type section specifically
  const typeSection = panel.querySelector('.filter-section h3');
  let typeSectionDiv = null;
  const allSections = panel.querySelectorAll('.filter-section');
  for (let section of allSections) {
    const h3 = section.querySelector('h3');
    if (h3 && h3.textContent.includes('Question Types')) {
      typeSectionDiv = section;
      break;
    }
  }
  
  if (typeSectionDiv) {
    const typeCheckboxes = typeSectionDiv.querySelectorAll('input[type="checkbox"]');
    const allTypesCheckbox = Array.from(typeCheckboxes).find(cb => cb.value === 'ALL');
    if (allTypesCheckbox) {
      state.allTypesSelected = allTypesCheckbox.checked;
    }
    
    // Save individual type selections
    typeCheckboxes.forEach(cb => {
      if (cb.checked && cb.value !== 'ALL') {
        state.selectedTypes.push(cb.value);
      }
    });
  }
  
  // Save explanation mode
  const expRadio = panel.querySelector('input[name="expMode"]:checked');
  if (expRadio) {
    state.explanationMode = parseInt(expRadio.value);
  }
  
  // Save behavior options
  const tryAgainId = isDbMode ? 'tryAgainOptionDb' : 'tryAgainOption';
  const topicRevealId = isDbMode ? 'topicRevealOptionDb' : 'topicRevealOption';
  const immediateResultId = isDbMode ? 'immediateResultOptionDb' : 'immediateResultOption';
  const correctAnswerId = isDbMode ? 'correctAnswerOptionDb' : 'correctAnswerOption';
  
  const tryAgainCb = document.getElementById(tryAgainId);
  const topicRevealCb = document.getElementById(topicRevealId);
  const immediateResultCb = document.getElementById(immediateResultId);
  const correctAnswerCb = document.getElementById(correctAnswerId);
  
  if (tryAgainCb) state.behaviorOptions.allowTryAgain = tryAgainCb.checked;
  if (topicRevealCb) state.behaviorOptions.showTopicSubtopic = topicRevealCb.checked;
  if (immediateResultCb) state.behaviorOptions.showImmediateResult = immediateResultCb.checked;
  if (correctAnswerCb) state.behaviorOptions.showCorrectAnswer = correctAnswerCb.checked;
  
  // Save number of questions
  const numInput = document.getElementById('numQuestions');
  if (numInput) {
    state.numQuestions = parseInt(numInput.value) || 10;
  }
  
  // Save selection mode (DB only)
  if (isDbMode) {
    const selectionModeRadio = panel.querySelector('input[name="selectionMode"]:checked');
    if (selectionModeRadio) {
      state.selectionMode = selectionModeRadio.value;
    }
  }
  
  // Save test mode
  const testModeRadio = panel.querySelector('input[name="testMode"]:checked');
  if (testModeRadio) {
    state.testMode = testModeRadio.value;
  }
  
  // Store the state
  if (isDbMode) {
    AppState.savedDbOptions = state;
  } else {
    AppState.savedJsonOptions = state;
  }
  
  console.log(`Saved ${isDbMode ? 'DB' : 'JSON'} options state:`, state);
}

/**
 * Restores previously saved options state
 * Automatically detects mode and restores appropriate settings
 * @returns {boolean} True if state was restored, false if no saved state exists
 */
function restoreOptionsState() {
  // Auto-detect mode based on the presence of DB-specific elements
  const isDbMode = !!document.getElementById('select-all-topics-db') || AppState.isDbMode;
  const state = isDbMode ? AppState.savedDbOptions : AppState.savedJsonOptions;
  
  if (!state) {
    console.log(`No saved ${isDbMode ? 'DB' : 'JSON'} options to restore`);
    return false;
  }
  
  console.log(`Restoring ${isDbMode ? 'DB' : 'JSON'} options state:`, state);
  
  // Wait for DOM to be ready
  setTimeout(() => {
    const panel = document.getElementById("filter-panel");
    if (!panel) return;
    
    // Restore topic/subtopic selections
    if (state.allTopicsSelected !== undefined && state.allTopicsSelected) {
      // If "All Topics" was selected, just check that and let it handle the rest
      const selectAllTopics = panel.querySelector(isDbMode ? '#select-all-topics-db' : '#select-all-topics');
      if (selectAllTopics) {
        selectAllTopics.checked = true;
        // Trigger change event to update child checkboxes
        selectAllTopics.dispatchEvent(new Event('change'));
      }
    } else if (state.selectedSubtopics && state.selectedSubtopics.length > 0) {
      // Restore individual subtopic selections
      const selectAllTopics = panel.querySelector(isDbMode ? '#select-all-topics-db' : '#select-all-topics');
      if (selectAllTopics) {
        selectAllTopics.checked = false; // Uncheck "All Topics" first
      }
      
      // Uncheck all first
      const allCheckboxes = panel.querySelectorAll('.topic-checkbox, .subtopic-checkbox');
      allCheckboxes.forEach(cb => cb.checked = false);
      
      // Then check only the saved selections
      const subtopicCheckboxes = panel.querySelectorAll('.subtopic-checkbox');
      subtopicCheckboxes.forEach(cb => {
        const isSelected = state.selectedSubtopics.some(s => 
          s.topic === cb.dataset.topic && s.subtopic === cb.value
        );
        if (isSelected) {
          cb.checked = true;
        }
      });
      
      // Update parent topic checkboxes based on subtopic states
      const topicCheckboxes = panel.querySelectorAll('.topic-checkbox');
      topicCheckboxes.forEach(topicCb => {
        const topic = topicCb.value;
        const relatedSubtopics = panel.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
        const checkedSubtopics = Array.from(relatedSubtopics).filter(cb => cb.checked);
        
        if (checkedSubtopics.length === relatedSubtopics.length) {
          topicCb.checked = true;
          topicCb.indeterminate = false;
        } else if (checkedSubtopics.length > 0) {
          topicCb.checked = false;
          topicCb.indeterminate = true;
        } else {
          topicCb.checked = false;
          topicCb.indeterminate = false;
        }
      });
    }
    
    // Restore type selections - find the type section specifically
    const typeSections = panel.querySelectorAll('.filter-section');
    let typeSectionDiv = null;
    for (let section of typeSections) {
      const h3 = section.querySelector('h3');
      if (h3 && h3.textContent.includes('Question Types')) {
        typeSectionDiv = section;
        break;
      }
    }
    
    if (typeSectionDiv) {
      if (state.allTypesSelected !== undefined && state.allTypesSelected) {
        const allTypesCheckbox = typeSectionDiv.querySelector('input[value="ALL"]');
        if (allTypesCheckbox) {
          allTypesCheckbox.checked = true;
          // Trigger change event
          allTypesCheckbox.dispatchEvent(new Event('change'));
        }
      } else if (state.selectedTypes && state.selectedTypes.length > 0) {
        // Restore individual type selections
        const typeCheckboxes = typeSectionDiv.querySelectorAll('input[type="checkbox"]');
        typeCheckboxes.forEach(cb => {
          if (cb.value === 'ALL') {
            cb.checked = false; // Uncheck "All" if individual selections exist
          } else {
            cb.checked = state.selectedTypes.includes(cb.value);
          }
        });
      }
    }
    
    // Restore explanation mode
    const expRadios = panel.querySelectorAll('input[name="expMode"]');
    expRadios.forEach(radio => {
      radio.checked = (parseInt(radio.value) === state.explanationMode);
    });
    
    // Restore behavior options
    const tryAgainId = isDbMode ? 'tryAgainOptionDb' : 'tryAgainOption';
    const topicRevealId = isDbMode ? 'topicRevealOptionDb' : 'topicRevealOption';
    const immediateResultId = isDbMode ? 'immediateResultOptionDb' : 'immediateResultOption';
    const correctAnswerId = isDbMode ? 'correctAnswerOptionDb' : 'correctAnswerOption';
    
    const tryAgainCb = document.getElementById(tryAgainId);
    const topicRevealCb = document.getElementById(topicRevealId);
    const immediateResultCb = document.getElementById(immediateResultId);
    const correctAnswerCb = document.getElementById(correctAnswerId);
    
    if (tryAgainCb) tryAgainCb.checked = state.behaviorOptions.allowTryAgain;
    if (topicRevealCb) topicRevealCb.checked = state.behaviorOptions.showTopicSubtopic;
    if (immediateResultCb) {
      immediateResultCb.checked = state.behaviorOptions.showImmediateResult;
      // Trigger change event to update dependent options
      immediateResultCb.dispatchEvent(new Event('change'));
    }
    if (correctAnswerCb) correctAnswerCb.checked = state.behaviorOptions.showCorrectAnswer;
    
    // Restore number of questions
    const numInput = document.getElementById('numQuestions');
    if (numInput && state.numQuestions) {
      numInput.value = state.numQuestions;
      // Force update to override any automatic updates
      setTimeout(() => {
        numInput.value = state.numQuestions;
      }, 50);
    }
    
    // Restore selection mode (DB only)
    if (isDbMode && state.selectionMode) {
      const selectionModeRadios = panel.querySelectorAll('input[name="selectionMode"]');
      selectionModeRadios.forEach(radio => {
        radio.checked = (radio.value === state.selectionMode);
      });
    }
  }, 10); // Minimal timeout to ensure DOM is ready
  
  return true;
}

// ============================================
// WORKFLOW MANAGEMENT
// ============================================

/**
 * Placeholder for event listener cleanup
 * To be implemented when event management is separated
 */
function removeAllEventListeners() {
  // This will be implemented when event-handlers.js is created
  console.log("Event listeners cleanup - to be implemented");
}

/**
 * Completely resets the application workflow and state
 * Cleans up resources, closes connections, and returns to initial state
 */
function resetWorkflow() {
  // Close database connection if it exists
  if (AppState.database) {
    try {
      AppState.database.close();
      console.log("Database connection closed");
    } catch (error) {
      console.warn("Error closing database connection:", error);
    }
  }
  
  // Clear all state
  AppState.reset();
  
  // Remove event listeners to prevent memory leaks
  removeAllEventListeners();

  // Clear DOM safely (requires core-utils.js)
  if (typeof clearElement === 'function') {
    clearElement(document.getElementById("test"));
    clearElement(document.getElementById("scoreboard"));
    clearElement(document.getElementById("filter-panel"));
  }
  
  document.getElementById("restart").style.display = "none";
  document.getElementById("restart-bottom").style.display = "none";
  document.getElementById("newtest").style.display = "none";
  
  // Hide all extra buttons on start page (only show Choose JSON and Choose DB)
  const backToStartButton = document.getElementById("backToStartFromOptions");
  const backToOptionsButton = document.getElementById("backToOptions");
  const newQuestionsButton = document.getElementById("newTestSameOptions");
  
  if (backToStartButton) {
    backToStartButton.style.display = "none";
  }
  if (backToOptionsButton) {
    backToOptionsButton.style.display = "none";
  }
  if (newQuestionsButton) {
    newQuestionsButton.style.display = "none";
  }
  
  // Clear status text (requires core-utils.js)
  if (typeof setTextContent === 'function') {
    setTextContent(document.getElementById("file-chosen"), "");
  }
  
  // Show file selection buttons again on start page
  const chooseJsonLabel = document.querySelector('label[for="fileInput"]');
  const chooseDbButton = document.getElementById("chooseDb");
  if (chooseJsonLabel) {
    chooseJsonLabel.style.display = "inline-block";
  }
  if (chooseDbButton) {
    chooseDbButton.style.display = "inline-block";
  }
  
  // Show the how-to-use guide when resetting
  const guideElement = document.getElementById("how-to-use-guide");
  if (guideElement) {
    guideElement.style.display = "block";
  }
}

/**
 * Reset options to defaults after loading new data source
 * Clears persistent saved settings and resets AppState to default values
 */
function resetOptionsToDefaults() {
  // Clear persistent saved settings to prevent restoration
  AppState.savedJsonOptions = null;
  AppState.savedDbOptions = null;
  
  // Reset AppState to default values
  AppState.allowTryAgain = true;
  AppState.showTopicSubtopic = true;
  AppState.showImmediateResult = true;
  AppState.showCorrectAnswer = true;
  AppState.explanationMode = 2; // "Both when right and wrong"
  
  console.log("Reset all options to defaults after loading new data source");
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Sets the current year in the copyright footer
 * Runs immediately when module loads
 */
(function initializeCopyright() {
  const copyrightYearElement = document.getElementById('swamys-copyright-year');
  if (copyrightYearElement) {
    copyrightYearElement.textContent = new Date().getFullYear();
  }
})();