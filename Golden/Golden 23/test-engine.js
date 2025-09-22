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
    if (questionType === "single" || questionType === "multiple" || questionType === "assertion") {
      if (question.answer === undefined || question.answer === null) {
        return { isValid: false, reason: "Missing answer field" };
      }
      
      // For single choice and assertion, answer should be one of the option texts
      if (questionType === "single" || questionType === "assertion") {
        if (!question.options.includes(question.answer)) {
          return { isValid: false, reason: `Answer "${question.answer}" not found in options: [${question.options.join(', ')}]` };
        }
      }
      
      // For multiple choice, answer should be an array of option texts
      if (questionType === "multiple") {
        if (!Array.isArray(question.answer)) {
          return { isValid: false, reason: "Multiple choice answer must be an array" };
        }
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
        alert(`Found ${invalidQuestions.length} invalid questions:\n\n` + 
              invalidQuestions.slice(0, 3).map(q => `• ${q.reason}`).join('\n') + 
              (invalidQuestions.length > 3 ? '\n... and more' : ''));
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
    // Validate questions before starting test
    const validQuestions = [];
    const invalidQuestions = [];
    
    filteredQuestions.forEach((question, index) => {
      const validation = validateQuestion(question);
      if (validation.isValid) {
        validQuestions.push(question);
      } else {
        invalidQuestions.push({
          ...question,
          id: question.id || index + 1,
          reason: validation.reason
        });
      }
    });
    
    // Store invalid questions for the button
    AppState.currentInvalidQuestions = invalidQuestions;
    
    // Update the "View Invalid Questions" button
    updateInvalidQuestionsButton(invalidQuestions, filteredQuestions.length);
    
    // Check if we have any valid questions to proceed
    if (validQuestions.length === 0) {
      document.getElementById("file-chosen").innerHTML = `<span style='color:red;'>No valid questions found! All ${filteredQuestions.length} questions failed validation.</span>`;
      return;
    }
    
    // Inform user about validation results
    if (invalidQuestions.length > 0) {
      document.getElementById("file-chosen").innerHTML = `<span style='color:orange;'>Found ${invalidQuestions.length} invalid questions (excluded). Starting test with ${validQuestions.length} valid questions.</span>`;
    } else {
      document.getElementById("file-chosen").innerHTML = `<span style='color:green;'>All ${validQuestions.length} questions validated successfully.</span>`;
    }
    
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
    
    // Set application title
    document.getElementById("test-title").innerHTML = "InsightPrep<br><span style='font-size: 0.75em; font-weight: normal; color: #e6f3ff; margin-top: 5px; display: inline-block;'>Where Preparation Meets Reflection</span>";
    
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
      // Prioritize the processed 'type' field over the raw 'question_type' field
      const questionType = q.type || q.question_type;
      
      // Debug logging
      console.log(`Question ${qIndex + 1}:`, {
        id: q.id,
        questionText: questionText?.substring(0, 50) + '...',
        question_type: q.question_type,
        type: q.type,
        questionType: questionType,
        hasOptions: Array.isArray(q.options),
        optionsCount: q.options?.length || 0,
        firstOption: q.options?.[0],
        answer: q.answer
      });
      
      // Check which condition fails
      console.log(`Question ${qIndex + 1} validation:`, {
        questionType: questionType,
        isSingleOrAssertion: (questionType === "single" || questionType === "assertion"),
        hasOptionsArray: Array.isArray(q.options),
        isMultiple: (questionType === "multiple"),
        isMatch: (questionType === "match"),
        hasMatchPairs: (q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0),
        willRenderSingle: ((questionType === "single" || questionType === "assertion") && Array.isArray(q.options)),
        willRenderMultiple: (questionType === "multiple" && Array.isArray(q.options)),
        willRenderMatch: (questionType === "match" && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0),
        willShowError: !((questionType === "single" || questionType === "assertion") && Array.isArray(q.options)) && 
                       !(questionType === "multiple" && Array.isArray(q.options)) && 
                       !(questionType === "match" && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0)
      });
      
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
      if ((questionType === "single" || questionType === "assertion") && Array.isArray(q.options)) {
        // Single choice questions (radio buttons)
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
      } else if (questionType === "multiple" && Array.isArray(q.options)) {
        // Multiple choice questions (checkboxes)
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
        });

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit Answer";
        submitBtn.title = "Submit your selected answers for this question. You can select multiple options.";
        submitBtn.addEventListener("click", () => {
          const selected = Array.from(qDiv.querySelectorAll(`input[name="q${q.id}"]:checked`)).map(inp => inp.value);
          handleAnswer(q, selected, qDiv, qIndex);
        });
        qDiv.appendChild(submitBtn);
      } else if (questionType === "match" && q.matchPairs && typeof q.matchPairs === 'object' && Object.keys(q.matchPairs).length > 0) {
        // Matching questions (requires createMatchQuestion from core-utils.js)
        if (typeof createMatchQuestion === 'function') {
          createMatchQuestion(q, qDiv, qIndex);
        } else {
          qDiv.innerHTML += `<div style='color:red;'>Error: Match question renderer not available.</div>`;
        }
      } else {
        qDiv.innerHTML += `<div style='color:red;'>Error: Question data is incomplete or malformed.</div>`;
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

  // Validate answer based on question type
  if (questionType === "single" || questionType === "assertion") {
    isCorrect = (chosen[0] === question.answer);
  }
  else if (questionType === "multiple") {
    const correct = new Set(question.answer);
    const selected = new Set(chosen);
    isCorrect = (correct.size === selected.size && [...correct].every(x => selected.has(x)));
  }
  else if (questionType === "match") {
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
      if (AppState.explanationMode === 2) {
        // Display the correct answer if enabled
        if (AppState.showCorrectAnswer) {
          if (questionType === "single" || questionType === "assertion") {
            const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
            qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
          } else if (questionType === "multiple") {
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
            qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
          } else if (questionType === "match") {
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
    console.log("Test completed! Showing final score.");
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
    if (questionType === "single" || questionType === "assertion") {
      const displayAnswer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
      qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answer: ${displayAnswer}</p>`);
    } else if (questionType === "multiple") {
      const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
      qDiv.insertAdjacentHTML("beforeend", `<p class="correct-answer">✓ Correct answers: ${correctAnswers.join(', ')}</p>`);
    } else if (questionType === "match") {
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
    if (typeof createMatchQuestion === 'function') {
      createMatchQuestion(q, qDiv, qIndex);
    }
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
  console.log("showFinalScore() called!");
  const total = AppState.questions.length;
  const percent = Math.round((AppState.score / total) * 100);
  console.log(`Final score: ${AppState.score}/${total} (${percent}%)`);

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

  // Display final score with branding
  document.getElementById("scoreboard").innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0078d7; margin: 0; font-size: 1.8em;">InsightPrep</h2>
      <p style="color: #666; margin: 5px 0 0 0; font-style: italic;">Where Preparation Meets Reflection</p>
    </div>
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