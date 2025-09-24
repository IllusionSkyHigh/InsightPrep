/**
 * ====================================================================
 * DATABASE MANAGER MODULE
 * ====================================================================
 * 
 * Purpose: Secure database operations and SQLite management for InsightPrep MockTest
 * 
 * This module provides comprehensive database functionality for the MockTest
 * application, handling all SQLite database interactions with security and
 * efficiency as primary concerns.
 * 
 * Key Responsibilities:
 * 
 * 1. SECURE QUERY EXECUTION:
 *    - Parameterized query execution to prevent SQL injection
 *    - Single and batch query operations with proper resource management
 *    - Statement preparation, binding, and cleanup
 * 
 * 2. INPUT VALIDATION & SANITIZATION:
 *    - String escaping for SQL safety
 *    - Input validation against allowed values
 *    - Type checking and conversion
 * 
 * 3. DATABASE CONNECTION MANAGEMENT:
 *    - SQLite database initialization and configuration
 *    - Connection lifecycle management
 *    - Resource cleanup and memory management
 * 
 * 4. QUERY UTILITIES:
 *    - Database metadata queries (count, schema info)
 *    - Test execution queries with filtering
 *    - Question retrieval and validation
 * 
 * 5. ERROR HANDLING:
 *    - Comprehensive error catching and logging
 *    - User-friendly error messages
 *    - Graceful degradation on database failures
 * 
 * Security Features:
 * - SQL injection prevention through parameterized queries
 * - Input validation and sanitization
 * - Safe string escaping for dynamic queries
 * - Error handling that doesn't expose sensitive information
 * 
 * Performance Features:
 * - Prepared statement reuse
 * - Efficient resource management
 * - Optimized query execution patterns
 * - Memory leak prevention
 * 
 * Dependencies: 
 * - app-state.js (for AppState access)
 * - SQL.js library (loaded dynamically)
 * 
 * Used by: 
 * - filter-panels.js (for database metadata)
 * - test-engine.js (for question retrieval)
 * - event-handlers.js (for database operations)
 * 
 * Author: InsightPrep Development Team
 * Version: 2.0.0
 * Last Updated: September 2025
 * ====================================================================
 */

// ============================================
// SECURE QUERY EXECUTION
// ============================================

/**
 * Executes a secure parameterized SQL query returning a single result
 * Uses prepared statements to prevent SQL injection attacks
 * 
 * @param {Database} database - The SQLite database instance
 * @param {string} query - The SQL query with parameter placeholders
 * @param {Array} params - Array of parameters to bind to the query
 * @returns {Object} Single result object from the query
 * @throws {Error} If query execution fails
 */
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

/**
 * Executes a secure parameterized SQL query returning multiple results
 * Uses prepared statements with proper resource management
 * 
 * @param {Database} database - The SQLite database instance
 * @param {string} query - The SQL query with parameter placeholders
 * @param {Array} params - Array of parameters to bind to the query
 * @returns {Array} Array of result objects from the query
 * @throws {Error} If query execution fails
 */
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

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Escapes SQL string literals to prevent injection attacks
 * Doubles single quotes as per SQL standard
 * 
 * @param {string} value - The string value to escape
 * @returns {string} SQL-safe escaped string
 */
function escapeSQLString(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/'/g, "''");
}

/**
 * Validates database input against allowed values and escapes if needed
 * Provides both whitelist validation and SQL escaping
 * 
 * @param {string} input - The input value to validate
 * @param {Array} allowedValues - Optional array of allowed values for whitelist validation
 * @returns {string} Validated and escaped input
 * @throws {Error} If input is not in allowed values list
 */
function validateDatabaseInput(input, allowedValues = null) {
  if (allowedValues && !allowedValues.includes(input)) {
    throw new Error('Invalid database input');
  }
  return escapeSQLString(input);
}

// ============================================
// DATABASE UTILITY FUNCTIONS
// ============================================

/**
 * Displays total question count in database for debugging purposes
 * Updates the file-chosen element with current database statistics
 */
