/**
 * ====================================================================
 * TEST ENGINE MODULE
 * ====================================================================
 * 
 * Purpose: Core test execution, question rendering, and scoring engine for InsightPrep MockTest
 * 
 * This module handles the complete test lifecycle from initialization to final
 * scoring. It provides the core functionality for running interactive tests
 * with various question types and real-time feedback systems.
 * 
 * Key Responsibilities:
 * 
 * 1. TEST LIFECYCLE MANAGEMENT:
 *    - Test initialization and setup
 *    - Question shuffling and randomization
 *    - UI state management during test execution
 *    - Final scoring and results presentation
 * 
 * 2. QUESTION RENDERING:
 *    - Dynamic question card generation
 *    - Support for multiple question types (single, multiple, match, assertion)
 *    - Advanced question text formatting (numbered lists, Roman numerals)
 *    - Interactive form elements and event handling
 * 
 * 3. ANSWER PROCESSING:
 *    - Real-time answer validation and scoring
 *    - Support for immediate and delayed feedback modes
 *    - Try Again functionality with option reshuffling
 *    - Progress tracking and state persistence
 * 
 * 4. QUESTION TYPE SUPPORT:
 *    - Single Choice (MCQ): Radio button selection
 *    - Multiple Choice: Checkbox selection with submit
 *    - Matching: Dropdown-based pair matching
 *    - Assertion-Reason: Specialized logic validation
 * 
 * 5. INTERACTIVE FEATURES:
 *    - Question-by-question progression
 *    - Visual feedback (correct/incorrect indicators)
 *    - Explanation and reference display
 *    - Topic/subtopic information reveal
 *    - Try Again functionality for incorrect answers
 * 
 * 6. SCORING & RESULTS:
 *    - Real-time score calculation
 *    - Performance categorization (Excellent, Good, Fair, Poor)
 *    - Detailed results with explanations
 *    - Final score presentation with motivational messaging
 * 
 * Rendering Features:
 * - Responsive question cards with consistent styling
 * - Advanced text formatting for complex questions
 * - Automatic option shuffling for fairness
 * - Progressive disclosure of questions
 * - Visual highlighting of active questions
 * 
 * Answer Processing Features:
 * - Secure answer validation
 * - Immediate vs delayed feedback modes
 * - Configurable explanation display
 * - Try Again with reshuffled options
 * - Question result tracking
 * 
 * Dependencies:
 * - app-state.js (for AppState access and configuration)
 * - core-utils.js (for DOM utilities and shuffling)
 * - database-manager.js (for rerunDatabaseTest functionality)
 * 
 * Used by:
 * - event-handlers.js (for test initiation)
 * - filter-panels.js (for starting filtered tests)
 * 
 * Author: InsightPrep Development Team
 * Version: 2.0.0
 * Last Updated: September 2025
 * ====================================================================
 */

// ============================================
// TEST INITIALIZATION & SETUP
// ============================================

/**
 * Validates a question object for completeness and correctness
 * @param {Object} question - Question object to validate
 * @returns {Object} - {isValid: boolean, reason: string}
 */
