// Exam Mode Manager Module
// Manages the exam practice mode functionality, timing, navigation, and state

class ExamModeManager {
  constructor() {
    this.isExamMode = false;
    this.examQuestions = [];
    this.currentQuestionIndex = 0;
    this.examTimer = null;
    this.examTimeMinutes = 60; // Default 60 minutes
    this.timeRemaining = 0; // in seconds
    this.userAnswers = new Map(); // questionIndex -> answer
    this.bookmarkedQuestions = new Set(); // Set of question indices
    this.examStartTime = null;
    this.examFinished = false;
    this.examSubmitted = false;
  }

  // Initialize exam mode
  initExamMode(questions, timeMinutes) {
    this.isExamMode = true;
    this.examQuestions = questions;
    this.examTimeMinutes = timeMinutes;
    this.timeRemaining = timeMinutes * 60; // Convert to seconds
    this.currentQuestionIndex = 0;
    this.userAnswers.clear();
    this.bookmarkedQuestions.clear();
    this.examStartTime = new Date();
    this.examFinished = false;
    this.examSubmitted = false;
    
    // Hide main content and show exam interface
    this.showExamInterface();
    this.startExamTimer();
    this.renderCurrentQuestion();
  }

  // Create and show exam interface
  showExamInterface() {
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    
    // Hide existing content
    const existingContent = main.innerHTML;
    main.innerHTML = '';
    
    // Store original content for later restoration
    this.originalMainContent = existingContent;
    
    // Create exam container
    const examContainer = document.createElement('div');
    examContainer.id = 'exam-container';
    examContainer.innerHTML = this.getExamInterfaceHTML();
    
    main.appendChild(examContainer);
    
    // Update header for exam mode
    header.style.background = '#d32f2f'; // Red color for exam mode
    const headerContent = header.querySelector('.header-content');
    if (headerContent) {
      headerContent.innerHTML = `
        <div style="font-size: 1.2em;">EXAM MODE</div>
        <div style="font-size: 0.75em; font-weight: normal; color: #ffcdd2; margin-top: 5px;">
          Focus and concentrate - this is exam practice
        </div>
      `;
    }
  }

  // Generate exam interface HTML
  getExamInterfaceHTML() {
    return `
      <div id="exam-header">
        <div id="exam-controls">
          <button id="exam-back-to-options" class="exam-control-btn" title="End exam and return to options">
            ← End Exam
          </button>
          <div id="exam-timer" class="exam-timer">
            <span id="exam-time-display">--:--</span>
          </div>
        </div>
        
        <div id="exam-question-nav">
          <!-- Question number buttons will be generated here -->
        </div>
      </div>

      <div id="exam-content">
        <div id="exam-question-area">
          <div id="exam-question-panel">
            <!-- Question content will be loaded here -->
          </div>
        </div>
        
        <div id="exam-divider"></div>
        
        <div id="exam-answer-area">
          <div id="exam-answer-panel">
            <!-- Answer options will be loaded here -->
          </div>
        </div>
      </div>

      <div id="exam-navigation">
        <button id="exam-prev-btn" class="exam-nav-btn">← Previous</button>
        <div id="exam-question-info">
          Question <span id="exam-current-num">1</span> of <span id="exam-total-num">${this.examQuestions.length}</span>
        </div>
        <button id="exam-bookmark-btn" class="exam-bookmark-btn" title="Bookmark this question">
          🔖 Bookmark
        </button>
        <button id="exam-next-btn" class="exam-nav-btn">Next →</button>
        <button id="exam-finish-btn" class="exam-finish-btn" style="display: none;">Finish Exam</button>
      </div>
    `;
  }