function showTotalDbQuestions() {
  if (!AppState.database) return;
  
  try {
    const res = AppState.database.exec('SELECT COUNT(*) FROM questions');
    const total = res[0]?.values[0][0] || 0;
    const fileChosenElement = document.getElementById('file-chosen');
    if (fileChosenElement) {
      fileChosenElement.innerHTML = `<span style='color:#0078d7; font-weight:bold;'>Total questions in DB: ${total}</span>`;
    }
  } catch (error) {
    console.error('Error getting database question count:', error);
  }
}

/**
 * Gets database metadata including topics, subtopics, and question types
 * Used for building filter panels and validation
 * 
 * @param {Database} database - The SQLite database instance
 * @returns {Object} Object containing topics, subtopics, and types arrays
 */
function getDatabaseMetadata(database) {
  try {
    // Get unique topics
    const topicsResult = database.exec('SELECT DISTINCT topic FROM questions WHERE topic IS NOT NULL ORDER BY topic');
    const topics = topicsResult[0]?.values?.map(row => row[0]) || [];
    
    // Get unique subtopics with their topics
    const subtopicsResult = database.exec('SELECT DISTINCT topic, subtopic FROM questions WHERE topic IS NOT NULL AND subtopic IS NOT NULL ORDER BY topic, subtopic');
    const subtopics = subtopicsResult[0]?.values?.map(row => ({ topic: row[0], subtopic: row[1] })) || [];
    
    // Get unique question types
    const typesResult = database.exec('SELECT DISTINCT type FROM questions WHERE type IS NOT NULL ORDER BY type');
    const types = typesResult[0]?.values?.map(row => row[0]) || [];
    
    return { topics, subtopics, types };
  } catch (error) {
    console.error('Error getting database metadata:', error);
    return { topics: [], subtopics: [], types: [] };
  }
}

/**
 * Builds a parameterized query for retrieving filtered questions from database
 * Creates secure WHERE clause with proper parameter binding
 * 
 * @param {Object} filters - Object containing filter criteria
 * @param {Array} filters.topics - Selected topics
 * @param {Array} filters.subtopics - Selected subtopics  
 * @param {Array} filters.types - Selected question types
 * @param {number} filters.limit - Maximum number of questions
 * @param {string} filters.selectionMode - 'random' or 'sequential'
 * @returns {Object} Object with query string and parameters array
 */
function buildFilteredQuery(filters) {
  let query = 'SELECT * FROM questions WHERE 1=1';
  const params = [];
  
  // Add topic filtering
  if (filters.topics && filters.topics.length > 0) {
    const topicPlaceholders = filters.topics.map(() => '?').join(',');
    query += ` AND topic IN (${topicPlaceholders})`;
    params.push(...filters.topics);
  }
  
  // Add subtopic filtering  
  if (filters.subtopics && filters.subtopics.length > 0) {
    const subtopicConditions = filters.subtopics.map(() => '(topic = ? AND subtopic = ?)').join(' OR ');
    query += ` AND (${subtopicConditions})`;
    filters.subtopics.forEach(st => {
      params.push(st.topic, st.subtopic);
    });
  }
  
  // Add type filtering
  if (filters.types && filters.types.length > 0) {
    const typePlaceholders = filters.types.map(() => '?').join(',');
    query += ` AND question_type IN (${typePlaceholders})`;
    params.push(...filters.types);
  }
  
  // Add ordering
  if (filters.selectionMode === 'random') {
    query += ' ORDER BY RANDOM()';
  } else {
    query += ' ORDER BY id';
  }
  
  // Add limit
  if (filters.limit && filters.limit > 0) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  return { query, params };
}

