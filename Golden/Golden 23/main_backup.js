/**
 * ============================================
 * MAIN APPLICATION COORDINATOR
 * ============================================
 * 
 * Purpose:
 * This is the main entry point and coordinator for the MockTest application.
 * It handles application initialization, DOM setup, and high-level coordination
 * between all application modules.
 * 
 * Key Responsibilities:
 * - Initialize the application after DOM content is loaded
 * - Set up copyright year and initial UI state
 * - Coordinate between all application modules
 * - Handle application-level error management
 * - Manage the overall application lifecycle
 * 
 * Dependencies:
 * - core-utils.js: Foundation utilities and library loading
 * - app-state.js: Application state management
 * - database-manager.js: Database operations
 * - ui-layout.js: UI layout and positioning
 * - test-engine.js: Test execution and scoring
 * - filter-panels.js: Filter panel construction and validation
 * - database-filter-panel.js: Database-specific filtering
 * - event-handlers.js: Event coordination and user interactions
 * 
 * Technical Features:
 * - Modular architecture with clear separation of concerns
 * - Centralized error handling and logging
 * - Graceful degradation when modules fail to load
 * - Automatic library loading and initialization
 * - Copyright year auto-update
 * 
 * Note: This file should contain minimal code - most functionality
 * has been extracted to specialized modules for better maintainability.
 * ============================================
 */