  // Start the exam timer
  startExamTimer() {
    this.examTimer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      
      // Auto-submit when time runs out
      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  // Update timer display
  updateTimerDisplay() {
    const timerDisplay = document.getElementById('exam-time-display');
    if (timerDisplay) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      
      // Change color based on remaining time
      const timerElement = document.getElementById('exam-timer');
      if (this.timeRemaining <= 300) { // Last 5 minutes
        timerElement.className = 'exam-timer exam-timer-warning';
      } else if (this.timeRemaining <= 60) { // Last minute
        timerElement.className = 'exam-timer exam-timer-critical';
      } else {
        timerElement.className = 'exam-timer';
      }
      
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Handle time up scenario
  timeUp() {
    clearInterval(this.examTimer);
    alert('Time is up! Your exam will be automatically submitted.');
    this.finishExam();
  }

  // Render current question
  renderCurrentQuestion() {
    const question = this.examQuestions[this.currentQuestionIndex];
    if (!question) return;

    // Update question navigation
    this.updateQuestionNavigation();
    
    // Update question panel
    this.renderQuestionPanel(question);
    
    // Update answer panel
    this.renderAnswerPanel(question);
    
    // Update navigation buttons
    this.updateNavigationButtons();
    
    // Update question info
    const currentNumSpan = document.getElementById('exam-current-num');
    if (currentNumSpan) {
      currentNumSpan.textContent = this.currentQuestionIndex + 1;
    }
    
    // Update bookmark button state
    this.updateBookmarkButton();
  }

  // Update question navigation buttons
  updateQuestionNavigation() {
    const navContainer = document.getElementById('exam-question-nav');
    if (!navContainer) return;
    
    navContainer.innerHTML = '';
    
    for (let i = 0; i < this.examQuestions.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'exam-question-nav-btn';
      btn.textContent = i + 1;
      btn.onclick = () => this.navigateToQuestion(i);
      
      // Add state classes
      if (i === this.currentQuestionIndex) {
        btn.classList.add('current');
      }
      if (this.userAnswers.has(i)) {
        btn.classList.add('answered');
      }
      if (this.bookmarkedQuestions.has(i)) {
        btn.classList.add('bookmarked');
      }
      
      navContainer.appendChild(btn);
    }
  }

  // Render question panel
  renderQuestionPanel(question) {
    const questionPanel = document.getElementById('exam-question-panel');
    if (!questionPanel) return;
    
    let questionHTML = `
      <div class="exam-question-header">
        <h3>Question ${this.currentQuestionIndex + 1}</h3>
        <span class="exam-question-type">${question.question_type || question.type || 'Question'}</span>
      </div>
      <div class="exam-question-content">
        ${question.question || question.question_text || ''}
      </div>
    `;
    
    // Add scenario if exists
    if (question.scenario) {
      questionHTML += `
        <div class="exam-question-scenario">
          <strong>Scenario:</strong><br>
          ${question.scenario}
        </div>
      `;
    }
    
    questionPanel.innerHTML = questionHTML;
  }

  // Render answer panel
  renderAnswerPanel(question) {
    const answerPanel = document.getElementById('exam-answer-panel');
    if (!answerPanel) return;
    
    const questionIndex = this.currentQuestionIndex;
    const savedAnswer = this.userAnswers.get(questionIndex);
    
    let answerHTML = '<div class="exam-answer-header"><h3>Select Your Answer</h3></div>';
    
    // Handle different question types
    if (question.question_type === 'MCQ' || question.question_type === 'MCQ-Scenario' || 
        question.question_type === 'Cohort-05-MCQ' || question.question_type === 'MCQ-Multiple') {
      answerHTML += this.renderMCQOptions(question, savedAnswer, questionIndex);
    } else if (question.question_type === 'True/False') {
      answerHTML += this.renderTrueFalseOptions(question, savedAnswer, questionIndex);
    } else if (question.question_type === 'Assertion-Reason') {
      answerHTML += this.renderAssertionReasonOptions(question, savedAnswer, questionIndex);
    } else if (question.question_type === 'Match the Following') {
      answerHTML += this.renderMatchingOptions(question, savedAnswer, questionIndex);
    }
    
    answerPanel.innerHTML = answerHTML;
    
    // Add event listeners
    this.addAnswerEventListeners(questionIndex);
  }

  // Render MCQ options
  renderMCQOptions(question, savedAnswer, questionIndex) {
    let html = '<div class="exam-mcq-options">';
    
    if (question.options && question.options.length > 0) {
      question.options.forEach((option, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
        const isChecked = Array.isArray(savedAnswer) ? savedAnswer.includes(option) : savedAnswer === option;
        
        html += `
          <label class="exam-option-label">
            <input type="radio" name="exam-answer-${questionIndex}" value="${option}" ${isChecked ? 'checked' : ''}>
            <span class="exam-option-letter">${optionLetter})</span>
            <span class="exam-option-text">${option}</span>
          </label>
        `;
      });
    }
    
    html += '</div>';
    
    // Add clear selection option
    html += `
      <div class="exam-clear-option">
        <button type="button" class="exam-clear-btn" onclick="examManager.clearAnswer(${questionIndex})">
          Clear Selection
        </button>
      </div>
    `;
    
    return html;
  }

  // Render True/False options
  renderTrueFalseOptions(question, savedAnswer, questionIndex) {
    const trueChecked = savedAnswer === 'True';
    const falseChecked = savedAnswer === 'False';
    
    return `
      <div class="exam-tf-options">
        <label class="exam-option-label">
          <input type="radio" name="exam-answer-${questionIndex}" value="True" ${trueChecked ? 'checked' : ''}>
          <span class="exam-option-letter">A)</span>
          <span class="exam-option-text">True</span>
        </label>
        <label class="exam-option-label">
          <input type="radio" name="exam-answer-${questionIndex}" value="False" ${falseChecked ? 'checked' : ''}>
          <span class="exam-option-letter">B)</span>
          <span class="exam-option-text">False</span>
        </label>
      </div>
      <div class="exam-clear-option">
        <button type="button" class="exam-clear-btn" onclick="examManager.clearAnswer(${questionIndex})">
          Clear Selection
        </button>
      </div>
    `;
  }

  // Render Assertion-Reason options
  renderAssertionReasonOptions(question, savedAnswer, questionIndex) {
    const options = [
      'Both assertion and reason are true, and reason is the correct explanation',
      'Both assertion and reason are true, but reason is not the correct explanation',
      'Assertion is true, but reason is false',
      'Assertion is false, but reason is true',
      'Both assertion and reason are false'
    ];
    
    let html = '<div class="exam-ar-options">';
    
    if (question.assertion) {
      html += `<div class="exam-assertion"><strong>Assertion (A):</strong> ${question.assertion}</div>`;
    }
    if (question.reason) {
      html += `<div class="exam-reason"><strong>Reason (R):</strong> ${question.reason}</div>`;
    }
    
    options.forEach((option, index) => {
      const optionLetter = String.fromCharCode(65 + index);
      const isChecked = savedAnswer === option;
      
      html += `
        <label class="exam-option-label">
          <input type="radio" name="exam-answer-${questionIndex}" value="${option}" ${isChecked ? 'checked' : ''}>
          <span class="exam-option-letter">${optionLetter})</span>
          <span class="exam-option-text">${option}</span>
        </label>
      `;
    });
    
    html += '</div>';
    html += `
      <div class="exam-clear-option">
        <button type="button" class="exam-clear-btn" onclick="examManager.clearAnswer(${questionIndex})">
          Clear Selection
        </button>
      </div>
    `;
    
    return html;
  }

  // Render Matching options
  renderMatchingOptions(question, savedAnswer, questionIndex) {
    let html = '<div class="exam-match-options">';
    
    if (question.leftSide && question.rightSide) {
      html += '<div class="exam-match-container">';
      
      question.leftSide.forEach((leftItem, index) => {
        const savedValue = savedAnswer && savedAnswer[index] ? savedAnswer[index] : '';
        
        html += `
          <div class="exam-match-row">
            <div class="exam-match-left">${leftItem}</div>
            <div class="exam-match-right">
              <select name="exam-match-${questionIndex}-${index}" class="exam-match-select">
                <option value="">-- Select --</option>
        `;
        
        question.rightSide.forEach((rightItem, rightIndex) => {
          const selected = savedValue === rightItem ? 'selected' : '';
          html += `<option value="${rightItem}" ${selected}>${rightItem}</option>`;
        });
        
        html += `
              </select>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    html += `
      <div class="exam-clear-option">
        <button type="button" class="exam-clear-btn" onclick="examManager.clearMatchingAnswer(${questionIndex})">
          Clear All Selections
        </button>
      </div>
    `;
    
    return html;
  }

  // Add event listeners for answer inputs
  addAnswerEventListeners(questionIndex) {
    // Radio button listeners
    const radioInputs = document.querySelectorAll(`input[name="exam-answer-${questionIndex}"]`);
    radioInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.saveAnswer(questionIndex, input.value);
      });
    });
    
    // Matching dropdown listeners
    const matchSelects = document.querySelectorAll(`select[name^="exam-match-${questionIndex}-"]`);
    matchSelects.forEach(select => {
      select.addEventListener('change', () => {
        this.saveMatchingAnswer(questionIndex);
      });
    });
  }

  // Save answer for current question
  saveAnswer(questionIndex, answer) {
    this.userAnswers.set(questionIndex, answer);
    this.updateQuestionNavigation(); // Update navigation to show answered state
  }

  // Save matching answer
  saveMatchingAnswer(questionIndex) {
    const matchSelects = document.querySelectorAll(`select[name^="exam-match-${questionIndex}-"]`);
    const answers = [];
    
    matchSelects.forEach(select => {
      answers.push(select.value);
    });
    
    this.userAnswers.set(questionIndex, answers);
    this.updateQuestionNavigation();
  }

  // Clear answer for current question
  clearAnswer(questionIndex) {
    this.userAnswers.delete(questionIndex);
    
    // Clear radio buttons
    const radioInputs = document.querySelectorAll(`input[name="exam-answer-${questionIndex}"]`);
    radioInputs.forEach(input => {
      input.checked = false;
    });
    
    this.updateQuestionNavigation();
  }

  // Clear matching answer
  clearMatchingAnswer(questionIndex) {
    this.userAnswers.delete(questionIndex);
    
    // Clear select dropdowns
    const matchSelects = document.querySelectorAll(`select[name^="exam-match-${questionIndex}-"]`);
    matchSelects.forEach(select => {
      select.value = '';
    });
    
    this.updateQuestionNavigation();
  }

  // Navigate to specific question
  navigateToQuestion(index) {
    if (index >= 0 && index < this.examQuestions.length) {
      this.currentQuestionIndex = index;
      this.renderCurrentQuestion();
    }
  }

  // Navigate to next question
  nextQuestion() {
    if (this.currentQuestionIndex < this.examQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.renderCurrentQuestion();
    }
  }

  // Navigate to previous question
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderCurrentQuestion();
    }
  }

  // Update navigation buttons
  updateNavigationButtons() {
    const prevBtn = document.getElementById('exam-prev-btn');
    const nextBtn = document.getElementById('exam-next-btn');
    const finishBtn = document.getElementById('exam-finish-btn');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentQuestionIndex === 0;
      prevBtn.onclick = () => this.previousQuestion();
    }
    
    if (nextBtn && finishBtn) {
      if (this.currentQuestionIndex === this.examQuestions.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
        finishBtn.onclick = () => this.finishExam();
      } else {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
        nextBtn.onclick = () => this.nextQuestion();
      }
    }
  }

  // Toggle bookmark for current question
  toggleBookmark() {
    const questionIndex = this.currentQuestionIndex;
    
    if (this.bookmarkedQuestions.has(questionIndex)) {
      this.bookmarkedQuestions.delete(questionIndex);
    } else {
      this.bookmarkedQuestions.add(questionIndex);
    }
    
    this.updateBookmarkButton();
    this.updateQuestionNavigation();
  }

  // Update bookmark button state
  updateBookmarkButton() {
    const bookmarkBtn = document.getElementById('exam-bookmark-btn');
    if (!bookmarkBtn) return;
    
    const isBookmarked = this.bookmarkedQuestions.has(this.currentQuestionIndex);
    
    if (isBookmarked) {
      bookmarkBtn.textContent = '🔖 Bookmarked';
      bookmarkBtn.classList.add('bookmarked');
    } else {
      bookmarkBtn.textContent = '🔖 Bookmark';
      bookmarkBtn.classList.remove('bookmarked');
    }
    
    bookmarkBtn.onclick = () => this.toggleBookmark();
  }

  // Finish exam
  finishExam() {
    if (this.examFinished) {
      this.showExamSummary();
      return;
    }
    
    clearInterval(this.examTimer);
    this.examFinished = true;
    this.showExamSummary();
  }

  // Show exam summary before final submission
  showExamSummary() {
    const answeredCount = this.userAnswers.size;
    const unansweredCount = this.examQuestions.length - answeredCount;
    const bookmarkedCount = this.bookmarkedQuestions.size;
    
    const summaryHTML = `
      <div id="exam-summary">
        <h2>Exam Summary</h2>
        <div class="exam-summary-stats">
          <div class="exam-stat">
            <span class="exam-stat-number">${answeredCount}</span>
            <span class="exam-stat-label">Answered</span>
          </div>
          <div class="exam-stat">
            <span class="exam-stat-number">${unansweredCount}</span>
            <span class="exam-stat-label">Unanswered</span>
          </div>
          <div class="exam-stat">
            <span class="exam-stat-number">${bookmarkedCount}</span>
            <span class="exam-stat-label">Bookmarked</span>
          </div>
        </div>
        
        <div class="exam-summary-actions">
          <button id="exam-review-btn" class="exam-action-btn">Review Answers</button>
          <button id="exam-submit-btn" class="exam-action-btn exam-submit">Submit Final Answers</button>
        </div>
        
        <div class="exam-summary-warning">
          <p><strong>Warning:</strong> Once you submit, you cannot change your answers.</p>
        </div>
      </div>
    `;
    
    const main = document.querySelector('main');
    main.innerHTML = summaryHTML;
    
    // Add event listeners
    document.getElementById('exam-review-btn').onclick = () => {
      this.showExamInterface();
      this.renderCurrentQuestion();
    };
    
    document.getElementById('exam-submit-btn').onclick = () => {
      this.submitExam();
    };
  }

  // Submit exam and show results
  submitExam() {
    if (this.examSubmitted) return;
    
    this.examSubmitted = true;
    
    // Calculate results
    const results = this.calculateResults();
    
    // Show results page
    this.showExamResults(results);
  }

  // Calculate exam results
  calculateResults() {
    let correctCount = 0;
    let totalAnswered = 0;
    const questionResults = [];
    
    this.examQuestions.forEach((question, index) => {
      const userAnswer = this.userAnswers.get(index);
      const isAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
      
      let isCorrect = false;
      if (isAnswered) {
        totalAnswered++;
        isCorrect = this.checkAnswer(question, userAnswer);
        if (isCorrect) correctCount++;
      }
      
      questionResults.push({
        question,
        userAnswer,
        isAnswered,
        isCorrect,
        isBookmarked: this.bookmarkedQuestions.has(index)
      });
    });
    
    const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    
    return {
      correctCount,
      totalAnswered,
      totalQuestions: this.examQuestions.length,
      percentage,
      questionResults,
      timeTaken: this.examTimeMinutes * 60 - this.timeRemaining
    };
  }

  // Check if answer is correct
  checkAnswer(question, userAnswer) {
    const correctAnswer = question.answer || question.correct_answer;
    
    if (Array.isArray(correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        return userAnswer.every(ans => correctAnswer.includes(ans)) && 
               correctAnswer.every(ans => userAnswer.includes(ans));
      } else {
        return correctAnswer.includes(userAnswer);
      }
    } else {
      return userAnswer === correctAnswer;
    }
  }

  // Show exam results
  showExamResults(results) {
    const resultsHTML = `
      <div id="exam-results">
        <h2>Exam Results</h2>
        
        <div class="exam-results-summary">
          <div class="exam-result-card">
            <div class="exam-result-score">${results.percentage}%</div>
            <div class="exam-result-fraction">${results.correctCount}/${results.totalAnswered}</div>
            <div class="exam-result-label">Correct Answers</div>
          </div>
          
          <div class="exam-result-stats">
            <div class="exam-result-stat">
              <span class="exam-result-stat-value">${results.totalAnswered}</span>
              <span class="exam-result-stat-label">Questions Attempted</span>
            </div>
            <div class="exam-result-stat">
              <span class="exam-result-stat-value">${results.totalQuestions - results.totalAnswered}</span>
              <span class="exam-result-stat-label">Questions Skipped</span>
            </div>
            <div class="exam-result-stat">
              <span class="exam-result-stat-value">${Math.floor(results.timeTaken / 60)}:${(results.timeTaken % 60).toString().padStart(2, '0')}</span>
              <span class="exam-result-stat-label">Time Taken</span>
            </div>
          </div>
        </div>
        
        <div class="exam-results-actions">
          <button id="exam-download-pdf" class="exam-action-btn">📄 Download PDF Report</button>
          <button id="exam-back-to-options" class="exam-action-btn">← Back to Options</button>
        </div>
      </div>
    `;
    
    const main = document.querySelector('main');
    main.innerHTML = resultsHTML;
    
    // Add event listeners
    document.getElementById('exam-download-pdf').onclick = () => {
      this.downloadPDFReport(results);
    };
    
    document.getElementById('exam-back-to-options').onclick = () => {
      this.exitExamMode();
    };
  }

  // Download PDF report
  downloadPDFReport(results) {
    // This would generate a PDF report
    // For now, we'll show an alert
    alert('PDF download functionality will be implemented. This would generate a comprehensive report with all questions, your answers, correct answers, and explanations.');
  }

  // Exit exam mode and return to options
  exitExamMode() {
    // Clear timer
    if (this.examTimer) {
      clearInterval(this.examTimer);
    }
    
    // Reset exam state
    this.isExamMode = false;
    this.examQuestions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers.clear();
    this.bookmarkedQuestions.clear();
    this.examFinished = false;
    this.examSubmitted = false;
    
    // Restore original header
    const header = document.querySelector('header');
    header.style.background = '#0078d7'; // Original blue color
    const headerContent = header.querySelector('.header-content');
    if (headerContent) {
      headerContent.innerHTML = `
        InsightPrep<br>
        <span style="font-size: 0.75em; font-weight: normal; color: #e6f3ff; margin-top: 5px; display: inline-block;">
          Where Preparation Meets Reflection
        </span>
      `;
    }
    
    // Restore main content
    const main = document.querySelector('main');
    main.innerHTML = this.originalMainContent || '';
    
    // Trigger return to options
    if (window.showDatabaseOptions && typeof window.showDatabaseOptions === 'function') {
      window.showDatabaseOptions();
    }
  }
}

// Global exam manager instance
window.examManager = new ExamModeManager();