function validateQuestion(question) {
  try {
    // Check if question exists
    if (!question) {
      return { isValid: false, reason: "Question is null or undefined" };
    }
    
    // Check required fields - support both database and JSON field names
    const questionText = question.question_text || question.question;
    if (!questionText || questionText.trim() === "") {
      return { isValid: false, reason: "Missing question text" };
    }
    
    const questionType = question.question_type || question.type;
    if (!questionType) {
      return { isValid: false, reason: "Missing question type" };
    }
    
    if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
      return { isValid: false, reason: "Missing or empty options array" };
    }
    
    // Check for valid answer depending on question type
    const isMCQType = (questionType === "MCQ" || questionType === "MCQ-Scenario" || questionType === "Cohort-05-MCQ" || questionType === "MCQ-Multiple" || questionType === "single" || questionType === "multiple" || questionType === "assertion");
    
    if (isMCQType) {
      if (question.answer === undefined || question.answer === null) {
        return { isValid: false, reason: "Missing answer field" };
      }
      
      // For single choice MCQs and assertion, answer should be one of the option texts
      const isSingleAnswer = !Array.isArray(question.answer);
      if (isSingleAnswer || questionType === "assertion") {
        const answerToCheck = isSingleAnswer ? question.answer : question.answer[0];
        if (!question.options.includes(answerToCheck)) {
          return { isValid: false, reason: `Answer "${answerToCheck}" not found in options: [${question.options.join(', ')}]` };
        }
      }
      
      // For multiple choice, answer should be an array of option texts
      if (Array.isArray(question.answer)) {
        for (const ans of question.answer) {
          if (!question.options.includes(ans)) {
            return { isValid: false, reason: `Answer "${ans}" not found in options` };
          }
        }
      }
    }
    
    // Check for minimum number of options
    if (question.options.length < 2) {
      return { isValid: false, reason: "Question must have at least 2 options" };
    }
    
    // Check that options are not empty
    for (let i = 0; i < question.options.length; i++) {
      if (!question.options[i] || question.options[i].trim() === "") {
        return { isValid: false, reason: `Option ${i + 1} is empty` };
      }
    }
    
    return { isValid: true, reason: "" };
    
  } catch (error) {
    return { isValid: false, reason: `Validation error: ${error.message}` };
  }
}

/**
 * Updates the Invalid Questions button display
 * @param {Array} invalidQuestions - Array of invalid question objects
 * @param {number} totalQuestions - Total number of questions processed
 */
function updateInvalidQuestionsButton(invalidQuestions, totalQuestions) {
  const viewInvalidBtnContainer = document.getElementById("viewInvalidBtnContainer");
  if (!viewInvalidBtnContainer) return;
  
  // Clear any existing button
  viewInvalidBtnContainer.innerHTML = "";
  
  // Only create button if there are invalid questions
  if (invalidQuestions && invalidQuestions.length > 0) {
    const viewInvalidBtn = document.createElement("button");
    viewInvalidBtn.textContent = `View ${invalidQuestions.length} Invalid Questions`;
    viewInvalidBtn.className = "custom-btn";
    viewInvalidBtn.style.marginLeft = "10px";
    viewInvalidBtn.style.backgroundColor = "#ff9800";
    viewInvalidBtn.style.color = "white";
    viewInvalidBtn.style.border = "1px solid #f57c00";
    viewInvalidBtn.title = "Show questions that failed validation and were excluded from the test";
    
    viewInvalidBtn.addEventListener("click", () => {
      if (typeof showInvalidQuestionsPopup === 'function') {
        showInvalidQuestionsPopup(invalidQuestions, totalQuestions);
      } else {
        // Could display invalid questions in a custom popup or UI element here if needed
        // Example: Show first 3 invalid reasons in the console (or handle as needed)
        /*
        const reasons = invalidQuestions.slice(0, 3).map(q => `• ${q.reason}`).join('\n') +
          (invalidQuestions.length > 3 ? '\n... and more' : '');
        // Optionally display in UI
        */
      }
    });
    
    viewInvalidBtnContainer.appendChild(viewInvalidBtn);
  }
}
/**
 * Initializes and starts a new test with the provided questions
 * Handles UI setup, question shuffling, and test state initialization
 * 
 * @param {Array} filteredQuestions - Array of question objects to use in the test
 */