// ============================================
// APPLICATION INITIALIZATION
// ============================================
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
      
      // Store the state
      if (isDbMode) {
        AppState.savedDbOptions = state;
      } else {
        AppState.savedJsonOptions = state;
      }
      
      console.log(`Saved ${isDbMode ? 'DB' : 'JSON'} options state:`, state);
    }
    
    // Restore options state
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

    // Set copyright year in footer
    (function initializeCopyright() {
      const copyrightYearElement = document.getElementById('swamys-copyright-year');
      if (copyrightYearElement) {
        copyrightYearElement.textContent = new Date().getFullYear();
      }
    })();

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

      // Clear DOM safely
      clearElement(document.getElementById("test"));
      clearElement(document.getElementById("scoreboard"));
      clearElement(document.getElementById("filter-panel"));
      
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
      
      setTextContent(document.getElementById("file-chosen"), "");
      
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

    // ============================================
    // SECURE DATABASE OPERATIONS
    // ============================================
    
    // Secure SQL query execution with parameter binding
    function executeSecureQuery(database, query, params = []) {
      try {
        const stmt = database.prepare(query);
        const result = stmt.getAsObject(params);
        stmt.free();
        return result;
      } catch (error) {
        console.error('Database query error:', error);
        throw new Error('Database operation failed');
      }
    }
    
    // Secure query for multiple results
    function executeSecureQueryAll(database, query, params = []) {
      try {
        const stmt = database.prepare(query);
        const results = [];
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      } catch (error) {
        console.error('Database query error:', error);
        throw new Error('Database operation failed');
      }
    }
    
    // Escape and validate string inputs for SQL
    function escapeSQL(value) {
      if (typeof value !== 'string') return value;
      return value.replace(/'/g, "''");
    }
    
    // Validate database inputs
    function validateDatabaseInput(input, allowedValues = null) {
      if (allowedValues && !allowedValues.includes(input)) {
        throw new Error('Invalid database input');
      }
      return escapeSQL(input);
    }

    // ============================================
    // MEMORY MANAGEMENT & CLEANUP
    // ============================================
    
    // Store event listeners for proper cleanup
    const eventListeners = new WeakMap();
    
    function addEventListenerWithCleanup(element, event, handler, options) {
      element.addEventListener(event, handler, options);
      
      if (!eventListeners.has(element)) {
        eventListeners.set(element, []);
      }
      eventListeners.get(element).push({ event, handler, options });
    }
    
    function removeAllEventListeners() {
      // This would be called when resetting the workflow
      // In practice, removing DOM elements automatically removes their listeners
      // but this structure allows for manual cleanup if needed
      document.querySelectorAll('.question-card').forEach(card => {
        card.remove(); // This removes all associated event listeners
      });
    }

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    // ============================================
    // HTML SANITIZATION & DOM UTILITIES
    // ============================================
    
    // Sanitize text content to prevent XSS attacks
    function sanitizeText(text) {
      if (typeof text !== 'string') return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    // Safe way to set text content (no HTML injection)
    function setTextContent(element, text) {
      element.textContent = text || '';
    }
    
    // Safe way to create elements with text content
    function createElement(tagName, textContent = '', className = '') {
      const element = document.createElement(tagName);
      if (textContent) setTextContent(element, textContent);
      if (className) element.className = className;
      return element;
    }
    
    // Efficient DOM updates using DocumentFragment
    function appendMultipleElements(parent, elements) {
      const fragment = document.createDocumentFragment();
      elements.forEach(element => fragment.appendChild(element));
      parent.appendChild(fragment);
    }
    
    // Clear element content safely
    function clearElement(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }

    // ============================================
    // REUSABLE MATCH QUESTION RENDERER
    // ============================================
    function createMatchQuestion(question, questionDiv, questionIndex) {
      const keys = Object.keys(question.matchPairs);
      const values = shuffle(Object.values(question.matchPairs));
      
      const table = createElement("div", "", "match-table");
      const selects = [];
      
      keys.forEach(key => {
        const row = createElement("div", "", "match-row");
        const leftCell = createElement("div", key, "match-cell");
        const rightCell = createElement("div", "", "match-cell");
        
        const select = document.createElement("select");
        
        // Add placeholder option
        const placeholder = document.createElement("option");
        placeholder.value = "";
        setTextContent(placeholder, "<Select One>");
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
        
        // Add value options
        values.forEach(value => {
          const option = document.createElement("option");
          option.value = value;
          setTextContent(option, value);
          select.appendChild(option);
        });
        
        rightCell.appendChild(select);
        appendMultipleElements(row, [leftCell, rightCell]);
        table.appendChild(row);
        
        selects.push(select);
      });
      
      questionDiv.appendChild(table);
      
      // Create submit button
      const submitBtn = createElement("button", "Submit Matches");
      submitBtn.title = "Submit your selected matches for this question. Match each item on the left to the correct option on the right.";
      submitBtn.disabled = true;
      
      // Enable submit button when all selections are made
      selects.forEach(select => {
        select.addEventListener("change", function handleSelectChange() {
          const allFilled = selects.every(s => s.value !== "");
          submitBtn.disabled = !allFilled;
        });
      });
      
      // Handle submit
      submitBtn.addEventListener("click", function handleMatchSubmit() {
        const userMatches = {};
        keys.forEach((key, index) => {
          userMatches[key] = selects[index].value;
        });
        handleAnswer(question, userMatches, questionDiv, questionIndex);
      });
      
      questionDiv.appendChild(submitBtn);
    }

    // Utility function to reset options to defaults after loading new data source
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
        
        startBtn.disabled = (maxQuestions < 1 || parseInt(numInput.value) < 1 || parseInt(numInput.value) > maxQuestions);
        
        // Reset the flag
        updateMaxQuestionsJSON.isUpdating = false;
      }
      topicDiv.addEventListener("change", updateMaxQuestionsJSON);
      typeDiv.addEventListener("change", updateMaxQuestionsJSON);
      setTimeout(() => {
        const numInput = document.getElementById("numQuestions");
        if (numInput) numInput.addEventListener("input", updateMaxQuestionsJSON);
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
        
        // Reset topics - check "All Topics"
        const topicChecks = topicDiv.querySelectorAll("input[type=checkbox]");
        topicChecks.forEach((cb, i) => {
          cb.checked = i === 0; // Only check "All Topics"
        });
        
        // Reset types - check "All Types"
        const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
        typeChecks.forEach((cb, i) => {
          cb.checked = i === 0; // Only check "All Types"
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

    function buildDbFilterPanel(topics, types, skipRestore = false) {
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
      
      // First, we need to get the topic-subtopic structure from the database
      // Check if subtopic column exists by trying the query and falling back if it fails
      let subtopicsRes;
      let topicSubtopicMap = new Map();
      
      try {
        // Try to get both topic and subtopic
        subtopicsRes = AppState.database.exec("SELECT DISTINCT topic, subtopic FROM questions ORDER BY topic, subtopic");
        
        if (subtopicsRes[0]?.values) {
          subtopicsRes[0].values.forEach(row => {
            const topic = row[0];
            const subtopic = row[1] || 'General';
            
            if (!topicSubtopicMap.has(topic)) {
              topicSubtopicMap.set(topic, new Set());
            }
            topicSubtopicMap.get(topic).add(subtopic);
          });
        }
      } catch (error) {
        console.log("Subtopic column not found, using topic only:", error.message);
        // Fallback: use only topic column and create "General" subtopic for each topic
        try {
          const topicsRes = AppState.database.exec("SELECT DISTINCT topic FROM questions ORDER BY topic");
          if (topicsRes[0]?.values) {
            topicsRes[0].values.forEach(row => {
              const topic = row[0];
              topicSubtopicMap.set(topic, new Set(['General']));
            });
          }
        } catch (fallbackError) {
          console.error("Error getting topics:", fallbackError);
          return;
        }
      }

      // Debug: Log the topic-subtopic mapping
      console.log("Database Topic-Subtopic Map:", topicSubtopicMap);

      const wrapper = document.createElement("div");
      wrapper.className = "filter-panel";

      // Add database name display at the top
      if (AppState.dbFileName) {
        const dbNameDiv = document.createElement("div");
        dbNameDiv.className = "db-name-display";
        dbNameDiv.style.cssText = "margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; font-weight: bold; color: #1565c0; display: flex; justify-content: space-between; align-items: center;";
        
        // Database name on the left
        const dbNameSpan = document.createElement("span");
        dbNameSpan.innerHTML = `📄 Database: <span style="color: #0d47a1;">${AppState.dbFileName}</span>`;
        
        // Start Test button on the right
        const startTestBtn = document.createElement("button");
        startTestBtn.textContent = "Start Test";
        startTestBtn.style.cssText = "background: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 15px;";
        startTestBtn.id = "topStartTestBtn";
        
        // Store reference to connect later after main button is created
        window.topStartTestButton = startTestBtn;
        
        // Add a direct onclick as backup
        startTestBtn.onclick = () => {
          // We'll connect this to the main button later
        };
        
        // Hover effect for the button
        startTestBtn.onmouseover = () => startTestBtn.style.background = "#45a049";
        startTestBtn.onmouseout = () => startTestBtn.style.background = "#4caf50";
        
        dbNameDiv.appendChild(dbNameSpan);
        dbNameDiv.appendChild(startTestBtn);
        wrapper.appendChild(dbNameDiv);
      }

      // Topics with nested subtopics (DATABASE MODE)
      const topicDiv = document.createElement("div");
      topicDiv.className = "filter-section";
      topicDiv.innerHTML = "<h3>Select Topics & Subtopics (Database)</h3>";
      
      // Select All checkbox
      const selectAllDiv = document.createElement("div");
      selectAllDiv.style.marginBottom = "15px";
      selectAllDiv.style.borderBottom = "1px solid #ddd";
      selectAllDiv.style.paddingBottom = "10px";
      const selectAllLabel = document.createElement("label");
      selectAllLabel.style.fontWeight = "bold";
      selectAllLabel.innerHTML = `<input type="checkbox" id="select-all-topics-db" checked> Select All Topics & Subtopics`;
      selectAllDiv.appendChild(selectAllLabel);
      topicDiv.appendChild(selectAllDiv);

      // Create hierarchical structure
      const topicContainer = document.createElement("div");
      topicContainer.className = "topic-hierarchy";
      
      Array.from(topicSubtopicMap.keys()).sort().forEach(topic => {
        const subtopics = Array.from(topicSubtopicMap.get(topic)).sort();
        
        // Get question count for this topic (all subtopics combined)
        const topicCountRes = AppState.database.exec("SELECT COUNT(*) FROM questions WHERE topic = ?", [topic]);
        const topicQuestionCount = topicCountRes[0]?.values[0][0] || 0;
        
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
          const subtopicCountRes = AppState.database.exec("SELECT COUNT(*) FROM questions WHERE topic = ? AND subtopic = ?", [topic, subtopic]);
          const subtopicQuestionCount = subtopicCountRes[0]?.values[0][0] || 0;
          
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
      setupTopicSubtopicCheckboxesDb(topicDiv, updateMaxQuestions);

      // Types
      const typeDiv = document.createElement("div");
      typeDiv.className = "filter-section";
      typeDiv.innerHTML = "<h3>Select Question Types</h3>";
      
      // Calculate total questions for filtered types only
      let totalFilteredQuestions = 0;
      const typeCountsArray = [];
      
      types.forEach(t => {
        // Get count for each question type from database
        const typeCountRes = AppState.database.exec(`SELECT COUNT(*) FROM questions WHERE question_type = '${escapeSQL(t)}'`);
        const typeQuestionCount = typeCountRes[0]?.values[0][0] || 0;
        typeCountsArray.push(typeQuestionCount);
        totalFilteredQuestions += typeQuestionCount;
      });
      
      const allTypes = document.createElement("label");
      allTypes.innerHTML = `<input type=\"checkbox\" value=\"ALL\" checked> Selected Types <span style="color: #666; font-weight: normal;">(${totalFilteredQuestions} question${totalFilteredQuestions === 1 ? '' : 's'})</span>`;
      typeDiv.appendChild(allTypes);
      
      types.forEach((t, index) => {
        const typeQuestionCount = typeCountsArray[index];
        const l = document.createElement("label");
        l.style.display = "block";
        l.style.marginLeft = "20px"; // Indent the individual type checkboxes
        l.innerHTML = `<input type=\"checkbox\" value=\"${t}\" checked> ${t} <span style="color: #666; font-weight: normal;">(${typeQuestionCount} question${typeQuestionCount === 1 ? '' : 's'})</span>`;
        typeDiv.appendChild(l);
      });
      setupAllCheckbox(typeDiv);
      
      // Function to update "Selected Types" count based on checked question types (Database mode)
      function updateSelectedTypesCountDB() {
        console.log("updateSelectedTypesCountDB called"); // Debug log
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
        console.log("Setting up DB mode event listeners"); // Debug log
        const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
        console.log("Found", typeChecks.length, "DB checkboxes to set up"); // Debug log
        typeChecks.forEach((cb, i) => {
          if (i > 0) { // Skip the first "Selected Types" checkbox
            console.log("Adding DB listener to", cb.value); // Debug log
            cb.addEventListener('change', () => {
              console.log("DB type checkbox changed:", cb.value, cb.checked); // Debug log
              updateSelectedTypesCountDB();
            });
          }
        });
      }, 200);

      // Explanation display mode
      const expDiv = document.createElement("div");
      expDiv.className = "filter-section";
      expDiv.innerHTML = "<h3>Explanation & Reference Display</h3>";
      expDiv.innerHTML += `
        <label><input type=\"radio\" name=\"expMode\" value=\"1\"> Only when wrong</label><br>
        <label><input type=\"radio\" name=\"expMode\" value=\"2\" checked> Both when right and wrong</label><br>
        <label><input type=\"radio\" name=\"expMode\" value=\"3\"> Do not display explanations</label>
      `;

      // Test behavior options
      const behaviorDiv = document.createElement("div");
      behaviorDiv.className = "filter-section";
      behaviorDiv.innerHTML = "<h3>Test Behavior Options</h3>";
      behaviorDiv.innerHTML += `
        <label><input type="checkbox" id="tryAgainOptionDb" checked> Allow "Try Again" for incorrect answers</label><br>
        <label><input type="checkbox" id="topicRevealOptionDb" checked> Show Topic/Subtopic when answering</label><br>
        <label><input type="checkbox" id="immediateResultOptionDb" checked> Show result immediately after each answer</label><br>
        <label><input type="checkbox" id="correctAnswerOptionDb" checked> Show correct answer when wrong</label>
        <div style="margin-top: 8px; padding: 8px; background: #f0f8ff; border-radius: 4px; font-size: 0.9em; color: #666;">
          <em>Note: If "immediate result" is OFF, results and selected options will be revealed after the final score</em>
        </div>
      `;

      // Add immediate result option change handler (DB mode)
      setTimeout(() => {
        const immediateResultCheckbox = document.getElementById("immediateResultOptionDb");
        const correctAnswerCheckbox = document.getElementById("correctAnswerOptionDb");
        const tryAgainCheckbox = document.getElementById("tryAgainOptionDb");
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
      const numDiv = document.createElement("div");
      numDiv.className = "filter-section";
      numDiv.innerHTML = `<h3>Number of Questions</h3><input type=\"number\" id=\"numQuestions\" min=\"1\" value=\"10\"> <span id=\"maxQuestionsInfo\" style=\"margin-left:10px; color:#0078d7; font-weight:bold;\"></span><button id=\"answerAllBtnDb\" style=\"margin-left:10px; background:#4caf50; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.85em; cursor:pointer; font-weight:bold; display:none;\" title=\"Set question count to maximum available\">Answer all</button>`;

      // Add total question count display at the top
      const totalCountRes = AppState.database.exec('SELECT COUNT(*) FROM questions');
      const totalQuestions = totalCountRes[0]?.values[0][0] || 0;
      AppState.dbTotalQuestions = totalQuestions; // Store for later use
      const totalCountDiv = document.createElement("div");
      totalCountDiv.id = "db-total-question-count";
      totalCountDiv.style = "margin-bottom: 10px; font-size: 1.1em; color: #0078d7; font-weight: bold; text-align: center;";
      totalCountDiv.textContent = `Total questions in database: ${totalQuestions}`;
      wrapper.appendChild(totalCountDiv);

      // Selection mode radio buttons
      const modeDiv = document.createElement("div");
      modeDiv.className = "filter-section";
      modeDiv.style.marginTop = "10px";
      modeDiv.innerHTML = `
        <h3>Selection Mode</h3>
        <label><input type="radio" name="selectionMode" value="random" checked> Random (default)</label><br>
        <label><input type="radio" name="selectionMode" value="balanced"> Balanced (1 per subtopic, then random)</label>
      `;

      // Start button
      const startBtn = document.createElement("button");
      startBtn.textContent = "Start Test";
      
      // Create tooltip container for balanced mode
      const startBtnContainer = document.createElement("div");
      startBtnContainer.className = "tooltip-container";
      startBtnContainer.appendChild(startBtn);
      
      // Tooltip element (initially hidden)
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.style.display = "none";
      startBtnContainer.appendChild(tooltip);
      
      // Function to update tooltip content for balanced mode
      function updateBalancedTooltip() {
        const mode = modeDiv.querySelector('input[name="selectionMode"]:checked').value;
        if (mode === 'balanced') {
          tooltip.style.display = "block";
          
          // Get current filter selections for DATABASE MODE (hierarchical structure)
          let selectedTypes = [];
          
          // Get selected question types (this part is the same)
          const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
          if (typeChecks[0].checked) {
            selectedTypes = types;
          } else {
            typeChecks.forEach((cb, i) => {
              if (i > 0 && cb.checked) selectedTypes.push(cb.value);
            });
          }
          
          const numInput = document.getElementById("numQuestions");
          const requestedCount = Math.max(1, parseInt(numInput.value) || 10);
          
          // Calculate distribution preview for SOPHISTICATED BALANCED MODE (DATABASE)
          // Check available questions based on subtopic selections
          const selectAllTopics = document.getElementById("select-all-topics-db");
          let availableQuestionCount = 0;
          
          if (selectAllTopics && selectAllTopics.checked) {
            // All topics and subtopics selected
            const countSql = `SELECT COUNT(*) FROM questions WHERE question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
            const countRes = AppState.database.exec(countSql);
            availableQuestionCount = countRes[0]?.values[0][0] || 0;
          } else {
            // Count based on individual subtopic selections
            const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
            
            if (selectedSubtopics.length > 0) {
              const conditions = [];
              selectedSubtopics.forEach(subtopicCb => {
                const topic = subtopicCb.dataset.topic;
                const subtopic = subtopicCb.value;
                conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
              });
              
              const countSql = `SELECT COUNT(*) FROM questions WHERE (${conditions.join(' OR ')}) AND question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
              const countRes = AppState.database.exec(countSql);
              availableQuestionCount = countRes[0]?.values[0][0] || 0;
            }
          }
          
          let distributionHTML = "";
          
          if (availableQuestionCount > 0) {
            // Calculate how many topic-subtopic combinations are available
            const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
            const combinationCount = selectAllTopics && selectAllTopics.checked 
              ? Array.from(topicSubtopicMap.keys()).reduce((total, topic) => total + topicSubtopicMap.get(topic).size, 0)
              : selectedSubtopics.length;
            
            // Build selected topics breakdown by question type
            let topicsBreakdownHTML = "";
            if (selectAllTopics && selectAllTopics.checked) {
              // All topics selected - show summary
              topicsBreakdownHTML = `
                <h4>Selected Topics & Question Distribution</h4>
                <div style="margin-bottom: 10px; padding: 8px; background: #f0f8ff; border-radius: 4px; font-size: 0.85em;">
                  <strong>All Topics Selected</strong><br>
                  <div style="margin-top: 5px;">
              `;
              
              // Get breakdown by question type across all topics
              selectedTypes.forEach(qType => {
                const typeCountSql = `SELECT COUNT(*) FROM questions WHERE question_type = '${escapeSQL(qType)}'`;
                const typeCountRes = AppState.database.exec(typeCountSql);
                const typeCount = typeCountRes[0]?.values[0][0] || 0;
                if (typeCount > 0) {
                  topicsBreakdownHTML += `<span style="margin-right: 15px;"><strong>${qType}:</strong> ${typeCount}</span>`;
                }
              });
              
              topicsBreakdownHTML += `
                  </div>
                </div>
              `;
            } else {
              // Specific topics/subtopics selected
              const selectedTopicMap = new Map();
              
              selectedSubtopics.forEach(subtopicCb => {
                const topic = subtopicCb.dataset.topic;
                const subtopic = subtopicCb.value;
                
                if (!selectedTopicMap.has(topic)) {
                  selectedTopicMap.set(topic, []);
                }
                selectedTopicMap.get(topic).push(subtopic);
              });
              
              topicsBreakdownHTML = `
                <h4>Selected Topics & Question Distribution</h4>
                <div style="margin-bottom: 10px; padding: 8px; background: #f0f8ff; border-radius: 4px; font-size: 0.85em;">
              `;
              
              for (const [topic, subtopics] of selectedTopicMap) {
                topicsBreakdownHTML += `<div style="margin-bottom: 8px;"><strong>${topic}</strong> (${subtopics.length} subtopic${subtopics.length === 1 ? '' : 's'}):<br>`;
                
                // Get question count by type for this topic
                const typeBreakdown = [];
                selectedTypes.forEach(qType => {
                  const subtopicConditions = subtopics.map(st => `(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(st)}')`).join(' OR ');
                  const typeCountSql = `SELECT COUNT(*) FROM questions WHERE (${subtopicConditions}) AND question_type = '${escapeSQL(qType)}'`;
                  const typeCountRes = AppState.database.exec(typeCountSql);
                  const typeCount = typeCountRes[0]?.values[0][0] || 0;
                  if (typeCount > 0) {
                    typeBreakdown.push(`${qType}: ${typeCount}`);
                  }
                });
                
                if (typeBreakdown.length > 0) {
                  topicsBreakdownHTML += `<span style="margin-left: 10px; color: #666;">${typeBreakdown.join(', ')}</span>`;
                } else {
                  topicsBreakdownHTML += `<span style="margin-left: 10px; color: #999;">No questions available</span>`;
                }
                
                topicsBreakdownHTML += `</div>`;
              }
              
              topicsBreakdownHTML += `</div>`;
            }
            
            // Simple balanced logic: 1 question per subtopic, then fill randomly
            const subtopicsUsed = Math.min(requestedCount, combinationCount);
            const randomQuestions = Math.max(0, requestedCount - combinationCount);
            
            distributionHTML = topicsBreakdownHTML + `
              <h4>Balanced Distribution Strategy</h4>
              <div style="margin-bottom: 10px; padding: 8px; background: #e7f3ff; border-radius: 4px; font-size: 0.9em;">
                <div><strong>Available Questions:</strong> ${availableQuestionCount}</div>
                <div><strong>Available Subtopics:</strong> ${combinationCount}</div>
                <div><strong>Strategy:</strong> 1 question per subtopic (${subtopicsUsed} subtopics), then ${randomQuestions} random questions</div>
                ${randomQuestions > 0 ? `<div style="color: #666;"><em>Since you want ${requestedCount} questions but only ${combinationCount} subtopics available, ${randomQuestions} questions will be selected randomly.</em></div>` : ''}
              </div>
              <div class="tooltip-summary">Total: ${Math.min(requestedCount, availableQuestionCount)} questions will be selected</div>
            `;
            
            if (requestedCount > availableQuestionCount) {
              distributionHTML += `
                <div style="margin-top: 8px; padding: 6px; background: #fff3cd; border-radius: 4px; font-size: 0.85em; color: #856404;">
                  ⚠️ Requested ${requestedCount} questions, but only ${availableQuestionCount} available.<br>
                  Will select all ${availableQuestionCount} available questions.
                </div>
              `;
            }
          } else {
            distributionHTML = `
              <h4>Simple Balanced Distribution Preview</h4>
              <div style="text-align: center; color: #856404;">
                No questions available for selected topic/subtopic and question type combinations.<br>
                Please adjust your selections.
              </div>
            `;
          }
          
          tooltip.innerHTML = distributionHTML;
        } else {
          tooltip.style.display = "none";
        }
      }
      
      // Update tooltip when selection mode changes
      modeDiv.addEventListener("change", updateBalancedTooltip);
      
      // Update tooltip when filters change
      topicDiv.addEventListener("change", updateBalancedTooltip);
      typeDiv.addEventListener("change", updateBalancedTooltip);
      
      // Update tooltip when number of questions changes
      setTimeout(() => {
        const numInput = document.getElementById("numQuestions");
        if (numInput) {
          numInput.addEventListener("input", updateBalancedTooltip);
        }
        updateBalancedTooltip(); // Initial update
      }, 0);
      
      startBtn.addEventListener("click", () => {
        // Save current options state before starting test
        saveOptionsState();
        
        document.getElementById("file-chosen").innerHTML = "Loading questions from database and building test...";
        // Get selected topic/subtopic combinations and question types for DATABASE MODE
        let selectedTypes = [];
        
        // Get selected question types (this part is the same)
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
        AppState.allowTryAgain = document.getElementById("tryAgainOptionDb").checked;
        AppState.showTopicSubtopic = document.getElementById("topicRevealOptionDb").checked;
        AppState.showImmediateResult = document.getElementById("immediateResultOptionDb").checked;
        AppState.showCorrectAnswer = document.getElementById("correctAnswerOptionDb").checked;
        
        // Build SQL query based on subtopic selections
        let sql2;
        const selectAllTopics = document.getElementById("select-all-topics-db");
        
        if (selectAllTopics && selectAllTopics.checked) {
          // All topics and subtopics selected
          sql2 = `SELECT * FROM questions WHERE question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
        } else {
          // Build query based on individual subtopic selections
          const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
          
          if (selectedSubtopics.length === 0) {
            document.getElementById("file-chosen").innerHTML = "No topics or subtopics selected.";
            alert("Please select at least one topic or subtopic.");
            return;
          }
          
          const conditions = [];
          selectedSubtopics.forEach(subtopicCb => {
            const topic = subtopicCb.dataset.topic;
            const subtopic = subtopicCb.value;
            conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
          });
          
          sql2 = `SELECT * FROM questions WHERE (${conditions.join(' OR ')}) AND question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
        }

        console.log("Executing SQL query:", sql2);
        const res2 = AppState.database.exec(sql2);
        if (!res2.length) {
          document.getElementById("file-chosen").innerHTML = "No questions found in the database for the selected filters.";
          alert("No questions found in the database for the selected filters.");
          return;
        }
        let allQuestions = res2[0]?.values.map(row => {
          const obj = {};
          res2[0].columns.forEach((col, i) => obj[col] = row[i]);
          return obj;
        }) || [];
        
        // Build valid question objects
        let validQuestions = [];
        let invalidCount = 0;
        console.log(`\n=== QUESTION VALIDATION STARTING ===`);
        console.log(`Total questions from database query: ${allQuestions.length}`);
        
        allQuestions.forEach((q, index) => {
          let valid = false;
          let invalidReason = "";
          
          // Check for invalid question_type first (anomaly)
          const validQuestionTypes = ['MCQ', 'MCQ-Scenario', 'Cohort-05-MCQ', 'TrueFalse', 'Match', 'AssertionReason'];
          if (!validQuestionTypes.includes(q.question_type)) {
            valid = false;
            invalidReason = `Invalid question_type: ${q.question_type} (valid types: ${validQuestionTypes.join(', ')})`;
            console.log(`❌ Question ${q.id} (${q.question_type}): INVALID - ${invalidReason}`);
          }
          
          // MCQ and MCQ-Scenario and Cohort-05-MCQ: fetch options
          if (q.question_type === 'MCQ' || q.question_type === 'MCQ-Scenario' || q.question_type === 'Cohort-05-MCQ') {
            const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
            q.options = optRes[0]?.values?.map(v => v[0]) || [];
            // Fix: Handle both string and integer values for is_correct
            q.answer = optRes[0]?.values?.filter(v => v[1] === 1 || v[1] === "1")?.map(v => v[0]) || [];
            
            if (q.answer.length === 1) q.answer = q.answer[0];
            
            // Enhanced validation for MCQs
            let mcqIssues = [];
            
            // Check for no options at all (anomaly - missing data)
            if (q.options.length === 0) {
              mcqIssues.push(`MCQ with no options found in database`);
            }
            // Check for <2 options (anomaly)
            else if (q.options.length < 2) {
              mcqIssues.push(`MCQ with <2 options (found ${q.options.length})`);
            }
            
            // Check for no correct options (anomaly)
            const correctAnswersCount = Array.isArray(q.answer) ? q.answer.length : (q.answer ? 1 : 0);
            if (correctAnswersCount === 0) {
              mcqIssues.push("MCQ with no correct options");
            }
            
            // Check for duplicate options (duplicate - safe to delete)
            if (q.options.length > 0) {
              const optionTexts = q.options;
              const uniqueOptions = [...new Set(optionTexts)];
              if (optionTexts.length !== uniqueOptions.length) {
                const duplicates = optionTexts.filter((item, index) => optionTexts.indexOf(item) !== index);
                mcqIssues.push(`Duplicate options found: ${[...new Set(duplicates)].join(', ')}`);
              }
              
              // Check for conflicting option correctness (duplicate - safe to delete)
              if (optRes[0]?.values) {
                const optionCorrectness = {};
                optRes[0].values.forEach(([text, correct]) => {
                  if (optionCorrectness[text] === undefined) {
                    optionCorrectness[text] = correct;
                  } else if (optionCorrectness[text] !== correct) {
                    mcqIssues.push(`Conflicting option correctness for: ${text}`);
                  }
                });
              }
            }
            
            // Check for broken multi-answer MCQs (anomaly)
            if (correctAnswersCount > 1 && correctAnswersCount < q.options.length) {
              // This could be intentional multi-answer, but let's flag for review
              // mcqIssues.push(`Broken multi-answer MCQ (${correctAnswersCount} correct out of ${q.options.length} total)`);
            }
            
            if (mcqIssues.length > 0) {
              valid = false;
              invalidReason = mcqIssues.join("; ");
              console.log(`❌ Question ${q.id} (${q.question_type}): INVALID - ${invalidReason}`);
            } else {
              valid = q.options.length > 0;
            }
            
            // For MCQ-Scenario, treat as single or multiple as per answer
            if (q.question_type === 'MCQ-Scenario') {
              q.type = (Array.isArray(q.answer) && q.answer.length > 1) ? 'multiple' : 'single';
            } else if (q.question_type === 'Cohort-05-MCQ') {
              // Cohort-05-MCQ can be single or multiple based on actual correct answers
              q.type = correctAnswersCount > 1 ? 'multiple' : 'single';
            } else {
              q.type = (Array.isArray(q.answer) && q.answer.length > 1) ? 'multiple' : 'single';
            }
          }
          
          // TrueFalse: set options and answer
          if (q.question_type === 'TrueFalse') {
            q.options = ["True", "False"];
            // Fetch correct answer from options table
            const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
            
            let tfIssues = [];
            
            // Check for missing TrueFalse options (anomaly - missing data)
            if (!optRes[0]?.values || optRes[0].values.length === 0) {
              tfIssues.push("TrueFalse with no options found in database");
            } else {
              // Check for duplicate TrueFalse options in database (duplicate - safe to delete)
              const dbOptions = optRes[0].values.map(v => v[0]);
              const uniqueDbOptions = [...new Set(dbOptions)];
              if (dbOptions.length !== uniqueDbOptions.length) {
                const duplicates = dbOptions.filter((item, index) => dbOptions.indexOf(item) !== index);
                tfIssues.push(`Duplicate TrueFalse options in database: ${[...new Set(duplicates)].join(', ')}`);
              }
              
              // Check for valid True/False structure (anomaly)
              const correctOpt = optRes[0].values.find(v => v[1] === 1);
              if (!correctOpt) {
                tfIssues.push("TrueFalse with no correct answer");
              } else if (!["True", "False"].includes(correctOpt[0])) {
                tfIssues.push(`TrueFalse with invalid answer: ${correctOpt[0]} (should be True or False)`);
              }
            }
            
            if (tfIssues.length > 0) {
              valid = false;
              invalidReason = tfIssues.join("; ");
              console.log(`❌ Question ${q.id} (${q.question_type}): INVALID - ${invalidReason}`);
            } else {
              const correctOpt = optRes[0]?.values.find(v => v[1] === 1);
              q.answer = correctOpt ? correctOpt[0] : null;
              valid = true;
            }
            q.type = 'single';
          }
          
          // Match: fetch pairs
          if (q.question_type === 'Match') {
            const matchRes = AppState.database.exec(`SELECT left_text, right_text FROM match_pairs WHERE question_id = ${q.id}`);
            q.matchPairs = {};
            q.matchPairsRaw = matchRes;
            
            let matchIssues = [];
            
            // Check for missing match pairs (anomaly - missing data)
            if (!matchRes[0] || !matchRes[0].values || matchRes[0].values.length === 0) {
              matchIssues.push("No match pairs found");
            } else {
              // Check for duplicate left_text or right_text values (duplicate - safe to delete)
              const leftTexts = matchRes[0].values.map(v => v[0]);
              const rightTexts = matchRes[0].values.map(v => v[1]);
              const uniqueLeftTexts = [...new Set(leftTexts)];
              const uniqueRightTexts = [...new Set(rightTexts)];
              
              if (leftTexts.length !== uniqueLeftTexts.length) {
                const duplicateLefts = leftTexts.filter((item, index) => leftTexts.indexOf(item) !== index);
                matchIssues.push(`Duplicate left_text values in match_pairs: ${[...new Set(duplicateLefts)].join(', ')}`);
              }
              
              if (rightTexts.length !== uniqueRightTexts.length) {
                const duplicateRights = rightTexts.filter((item, index) => rightTexts.indexOf(item) !== index);
                matchIssues.push(`Duplicate right_text values in match_pairs: ${[...new Set(duplicateRights)].join(', ')}`);
              }
              
              // Check for exact duplicate match pairs (duplicate - safe to delete)
              const pairStrings = matchRes[0].values.map(v => `${v[0]}|${v[1]}`);
              const uniquePairStrings = [...new Set(pairStrings)];
              if (pairStrings.length !== uniquePairStrings.length) {
                matchIssues.push("Duplicate match pairs (exact same left+right combinations)");
              }
              
              if (matchIssues.length === 0) {
                matchRes[0].values.forEach(v => { q.matchPairs[v[0]] = v[1]; });
                valid = Object.keys(q.matchPairs).length > 0;
              }
            }
            
            // Check for missing dummy option (anomaly)
            const optRes = AppState.database.exec(`SELECT option_text FROM options WHERE question_id = ${q.id} AND option_text = 'Refer to match pairs'`);
            if (!optRes[0]?.values?.length) {
              matchIssues.push("Match without dummy option");
            }
            
            if (matchIssues.length > 0) {
              valid = false;
              invalidReason = matchIssues.join("; ");
              console.log(`❌ Question ${q.id} (${q.question_type}): INVALID - ${invalidReason}`);
            }
            q.type = 'match';
          }
          
          // AssertionReason: fetch options from options table
          if (q.question_type === 'AssertionReason') {
            const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
            
            let arIssues = [];
            
            // Check for missing AssertionReason options (anomaly - missing data)
            if (!optRes[0]?.values || optRes[0].values.length === 0) {
              arIssues.push("No assertion-reason options found in options table");
            } else {
              // Check for duplicate options (duplicate - safe to delete)
              const allOptions = optRes[0].values.map(row => row[0]);
              const uniqueOptions = [...new Set(allOptions)];
              if (allOptions.length !== uniqueOptions.length) {
                const duplicates = allOptions.filter((item, index) => allOptions.indexOf(item) !== index);
                arIssues.push(`Duplicate AssertionReason options found: ${[...new Set(duplicates)].join(', ')}`);
              }
              
              // Check for exactly 4 options requirement (anomaly)
              if (uniqueOptions.length !== 4 && uniqueOptions.length < 7) {
                arIssues.push(`AssertionReason without exactly 4 options (found ${uniqueOptions.length}, expected 4 or 7)`);
              }
              
              if (arIssues.length === 0) {
                // For AssertionReason, we expect the first two options to be assertion and reason
                // and the remaining options to be the standard 5 choices
                if (allOptions.length >= 7) { // 2 for assertion/reason + 5 standard options
                  q.assertion = allOptions[0];
                  q.reason = allOptions[1];
                  q.options = allOptions.slice(2); // Take the 5 standard options
                  // Find the correct answer from the options table
                  const correctOption = optRes[0].values.find(row => row[1] === 1); // is_correct = 1
                  q.answer = correctOption ? correctOption[0] : q.options[0];
                } else {
                  // Fallback: use all options as standard assertion-reason choices
                  q.options = allOptions.length > 0 ? allOptions : [
                    "Both A and R are true, and R explains A",
                    "Both A and R are true, but R does not explain A",
                    "A is true, R is false",
                    "A is false, R is true",
                    "Both A and R are false"
                  ];
                  // Try to extract assertion and reason from question text or use defaults
                  q.assertion = q.question_text || "Assertion not found";
                  q.reason = "Reason not found";
                  const correctOption = optRes[0].values.find(row => row[1] === 1);
                  q.answer = correctOption ? correctOption[0] : q.options[0];
                }
                valid = true;
              }
            }
            
            if (arIssues.length > 0) {
              valid = false;
              invalidReason = arIssues.join("; ");
              console.log(`❌ Question ${q.id} (${q.question_type}): INVALID - ${invalidReason}`);
            }
            q.type = 'assertion';
          }
          q.question = q.question_text;
          
          // Only push if valid
          if (valid) {
            validQuestions.push(q);
            console.log(`✅ Question ${q.id} (${q.question_type}): VALID`);
          } else {
            invalidCount++;
            if (!invalidReason) {
              const validQuestionTypes = ['MCQ', 'MCQ-Scenario', 'Cohort-05-MCQ', 'TrueFalse', 'Match', 'AssertionReason'];
              invalidReason = `Unknown/unsupported question type: ${q.question_type}. Valid types are: ${validQuestionTypes.join(', ')}`;
              console.log(`❌ Question ${q.id} (${q.question_type}): INVALID - ${invalidReason}`);
            }
          }
        });
        
        console.log(`=== QUESTION VALIDATION SUMMARY ===`);
        console.log(`Initial questions from query: ${allQuestions.length}`);
        console.log(`Valid questions after validation: ${validQuestions.length}`);
        console.log(`Invalid questions filtered out: ${invalidCount}`);
        console.log(`Loss rate: ${((invalidCount / allQuestions.length) * 100).toFixed(1)}%`);
        console.log(`=======================================\n`);

        if (validQuestions.length === 0) {
          let alertMessage = "No valid questions found.";
          if (invalidCount > 0) {
            alertMessage += ` Found ${invalidCount} invalid questions with issues. Check console for details. Valid question types are: MCQ, MCQ-Scenario, Cohort-05-MCQ, TrueFalse, Match, AssertionReason.`;
          } else {
            alertMessage += " Please check your database structure and selected filters.";
          }
          document.getElementById("file-chosen").innerHTML = "No valid questions found for the selected criteria.";
          alert(alertMessage);
          return;
        }

        // Selection mode logic
        const mode = modeDiv.querySelector('input[name="selectionMode"]:checked').value;
        let chosenQuestions = [];
        const numInput = document.getElementById("numQuestions");
        const numQuestions = Math.max(1, Math.min(parseInt(numInput.value), parseInt(numInput.max)));
        
        if (mode === 'balanced') {
          // SIMPLE BALANCED MODE: One question per subtopic, then fill randomly
          // Much simpler approach: assign 1 question per subtopic up to requested number
          
          // Get available topic-subtopic combinations from the validQuestions
          const availableCombinations = [];
          const combinationMap = new Map();
          
          validQuestions.forEach(q => {
            const combo = `${q.topic}:::${q.subtopic || 'General'}`;
            if (!combinationMap.has(combo)) {
              combinationMap.set(combo, []);
              availableCombinations.push({
                topic: q.topic,
                subtopic: q.subtopic || 'General',
                key: combo
              });
            }
            combinationMap.get(combo).push(q);
          });
          
          console.log(`Available topic-subtopic combinations: ${availableCombinations.length}`);
          console.log("Combinations:", availableCombinations.map(c => `${c.topic}→${c.subtopic} (${combinationMap.get(c.key).length} questions)`));
          
          if (availableCombinations.length === 0) {
            document.getElementById("file-chosen").innerHTML = "No valid topic-subtopic combinations found.";
            return;
          }
          
          // Simple approach: Take 1 question from each subtopic until we have enough
          // If we run out of subtopics, fill the rest randomly
          chosenQuestions = [];
          const usedQuestions = new Set();
          
          // Shuffle combinations to avoid bias in selection order
          const shuffledCombinations = shuffle([...availableCombinations]);
          
          // Take one question from each subtopic up to the requested number
          let questionsNeeded = numQuestions;
          console.log(`Simple balanced approach: Taking 1 question from each subtopic up to ${questionsNeeded} questions`);
          
          for (const combination of shuffledCombinations) {
            if (questionsNeeded <= 0) break;
            
            const availableForCombination = combinationMap.get(combination.key).filter(q => !usedQuestions.has(q.id));
            if (availableForCombination.length > 0) {
              // Pick one random question from this subtopic
              const randomQuestion = availableForCombination[Math.floor(Math.random() * availableForCombination.length)];
              chosenQuestions.push(randomQuestion);
              usedQuestions.add(randomQuestion.id);
              questionsNeeded--;
              console.log(`  Selected 1 question from ${combination.topic}→${combination.subtopic}`);
            }
          }
          
          // If we still need more questions, fill randomly from remaining questions
          if (questionsNeeded > 0) {
            console.log(`Need ${questionsNeeded} more questions. Filling randomly from remaining.`);
            const remainingQuestions = validQuestions.filter(q => !usedQuestions.has(q.id));
            const shuffledRemaining = shuffle(remainingQuestions);
            const additionalQuestions = shuffledRemaining.slice(0, questionsNeeded);
            chosenQuestions = chosenQuestions.concat(additionalQuestions);
            console.log(`Added ${additionalQuestions.length} additional questions randomly`);
          }
          
          console.log(`Final selection: ${chosenQuestions.length} questions`);
          console.log("Distribution by combination:", availableCombinations.map(c => {
            const count = chosenQuestions.filter(q => q.topic === c.topic && (q.subtopic || 'General') === c.subtopic).length;
            return `${c.topic}→${c.subtopic}: ${count}`;
          }));
          
          if (chosenQuestions.length === 0) {
            document.getElementById("file-chosen").innerHTML = "No valid questions found for the selected filters. Please adjust your selection.";
            return;
          }
        } else {
          // Random: shuffle and pick N
          validQuestions = shuffle(validQuestions);
          chosenQuestions = validQuestions.slice(0, numQuestions);
        }
        if (chosenQuestions.length === 0) {
          document.getElementById("file-chosen").innerHTML = "No valid questions found for the selected filters. Please try different options.";
          return;
        }
        document.getElementById("file-chosen").innerHTML = `Loaded ${chosenQuestions.length} questions. Preparing test UI...`;
        
        // Store database query parameters for "New Questions" functionality
        AppState.lastDbQueryParams = {
          selectedTypes: [...selectedTypes],
          mode: mode,
          numQuestions: numQuestions,
          explanationMode: AppState.explanationMode,
          isAllTopicsSelected: selectAllTopics && selectAllTopics.checked,
          selectedSubtopics: null
        };
        
        // Store subtopic selections if not "all topics" mode
        if (!AppState.lastDbQueryParams.isAllTopicsSelected) {
          const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
          AppState.lastDbQueryParams.selectedSubtopics = Array.from(selectedSubtopics).map(cb => ({
            topic: cb.dataset.topic,
            subtopic: cb.value
          }));
        }
        
        setTimeout(() => {
          console.log("=== ABOUT TO CALL startTest() ===");
          console.log("Final chosen questions count:", chosenQuestions.length);
          panel.innerHTML = ""; // Clear filter panel before starting test
          document.getElementById("restart").style.display = "none"; // Hide restart until questions are shown
          document.getElementById("restart-bottom").style.display = "none";
          startTest(chosenQuestions);
        }, 500);
      });

      // Connect the top "Start Test" button to trigger the main button's click event
      const topStartTestBtn = window.topStartTestButton; // Use stored reference instead of getElementById
      if (topStartTestBtn) {
        // Update the onclick handler to trigger the main button
        topStartTestBtn.onclick = () => {
          console.log("Top Start Test button clicked - delegating to main button");
          console.log("Main startBtn exists:", !!startBtn);
          console.log("Main startBtn disabled:", startBtn.disabled);
          startBtn.click(); // Simply trigger the main start button's click
        };
      }

      // Update max questions info and input limit dynamically
      function updateMaxQuestions() {
        // Prevent recursive calls when we programmatically change the input value
        if (updateMaxQuestions.isUpdating) return;
        updateMaxQuestions.isUpdating = true;
        
        console.log("updateMaxQuestions called"); // Debug log
        // Get selected topic/subtopic combinations and question types for DATABASE MODE
        let selectedTypes = [];
        
        // Get selected question types (this part is the same)
        const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
        if (typeChecks[0].checked) {
          selectedTypes = types;
        } else {
          typeChecks.forEach((cb, i) => {
            if (i > 0 && cb.checked) selectedTypes.push(cb.value);
          });
        }
        
        if (selectedTypes.length === 0) {
          document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available (no question types selected)";
          const answerAllBtnDb = document.getElementById("answerAllBtnDb");
          if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
          const numInput = document.getElementById("numQuestions");
          numInput.max = 0;
          if (parseInt(numInput.value) > 0) numInput.value = 0;
          startBtn.disabled = true;
          updateMaxQuestions.isUpdating = false;
          return;
        }
        
        // Get selected topic/subtopic combinations using hierarchical structure
        const selectAllTopics = document.getElementById("select-all-topics-db");
        let sql;
        
        if (selectAllTopics && selectAllTopics.checked) {
          // All topics and subtopics selected
          sql = `SELECT * FROM questions WHERE question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
        } else {
          // Build query based on individual subtopic selections
          const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
          console.log("Selected subtopics:", selectedSubtopics.length); // Debug log
          
          if (selectedSubtopics.length === 0) {
            document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available (no subtopics selected)";
            const answerAllBtnDb = document.getElementById("answerAllBtnDb");
            if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
            const numInput = document.getElementById("numQuestions");
            numInput.max = 0;
            if (parseInt(numInput.value) > 0) numInput.value = 0;
            startBtn.disabled = true;
            updateMaxQuestions.isUpdating = false;
            return;
          }
          
          // Build a query for each selected topic/subtopic combination
          const conditions = [];
          selectedSubtopics.forEach(subtopicCb => {
            const topic = subtopicCb.dataset.topic;
            const subtopic = subtopicCb.value;
            conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
          });
          
          sql = `SELECT * FROM questions WHERE (${conditions.join(' OR ')}) AND question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
        }
        
        console.log("Validating questions for max count:", sql); // Debug log
        const res = AppState.database.exec(sql);
        if (!res.length) {
          console.log("No questions returned from SQL query");
          document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available for selection";
          const answerAllBtnDb = document.getElementById("answerAllBtnDb");
          if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
          const numInput = document.getElementById("numQuestions");
          numInput.max = 0;
          if (parseInt(numInput.value) > 0) numInput.value = 0;
          startBtn.disabled = true;
          updateMaxQuestions.isUpdating = false;
          return;
        }
        
        let allQuestions = res[0]?.values.map(row => {
          const obj = {};
          res[0].columns.forEach((col, i) => obj[col] = row[i]);
          return obj;
        }) || [];
        
        // Store all questions for potential refresh functionality
        AppState.lastQueryAllQuestions = allQuestions;
        
        console.log(`=== MAX QUESTIONS VALIDATION DEBUG ===`);
        console.log(`SQL query returned ${allQuestions.length} questions`);
        console.log(`First few questions:`, allQuestions.slice(0, 3).map(q => ({ id: q.id, type: q.question_type, topic: q.topic })));
        
        // Perform the same validation as the main question selection to get accurate count
        let validQuestions = [];
        let invalidQuestions = [];
        // Use comprehensive SQL-based validation queries for proper segregation
        
        // === DUPLICATES → Safe to Delete ===
        
        // 1.1 Duplicate options (exact same text + correctness)
        try {
          const duplicateOptionsSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, o.option_text, o.is_correct,
                   COUNT(*) as dup_count, 'Duplicate option (exact)' as reason
            FROM questions q
            JOIN options o ON q.id = o.question_id
            GROUP BY q.id, o.option_text, o.is_correct
            HAVING COUNT(*) > 1
          `;
          const dupOptionsResult = AppState.database.exec(duplicateOptionsSQL);
          if (dupOptionsResult[0]?.values) {
            dupOptionsResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, option_text, is_correct, dup_count, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason} - "${option_text}" (${dup_count} times)`
              });
            });
          }
        } catch (e) { console.log("Error checking duplicate options:", e); }
        
        // 1.2 Conflicting options (same text, different correctness)
        try {
          const conflictingOptionsSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, o.option_text,
                   GROUP_CONCAT(o.is_correct) as correctness, 'Conflicting option correctness' as reason
            FROM questions q
            JOIN options o ON q.id = o.question_id
            GROUP BY q.id, o.option_text
            HAVING COUNT(DISTINCT o.is_correct) > 1
          `;
          const conflictResult = AppState.database.exec(conflictingOptionsSQL);
          if (conflictResult[0]?.values) {
            conflictResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, option_text, correctness, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason} - "${option_text}" (correctness: ${correctness})`
              });
            });
          }
        } catch (e) { console.log("Error checking conflicting options:", e); }
        
        // 1.3 Duplicate match_pairs (exact same left+right)
        try {
          const duplicateMatchPairsSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, m.left_text, m.right_text,
                   COUNT(*) as dup_count, 'Duplicate match pair (exact)' as reason
            FROM questions q
            JOIN match_pairs m ON q.id = m.question_id
            GROUP BY q.id, m.left_text, m.right_text
            HAVING COUNT(*) > 1
          `;
          const dupMatchResult = AppState.database.exec(duplicateMatchPairsSQL);
          if (dupMatchResult[0]?.values) {
            dupMatchResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, left_text, right_text, dup_count, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason} - "${left_text}" → "${right_text}" (${dup_count} times)`
              });
            });
          }
        } catch (e) { console.log("Error checking duplicate match pairs:", e); }
        
        // 1.4 Duplicate left_text in match_pairs
        try {
          const duplicateLeftTextSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, m.left_text,
                   COUNT(*) as dup_count, 'Duplicate left_text in match_pairs' as reason
            FROM questions q
            JOIN match_pairs m ON q.id = m.question_id
            GROUP BY q.id, m.left_text
            HAVING COUNT(*) > 1
          `;
          const dupLeftResult = AppState.database.exec(duplicateLeftTextSQL);
          if (dupLeftResult[0]?.values) {
            dupLeftResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, left_text, dup_count, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason} - "${left_text}" (${dup_count} times)`
              });
            });
          }
        } catch (e) { console.log("Error checking duplicate left_text:", e); }
        
        // === ANOMALIES → Need Fixing ===
        
        // 2.1 Invalid question_type
        try {
          const invalidTypeSQL = `
            SELECT id, question_type, question_text, topic, subtopic, 'Invalid question_type' as reason
            FROM questions
            WHERE question_type NOT IN ('MCQ','MCQ-Scenario','Cohort-05-MCQ','TrueFalse','Match','AssertionReason')
          `;
          const invalidTypeResult = AppState.database.exec(invalidTypeSQL);
          if (invalidTypeResult[0]?.values) {
            invalidTypeResult[0].values.forEach(row => {
              const [id, question_type, question_text, topic, subtopic, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason}: ${question_type}`
              });
            });
          }
        } catch (e) { console.log("Error checking invalid question types:", e); }
        
        // 2.2 - REMOVED: Multi-answer MCQs are legitimate in this system
        // Questions with multiple correct answers automatically show checkboxes
        
        // 2.3 MCQs with <2 options
        try {
          const mcqFewOptionsSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, COUNT(o.id) as opt_count, 'MCQ with <2 options' as reason
            FROM questions q
            LEFT JOIN options o ON q.id = o.question_id
            WHERE q.question_type IN ('MCQ', 'MCQ-Scenario', 'Cohort-05-MCQ')
            GROUP BY q.id
            HAVING COUNT(o.id) < 2
          `;
          const mcqFewResult = AppState.database.exec(mcqFewOptionsSQL);
          if (mcqFewResult[0]?.values) {
            mcqFewResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, opt_count, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason} (found ${opt_count})`
              });
            });
          }
        } catch (e) { console.log("Error checking MCQ few options:", e); }
        
        // 2.4 MCQs with no correct options
        try {
          const mcqNoCorrectSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 'MCQ with no correct options' as reason
            FROM questions q
            LEFT JOIN options o ON q.id = o.question_id
            WHERE q.question_type IN ('MCQ', 'MCQ-Scenario', 'Cohort-05-MCQ')
            GROUP BY q.id
            HAVING SUM(CASE WHEN o.is_correct = 1 THEN 1 ELSE 0 END) = 0
          `;
          const mcqNoCorrectResult = AppState.database.exec(mcqNoCorrectSQL);
          if (mcqNoCorrectResult[0]?.values) {
            mcqNoCorrectResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, reason] = row;
              invalidQuestions.push({ id, question_text, question_type, topic, subtopic, reason });
            });
          }
        } catch (e) { console.log("Error checking MCQ no correct:", e); }
        
        // 2.5 AssertionReason without exactly 4 options
        try {
          const arWrongOptionsSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, COUNT(o.id) as opt_count, 'AssertionReason without 4 options' as reason
            FROM questions q
            LEFT JOIN options o ON q.id = o.question_id
            WHERE q.question_type = 'AssertionReason'
            GROUP BY q.id
            HAVING COUNT(o.id) <> 4
          `;
          const arWrongResult = AppState.database.exec(arWrongOptionsSQL);
          if (arWrongResult[0]?.values) {
            arWrongResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, opt_count, reason] = row;
              invalidQuestions.push({
                id, question_text, question_type, topic, subtopic, reason: `${reason} (found ${opt_count})`
              });
            });
          }
        } catch (e) { console.log("Error checking AssertionReason options:", e); }
        
        // 2.6 Match without dummy option
        try {
          const matchNoDummySQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 'Match without dummy option' as reason
            FROM questions q
            WHERE q.question_type = 'Match'
              AND NOT EXISTS (
                  SELECT 1 FROM options o
                  WHERE o.question_id = q.id AND o.option_text = 'Refer to match pairs'
              )
          `;
          const matchNoDummyResult = AppState.database.exec(matchNoDummySQL);
          if (matchNoDummyResult[0]?.values) {
            matchNoDummyResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, reason] = row;
              invalidQuestions.push({ id, question_text, question_type, topic, subtopic, reason });
            });
          }
        } catch (e) { console.log("Error checking Match dummy option:", e); }
        
        // === ADDITIONAL GAPS ===
        
        // Gap: Orphan questions with no associated records
        try {
          const orphanQuestionsSQL = `
            SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 'Orphan question with no options/match_pairs' as reason
            FROM questions q
            WHERE (q.question_type IN ('MCQ','MCQ-Multiple','MCQ-Scenario','Cohort-05-MCQ','TrueFalse','AssertionReason')
                   AND NOT EXISTS (SELECT 1 FROM options o WHERE o.question_id = q.id))
               OR (q.question_type = 'Match'
                   AND NOT EXISTS (SELECT 1 FROM match_pairs m WHERE m.question_id = q.id))
          `;
          const orphanResult = AppState.database.exec(orphanQuestionsSQL);
          if (orphanResult[0]?.values) {
            orphanResult[0].values.forEach(row => {
              const [id, question_text, question_type, topic, subtopic, reason] = row;
              invalidQuestions.push({ id, question_text, question_type, topic, subtopic, reason });
            });
          }
        } catch (e) { console.log("Error checking orphan questions:", e); }
        
        // Collect all valid questions (those not flagged as invalid)
        const invalidQuestionIds = new Set(invalidQuestions.map(q => q.id));
        allQuestions.forEach(q => {
          if (!invalidQuestionIds.has(q.id)) {
            validQuestions.push(q);
          }
        });
        
        console.log(`Valid questions: ${validQuestions.length}, Invalid: ${invalidQuestions.length}`);
        console.log(`Sample invalid questions:`, invalidQuestions.slice(0, 5));
        console.log(`========================================`);
        
        const totalValidQuestions = validQuestions.length;
        const totalInvalidQuestions = invalidQuestions.length;
        
        document.getElementById("maxQuestionsInfo").textContent = `Max: ${totalValidQuestions} question${totalValidQuestions === 1 ? '' : 's'} available for selection`;
        const answerAllBtnDb = document.getElementById("answerAllBtnDb");
        if (answerAllBtnDb && totalValidQuestions > 0) {
          answerAllBtnDb.textContent = `Answer all ${totalValidQuestions}`;
          answerAllBtnDb.title = `Set question count to maximum available (${totalValidQuestions})`;
          answerAllBtnDb.style.display = "inline-block";
          answerAllBtnDb.onclick = () => {
            document.getElementById("numQuestions").value = totalValidQuestions;
          };
        } else if (answerAllBtnDb) {
          answerAllBtnDb.style.display = "none";
        }
        const numInput = document.getElementById("numQuestions");
        numInput.max = totalValidQuestions;
        
        // Store invalid questions for the button
        AppState.currentInvalidQuestions = invalidQuestions;
        
        // Update the "View Invalid Questions" button
        const viewInvalidBtnContainer = document.getElementById("viewInvalidBtnContainer");
        if (viewInvalidBtnContainer) {
          // Clear any existing button
          viewInvalidBtnContainer.innerHTML = "";
          
          // Only create button if there are invalid questions
          if (invalidQuestions && invalidQuestions.length > 0) {
            const viewInvalidBtn = document.createElement("button");
            viewInvalidBtn.textContent = `View ${invalidQuestions.length} Invalid Questions`;
            viewInvalidBtn.className = "custom-btn";
            viewInvalidBtn.style.marginRight = "10px";
            viewInvalidBtn.style.backgroundColor = "#ff9800";
            viewInvalidBtn.style.color = "white";
            viewInvalidBtn.style.border = "1px solid #f57c00";
            viewInvalidBtn.title = "Show questions that failed validation and were excluded from the test";
            
            viewInvalidBtn.addEventListener("click", () => {
              showInvalidQuestionsPopup(AppState.currentInvalidQuestions, validQuestions.length + invalidQuestions.length);
            });
            
            viewInvalidBtnContainer.appendChild(viewInvalidBtn);
          }
        }
        
        // Auto-adjust the value if it exceeds the new maximum
        const currentValue = parseInt(numInput.value) || 0;
        if (currentValue < 1) {
          numInput.value = Math.min(10, totalValidQuestions);
        } else if (currentValue > totalValidQuestions) {
          numInput.value = totalValidQuestions;
        }
        
        // Disable start button if value < 1 or > max
        startBtn.disabled = (totalValidQuestions < 1 || parseInt(numInput.value) < 1 || parseInt(numInput.value) > totalValidQuestions);
        
        // Reset the flag
        updateMaxQuestions.isUpdating = false;
      }
      
      // Function to update question type counts based on selected topics/subtopics
      function updateQuestionTypeCounts() {
        // Get selected topic/subtopic combinations
        const selectAllTopics = document.getElementById("select-all-topics-db");
        let sql;
        
        if (selectAllTopics && selectAllTopics.checked) {
          // All topics and subtopics selected - use original total counts
          types.forEach((t, index) => {
            const typeLabel = typeDiv.querySelector(`input[value="${t}"]`);
            if (typeLabel && typeLabel.parentElement) {
              const span = typeLabel.parentElement.querySelector('span');
              if (span) {
                const originalCount = typeCountsArray[index];
                span.textContent = `(${originalCount} question${originalCount === 1 ? '' : 's'})`;
              }
            }
          });
        } else {
          // Build query based on individual subtopic selections
          const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
          
          if (selectedSubtopics.length === 0) {
            // No subtopics selected - show 0 for all types
            types.forEach((t) => {
              const typeLabel = typeDiv.querySelector(`input[value="${t}"]`);
              if (typeLabel && typeLabel.parentElement) {
                const span = typeLabel.parentElement.querySelector('span');
                if (span) {
                  span.textContent = `(0 questions)`;
                }
              }
            });
            return;
          }
          
          // Build conditions for selected subtopics
          const conditions = [];
          selectedSubtopics.forEach(subtopicCb => {
            const topic = subtopicCb.dataset.topic;
            const subtopic = subtopicCb.value;
            conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
          });
          
          // Update counts for each question type
          let totalFilteredForSelection = 0;
          const updatedCounts = [];
          
          types.forEach((t) => {
            const countSql = `SELECT COUNT(*) FROM questions WHERE (${conditions.join(' OR ')}) AND question_type = '${escapeSQL(t)}'`;
            const countRes = AppState.database.exec(countSql);
            const count = countRes[0]?.values[0][0] || 0;
            updatedCounts.push(count);
            totalFilteredForSelection += count;
            
            // Update the display
            const typeLabel = typeDiv.querySelector(`input[value="${t}"]`);
            if (typeLabel && typeLabel.parentElement) {
              const span = typeLabel.parentElement.querySelector('span');
              if (span) {
                span.textContent = `(${count} question${count === 1 ? '' : 's'})`;
              }
            }
          });
        }
        
        // Update the "Selected Types" count to reflect only checked types
        if (typeof updateSelectedTypesCountDB === 'function') {
          updateSelectedTypesCountDB();
        }
      }
      
      // Attach listeners to topic/type checkboxes and numQuestions input
      topicDiv.addEventListener("change", () => {
        updateQuestionTypeCounts();
        updateMaxQuestions();
      });
      typeDiv.addEventListener("change", () => {
        if (typeof updateSelectedTypesCountDB === 'function') {
          updateSelectedTypesCountDB();
        }
        updateMaxQuestions();
      });
      setTimeout(() => {
        const numInput = document.getElementById("numQuestions");
        if (numInput) numInput.addEventListener("input", updateMaxQuestions);
        updateMaxQuestions();
        // Initialize the Selected Types count
        if (typeof updateSelectedTypesCountDB === 'function') {
          updateSelectedTypesCountDB();
        }
      }, 0);
      
  // Create button container for Start Test button
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginTop = "20px";
  buttonContainer.style.textAlign = "center";
  
  // Create Reset to Defaults button for DB mode
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset to Defaults";
  resetBtn.className = "custom-btn";
  resetBtn.style.marginRight = "10px";
  resetBtn.style.backgroundColor = "#f5f5f5";
  resetBtn.style.color = "#333";
  resetBtn.style.border = "1px solid #ccc";
  
  resetBtn.addEventListener("click", () => {
    // Reset all selections to defaults
    
    // Reset to "All Topics and Subtopics"
    const selectAllTopics = document.getElementById("select-all-topics-db");
    if (selectAllTopics) {
      selectAllTopics.checked = true;
      selectAllTopics.dispatchEvent(new Event('change')); // Trigger the change event
    }
    
    // Reset types - check "All Types"
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    typeChecks.forEach((cb, i) => {
      cb.checked = i === 0; // Only check "All Types"
    });
    
    // Reset explanation mode to "Both when right and wrong" (value 2)
    const expRadios = expDiv.querySelectorAll("input[name=expMode]");
    expRadios.forEach(radio => {
      radio.checked = radio.value === "2";
    });
    
    // Reset behavior options to defaults
    document.getElementById("tryAgainOptionDb").checked = true;
    document.getElementById("topicRevealOptionDb").checked = true;
    document.getElementById("immediateResultOptionDb").checked = true;
    document.getElementById("correctAnswerOptionDb").checked = true;
    
    // Update AppState with default values
    AppState.allowTryAgain = true;
    AppState.showTopicSubtopic = true;
    AppState.showImmediateResult = true;
    AppState.showCorrectAnswer = true;
    AppState.explanationMode = 2; // "Both when right and wrong"
    
    // Clear persistent saved settings to prevent restoration
    AppState.savedDbOptions = null;
    
    // Update immediate result option state (trigger change event to apply DOM logic)
    document.getElementById("immediateResultOptionDb").dispatchEvent(new Event('change'));
    
    // Reset number of questions to default (10 or max available)
    const numInput = document.getElementById("numQuestionsDb");
    if (numInput) {
      numInput.value = 10;
    }
    
    // Reset selection mode to random
    const selectionModeRadios = modeDiv.querySelectorAll("input[name=selectionMode]");
    selectionModeRadios.forEach(radio => {
      radio.checked = radio.value === "random";
    });
    
    console.log("Reset all DB options to defaults");
  });
  
  buttonContainer.appendChild(resetBtn);
  
  // Create placeholder for "View Invalid Questions" button (will be added dynamically after validation)
  const viewInvalidBtnPlaceholder = document.createElement("span");
  viewInvalidBtnPlaceholder.id = "viewInvalidBtnContainer";
  buttonContainer.appendChild(viewInvalidBtnPlaceholder);
  
  buttonContainer.appendChild(startBtnContainer);
  
  wrapper.appendChild(topicDiv);
  wrapper.appendChild(typeDiv);
  wrapper.appendChild(expDiv);
  wrapper.appendChild(behaviorDiv);
  wrapper.appendChild(numDiv);
  wrapper.appendChild(modeDiv);
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

    // Utility: Show total question count in DB in file-chosen area for debugging
    function showTotalDbQuestions() {
      if (!AppState.database) return;
      const res = AppState.database.exec('SELECT COUNT(*) FROM questions');
      const total = res[0]?.values[0][0] || 0;
      document.getElementById('file-chosen').innerHTML = `<span style='color:#0078d7; font-weight:bold;'>Total questions in DB: ${total}</span>`;
    }
    // Call this after DB loads
    if (typeof showTotalDbQuestions === 'function') setTimeout(showTotalDbQuestions, 500);

    function startTest(filteredQuestions) {
      try {
        document.getElementById("file-chosen").innerHTML = "";
        const container = document.getElementById("test");
        container.innerHTML = "";
        
        // Hide the how-to-use guide when test starts
        const guideElement = document.getElementById("how-to-use-guide");
        if (guideElement) {
          guideElement.style.display = "none";
        }
        
        // Hide file selection buttons during test (Choose JSON and Choose DB)
        const chooseJsonLabel = document.querySelector('label[for="fileInput"]');
        const chooseDbButton = document.getElementById("chooseDb");
        if (chooseJsonLabel) {
          chooseJsonLabel.style.display = "none";
        }
        if (chooseDbButton) {
          chooseDbButton.style.display = "none";
        }
        
        document.getElementById("restart").style.display = "inline-block";
        document.getElementById("backToOptions").style.display = "inline-block";
        document.getElementById("newTestSameOptions").style.display = "inline-block";
        document.getElementById("newtest").style.display = "none";
        document.getElementById("scoreboard").innerHTML = "";
        AppState.score = 0;
        AppState.questionResults = []; // Reset question results for new test
        document.getElementById("test-title").innerHTML = "InsightPrep<br><span style='font-size: 0.75em; font-weight: normal; color: #e6f3ff; margin-top: 5px; display: inline-block;'>Where Preparation Meets Reflection</span>";
        // Scroll to top when test begins
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Absolute random shuffle for questions
        const shuffledQuestions = shuffle(filteredQuestions.map(q => ({ ...q })));
        // Absolute random shuffle for options in every question
        AppState.questions = shuffledQuestions.map(q => {
          if (q.options) q.options = shuffle([...q.options]);
          return q;
        });
        // Save last used filters for restart
        AppState.lastFilteredQuestions = AppState.questions.map(q => ({ ...q }));
        AppState.lastExplanationMode = AppState.explanationMode;
        renderTest(AppState.questions);
      } catch (err) {
        document.getElementById("file-chosen").innerHTML = `<pre style='color:red;'>Error rendering test: ${err.message}</pre>`;
        document.getElementById("test").innerHTML = "";
      }
    }

    function renderTest(questions) {
      try {
        if (!Array.isArray(questions) || questions.length === 0) {
          document.getElementById("file-chosen").innerHTML = `<pre style='color:red;'>Error: No questions to display. Please check your filters or database content.</pre>`;
          document.getElementById("test").innerHTML = "";
          return;
        }
        const container = document.getElementById("test");
        container.innerHTML = "";

        questions.forEach((q, qIndex) => {
          const qDiv = document.createElement("div");
          qDiv.className = "question-card";
          qDiv.id = `q-${q.id}`;
          qDiv.style.position = 'relative';

          const qTitle = document.createElement("h3");
          
          // Format question text to handle both numbered lists and Roman numerals
          function formatQuestionWithLists(questionText) {
            // Check for numbered lists (1., 2., 3., etc.)
            const numberedPattern = /\b\d+\.\s/g;
            const numberedMatches = questionText.match(numberedPattern);
            
            // Check for Roman numerals (I., II., III., IV., etc.)
            const romanNumeralPattern = /\b(I{1,3}V?|IV|V|VI{0,3}|IX|X{1,3})\.\s/g;
            const romanMatches = questionText.match(romanNumeralPattern);
            
            // Determine which pattern to use (numbered lists take precedence)
            if (numberedMatches && numberedMatches.length >= 2) {
              // Process numbered lists
              const firstMatch = questionText.match(/\b(\d+)\.\s/);
              const firstMatchIndex = questionText.indexOf(firstMatch[0]);
              
              // Split into main question and numbered parts
              const mainQuestion = questionText.substring(0, firstMatchIndex).trim();
              const numberedParts = questionText.substring(firstMatchIndex);
              
              // Split by looking for pattern "number. " and capture everything until the next number
              const items = [];
              const regex = /(\d+)\.\s([^]*?)(?=\d+\.\s|$)/g;
              let match;
              
              while ((match = regex.exec(numberedParts)) !== null) {
                items.push({
                  number: match[1],
                  content: match[2].trim()
                });
              }
              
              let formattedHTML = mainQuestion;
              
              items.forEach(item => {
                formattedHTML += `<div style="margin-left: 30px; font-size: 0.9em; font-weight: normal;"><strong>${item.number}.</strong> ${item.content}</div>`;
              });
              
              return formattedHTML;
            } 
            else if (romanMatches && romanMatches.length >= 2) {
              // Process Roman numerals (existing logic)
              const firstMatch = questionText.match(/\b(I{1,3}V?|IV|V|VI{0,3}|IX|X{1,3})\.\s/);
              const firstMatchIndex = questionText.indexOf(firstMatch[0]);
              
              // Split into main question and Roman numeral parts
              const mainQuestion = questionText.substring(0, firstMatchIndex).trim();
              const romanParts = questionText.substring(firstMatchIndex);
              
              // Process the Roman numeral parts
              const parts = romanParts.split(/\b(I{1,3}V?|IV|V|VI{0,3}|IX|X{1,3})\.\s/);
              
              let formattedHTML = mainQuestion;
              
              for (let i = 0; i < parts.length; i++) {
                if (parts[i] && parts[i].match(/^(I{1,3}V?|IV|V|VI{0,3}|IX|X{1,3})$/)) {
                  // This is a Roman numeral
                  const nextPart = parts[i + 1] ? parts[i + 1].trim() : '';
                  if (nextPart) {
                    formattedHTML += `<div style="margin-left: 30px; font-size: 0.9em; font-weight: normal;"><strong>${parts[i]}.</strong> ${nextPart}</div>`;
                    i++; // Skip the next part as we've already processed it
                  }
                }
              }
              
              return formattedHTML;
            }
            
            return questionText;
          }
          
          const formattedQuestion = formatQuestionWithLists(q.question);
          
          // Use innerHTML if the question was formatted, otherwise use textContent
          if (formattedQuestion !== q.question) {
            qTitle.innerHTML = `${qIndex + 1}. ${formattedQuestion}`;
          } else {
            qTitle.textContent = `${qIndex + 1}. ${q.question}`;
          }
          qDiv.appendChild(qTitle);

          if ((q.type === "single" || q.type === "assertion") && Array.isArray(q.options)) {
            q.options.forEach(opt => {
              const label = document.createElement("label");
              label.style.display = "block";
              const input = document.createElement("input");
              input.type = "radio";
              input.name = `q${q.id}`;
              input.value = opt;
              input.addEventListener("change", () => {
                handleAnswer(q, [opt], qDiv, qIndex);
              });
              label.appendChild(input);
              label.append(" " + opt);
              qDiv.appendChild(label);
            });
          } else if (q.type === "multiple" && Array.isArray(q.options)) {
            q.options.forEach(opt => {
              const label = document.createElement("label");
              label.style.display = "block";
              const input = document.createElement("input");
              input.type = "checkbox";
              input.name = `q${q.id}`;
              input.value = opt;
              label.appendChild(input);
              label.append(" " + opt);
              qDiv.appendChild(label);
              qDiv.appendChild(label);
            });

            const submitBtn = document.createElement("button");
            submitBtn.textContent = "Submit Answer";
            submitBtn.title = "Submit your selected answers for this question. You can select multiple options.";
            submitBtn.addEventListener("click", () => {
              const selected = Array.from(qDiv.querySelectorAll(`input[name="q${q.id}"]:checked`)).map(inp => inp.value);
              handleAnswer(q, selected, qDiv, qIndex);
            });
            qDiv.appendChild(submitBtn);
          } else if (q.type === "match" && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0) {
            createMatchQuestion(q, qDiv, qIndex);
          } else {
            qDiv.innerHTML += `<div style='color:red;'>Error: Question data is incomplete or malformed.</div>`;
          }

          container.appendChild(qDiv);
        });

        // After all question cards are created, set disabled/active classes
        questions.slice(1).forEach(q => {
          const el = document.getElementById(`q-${q.id}`);
          if (el) el.classList.add("disabled");
        });
        const firstEl = document.getElementById(`q-${questions[0]?.id}`);
        if (firstEl) firstEl.classList.add("active");
      } catch (err) {
        document.getElementById("file-chosen").innerHTML = `<pre style='color:red;'>Error rendering questions: ${err.message}</pre>`;
        document.getElementById("test").innerHTML = "";
      }
    }

    function handleAnswer(question, chosen, qDiv, qIndex) {
      if (qDiv.classList.contains("locked")) return;

      qDiv.classList.remove("active");
      qDiv.classList.add("locked");

      let isCorrect = false;

      if (question.type === "single" || question.type === "assertion") {
        isCorrect = (chosen[0] === question.answer);
      }
      else if (question.type === "multiple") {
        const correct = new Set(question.answer);
        const selected = new Set(chosen);
        isCorrect = (correct.size === selected.size && [...correct].every(x => selected.has(x)));
      }
      else if (question.type === "match") {
        isCorrect = JSON.stringify(chosen) === JSON.stringify(question.matchPairs);
      }

  // Remove any previous try-again container
  const prevTryContainer = qDiv.querySelector('.try-again-container');
  if (prevTryContainer) prevTryContainer.remove();

      // Remove all visible try again buttons for all questions
      document.querySelectorAll('[id^="try-again-outer-container-"]').forEach(el => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      
      if (isCorrect) {
        // Store the result for this question
        AppState.questionResults[qIndex] = { isCorrect: true, userAnswer: chosen };
        
        if (AppState.showImmediateResult) {
          qDiv.insertAdjacentHTML("beforeend", `<p class="correct">✅ Correct!</p>`);
          
          // Show explanation for correct answers if explanationMode is 2 (Both when right and wrong)
          console.log(`Debug: isCorrect=true, explanationMode=${AppState.explanationMode}, showImmediateResult=${AppState.showImmediateResult}`);
          console.log(`Debug: Should show explanation? ${AppState.explanationMode === 2}`);
          if (AppState.explanationMode === 2) {
            // Display the correct answer if enabled
            if (AppState.showCorrectAnswer) {
              if (question.type === "single" || question.type === "assertion") {
                // Handle case where answer might be an array even for single type
                const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
                qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
              } else if (question.type === "multiple") {
                const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
                qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
              } else if (question.type === "match") {
                // Convert matchPairs object to array of pairs for display
                const matchDisplay = Object.entries(question.matchPairs).map(([left, right]) => `${left} → ${right}`).join(', ');
                qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct matches: ${matchDisplay}</p>`);
              }
            }
            
            // Show explanation if available
            if (question.explanation) {
              qDiv.insertAdjacentHTML("beforeend", `<p class="explanation">💡 Explanation: ${question.explanation}</p>`);
            }
            
            // Show reference if available
            if (question.reference) {
              qDiv.insertAdjacentHTML("beforeend", `<p class="reference">📚 Reference: ${question.reference}</p>`);
            }
          }
        }
        AppState.score++;
        console.log(`Question ${qIndex + 1} answered correctly. Score: ${AppState.score}/${AppState.questions.length}`);
        // Unlock next question or show score
        const nextQ = document.getElementById(`q-${AppState.questions[qIndex + 1]?.id}`);
        console.log(`Looking for next question at index ${qIndex + 1}:`, nextQ ? "Found" : "Not found (this was the last question)");
        if (nextQ) {
          // Only enable the next question, keep all others after it disabled
          nextQ.classList.remove("disabled");
          nextQ.classList.remove("locked");
          nextQ.classList.add("active");
          
          // Ensure all questions after the next one remain disabled
          for (let i = qIndex + 2; i < AppState.questions.length; i++) {
            const laterQ = document.getElementById(`q-${AppState.questions[i].id}`);
            if (laterQ) {
              laterQ.classList.add('disabled');
              laterQ.classList.remove('active');
              laterQ.classList.remove('locked');
            }
          }
        } else {
          console.log("This was the last question! Calling showFinalScore()");
          showFinalScore();
        }
        // Always highlight next question after any answer
        setTimeout(() => {
          document.querySelectorAll('.question-card').forEach(card => {
            card.style.boxShadow = '';
            card.classList.remove('active');
          });
          if (nextQ) {
            nextQ.classList.add('active');
          }
        }, 10);
      } else {
        // Store the result for this question
        AppState.questionResults[qIndex] = { isCorrect: false, userAnswer: chosen };
        
        // Show wrong message - only if immediate result is enabled
        if (AppState.showImmediateResult) {
          qDiv.insertAdjacentHTML("beforeend", `<p class=\"wrong\">❌ <b>Wrong.</b></p>`);
        }
        
        // Enable the next question after wrong answer too, but keep all others disabled
        const nextQ = document.getElementById(`q-${AppState.questions[qIndex + 1]?.id}`);
        console.log(`Wrong answer on question ${qIndex + 1}. Looking for next question:`, nextQ ? "Found" : "Not found (this was the last question)");
        if (nextQ) {
          nextQ.classList.remove("disabled");
          nextQ.classList.remove("locked");
          nextQ.classList.remove("active"); // Don't make it active yet, user can choose to continue or retry
          
          // Ensure all questions after the next one remain disabled
          for (let i = qIndex + 2; i < AppState.questions.length; i++) {
            const laterQ = document.getElementById(`q-${AppState.questions[i].id}`);
            if (laterQ) {
              laterQ.classList.add('disabled');
              laterQ.classList.remove('active');
              laterQ.classList.remove('locked');
            }
          }
        } else {
          // This was the last question, even though answered wrong, show final score
          console.log("Last question answered incorrectly. Showing final score.");
          showFinalScore();
        }
        
        // Place Try Again button just below and close to the card, only if answered wrong AND if Try Again is enabled
        if (AppState.allowTryAgain) {
          // Remove any previous try again container for this card
          const prevTryAgain = document.getElementById('try-again-outer-container-' + qIndex);
          if (prevTryAgain && prevTryAgain.parentNode) {
            prevTryAgain.parentNode.removeChild(prevTryAgain);
          }
          const newOuter = document.createElement('div');
          newOuter.id = 'try-again-outer-container-' + qIndex;
          newOuter.style.display = 'flex';
          newOuter.style.justifyContent = 'flex-end';
          newOuter.style.marginTop = '-16px'; // bring closer to card
          newOuter.style.marginBottom = '24px';
          newOuter.style.width = qDiv.offsetWidth ? qDiv.offsetWidth + 'px' : '100%';
          const tryBtn = document.createElement('button');
          tryBtn.textContent = 'Try again';
          tryBtn.className = 'try-again-btn';
          tryBtn.style.background = '#ff9800';
          tryBtn.style.color = 'black';
          tryBtn.style.border = 'none';
          tryBtn.style.borderRadius = '4px';
          tryBtn.style.padding = '4px 12px';
          tryBtn.style.fontWeight = 'bold';
          tryBtn.style.cursor = 'pointer';
          tryBtn.title = 'Try this question again with shuffled options.';
          tryBtn.onclick = function() {
            // Remove the try again button container immediately
            const tryAgainContainer = document.getElementById('try-again-outer-container-' + qIndex);
            if (tryAgainContainer && tryAgainContainer.parentNode) {
              tryAgainContainer.parentNode.removeChild(tryAgainContainer);
            }
            Array.from(qDiv.children).forEach((el, idx) => { if (idx > 0) qDiv.removeChild(el); });
            qDiv.classList.remove('locked');
            let qCopy = { ...question };
            if (qCopy.options) qCopy.options = shuffle([...qCopy.options]);
            if (qCopy.type === 'match' && qCopy.matchPairs) {
              qCopy = { ...qCopy, matchPairs: { ...qCopy.matchPairs } };
            }
            renderSingleQuestion(qCopy, qDiv, qIndex);
            // Highlight the retried card only after pressing Try again
            setTimeout(() => {
              document.querySelectorAll('.question-card').forEach(card => {
                card.style.boxShadow = '';
                card.classList.remove('active');
              });
              qDiv.classList.add('active');
            }, 10);
          };
          newOuter.appendChild(tryBtn);
          // Insert after the card
          if (qDiv.parentNode) {
            if (qDiv.nextSibling) {
              qDiv.parentNode.insertBefore(newOuter, qDiv.nextSibling);
            } else {
              qDiv.parentNode.appendChild(newOuter);
            }
          }
        }
        // Always highlight and activate next question after any answer (even if wrong)
        setTimeout(() => {
          document.querySelectorAll('.question-card').forEach(card => {
            card.style.boxShadow = '';
            card.classList.remove('active');
          });
          if (nextQ) {
            nextQ.classList.add('active'); // Make next question active after wrong answer too
          }
        }, 10);
        // Show correct answer and explanation for wrong answers (based on explanation mode) - only if immediate results are enabled
        console.log(`Debug: isCorrect=${isCorrect}, explanationMode=${AppState.explanationMode}, showImmediateResult=${AppState.showImmediateResult}`);
        console.log(`Debug: Should show explanation? ${AppState.showImmediateResult && (AppState.explanationMode === 2 || (AppState.explanationMode === 1 && !isCorrect))}`);
        if (AppState.showImmediateResult && (AppState.explanationMode === 2 || (AppState.explanationMode === 1 && !isCorrect))) {
          // Display the correct answer - only if enabled
          if (AppState.showCorrectAnswer) {
            if (question.type === "single" || question.type === "assertion") {
              // Handle case where answer might be an array even for single type
              const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
              qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
            } else if (question.type === "multiple") {
              const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
              qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
            } else if (question.type === "match") {
              // Convert matchPairs object to array of pairs for display
              const matchDisplay = Object.entries(question.matchPairs).map(([left, right]) => `${left} → ${right}`).join(', ');
              qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct matches: ${matchDisplay}</p>`);
            }
          }
          
          if (question.explanation) {
            qDiv.insertAdjacentHTML("beforeend", `<p class="explanation">💡 Explanation: ${question.explanation}</p>`);
          }
          if (question.reference) {
            qDiv.insertAdjacentHTML("beforeend", `<p class="reference">📖 Reference: ${question.reference}</p>`);
          }
        }
      }
      
      // Add topic and subtopic information after answer (for both correct and incorrect) - only if enabled and immediate results are on
      if (AppState.showImmediateResult && AppState.showTopicSubtopic) {
        const topicSubtopicInfo = document.createElement("div");
        topicSubtopicInfo.className = "topic-subtopic-info";
        topicSubtopicInfo.style.cssText = "margin-top: 10px; padding: 8px; background: #f8f9fa; border-left: 1px solid #0078d7; font-size: 0.9em; color: #666;";
        
        let topicText = question.topic || "Unknown Topic";
        let subtopicText = question.subtopic || "General";
        
        topicSubtopicInfo.innerHTML = `<strong>Topic:</strong> ${topicText} | <strong>Subtopic:</strong> ${subtopicText}`;
        qDiv.appendChild(topicSubtopicInfo);
      }
    }

    // Helper to re-render a single question in place (for Try Again)
    function renderSingleQuestion(q, qDiv, qIndex) {
    // Remove all children except the title
    Array.from(qDiv.children).forEach((el, idx) => { if (idx > 0) qDiv.removeChild(el); });
    // Always reset state for retry
    qDiv.classList.remove('locked');
    qDiv.classList.remove('active');
    // Remove any previous try again button for this card (ensure it disappears on retry)
    const prevTryAgain = document.getElementById('try-again-outer-container-' + qIndex);
    if (prevTryAgain && prevTryAgain.parentNode) {
      prevTryAgain.parentNode.removeChild(prevTryAgain);
    }
    
    // Disable all questions below this one and remove any try-again buttons
    for (let i = qIndex + 1; i < AppState.questions.length; i++) {
      const nextQDiv = document.getElementById(`q-${AppState.questions[i].id}`);
      if (nextQDiv) {
        nextQDiv.classList.add('disabled');
        nextQDiv.classList.remove('locked');
        nextQDiv.classList.remove('active');
        
        // Remove any existing try-again buttons for questions below
        const nextTryAgain = document.getElementById('try-again-outer-container-' + i);
        if (nextTryAgain && nextTryAgain.parentNode) {
          nextTryAgain.parentNode.removeChild(nextTryAgain);
        }
        
        // Remove correct/wrong status messages from questions below
        const correctMsg = nextQDiv.querySelector('.correct');
        const wrongMsg = nextQDiv.querySelector('.wrong');
        if (correctMsg) correctMsg.remove();
        if (wrongMsg) wrongMsg.remove();
        
        // Remove explanation and reference from questions below
        const explanation = nextQDiv.querySelector('.explanation');
        const reference = nextQDiv.querySelector('.reference');
        if (explanation) explanation.remove();
        if (reference) reference.remove();
        
        // Remove topic/subtopic info from questions below
        const topicSubtopicInfo = nextQDiv.querySelector('.topic-subtopic-info');
        if (topicSubtopicInfo) topicSubtopicInfo.remove();
      }
    }
    
    // Ensure relative positioning for try again button
    qDiv.style.position = 'relative';
      if ((q.type === "single" || q.type === "assertion") && Array.isArray(q.options)) {
        q.options.forEach(opt => {
          const label = document.createElement("label");
          label.style.display = "block";
          const input = document.createElement("input");
          input.type = "radio";
          input.name = `q${q.id}_retry`;
          input.value = opt;
          input.addEventListener("change", () => {
            handleAnswer(q, [opt], qDiv, qIndex);
          });
          label.appendChild(input);
          label.append(" " + opt);
          qDiv.appendChild(label);
        });
      }
      else if (q.type === "multiple" && Array.isArray(q.options)) {
        q.options.forEach(opt => {
          const label = document.createElement("label");
          label.style.display = "block";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.name = `q${q.id}_retry`;
          input.value = opt;
          label.appendChild(input);
          label.append(" " + opt);
          qDiv.appendChild(label);
        });
        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit Answer";
        submitBtn.title = "Submit your selected answers for this question. You can select multiple options.";
        submitBtn.addEventListener("click", () => {
          const selected = Array.from(qDiv.querySelectorAll("input[type=checkbox][name='q" + q.id + "_retry']:checked"))
            .map(cb => cb.value);
          handleAnswer(q, selected, qDiv, qIndex);
        });
        qDiv.appendChild(submitBtn);
      }
      else if (q.type === "match" && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0) {
        createMatchQuestion(q, qDiv, qIndex);
      }

      // Highlight this card if not locked (for retry)
      setTimeout(() => {
        document.querySelectorAll('.question-card').forEach(card => {
          card.style.boxShadow = '';
          card.classList.remove('active');
        });
        if (!qDiv.classList.contains('locked')) {
          qDiv.classList.add('active');
        }
      }, 10);
  }

    function showFinalScore() {
      console.log("showFinalScore() called!");
      const total = AppState.questions.length;
      const percent = Math.round((AppState.score / total) * 100);
      console.log(`Final score: ${AppState.score}/${total} (${percent}%)`);

      let message = "";
      let cssClass = "";

      if (percent >= 90) {
        message = "🌟 Outstanding performance! You’ve clearly mastered the material.";
        cssClass = "excellent";
      } else if (percent >= 70) {
        message = "👍 Well done! You have a strong grasp, revise the missed parts.";
        cssClass = "good";
      } else if (percent >= 50) {
        message = "😊 Decent effort! Review the gaps and practice more.";
        cssClass = "fair";
      } else {
        message = "🙌 Keep trying! Revise basics and practice step by step.";
        cssClass = "poor";
      }

      document.getElementById("scoreboard").innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0078d7; margin: 0; font-size: 1.8em;">InsightPrep</h2>
          <p style="color: #666; margin: 5px 0 0 0; font-style: italic;">Where Preparation Meets Reflection</p>
        </div>
        <div><strong>Your Score:</strong> ${AppState.score} / ${total} (${percent}%)</div>
        <div id="message" class="${cssClass}">${message}</div>
      `;

      // If immediate results were OFF, now reveal the correct/incorrect status for each question
      if (!AppState.showImmediateResult) {
        // Save the current scroll position before adding content that might expand the page
        const scoreboardElement = document.getElementById("scoreboard");
        const currentScrollY = window.scrollY;
        const scoreboardOffsetTop = scoreboardElement.offsetTop;
        
        AppState.questions.forEach((question, qIndex) => {
          const qDiv = document.getElementById(`q-${question.id}`);
          if (qDiv && AppState.questionResults[qIndex]) {
            const result = AppState.questionResults[qIndex];
            
            // Remove any existing result indicators
            const existingResults = qDiv.querySelectorAll('.correct, .wrong, .correct-answer');
            existingResults.forEach(el => el.remove());
            
            // Add the result indicator
            if (result.isCorrect) {
              qDiv.insertAdjacentHTML("beforeend", `<p class="correct">✅ Correct!</p>`);
            } else {
              qDiv.insertAdjacentHTML("beforeend", `<p class="wrong">❌ <b>Wrong.</b></p>`);
            }
            
            // Show correct answers based on explanation mode and showCorrectAnswer setting
            if (AppState.showCorrectAnswer && (AppState.explanationMode === 2 || (AppState.explanationMode === 1 && !result.isCorrect))) {
              if (question.type === "match") {
                // Convert matchPairs object to array of pairs for display
                const matchDisplay = Object.entries(question.matchPairs).map(([left, right]) => `${left} → ${right}`).join(', ');
                qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct matches: ${matchDisplay}</p>`);
              } else if (question.type === "single" || question.type === "assertion") {
                // Handle case where answer might be an array even for single type
                const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
                qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
              } else if (question.type === "multiple") {
                const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
                qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
              }
            }
            
            // Show explanations and references based on explanation mode
            if (AppState.explanationMode === 2 || (AppState.explanationMode === 1 && !result.isCorrect)) {
              if (question.explanation) {
                qDiv.insertAdjacentHTML("beforeend", `<p class="explanation">💡 Explanation: ${question.explanation}</p>`);
              }
              if (question.reference) {
                qDiv.insertAdjacentHTML("beforeend", `<p class="reference">📖 Reference: ${question.reference}</p>`);
              }
            }
            
            // Add topic and subtopic information if enabled
            if (AppState.showTopicSubtopic) {
              // Remove any existing topic/subtopic info first
              const existingTopicInfo = qDiv.querySelector('.topic-subtopic-info');
              if (existingTopicInfo) existingTopicInfo.remove();
              
              const topicSubtopicInfo = document.createElement("div");
              topicSubtopicInfo.className = "topic-subtopic-info";
              topicSubtopicInfo.style.cssText = "margin-top: 10px; padding: 8px; background: #f8f9fa; border-left: 1px solid #0078d7; font-size: 0.9em; color: #666;";
              
              let topicText = question.topic || "Unknown Topic";
              let subtopicText = question.subtopic || "General";
              
              topicSubtopicInfo.innerHTML = `<strong>Topic:</strong> ${topicText} | <strong>Subtopic:</strong> ${subtopicText}`;
              qDiv.appendChild(topicSubtopicInfo);
            }
          }
        });
        
        // After adding all the answers and explanations, scroll to keep the scoreboard visible
        // Use a small timeout to ensure all DOM updates are complete
        setTimeout(() => {
          const scoreboardElement = document.getElementById("scoreboard");
          if (scoreboardElement) {
            // Scroll to show the scoreboard at the bottom of the viewport
            // This ensures the final score remains visible and users don't get confused
            scoreboardElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end',  // Align to bottom of viewport
              inline: 'nearest' 
            });
          }
        }, 100);
      }

      document.getElementById("restart").style.display = "inline-block";
      document.getElementById("restart-bottom").style.display = "inline-block";
      document.getElementById("backToOptions").style.display = "inline-block";
      document.getElementById("backToOptions-bottom").style.display = "inline-block";
      document.getElementById("newTestSameOptions").style.display = "inline-block";
      document.getElementById("newTestSameOptions-bottom").style.display = "inline-block";
      document.getElementById("newtest").style.display = "inline-block";
    }

    // Helper function to run database query and start test with current selections
    function rerunDatabaseTest() {
      if (!AppState.isDbMode) {
        // Not in database mode, just restart with last filtered questions
        if (AppState.lastFilteredQuestions && AppState.lastFilteredQuestions.length > 0) {
          AppState.explanationMode = AppState.lastExplanationMode;
          startTest(AppState.lastFilteredQuestions);
        }
        return;
      }

      // Check if we have stored query parameters
      if (!AppState.lastDbQueryParams) {
        alert("No previous query parameters found. Please use 'Back to Options' to select filters again.");
        return;
      }

      try {
        document.getElementById("file-chosen").innerHTML = "Loading new set of questions from database...";
        
        const params = AppState.lastDbQueryParams;
        AppState.explanationMode = params.explanationMode;
        
        // Build SQL query based on stored selections
        let sql2;
        
        if (params.isAllTopicsSelected) {
          // All topics and subtopics selected
          sql2 = `SELECT * FROM questions WHERE question_type IN (${params.selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
        } else {
          // Build query based on stored subtopic selections
          if (!params.selectedSubtopics || params.selectedSubtopics.length === 0) {
            alert("No stored subtopic selections found. Please use 'Back to Options' to select filters again.");
            return;
          }
          
          const conditions = [];
          params.selectedSubtopics.forEach(selection => {
            conditions.push(`(topic = '${escapeSQL(selection.topic)}' AND subtopic = '${escapeSQL(selection.subtopic)}')`);
          });
          
          sql2 = `SELECT * FROM questions WHERE (${conditions.join(' OR ')}) AND question_type IN (${params.selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
        }

        // Execute database query
        const res2 = AppState.database.exec(sql2);
        if (!res2.length) {
          document.getElementById("file-chosen").innerHTML = "No questions found in the database for the stored filters.";
          alert("No questions found in the database for the stored filters.");
          return;
        }

        // Process questions (same logic as original)
        let allQuestions = res2[0]?.values.map(row => {
          const obj = {};
          res2[0].columns.forEach((col, i) => obj[col] = row[i]);
          return obj;
        }) || [];

        // Build valid question objects (reuse the same logic)
        let validQuestions = [];
        allQuestions.forEach(q => {
          let valid = false;
          // MCQ and MCQ-Scenario and Cohort-05-MCQ: fetch options
          if (q.question_type === 'MCQ' || q.question_type === 'MCQ-Scenario' || q.question_type === 'Cohort-05-MCQ') {
            const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
            q.options = optRes[0]?.values?.map(v => v[0]) || [];
            // Fix: Handle both string and integer values for is_correct
            q.answer = optRes[0]?.values?.filter(v => v[1] === 1 || v[1] === "1")?.map(v => v[0]) || [];
            
            // Debug logging to identify the issue
            console.log(`Rerun Question ${q.id}: All options:`, q.options);
            console.log(`Rerun Question ${q.id}: Correct answers:`, q.answer);
            console.log(`Rerun Question ${q.id}: Raw option data:`, optRes[0]?.values);
            
            if (q.answer.length === 1) q.answer = q.answer[0];
            valid = q.options.length > 0;
            // Properly handle different MCQ types
            if (q.question_type === 'Cohort-05-MCQ') {
              // Cohort-05-MCQ can be single or multiple based on actual correct answers
              // Check before converting single answers to string
              const correctAnswersCount = Array.isArray(q.answer) ? q.answer.length : 1;
              q.type = correctAnswersCount > 1 ? 'multiple' : 'single';
            } else {
              q.type = (Array.isArray(q.answer) && q.answer.length > 1) ? 'multiple' : 'single';
            }
          }
          // TrueFalse: set options and answer
          if (q.question_type === 'TrueFalse') {
            q.options = ["True", "False"];
            const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
            const correctOpt = optRes[0]?.values.find(v => v[1] === 1);
            q.answer = correctOpt ? correctOpt[0] : null;
            valid = true;
            q.type = 'single';
          }
          // Match: fetch pairs
          if (q.question_type === 'Match') {
            const matchRes = AppState.database.exec(`SELECT left_text, right_text FROM match_pairs WHERE question_id = ${q.id}`);
            q.matchPairs = {};
            if (matchRes[0] && matchRes[0].values && matchRes[0].values.length > 0) {
              matchRes[0].values.forEach(v => { q.matchPairs[v[0]] = v[1]; });
              valid = Object.keys(q.matchPairs).length > 0;
            }
            q.type = 'match';
          }
          // AssertionReason: fetch options from options table
          if (q.question_type === 'AssertionReason') {
            const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
            if (optRes[0]?.values.length) {
              // For AssertionReason, we expect the first two options to be assertion and reason
              // and the remaining options to be the standard 5 choices
              const allOptions = optRes[0].values.map(row => row[0]);
              if (allOptions.length >= 7) { // 2 for assertion/reason + 5 standard options
                q.assertion = allOptions[0];
                q.reason = allOptions[1];
                q.options = allOptions.slice(2); // Take the 5 standard options
              } else {
                // Fallback: use all options as standard assertion-reason choices
                q.options = allOptions.length > 0 ? allOptions : [
                  "Both A and R are true, and R explains A",
                  "Both A and R are true, but R does not explain A",
                  "A is true, R is false",
                  "A is false, R is true",
                  "Both A and R are false"
                ];
                // Try to extract assertion and reason from question text or use defaults
                q.assertion = q.question_text || "Assertion not found";
                q.reason = "Reason not found";
              }
              // Find the correct answer from the options table
              const correctOption = optRes[0].values.find(row => row[1] === 1); // is_correct = 1
              q.answer = correctOption ? correctOption[0] : q.options[0];
              valid = true;
            }
            q.type = 'assertion';
          }
          q.question = q.question_text;
          if (valid) validQuestions.push(q);
        });

        // Apply selection mode and choose questions
        let chosenQuestions = [];
        if (params.mode === 'balanced') {
          // Use balanced selection logic (simplified version)
          validQuestions = shuffle(validQuestions);
          chosenQuestions = validQuestions.slice(0, params.numQuestions);
        } else {
          // Random selection
          validQuestions = shuffle(validQuestions);
          chosenQuestions = validQuestions.slice(0, params.numQuestions);
        }

        if (chosenQuestions.length === 0) {
          document.getElementById("file-chosen").innerHTML = "No valid questions found for the stored filters.";
          return;
        }

        document.getElementById("file-chosen").innerHTML = `Loaded ${chosenQuestions.length} new questions. Starting test...`;
        setTimeout(() => {
          startTest(chosenQuestions);
        }, 500);

      } catch (err) {
        alert("Error generating new questions: " + err.message);
        console.error("Error in rerunDatabaseTest:", err);
      }
    }

    // Set current year in footer
    document.addEventListener('DOMContentLoaded', function() {
      var y = new Date().getFullYear();
      var el = document.getElementById('swamys-copyright-year');
      if (el) el.textContent = y;
      
      // Initialize all event listeners after DOM is ready
      initializeEventListeners();
    });

    // Initialize all event listeners
    function initializeEventListeners() {
      // File input event listener for JSON files
      document.getElementById("fileInput").addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // If a test is already loaded, reset workflow instead of reload
        if (AppState.originalData !== null || AppState.questions.length > 0) {
          resetWorkflow();
        }
        
        // Don't hide the guide here - let buildFilterPanel handle it
        
        const reader = new FileReader();
        reader.onload = function(event) {
          try {
            const data = JSON.parse(event.target.result);
            AppState.originalData = data;
            AppState.isDbMode = false; // Set JSON mode flag
            document.getElementById("file-chosen").innerHTML =
              `✅ Test loaded: <strong>${data.title || file.name}</strong>`;
            
            // Reset options to defaults after successful JSON loading
            resetOptionsToDefaults();
            
            buildFilterPanel(data.questions);
          } catch (err) {
            alert("Invalid JSON file.");
            // Keep guide visible if file loading failed
          }
        };
        reader.readAsText(file);
        e.target.value = ""; // allow re-selecting the same file again
      });
      
      // Choose DB button event listener
      document.getElementById("chooseDb").addEventListener("click", async () => {
        // Ensure SQL.js is loaded before proceeding
        try {
          await loadSQLJS();
        } catch (error) {
          alert('Database library failed to load. Please refresh the page and try again.');
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
            console.log("=== DATABASE QUESTION TYPES DEBUG ===");
            console.log("All question types found in database:", allTypes);
            
            // Remove the filter that was excluding 'Cohort-05-Match' - let's include all types
            const types = allTypes.filter(type => type && type.trim() !== ''); // Only filter out empty/null types
            
            console.log("Question types after filtering:", types);
            console.log("Types that would have been excluded by old filter:", allTypes.filter(type => type === 'Cohort-05-Match'));
            console.log("==========================================");
            
            // Store for later use when going back to options
            AppState.dbTopics = topics;
            AppState.dbTypes = types;
            
            if (topics.length === 0 || types.length === 0) {
              document.getElementById("file-chosen").innerHTML = "No topics or question types found in the database.";
              return;
            }
            document.getElementById("file-chosen").innerHTML = `Database ready. Total questions: <strong>${totalQuestions}</strong>. Please select filters and number of questions.`;
            
            // Reset options to defaults after successful database loading
            resetOptionsToDefaults();
            
            buildDbFilterPanel(topics, types);
          } catch (err) {
            document.getElementById("file-chosen").innerHTML = "Error loading database: " + err.message;
          }
          document.body.removeChild(input);
        };
      });
      
      // Back to Start Page button event listener
      document.getElementById("backToStartFromOptions").addEventListener("click", () => {
        resetWorkflow();
      });
      
      // Restart button event listeners
      document.getElementById("restart").addEventListener("click", () => {
        // Use last filters and explanation mode for restart
        if (AppState.lastFilteredQuestions && AppState.lastFilteredQuestions.length > 0) {
          AppState.explanationMode = AppState.lastExplanationMode;
          startTest(AppState.lastFilteredQuestions);
        } else {
          startTest(AppState.originalData.questions);
        }
      });

      document.getElementById("restart-bottom").addEventListener("click", () => {
        // Use last filters and explanation mode for restart
        if (AppState.lastFilteredQuestions && AppState.lastFilteredQuestions.length > 0) {
          AppState.explanationMode = AppState.lastExplanationMode;
          startTest(AppState.lastFilteredQuestions);
        } else {
          startTest(AppState.originalData.questions);
        }
      });

      // Back to Options button event listeners
      document.getElementById("backToOptions").addEventListener("click", () => {
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
        
        // Reset the title
        document.getElementById("test-title").innerHTML = "InsightPrep<br><span style=\"font-size: 0.75em; font-weight: normal; color: #e6f3ff; margin-top: 5px; display: inline-block;\">Where Preparation Meets Reflection</span>";
        
        // Show appropriate message based on mode
        if (AppState.isDbMode) {
          // For database mode, show the ready message with total questions
          const totalQuestions = AppState.dbTotalQuestions || "Unknown";
          document.getElementById("file-chosen").innerHTML = `Database ready. Total questions: <strong>${totalQuestions}</strong>. Please select filters and number of questions.`;
          
          // Rebuild the filter panel if we have the data
          if (AppState.dbTopics && AppState.dbTypes) {
            buildDbFilterPanel(AppState.dbTopics, AppState.dbTypes, true); // Skip restore in function
            // Restore settings immediately when going back to options (no delay to prevent flicker)
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
          } else {
            // Fallback: fetch topics and types again
            try {
              const topicsRes = AppState.database.exec("SELECT DISTINCT topic FROM questions");
              const typesRes = AppState.database.exec("SELECT DISTINCT question_type FROM questions");
              const topics = topicsRes[0]?.values.map(v => v[0]) || [];
              const types = typesRes[0]?.values.map(v => v[0]) || [];
              AppState.dbTopics = topics;
              AppState.dbTypes = types;
              buildDbFilterPanel(topics, types, true); // Skip restore in function
              // Restore settings immediately when going back to options (no delay to prevent flicker)
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
            buildFilterPanel(AppState.originalData.questions, true); // Skip restore in function
            // Restore settings immediately when going back to options (no delay to prevent flicker)
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
          }
        }
        
        // Scroll to top to show the filter panel
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      document.getElementById("backToOptions-bottom").addEventListener("click", () => {
        // Same functionality as top button
        document.getElementById("backToOptions").click();
      });

      // New Test Same Options button event listeners
      document.getElementById("newTestSameOptions").addEventListener("click", () => {
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
      });

      document.getElementById("newTestSameOptions-bottom").addEventListener("click", () => {
        // Same functionality as top button
        document.getElementById("newTestSameOptions").click();
      });

      // New Test button event listener
      document.getElementById("newtest").addEventListener("click", () => {
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
        document.getElementById("fileInput").value = ""; // reset file input
      });
      
      // Close the initialization function
    }
