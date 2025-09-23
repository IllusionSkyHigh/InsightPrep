/**
 * ====================================================================
 * CORE UTILITIES MODULE
 * ====================================================================
 * 
 * Purpose: Foundation utilities and library management for InsightPrep MockTest
 * 
 * This module provides essential utility functions that form the foundation
 * of the MockTest application. It contains:
 * 
 * 1. SECURITY UTILITIES:
 *    - SQL injection prevention through string escaping
 *    - HTML/XSS protection through text sanitization
 * 
 * 2. LIBRARY MANAGEMENT:
 *    - Dynamic loading of SQL.js for database functionality
 *    - Promise-based library initialization
 * 
 * 3. DATA MANIPULATION:
 *    - Array randomization/shuffling algorithms
 *    - Efficient Fisher-Yates shuffle implementation
 * 
 * 4. DOM UTILITIES:
 *    - Safe element creation and text content setting
 *    - Efficient DOM manipulation using DocumentFragment
 *    - Memory-safe element clearing
 * 
 * 5. LAYOUT UTILITIES:
 *    - Window state detection (maximized/windowed)
 *    - Dynamic copyright positioning based on window state
 * 
 * 6. SPECIALIZED COMPONENTS:
 *    - Match question renderer for interactive question types
 *    - Dropdown-based matching interface creation
 * 
 * Dependencies: None (standalone foundation module)
 * Used by: All other modules in the application
 * 
 * Author: InsightPrep Development Team
 * Version: 2.0.0
 * Last Updated: September 2025
 * ====================================================================
 */

// ============================================
// SECURITY & SANITIZATION UTILITIES
// ============================================

/**
 * Escapes SQL string to prevent SQL injection attacks
 * @param {string} str - The string to escape
 * @returns {string} SQL-safe escaped string
 */
function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

/**
 * Sanitizes text content to prevent XSS attacks
 * @param {string} text - The text to sanitize
 * @returns {string} HTML-safe sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ============================================
// LIBRARY MANAGEMENT
// ============================================

/**
 * Dynamically loads SQL.js library for database functionality
 * @returns {Promise} Promise that resolves when SQL.js is loaded
 */
function loadSQLJS() {
  return new Promise((resolve, reject) => {
    // Check if SQL.js is already loaded
    if (typeof initSqlJs !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load SQL.js library'));
    document.head.appendChild(script);
  });
}

// ============================================
// DATA MANIPULATION UTILITIES
// ============================================

/**
 * Fisher-Yates shuffle algorithm for array randomization
 * @param {Array} array - The array to shuffle (modified in place)
 * @returns {Array} The shuffled array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================
// DOM MANIPULATION UTILITIES
// ============================================

/**
 * Safely sets text content without HTML injection risk
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The text content to set
 */
function setTextContent(element, text) {
  element.textContent = text || '';
}

/**
 * Creates DOM elements safely with optional text and class
 * @param {string} tagName - The HTML tag name
 * @param {string} textContent - Optional text content
 * @param {string} className - Optional CSS class name
 * @returns {HTMLElement} The created element
 */
function createElement(tagName, textContent = '', className = '') {
  const element = document.createElement(tagName);
  if (textContent) setTextContent(element, textContent);
  if (className) element.className = className;
  return element;
}

/**
 * Efficiently appends multiple elements using DocumentFragment
 * @param {HTMLElement} parent - The parent element
 * @param {Array<HTMLElement>} elements - Array of elements to append
 */
function appendMultipleElements(parent, elements) {
  const fragment = document.createDocumentFragment();
  elements.forEach(element => fragment.appendChild(element));
  parent.appendChild(fragment);
}

/**
 * Safely clears all child elements from a container
 * @param {HTMLElement} element - The element to clear
 */
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// ============================================
// LAYOUT & WINDOW UTILITIES
// ============================================

/**
 * Detects if the browser window is maximized
 * @returns {boolean} True if window appears to be maximized
 */
function isWindowMaximized() {
  // Heuristic: window outer size nearly equals screen size
  return (
    Math.abs(window.outerWidth - screen.availWidth) < 8 &&
    Math.abs(window.outerHeight - screen.availHeight) < 8
  );
}

/**
 * Updates copyright card positioning based on window state
 * Shows as positioned card when maximized, sticky footer otherwise
 */
function updateCopyrightCardPosition() {
  const body = document.body;
  if (isWindowMaximized()) {
    // When maximized, show as regular positioned card
    body.classList.remove('sticky-footer');
    body.classList.remove('hide-copyright-card');
  } else {
    // When windowed, use sticky footer
    body.classList.add('sticky-footer');
    body.classList.remove('hide-copyright-card');
  }
}

// ============================================
// SPECIALIZED COMPONENT RENDERERS
// ============================================

/**
 * Creates interactive match question interface with dropdowns
 * @param {Object} question - The question object with matchPairs
 * @param {HTMLElement} questionDiv - The container element
 * @param {number} questionIndex - The question index for event handling
 */
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

// ============================================
// HEADER MANAGEMENT
// ============================================

/**
 * Updates the header title while preserving the logo
 * Provides consistent header updates across all pages
 * 
 * @param {string} titleText - The title text to display
 */
function updateHeaderTitle(titleText = "InsightPrep<br><span style='font-size: 0.75em; font-weight: normal; color: #e6f3ff; margin-top: 5px; display: inline-block;'>Where Preparation Meets Reflection</span>") {
  const headerContent = document.querySelector("#test-title .header-content");
  if (headerContent) {
    headerContent.innerHTML = titleText;
  } else {
    // Fallback for compatibility with older header structure
    document.getElementById("test-title").innerHTML = titleText;
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Load SQL.js library immediately when module loads
loadSQLJS().catch(error => {
  console.error('Error loading SQL.js:', error);
  alert('Failed to load database library. Database features will not work.');
});

// Set up window resize listener for copyright positioning
window.addEventListener('resize', updateCopyrightCardPosition);
window.addEventListener('load', updateCopyrightCardPosition);