function startTest(filteredQuestions) {
  try {
    // No validation - use all questions as provided
    const validQuestions = filteredQuestions;
    const invalidQuestions = [];
    
    // Store no invalid questions
    AppState.currentInvalidQuestions = [];
    
    // Update the "View Invalid Questions" button
    updateInvalidQuestionsButton([], filteredQuestions.length);
    
    // Clear any previous messages - no status message needed
    document.getElementById("file-chosen").innerHTML = "";
    
    // Clear previous content and status
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
    
    // Show test control buttons
    document.getElementById("restart").style.display = "inline-block";
    document.getElementById("backToOptions").style.display = "inline-block";
    document.getElementById("newTestSameOptions").style.display = "inline-block";
    document.getElementById("newtest").style.display = "none";
    
    // Reset test state
    document.getElementById("scoreboard").innerHTML = "";
    AppState.score = 0;
    AppState.questionResults = []; // Reset question results for new test
    
    // Initialize exam mode timer if needed
    if (AppState.isExamMode) {
      initializeExamTimer();
    }
    
    // Set application title - preserve logo using utility function
    updateHeaderTitle();
    
    // Scroll to top when test begins
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Absolute random shuffle for questions (use only valid questions)
    const shuffledQuestions = shuffle(validQuestions.map(q => ({ ...q })));
    
    // Absolute random shuffle for options in every question
    AppState.questions = shuffledQuestions.map(q => {
      if (q.options) q.options = shuffle([...q.options]);
      return q;
    });
    
    // Save last used filters for restart
    AppState.lastFilteredQuestions = AppState.questions.map(q => ({ ...q }));
    AppState.lastExplanationMode = AppState.explanationMode;
    
    // Start rendering the test
    renderTest(AppState.questions);
    
  } catch (err) {
    document.getElementById("file-chosen").innerHTML = `<pre style='color:red;'>Error rendering test: ${err.message}</pre>`;
    document.getElementById("test").innerHTML = "";
  }
}

// ============================================
// QUESTION RENDERING ENGINE
// ============================================

/**
 * Advanced question text formatting for numbered lists and Roman numerals
 * Handles complex question structures with proper HTML formatting
 * Based on Golden 22's formatting logic for perfect compatibility
 * 
 * @param {string} questionText - The raw question text to format
 * @returns {string} Formatted HTML string or original text if no formatting needed
 */
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

/**
 * Renders the complete test with all questions as interactive cards
 * Creates question cards, options, and sets up progressive disclosure
 * 
 * @param {Array} questions - Array of question objects to render
 */
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
      
      // Get question text using flexible field names (support both database and JSON formats)
      const questionText = q.question_text || q.question;
      // Get the original question type from database
      const questionType = q.question_type || q.type;
      
      // For MCQ-type questions, determine if single or multiple choice based on correct answer count
      let isSingleChoice = true;
      let isMultipleChoice = false;
      
      if (AppState.isDbMode && (questionType === 'MCQ' || questionType === 'MCQ-Scenario' || questionType === 'Cohort-05-MCQ' || questionType === 'MCQ-Multiple')) {
        // Count correct answers in the options table
        try {
          const correctCountRes = AppState.database.exec(`SELECT COUNT(*) FROM options WHERE question_id = ${q.id} AND is_correct = 1`);
          const correctCount = correctCountRes[0]?.values[0][0] || 1;
          
          isSingleChoice = (correctCount === 1);
          isMultipleChoice = (correctCount > 1);
          
          // ...removed debug log...
        } catch (error) {
          console.warn(`Error checking correct answers for question ${q.id}:`, error);
          // Default to single choice if error
          isSingleChoice = true;
          isMultipleChoice = false;
        }
      } else if (q.type === 'single' || questionType === 'single') {
        // JSON mode or explicitly marked as single
        isSingleChoice = true;
        isMultipleChoice = false;
      } else if (q.type === 'multiple' || questionType === 'multiple') {
        // JSON mode or explicitly marked as multiple  
        isSingleChoice = false;
        isMultipleChoice = true;
      }
      
      // Debug logging removed
      // Object construction preserved
      const questionInfo = {
        id: q.id,
        questionText: questionText?.substring(0, 50) + '...',
        question_type: q.question_type,
        type: q.type,
        questionType: questionType,
        isSingleChoice: isSingleChoice,
        isMultipleChoice: isMultipleChoice,
        hasOptions: Array.isArray(q.options),
        optionsCount: q.options?.length || 0,
        firstOption: q.options?.[0],
        answer: q.answer
      };
      
      // Format question text with advanced formatting
      const formattedQuestion = formatQuestionWithLists(questionText);
      
      // Use innerHTML if the question was formatted, otherwise use textContent
      if (formattedQuestion !== questionText) {
        qTitle.innerHTML = `${qIndex + 1}. ${formattedQuestion}`;
      } else {
        qTitle.textContent = `${qIndex + 1}. ${questionText}`;
      }
      qDiv.appendChild(qTitle);

      // Render question type-specific content
      if ((questionType === "match" || questionType === "Match") && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0) {
        // Matching questions (requires createMatchQuestion from core-utils.js)
        const matchInfo = {
          questionType: questionType,
          hasMatchPairs: !!q.matchPairs,
          matchPairCount: Object.keys(q.matchPairs || {}).length,
          matchPairs: q.matchPairs,
          createMatchQuestionAvailable: typeof createMatchQuestion === 'function'
        };
        
        if (typeof createMatchQuestion === 'function') {
          createMatchQuestion(q, qDiv, qIndex);
        } else {
          qDiv.innerHTML += `<div style='color:red;'>Error: Match question renderer not available.</div>`;
        }
      } else if ((isSingleChoice || questionType === "assertion") && Array.isArray(q.options)) {
        // Single choice questions (radio buttons) - using answer-option structure for consistency
        q.options.forEach(opt => {
          const label = document.createElement("label");
          label.className = "answer-option";
          const input = document.createElement("input");
          input.type = "radio";
          input.name = `q${q.id}`;
          input.value = opt;
          input.addEventListener("change", () => {
            handleAnswer(q, [opt], qDiv, qIndex);
          });
          const optionText = document.createElement("span");
          optionText.className = "option-text";
          optionText.textContent = opt;
          label.appendChild(input);
          label.appendChild(optionText);
          qDiv.appendChild(label);
        });
      } else if (isMultipleChoice && Array.isArray(q.options)) {
        // Multiple choice questions (checkboxes) - using answer-option structure for consistency
        q.options.forEach(opt => {
          const label = document.createElement("label");
          label.className = "answer-option";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.name = `q${q.id}`;
          input.value = opt;
          const optionText = document.createElement("span");
          optionText.className = "option-text";
          optionText.textContent = opt;
          label.appendChild(input);
          label.appendChild(optionText);
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
      } else {
        // Debug why question failed to match any type
        console.error(`Question ${q.id} failed to match any rendering type:`, {
          questionType: questionType,
          isSingleChoice: isSingleChoice,
          isMultipleChoice: isMultipleChoice,
          hasOptions: Array.isArray(q.options),
          optionsLength: q.options?.length || 0,
          hasMatchPairs: !!q.matchPairs,
          matchPairCount: Object.keys(q.matchPairs || {}).length,
          question: q
        });
        qDiv.innerHTML += `<div style='color:red;'>Error: Question data is incomplete or malformed. Type: ${questionType}</div>`;
      }

      container.appendChild(qDiv);
    });

    // Set up progressive disclosure - only first question is active
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