/**
 * Validates question data structure for completeness and correctness
 * Ensures required fields are present and properly formatted
 * 
 * @param {Object} question - Question object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateQuestionData(question) {
  const errors = [];
  
  if (!question.id) errors.push('Missing question ID');
  if (!question.question || typeof question.question !== 'string') {
    errors.push('Missing or invalid question text');
  }
  if (!question.type) errors.push('Missing question type');
  
  // Type-specific validation
  if (question.type === 'single' || question.type === 'multiple') {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push('Single/multiple choice questions need at least 2 options');
    }
  }
  
  if (question.type === 'match') {
    if (!question.matchPairs || typeof question.matchPairs !== 'object') {
      errors.push('Match questions need matchPairs object');
    }
  }
  
  if (!question.answer) errors.push('Missing answer');
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// ============================================
// DATABASE QUERY OPERATIONS
// ============================================

/**
 * Reruns the last database test query with the same parameters
 * Used for "New Questions (Same Options)" functionality
 */
function rerunDatabaseTest() {
  if (!AppState.isDbMode) {
    // Not in database mode, just restart with last filtered questions
    if (AppState.lastFilteredQuestions && AppState.lastFilteredQuestions.length > 0) {
      AppState.explanationMode = AppState.lastExplanationMode;
      if (typeof startTest === 'function') {
        startTest(AppState.lastFilteredQuestions);
      }
    }
    return;
  }

  // Check if we have stored query parameters
  if (!AppState.lastDbQueryParams) {
    alert("No previous query parameters found. Please use 'Back to Options' to select filters again.");
    return;
  }

  try {
    const params = AppState.lastDbQueryParams;
    const questionCount = params.numQuestions || 10;
    
    // Create and display prominent loading message at the top of the test area
    const testArea = document.getElementById("test");
    if (testArea) {
      const loadingMessage = document.createElement("div");
      loadingMessage.id = "loading-message";
      loadingMessage.style.cssText = `
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      `;
      loadingMessage.innerHTML = `Loading ${questionCount} fresh questions...`;
      document.body.appendChild(loadingMessage);
      
      // Add animation keyframes if not already present
      if (!document.getElementById('loading-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-styles';
        style.textContent = `
          @keyframes slideIn {
            from { 
              top: 70px; 
              opacity: 0; 
              transform: translateX(-50%) translateY(-10px); 
            }
            to { 
              top: 120px; 
              opacity: 1; 
              transform: translateX(-50%) translateY(0); 
            }
          }
          @keyframes slideOut {
            from { 
              top: 120px; 
              opacity: 1; 
              transform: translateX(-50%) translateY(0); 
            }
            to { 
              top: 70px; 
              opacity: 0; 
              transform: translateX(-50%) translateY(-10px); 
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Also update file-chosen as fallback
    const fileChosenElement = document.getElementById("file-chosen");
    if (fileChosenElement) {
      fileChosenElement.innerHTML = `<span style="color: #4caf50; font-weight: bold;">Loading ${questionCount} fresh questions...</span>`;
    }
    
    AppState.explanationMode = params.explanationMode;
    
    // Update behavior options in AppState
    AppState.allowTryAgain = params.allowTryAgain;
    AppState.showTopicSubtopic = params.showTopicSubtopic;
    AppState.showImmediateResult = params.showImmediateResult;
    AppState.showCorrectAnswer = params.showCorrectAnswer;
    
    // Build and execute the query
    const queryFilters = {
      topics: params.selectedTopics,
      subtopics: params.selectedSubtopics,
      types: params.selectedTypes,
      limit: params.numQuestions,
      selectionMode: params.selectionMode
    };
    
    console.log('Building query with filters:', queryFilters);
    const { query, params: queryParams } = buildFilteredQuery(queryFilters);
    console.log('Generated query:', query);
    console.log('Query parameters:', queryParams);
    
    const results = executeSecureQueryAll(AppState.database, query, queryParams);
    
    if (results.length === 0) {
      if (fileChosenElement) {
        fileChosenElement.innerHTML = "No questions found matching your criteria. Please adjust your filters.";
      }
      return;
    }
    
    // Transform questions using the same logic as the original Start Test
    const transformedQuestions = results.map(q => {
      // Standardize question text field
      q.question = q.question_text;
      
      // Process different question types
      if (q.question_type === 'MCQ' || q.question_type === 'MCQ-Scenario' || q.question_type === 'Cohort-05-MCQ' || q.question_type === 'MCQ-Multiple') {
        // Fetch options from options table
        const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id} ORDER BY id`);
        q.options = optRes[0]?.values?.map(v => v[0]) || [];
        
        // Get correct answers (handle both string and integer values for is_correct)
        q.answer = optRes[0]?.values?.filter(v => v[1] === 1 || v[1] === "1")?.map(v => v[0]) || [];
        
        // For single choice, convert array to single value
        if (q.answer.length === 1) {
          q.answer = q.answer[0];
        }
        
        // Set type based on number of correct answers
        if (q.question_type === 'MCQ-Multiple') {
          q.type = 'multiple';
        } else {
          q.type = (Array.isArray(q.answer) && q.answer.length > 1) ? 'multiple' : 'single';
        }
        
      } else if (q.question_type === 'TrueFalse') {
        q.options = ["True", "False"];
        q.type = 'single';
        
        // Fetch correct answer from options table
        const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id}`);
        const correctOpt = optRes[0]?.values?.find(v => v[1] === 1 || v[1] === "1");
        q.answer = correctOpt ? correctOpt[0] : null;
        
      } else if (q.question_type === 'Match') {
        q.type = 'match';
        
        // Fetch match pairs from match_pairs table
        const matchRes = AppState.database.exec(`SELECT left_text, right_text FROM match_pairs WHERE question_id = ${q.id} ORDER BY id`);
        if (matchRes[0]?.values) {
          q.matchPairs = {};
          matchRes[0].values.forEach(([left, right]) => {
            q.matchPairs[left] = right;
          });
          q.options = ["Refer to match pairs"]; // Placeholder for compatibility
          q.answer = q.matchPairs;
        }
        
      } else if (q.question_type === 'AssertionReason') {
        q.type = 'assertion';
        
        // Fetch options from options table
        const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id} ORDER BY id`);
        q.options = optRes[0]?.values?.map(v => v[0]) || [];
        const correctOpt = optRes[0]?.values?.find(v => v[1] === 1 || v[1] === "1");
        q.answer = correctOpt ? correctOpt[0] : null;
      }
      
      return q;
    });
    
    console.log(`Question transformation complete: ${transformedQuestions.length} questions processed`);
    
    // Update loading message before starting test
    if (fileChosenElement) {
      fileChosenElement.innerHTML = `<span style="color: #4caf50; font-weight: bold;">Starting test with ${transformedQuestions.length} fresh questions...</span>`;
    }
    
    // Start the test with transformed questions (same as original Start Test logic)
    if (typeof startTest === 'function') {
      startTest(transformedQuestions);
      
      // Remove loading message after test starts
      setTimeout(() => {
        const loadingMessage = document.getElementById("loading-message");
        if (loadingMessage) {
          // Ensure smooth exit animation
          loadingMessage.style.animation = 'slideOut 0.4s ease-in-out forwards';
          loadingMessage.addEventListener('animationend', () => {
            if (loadingMessage.parentNode) {
              loadingMessage.remove();
            }
          });
        }
        
        // Clear file-chosen message
        const fileChosenElement = document.getElementById("file-chosen");
        if (fileChosenElement) {
          fileChosenElement.innerHTML = "";
        }
      }, 500);
    }
    
  } catch (error) {
    console.error('Error rerunning database test:', error);
    const fileChosenElement = document.getElementById("file-chosen");
    if (fileChosenElement) {
      fileChosenElement.innerHTML = `<span style="color: red;">Error loading questions: ${error.message}</span>`;
    }
  }
}

// ============================================
// INITIALIZATION AND UTILITIES
// ============================================

/**
 * Initializes database operations when module loads
 * Sets up event listeners and utility functions
 */
function initializeDatabaseManager() {
  // Set up automatic total display after database loads
  if (typeof showTotalDbQuestions === 'function') {
    setTimeout(showTotalDbQuestions, 500);
  }
  
  console.log('Database Manager module initialized');
}