// ============================================
// ANSWER PROCESSING & VALIDATION
// ============================================

/**
 * Processes user answer submission with validation and feedback
 * Handles all question types and manages test progression
 * 
 * @param {Object} question - The question object being answered
 * @param {Array|Object} chosen - User's selected answer(s)
 * @param {HTMLElement} qDiv - The question's DOM container
 * @param {number} qIndex - Index of the question in the test
 */
function handleAnswer(question, chosen, qDiv, qIndex) {
  if (qDiv.classList.contains("locked")) return;

  qDiv.classList.remove("active");
  qDiv.classList.add("locked");

  let isCorrect = false;
  
  // Get question type using flexible field names
  const questionType = question.question_type || question.type;
  
  // Determine if this is single or multiple choice based on the answer format and database check
  let isSingleChoice = true;
  let isMultipleChoice = false;
  
  if (questionType === 'match' || questionType === 'Match') {
    // Matching questions are neither single nor multiple choice in this flow
    isSingleChoice = false;
    isMultipleChoice = false;
  }
  else if (AppState.isDbMode && (questionType === 'MCQ' || questionType === 'MCQ-Scenario' || questionType === 'Cohort-05-MCQ' || questionType === 'MCQ-Multiple')) {
    // For database mode, check if answer is array with multiple values or single value
    isMultipleChoice = Array.isArray(question.answer) && question.answer.length > 1;
    isSingleChoice = !isMultipleChoice;
  } else {
    // For JSON mode, use the type field or answer format
    isSingleChoice = (question.type === "single" || questionType === "single" || questionType === "assertion") || 
                     (!!question.answer && !Array.isArray(question.answer) && (typeof question.answer !== 'object')) ||
                     (Array.isArray(question.answer) && question.answer.length === 1);
    isMultipleChoice = (question.type === "multiple" || questionType === "multiple") || 
                       (Array.isArray(question.answer) && question.answer.length > 1);
  }

  // Validate answer based on determined choice type
  if (isSingleChoice || questionType === "assertion") {
    const correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
    isCorrect = (chosen[0] === correctAnswer);
  }
  else if (isMultipleChoice) {
    const correct = new Set(Array.isArray(question.answer) ? question.answer : [question.answer]);
    const selected = new Set(chosen);
    isCorrect = (correct.size === selected.size && [...correct].every(x => selected.has(x)));
  }
  else if (questionType === "match" || questionType === "Match") {
    const correctPairs = question.matchPairs || question.answer || {};
    const norm = (obj) => {
      const out = {};
      Object.keys(obj || {}).forEach(k => {
        const nk = String(k).trim().toLowerCase();
        const nv = obj[k] != null ? String(obj[k]).trim().toLowerCase() : '';
        out[nk] = nv;
      });
      return out;
    };
    const a = norm(correctPairs);
    const b = norm(chosen || {});
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    isCorrect = aKeys.length > 0 && aKeys.length === bKeys.length && aKeys.every(k => a[k] === b[k]);
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
      if (AppState.explanationMode === 2) {
        // Display the correct answer if enabled
        if (AppState.showCorrectAnswer) {
          if (isSingleChoice || questionType === "assertion") {
            const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
            qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
          } else if (isMultipleChoice) {
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
            qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
          } else if (questionType === "match" || questionType === "Match") {
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
  // ...removed debug log...
    
    // Progress to next question or show final score
    progressToNextQuestion(qIndex);
    
  } else {
    // Store the result for this question
    AppState.questionResults[qIndex] = { isCorrect: false, userAnswer: chosen };
    
    // Show wrong message - only if immediate result is enabled
    if (AppState.showImmediateResult) {
      qDiv.insertAdjacentHTML("beforeend", `<p class="wrong">❌ <b>Wrong.</b></p>`);
    }
    
    // Enable the next question after wrong answer too
    progressToNextQuestion(qIndex);
    
    // Show "Try Again" button if enabled
    if (AppState.allowTryAgain) {
      createTryAgainButton(question, qDiv, qIndex);
    }
    
    // Show correct answer and explanation for wrong answers (based on explanation mode)
    if (AppState.showImmediateResult && (AppState.explanationMode === 2 || (AppState.explanationMode === 1 && !isCorrect))) {
      showAnswerFeedback(question, qDiv);
    }
  }
  
  // Add topic and subtopic information after answer (for both correct and incorrect)
  if (AppState.showImmediateResult && AppState.showTopicSubtopic) {
    addTopicSubtopicInfo(question, qDiv);
  }
}

/**
 * Progresses to the next question or shows final score if test is complete
 * @param {number} currentIndex - Index of the current question
 */
function progressToNextQuestion(currentIndex) {
  const nextQ = document.getElementById(`q-${AppState.questions[currentIndex + 1]?.id}`);
  
  if (nextQ) {
    // Enable next question
    nextQ.classList.remove("disabled");
    nextQ.classList.remove("locked");
    nextQ.classList.add("active");
    
    // Ensure all questions after the next one remain disabled
    for (let i = currentIndex + 2; i < AppState.questions.length; i++) {
      const laterQ = document.getElementById(`q-${AppState.questions[i].id}`);
      if (laterQ) {
        laterQ.classList.add('disabled');
        laterQ.classList.remove('active');
        laterQ.classList.remove('locked');
      }
    }
    
    // Highlight next question
    setTimeout(() => {
      document.querySelectorAll('.question-card').forEach(card => {
        card.style.boxShadow = '';
        card.classList.remove('active');
      });
      nextQ.classList.add('active');
    }, 10);
  } else {
    // This was the last question, show final score
  // ...removed debug log...
    showFinalScore();
  }
}

/**
 * Creates and positions the "Try Again" button for incorrect answers
 * @param {Object} question - The question object
 * @param {HTMLElement} qDiv - Question container element
 * @param {number} qIndex - Question index
 */
function createTryAgainButton(question, qDiv, qIndex) {
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
    
    // Reset and re-render the question
    Array.from(qDiv.children).forEach((el, idx) => { if (idx > 0) qDiv.removeChild(el); });
    qDiv.classList.remove('locked');
    
    let qCopy = { ...question };
    if (qCopy.options) qCopy.options = shuffle([...qCopy.options]);
    if (qCopy.type === 'match' && qCopy.matchPairs) {
      qCopy = { ...qCopy, matchPairs: { ...qCopy.matchPairs } };
    }
    
    renderSingleQuestion(qCopy, qDiv, qIndex);
    
    // Highlight the retried card
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

/**
 * Shows answer feedback (correct answer, explanation, reference)
 * @param {Object} question - The question object
 * @param {HTMLElement} qDiv - Question container element
 */
function showAnswerFeedback(question, qDiv) {
  // Get question type using flexible field names
  const questionType = question.question_type || question.type;
  
  // Display the correct answer if enabled
  if (AppState.showCorrectAnswer) {
    // Determine if single or multiple choice based on answer format and database mode
    let isMultipleChoice = false;
    
    if (AppState.isDbMode && (questionType === 'MCQ' || questionType === 'MCQ-Scenario' || questionType === 'Cohort-05-MCQ' || questionType === 'MCQ-Multiple')) {
      // For database mode, check if answer is array with multiple values
      isMultipleChoice = Array.isArray(question.answer) && question.answer.length > 1;
    } else {
      // For JSON mode, use type field or answer format
      isMultipleChoice = (questionType === "multiple" || questionType === "MCQ-Multiple") || 
                         (Array.isArray(question.answer) && question.answer.length > 1);
    }
    
    // Display answer based on determined type
    if (questionType === "match" || questionType === "Match") {
      const matchDisplay = Object.entries(question.matchPairs).map(([left, right]) => `${left} → ${right}`).join(', ');
      qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct matches: ${matchDisplay}</p>`);
    } else if (isMultipleChoice) {
      const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
      qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
    } else {
      // Single choice (including MCQ, TrueFalse, AssertionReason, assertion, etc.)
      const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
      if (displayAnswer) {
        qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
      }
    }
  }
  
  if (question.explanation) {
    qDiv.insertAdjacentHTML("beforeend", `<p class="explanation">💡 Explanation: ${question.explanation}</p>`);
  }
  if (question.reference) {
    qDiv.insertAdjacentHTML("beforeend", `<p class="reference">📖 Reference: ${question.reference}</p>`);
  }
}

/**
 * Adds topic and subtopic information to the question display
 * @param {Object} question - The question object
 * @param {HTMLElement} qDiv - Question container element
 */
function addTopicSubtopicInfo(question, qDiv) {
  const topicSubtopicInfo = document.createElement("div");
  topicSubtopicInfo.className = "topic-subtopic-info";
  topicSubtopicInfo.style.cssText = "margin-top: 10px; padding: 8px; background: #f8f9fa; border-left: 1px solid #0078d7; font-size: 0.9em; color: #666;";
  
  let topicText = question.topic || "Unknown Topic";
  let subtopicText = question.subtopic || "General";
  
  topicSubtopicInfo.innerHTML = `<strong>Topic:</strong> ${topicText} | <strong>Subtopic:</strong> ${subtopicText}`;
  qDiv.appendChild(topicSubtopicInfo);
}

// ============================================
// SINGLE QUESTION RE-RENDERING (TRY AGAIN)
// ============================================

/**
 * Re-renders a single question in place for "Try Again" functionality
 * Resets question state and reshuffles options
 * 
 * @param {Object} q - Question object to re-render
 * @param {HTMLElement} qDiv - Question container element
 * @param {number} qIndex - Question index
 */
function renderSingleQuestion(q, qDiv, qIndex) {
  // Remove all children except the title
  Array.from(qDiv.children).forEach((el, idx) => { if (idx > 0) qDiv.removeChild(el); });
  
  // Always reset state for retry
  qDiv.classList.remove('locked');
  qDiv.classList.remove('active');
  
  // Remove any previous try again button for this card
  const prevTryAgain = document.getElementById('try-again-outer-container-' + qIndex);
  if (prevTryAgain && prevTryAgain.parentNode) {
    prevTryAgain.parentNode.removeChild(prevTryAgain);
  }
  
  // Disable all questions below this one and clean up their state
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
      
      // Remove feedback messages from questions below
      ['correct', 'wrong', 'explanation', 'reference', 'topic-subtopic-info'].forEach(className => {
        const elements = nextQDiv.querySelectorAll(`.${className}`);
        elements.forEach(el => el.remove());
      });
    }
  }
  
  // Ensure relative positioning for try again button
  qDiv.style.position = 'relative';
  
  // Re-render question content based on type
  if ((q.type === "match" || q.type === "Match") && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0) {
    if (typeof createMatchQuestion === 'function') {
      createMatchQuestion(q, qDiv, qIndex);
    }
  }
  else if ((q.type === "single" || q.type === "assertion") && Array.isArray(q.options)) {
    q.options.forEach(opt => {
      const label = document.createElement("label");
      label.className = "answer-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${q.id}_retry`;
      input.value = opt;
      input.addEventListener("change", () => {
        handleAnswer(q, [opt], qDiv, qIndex);
      });
      const optionText = document.createElement("span");
      optionText.className = "option-text";
      optionText.textContent = opt;
      label.appendChild(input);
      label.appendChild(optionText);
      qDiv.appendChild(label);
    });
  }
  else if (q.type === "multiple" && Array.isArray(q.options)) {
    q.options.forEach(opt => {
      const label = document.createElement("label");
      label.className = "answer-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = `q${q.id}_retry`;
      input.value = opt;
      const optionText = document.createElement("span");
      optionText.className = "option-text";
      optionText.textContent = opt;
      label.appendChild(input);
      label.appendChild(optionText);
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

  // Highlight this card for retry
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

// ============================================
// FINAL SCORING & RESULTS
// ============================================

/**
 * Displays the final test score with performance feedback and detailed results
 * Handles both immediate and delayed feedback modes
 */
function showFinalScore() {
  // ...removed debug log...
  const total = AppState.questions.length;
  const percent = Math.round((AppState.score / total) * 100);
  // ...removed debug log...

  let message = "";
  let cssClass = "";

  // Categorize performance with motivational messaging
  if (percent >= 90) {
    message = "🌟 Outstanding performance! You've clearly mastered the material.";
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

  // Read candidate label and name (shared with Exam mode cookies)
  const candidateLabel = (function(){ try { return localStorage.getItem('candidateLabel') || 'Examinee'; } catch(_) { return 'Examinee'; } })();
  const candidateName = (function(){
    try {
      const nameEQ = encodeURIComponent('candidateName') + '=';
      const parts = document.cookie.split(';');
      for (let c of parts) { c = c.trim(); if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length)); }
    } catch(_){ }
    try { return localStorage.getItem('candidateName') || ''; } catch(_) { return ''; }
  })();
  const safeName = (function(s){
    const t = (s || '').toString().slice(0,50);
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  })(candidateName);

  // Display final score with branding and candidate name
  document.getElementById("scoreboard").innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0078d7; margin: 0; font-size: 1.8em;">InsightPrep</h2>
      <p style="color: #666; margin: 5px 0 0 0; font-style: italic;">Where Preparation Meets Reflection</p>
    </div>
    <div style="margin-bottom:8px;${safeName ? '' : 'display:none;'}"><strong>${candidateLabel}:</strong> ${safeName || ''}</div>
    <div><strong>Your Score:</strong> ${AppState.score} / ${total} (${percent}%)</div>
    <div id="message" class="${cssClass}">${message}</div>
  `;

  // If immediate results were OFF, now reveal all answers and explanations
  if (!AppState.showImmediateResult) {
    revealDelayedResults();
  }

  // Show all control buttons
  document.getElementById("restart").style.display = "inline-block";
  document.getElementById("restart-bottom").style.display = "inline-block";
  document.getElementById("backToOptions").style.display = "inline-block";
  document.getElementById("backToOptions-bottom").style.display = "inline-block";
  document.getElementById("newTestSameOptions").style.display = "inline-block";
  document.getElementById("newTestSameOptions-bottom").style.display = "inline-block";
  document.getElementById("newtest").style.display = "inline-block";
}

/**
 * Reveals delayed results when immediate feedback was disabled
 * Shows correct/incorrect status, answers, and explanations for all questions
 */
function revealDelayedResults() {
  const scoreboardElement = document.getElementById("scoreboard");
  
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
      
      // Show correct answers based on explanation mode and settings
      if (AppState.showCorrectAnswer && (AppState.explanationMode === 2 || (AppState.explanationMode === 1 && !result.isCorrect))) {
        showAnswerFeedback(question, qDiv);
      }
      
      // Add topic and subtopic information if enabled
      if (AppState.showTopicSubtopic) {
        // Remove any existing topic/subtopic info first
        const existingTopicInfo = qDiv.querySelector('.topic-subtopic-info');
        if (existingTopicInfo) existingTopicInfo.remove();
        
        addTopicSubtopicInfo(question, qDiv);
      }
    }
  });
  
  // Scroll to show the scoreboard after adding all feedback
  setTimeout(() => {
    if (scoreboardElement) {
      scoreboardElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest' 
      });
    }
  }, 100);
}

// Exam Mode Timer Functions
let examTimer = null;
let examStartTime = null;
let examDurationMinutes = 90;

function initializeExamTimer() {
  if (!AppState.isExamMode || !AppState.examDuration) {
    return;
  }
  
  // Use exam duration from AppState
  examDurationMinutes = AppState.examDuration;
  
  // Create timer display
  createTimerDisplay();
  
  // Start the timer
  startExamTimer();
}

function createTimerDisplay() {
  // Remove existing timer if any
  const existingTimer = document.getElementById('exam-timer');
  if (existingTimer) existingTimer.remove();
  
  // Create timer display
  const timerDiv = document.createElement('div');
  timerDiv.id = 'exam-timer';
  timerDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #fff;
    border: 2px solid #0078d7;
    border-radius: 8px;
    padding: 10px 15px;
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: bold;
    color: #333;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    z-index: 1000;
  `;
  timerDiv.innerHTML = `⏱️ ${formatTime(examDurationMinutes * 60)}`;
  
  document.body.appendChild(timerDiv);
}

function startExamTimer() {
  examStartTime = Date.now();
  const totalSeconds = examDurationMinutes * 60;
  
  examTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
    const remaining = Math.max(0, totalSeconds - elapsed);
    
    updateTimerDisplay(remaining);
    
    if (remaining === 0) {
      clearInterval(examTimer);
      handleTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const timerDiv = document.getElementById('exam-timer');
  if (timerDiv) {
    const timeText = formatTime(seconds);
    
    // Change color based on time remaining
    if (seconds <= 300) { // Last 5 minutes
      timerDiv.style.borderColor = '#ff4444';
      timerDiv.style.color = '#ff4444';
      if (seconds <= 60) { // Last minute
        timerDiv.style.background = '#ffe6e6';
      }
    }
    
    timerDiv.innerHTML = `⏱️ ${timeText}`;
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleTimeUp() {
  // ...removed debug alert...
  
  // Auto-submit the exam
  showExamResults();
}

function showExamResults() {
  // Clear timer
  if (examTimer) {
    clearInterval(examTimer);
    examTimer = null;
  }
  
  const timerDiv = document.getElementById('exam-timer');
  if (timerDiv) timerDiv.remove();
  
  // Calculate and show final results
  calculateFinalScore();
  
  // Show results with exam-specific messaging
  const scoreboardElement = document.getElementById("scoreboard");
  if (scoreboardElement) {
    scoreboardElement.innerHTML = `
      <h2>🎯 Exam Complete!</h2>
      <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <p><strong>Exam Duration:</strong> ${examDurationMinutes} minutes</p>
        <p><strong>Questions Completed:</strong> ${AppState.questions.length}</p>
        <p><strong>Final Score:</strong> ${AppState.score} / ${AppState.questions.length}</p>
        <p><strong>Percentage:</strong> ${Math.round((AppState.score / AppState.questions.length) * 100)}%</p>
      </div>
    ` + scoreboardElement.innerHTML;
    
    scoreboardElement.scrollIntoView({ behavior: 'smooth' });
  }
}