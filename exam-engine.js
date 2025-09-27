/**
 * Exam Engine - Handles exam mode functionality
 */

class ExamEngine {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
        this.bookmarkedQuestions = new Set();
        this.examTimer = null;
        this.examDuration = 0;
        this.timeRemaining = 0;
        this.examStartTime = null;
        this.examCompleted = false;
        this.allowNavigation = false; // Flag to control navigation
        
        this.initializeEventListeners();
        this.loadExamData();
    }

    setupDynamicLayout() {
        // Adjust layout when window resizes or when navigation changes
        this.adjustContainerHeights();
        window.addEventListener('resize', () => this.adjustContainerHeights());
    }



    adjustContainerHeights() {
        try {
            const header = document.querySelector('header');
            const navContainer = document.getElementById('question-nav-container');
            const bottomNav = document.getElementById('bottom-navigation');
            const examContent = document.getElementById('exam-content');

            if (!header || !navContainer || !bottomNav || !examContent) {

                return;
            }

            // Calculate available space
            const headerHeight = header.offsetHeight;
            const navHeight = navContainer.offsetHeight;
            const bottomNavHeight = bottomNav.offsetHeight;
            const margins = 40; // Total margins and padding

            // Calculate dynamic height for exam content
            const availableHeight = window.innerHeight - headerHeight - navHeight - bottomNavHeight - margins;
            const minHeight = 300; // Minimum viable height
            
            const finalHeight = Math.max(availableHeight, minHeight);
            
            // Apply the calculated height
            examContent.style.height = `${finalHeight}px`;
            


        } catch (error) {
            console.error('Error adjusting container heights:', error);
        }
    }



    handleKeyboardNavigation(e) {
        // Only handle keyboard shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.previousQuestion();
                break;
            
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.nextQuestion();
                break;
            
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                this.selectOptionByNumber(parseInt(e.key));
                break;
            
            case 'a': case 'A': case 'b': case 'B': case 'c': case 'C': case 'd': case 'D':
            case 'e': case 'E': case 'f': case 'F': case 'g': case 'G': case 'h': case 'H':
            case 'i': case 'I': case 'j': case 'J': case 'k': case 'K': case 'l': case 'L':
                e.preventDefault();
                this.selectOptionByLetter(e.key.toUpperCase());
                break;
            
            case 'Escape':
                e.preventDefault();
                this.clearCurrentAnswer();
                break;
                
            case ' ': // Spacebar to bookmark
                e.preventDefault();
                this.toggleBookmark();
                break;
        }
    }

    selectOptionByNumber(num) {
        // Map numeric keys to the nth rendered option (supports >6)
        const inputs = document.querySelectorAll('#answer-options input[name="answer"]');
        if (num >= 1 && num <= inputs.length) {
            const letter = inputs[num - 1].value;
            this.selectOptionByLetter(letter);
        }
    }

    selectOptionByLetter(letter) {
        const radio = document.getElementById(`option-${letter}`);
        if (radio && !radio.disabled) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
            this.userAnswers.set(this.currentQuestionIndex, letter);
            this.updateNavigationButtons();
            this.updateQuestionStatus();
        }
    }

    startAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.autoSaveProgress();
        }, 30000);
        
        
    }

    autoSaveProgress() {
        try {
            const progressData = {
                currentQuestionIndex: this.currentQuestionIndex,
                userAnswers: Array.from(this.userAnswers.entries()),
                bookmarkedQuestions: Array.from(this.bookmarkedQuestions),
                timeRemaining: this.timeRemaining,
                examStartTime: this.examStartTime,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('examProgress', JSON.stringify(progressData));
            
            
            // Show subtle save indicator
            this.showSaveIndicator();
            
        } catch (error) {
            console.error('Error auto-saving progress:', error);
        }
    }

    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.innerHTML = '💾 Saved';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8em;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => indicator.style.opacity = '1', 10);
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => document.body.removeChild(indicator), 300);
        }, 2000);
    }

    restoreProgress() {
        try {
            const saved = localStorage.getItem('examProgress');
            if (!saved) return false;
            
            const progressData = JSON.parse(saved);
            
            // Restore answers
            this.userAnswers = new Map(progressData.userAnswers);
            this.bookmarkedQuestions = new Set(progressData.bookmarkedQuestions);
            
            // Restore timing if still valid
            if (progressData.timeRemaining > 0) {
                this.timeRemaining = progressData.timeRemaining;
            }
            
            
            return true;
            
        } catch (error) {
            console.error('Error restoring progress:', error);
            return false;
        }
    }

    clearAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        localStorage.removeItem('examProgress');
    }

    initializeEventListeners() {

        
        try {
            // Navigation buttons
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const finishBtn = document.getElementById('finish-btn');
            
            if (prevBtn) prevBtn.addEventListener('click', () => this.previousQuestion());
            if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());
            if (finishBtn) finishBtn.addEventListener('click', () => this.showFinishModal());
            
            // Control buttons
            const backBtn = document.getElementById('back-to-options');
            const bookmarkBtn = document.getElementById('bookmark-btn');
            const clearBtn = document.getElementById('clear-answer');
            
            if (backBtn) backBtn.addEventListener('click', () => this.backToOptions());
            if (bookmarkBtn) bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
            if (clearBtn) clearBtn.addEventListener('click', () => this.clearCurrentAnswer());
            
            // Modal buttons
            const reviewBtn = document.getElementById('review-answers');
            const submitBtn = document.getElementById('submit-exam');
            const downloadBtn = document.getElementById('download-report');
            const returnBtn = document.getElementById('return-options');
            
            if (reviewBtn) reviewBtn.addEventListener('click', () => this.hideFinishModal());
            if (submitBtn) submitBtn.addEventListener('click', () => this.submitExam());
            if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadPdfReport());
            if (returnBtn) returnBtn.addEventListener('click', () => this.returnToOptions());
            
            // Helper wrappers for beforeunload so we can deterministically detach/attach
            this.attachBeforeUnload = () => {
                if (this.beforeUnloadHandlerAttached) return;
                this.beforeUnloadHandler = (e) => {
                    const exitInProgress = !!window.__examExitInProgress;
                    if (!this.allowNavigation && !this.examCompleted && !exitInProgress) {
                        // Mark that a mid-exam refresh/navigation occurred; no confirmation prompt shown.
                        try { sessionStorage.setItem('examExitByRefresh','1'); } catch(_) {}
                        // No e.returnValue assignment => silent exit allowed; exam cannot restart because of early redirect above.
                        return;
                    }
                };
                window.addEventListener('beforeunload', this.beforeUnloadHandler);
                this.beforeUnloadHandlerAttached = true;
            };
            this.detachBeforeUnload = () => {
                if (this.beforeUnloadHandler && this.beforeUnloadHandlerAttached) {
                    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
                    this.beforeUnloadHandlerAttached = false;
                }
            };
            // Initial attach
            this.attachBeforeUnload();

            // Add keyboard navigation
            document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
            // Resize listener to keep options list height safe relative to bottom navigation
            window.addEventListener('resize', () => this.adjustOptionsListHeight());
            

            
        } catch (error) {
            console.error('Error initializing event listeners:', error);
        }
    }

    // Ensure the inner options list never extends under the bottom nav so the scrollbar remains fully visible
    adjustOptionsListHeight() {
        try {
            if (!this.currentOptionsListEl) return;
            const listEl = this.currentOptionsListEl;
            const bottomNav = document.getElementById('bottom-navigation');
            const rect = listEl.getBoundingClientRect();
            const viewportH = window.innerHeight || document.documentElement.clientHeight;
            const buffer = 12; // spacing above bottom nav
            // Use the top of bottom nav as a hard boundary, fallback to viewport bottom
            const bottomBoundary = bottomNav ? bottomNav.getBoundingClientRect().top : viewportH;
            const available = Math.max(140, bottomBoundary - rect.top - buffer);
            listEl.style.maxHeight = available + 'px';
        } catch (e) {
            
        }
    }

    loadExamData() {
        const examDataStr = sessionStorage.getItem('examData');
        if (!examDataStr) {
            // ...removed debug alert...
            window.location.href = 'mocktest.html';
            return;
        }
        
        try {
            const examData = JSON.parse(examDataStr);
            this.questions = examData.questions || examData.selectedQuestions || [];
            
            if (this.questions.length === 0) {
                // ...removed debug alert...
                window.location.href = 'mocktest.html';
                return;
            }
            
            // (Removed debug inspection of first question)
            
            // Restore database state to AppState for proper navigation back
            if (examData.dbFileName && examData.dbTopics && examData.dbTypes) {
                AppState.dbFileName = examData.dbFileName;
                AppState.dbTopics = examData.dbTopics;
                AppState.dbTypes = examData.dbTypes;
                AppState.isDbMode = true;
                
            }
            
            this.examDuration = examData.duration || Math.ceil(this.questions.length * 1.5);
            this.timeRemaining = this.examDuration * 60;
            // Capture candidate name for display & report (fallback to cookie/localStorage if missing)
            try {
                const fromPayload = (examData.candidateName && String(examData.candidateName).trim()) || '';
                this.candidateName = fromPayload || this.getCandidateNameFromCookie();
            } catch(_) {
                this.candidateName = this.getCandidateNameFromCookie();
            }
            
            this.initializeUI();
            this.startExamTimer();
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Error loading exam data:', error);
            // ...removed debug alert...
            window.location.href = 'mocktest.html';
        }
    }





    initializeUI() {
        // Set up question numbers
        this.createQuestionNumbers();
        
        // Display first question
        this.displayQuestion(0);
        
        // Update counters
        this.updateCounters();
        
        // Set up navigation buttons
        this.updateNavigationButtons();
    }

    createQuestionNumbers() {
        const container = document.getElementById('question-numbers');
        container.innerHTML = '';
        
        this.questions.forEach((_, index) => {
            const btn = document.createElement('button');
            btn.className = 'question-num-btn';
            btn.textContent = index + 1;
            btn.addEventListener('click', () => this.goToQuestion(index));
            container.appendChild(btn);
        });
        
        // Adjust layout after creating navigation buttons
        setTimeout(() => this.adjustContainerHeights(), 100);
    }

    displayQuestion(index) {
        if (index < 0 || index >= this.questions.length) {
            return;
        }
        
        this.currentQuestionIndex = index;
        const question = this.questions[index];
        
        // Update question counter
        const currentQuestionElement = document.getElementById('current-question-num');
        const totalQuestionsElement = document.getElementById('total-questions');
        
        if (currentQuestionElement) {
            currentQuestionElement.textContent = index + 1;
        }
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = this.questions.length;
        }
        
        // Display question text
        const questionTextElement = document.getElementById('question-text');
        if (questionTextElement) {
            const questionText = question.question_text || question.question || 'Question text not available';
            questionTextElement.innerHTML = this.formatQuestionText(questionText);
        }
        
        // Hide topic info in exam mode (no spoilers!)
        const topicInfoElement = document.getElementById('topic-info');
        const metadataElement = document.getElementById('question-metadata');
        if (topicInfoElement) {
            topicInfoElement.textContent = '';
        }
        if (metadataElement) {
            metadataElement.style.display = 'none';
        }
        
        // Update bookmark button
        this.updateBookmarkButton();
        
        // Display answer options
        this.displayAnswerOptions(question);
        
        // Update question number highlights
        this.updateQuestionNumberHighlights();
        
        // Update navigation
        this.updateNavigationButtons();
    }

    // Turn inline enumerations like "I.", "1)", "A.", "a.", "ii.", etc. into separate lines
    formatQuestionText(raw) {
        try {
            const str = String(raw);
            // If content already has list/table/line breaks, leave it as-is to avoid double-formatting
            if (/<\s*(ul|ol|table|tr|li|br)\b/i.test(str)) return str;
            // Insert a marker before enumeration tokens to split later
            // Match tokens preceded by whitespace or '(' and followed by space: 1. 1) I. A. a. ii. etc.
            const enumToken = '((?:\\d+|[ivx]+|[IVX]+|[a-z]|[A-Z])[.)])';
            const re = new RegExp('([\\s(])' + enumToken + '\\s+', 'g');
            const withMarkers = str.replace(re, '$1|||$2 ');
            const parts = withMarkers.split('|||');
            if (parts.length <= 1) return str;
            const preamble = parts.shift().trim();
            const items = parts.map(s => s.trim()).filter(Boolean);
            // Require at least two items to consider it a list
            if (items.length < 2) return str;
            const block = `<div class="enum-block" style="margin-top:6px;display:flex;flex-direction:column;gap:8px;">${items.map(it => `<div class="enum-item">${it}</div>`).join('')}</div>`;
            return (preamble ? `<div class="q-preamble" style="margin-bottom:6px;">${preamble}</div>` : '') + block;
        } catch (e) {
            return raw;
        }
    }

    displayAnswerOptions(question) {
        const container = document.getElementById('answer-options');
        if (!container) return;
        
    container.innerHTML = '';
        // Reset outer container overflow; specific renderers will adjust if needed
        const examContentEl = document.getElementById('exam-content');
    if (examContentEl) examContentEl.style.overflow = '';
    // Re-enable page scroll by default; renderers will disable when needed
    try { document.body.style.overflowY = ''; } catch(_) {}
        // Ensure the right panel uses its own scroll by default (will be disabled when inner list scrolls)
        const answerPanelEl = document.getElementById('answer-panel');
        if (answerPanelEl) answerPanelEl.style.overflowY = 'auto';
    // Reset any extra padding previously applied
    if (answerPanelEl) answerPanelEl.style.paddingBottom = '';
    // Clear current list reference
    this.currentOptionsListEl = null;
        
        // Handle different question types
        if (question.question_type === 'Match' || question.type === 'match') {
            this.displayMatchOptions(question, container);
        } else {
            // Check if this should be multiple choice (array answer) or single choice
            const correctAnswer = question.answer || question.correct_answer || question.correct || question.correctAnswer;
            const isMultipleChoice = Array.isArray(correctAnswer) && correctAnswer.length > 1;
            
            if (isMultipleChoice) {
                this.displayMultipleChoiceOptions(question, container);
            } else {
                this.displayMCQOptions(question, container);
            }
        }
        
        this.restorePreviousAnswer();
    }

    displayMCQOptions(question, container) {
        // Build all option texts (array form preferred, fallback to legacy fields up to 12)
        let optTexts = [];
        if (Array.isArray(question.options) && question.options.length > 0) {
            optTexts = question.options.filter(v => v != null && String(v).trim().length > 0).map(v => String(v));
        } else if (question.option_a && typeof question.option_a === 'string' && question.option_a.includes(',') && (!question.option_b || !question.option_c || !question.option_d)) {
            optTexts = question.option_a.split(',').map(s => s.trim()).filter(Boolean);
        } else {
            const letters = 'abcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < 12; i++) {
                const l = letters[i];
                const val = question[`option_${l}`] || question[`option${l.toUpperCase()}`] || question[l] || question[`choice_${l}`];
                if (val != null && String(val).trim().length > 0) optTexts.push(String(val));
            }
        }

        if (optTexts.length === 0) {
            container.innerHTML = '<p>No options available for this question.</p>';
            return;
        }

        // Scrollable list and hint for many options
        const listRoot = document.createElement('div');
        if (optTexts.length > 6) {
            const hint = document.createElement('div');
            hint.className = 'scroll-hint';
            hint.style.cssText = 'margin:6px 0 8px; padding:8px 10px; background:#eaf4ff; border-left:3px solid #2196f3; color:#084298; font-size:0.9em; border-radius:4px;';
            hint.textContent = 'Scroll down to see more options';
            container.appendChild(hint);

            // Height is computed dynamically to avoid overlapping bottom nav
            listRoot.style.overflowY = 'auto';
            listRoot.style.paddingRight = '6px';
            // dynamic bottom padding so last option clears the bottom bar
            const bottomNav1 = document.getElementById('bottom-navigation');
            const safePad1 = (bottomNav1 ? bottomNav1.offsetHeight : 64) + 24; // nav height + buffer
            listRoot.style.paddingBottom = safePad1 + 'px';
            // Ensure only the options list scrolls
            const examContent = document.getElementById('exam-content');
            if (examContent) examContent.style.overflow = 'hidden';
            try { document.body.style.overflowY = 'hidden'; } catch(_) {}
            const answerPanel = document.getElementById('answer-panel');
            if (answerPanel) answerPanel.style.overflowY = 'hidden';
            if (answerPanel) answerPanel.style.paddingBottom = (safePad1 - 8) + 'px';
            // Save reference and compute height now
            this.currentOptionsListEl = listRoot;
            this.adjustOptionsListHeight();
            // Defer a second recalculation after layout settles
            requestAnimationFrame(() => this.adjustOptionsListHeight());
            setTimeout(() => this.adjustOptionsListHeight(), 60);
        }

        // Restore spacing between options
        listRoot.style.display = 'flex';
        listRoot.style.flexDirection = 'column';
        listRoot.style.gap = '15px';

        optTexts.forEach((text, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            optionDiv.innerHTML = `
                <input type="radio" name="answer" value="${letter}" id="option-${letter}">
                <span class="option-text">${letter}. ${this.escapeHtml(String(text))}</span>
            `;
            const handleOptionClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const radio = optionDiv.querySelector('input[type="radio"]');
                const allRadios = listRoot.querySelectorAll('input[type="radio"]');
                if (radio.checked) {
                    radio.checked = false;
                    this.userAnswers.delete(this.currentQuestionIndex);
                    optionDiv.classList.remove('selected');
                } else {
                    allRadios.forEach(r => { r.checked = false; const od = r.closest('.answer-option'); if (od) od.classList.remove('selected'); });
                    radio.checked = true;
                    this.userAnswers.set(this.currentQuestionIndex, letter);
                    optionDiv.classList.add('selected');
                }
                this.updateCounters();
                this.updateQuestionNumberHighlights();
            };
            optionDiv.addEventListener('click', handleOptionClick);
            const radio = optionDiv.querySelector('input[type="radio"]');
            radio.addEventListener('click', handleOptionClick);
            listRoot.appendChild(optionDiv);
        });

        container.appendChild(listRoot);
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '15px';
        // If we didn't enable inner scrolling (<=6 options), hide right-panel scrollbar
        if (optTexts.length <= 6) {
            const answerPanel = document.getElementById('answer-panel');
            if (answerPanel) answerPanel.style.overflowY = 'hidden';
        }
    }

    displayMultipleChoiceOptions(question, container) {
        // Add instruction for multiple choice
        const instruction = document.createElement('div');
        instruction.className = 'multiple-choice-instruction';
        instruction.innerHTML = '<strong>📝 Select ALL correct answers:</strong>';
        instruction.style.cssText = 'margin-bottom: 10px; padding: 10px; background: #e3f2fd; border-radius: 5px; color: #1565c0;';
        container.appendChild(instruction);

        // Build all option texts
        let optTexts = [];
        if (Array.isArray(question.options) && question.options.length > 0) {
            optTexts = question.options.filter(v => v != null && String(v).trim().length > 0).map(v => String(v));
        } else {
            const letters = 'abcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < 12; i++) {
                const l = letters[i];
                const val = question[`option_${l}`] || question[`option${l.toUpperCase()}`] || question[l] || question[`choice_${l}`];
                if (val != null && String(val).trim().length > 0) optTexts.push(String(val));
            }
        }

        if (optTexts.length === 0) {
            container.innerHTML += '<p>No options available for this question.</p>';
            return;
        }

        const listRoot = document.createElement('div');
        if (optTexts.length > 6) {
            const hint = document.createElement('div');
            hint.className = 'scroll-hint';
            hint.style.cssText = 'margin:6px 0 8px; padding:8px 10px; background:#eaf4ff; border-left:3px solid #2196f3; color:#084298; font-size:0.9em; border-radius:4px;';
            hint.textContent = 'Scroll down to see more options';
            container.appendChild(hint);
            // Height is computed dynamically to avoid overlapping bottom nav
            listRoot.style.overflowY = 'auto';
            listRoot.style.paddingRight = '6px';
            // dynamic bottom padding so last option clears the bottom bar
            const bottomNav2 = document.getElementById('bottom-navigation');
            const safePad2 = (bottomNav2 ? bottomNav2.offsetHeight : 64) + 24; // nav height + buffer
            listRoot.style.paddingBottom = safePad2 + 'px';
            // Ensure only the options list scrolls
            const examContent = document.getElementById('exam-content');
            if (examContent) examContent.style.overflow = 'hidden';
            try { document.body.style.overflowY = 'hidden'; } catch(_) {}
            const answerPanel = document.getElementById('answer-panel');
            if (answerPanel) answerPanel.style.overflowY = 'hidden';
            if (answerPanel) answerPanel.style.paddingBottom = (safePad2 - 8) + 'px';
            // Save reference and compute height now
            this.currentOptionsListEl = listRoot;
            this.adjustOptionsListHeight();
            requestAnimationFrame(() => this.adjustOptionsListHeight());
            setTimeout(() => this.adjustOptionsListHeight(), 60);
        }

        // Restore spacing between options
        listRoot.style.display = 'flex';
        listRoot.style.flexDirection = 'column';
        listRoot.style.gap = '15px';

        optTexts.forEach((text, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            optionDiv.innerHTML = `
                <input type="checkbox" name="answer" value="${letter}" id="option-${letter}">
                <span class="option-text">${letter}. ${this.escapeHtml(String(text))}</span>
            `;
            const handleOptionClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const checkbox = optionDiv.querySelector('input[type=\"checkbox\"]');
                checkbox.checked = !checkbox.checked;
                optionDiv.classList.toggle('selected', checkbox.checked);
                const checkboxes = listRoot.querySelectorAll('input[name=\"answer\"]:checked');
                const selectedOptions = Array.from(checkboxes).map(cb => cb.value);
                if (selectedOptions.length > 0) {
                    this.userAnswers.set(this.currentQuestionIndex, selectedOptions);
                } else {
                    this.userAnswers.delete(this.currentQuestionIndex);
                }
                this.updateCounters();
                this.updateQuestionNumberHighlights();
            };
            optionDiv.addEventListener('click', handleOptionClick);
            const checkbox = optionDiv.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('click', handleOptionClick);
            listRoot.appendChild(optionDiv);
        });

        container.appendChild(listRoot);
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '15px';
        if (optTexts.length <= 6) {
            const answerPanel = document.getElementById('answer-panel');
            if (answerPanel) answerPanel.style.overflowY = 'hidden';
        }
    }

    updateMultipleChoiceAnswers() {
        const checkboxes = document.querySelectorAll('input[name="answer"]:checked');
        const selectedOptions = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedOptions.length > 0) {
            this.userAnswers.set(this.currentQuestionIndex, selectedOptions);
        } else {
            this.userAnswers.delete(this.currentQuestionIndex);
        }
        
        this.updateCounters();
        this.updateQuestionNumberHighlights();
    }

    displayMatchOptions(question, container) {
        // Check if match pairs data exists
        if (!question.matchPairs && !question.match_pairs) {
            container.innerHTML = '<div style="color: red; padding: 20px;">No match pairs found for this question.</div>';
            return;
        }
        
        const matchPairs = question.matchPairs || question.match_pairs || {};
        const leftItems = Object.keys(matchPairs);
        const rightItems = Object.values(matchPairs);
        
        if (leftItems.length === 0) {
            container.innerHTML = '<div style="color: red; padding: 20px;">No match pairs data available.</div>';
            return;
        }
        
        // Shuffle right items for the matching exercise
        const shuffledRightItems = [...rightItems].sort(() => Math.random() - 0.5);

        // Build content in a wrapper so we can decide whether to scroll it or not
        container.innerHTML = '';
    const hint = document.createElement('div');
        hint.className = 'scroll-hint';
    hint.style.cssText = 'display:none;margin:4px 0 4px; padding:6px 10px; background:#eaf4ff; border-left:3px solid #2196f3; color:#084298; font-size:0.9em; border-radius:4px;';
        hint.textContent = 'Scroll down to see more options';
        container.appendChild(hint);

        const wrapper = document.createElement('div');
        wrapper.className = 'match-wrapper';
        wrapper.innerHTML = `
            <div class="match-container">
                <div class="match-left">
                    <h4>Match items from left to right:</h4>
                    ${leftItems.map((item, index) => 
                        `<div class="match-item" data-left="${item}" data-index="${index}">
                            ${item}
                            <select class="match-select" data-left="${item}">
                                <option value="">Choose match...</option>
                                ${shuffledRightItems.map(rightItem => 
                                    `<option value="${rightItem}">${rightItem}</option>`
                                ).join('')}
                            </select>
                        </div>`
                    ).join('')}
                </div>
                <div class="match-right">
                    <h4>Available options:</h4>
                    ${shuffledRightItems.map(item => 
                        `<div class="match-item match-option">${item}</div>`
                    ).join('')}
                </div>
            </div>`;
        container.appendChild(wrapper);
        // Reduce the default top margin of the match container to tighten spacing under the hint
        try {
            const mc = wrapper.querySelector('.match-container');
            if (mc) mc.style.marginTop = '4px';
        } catch(_) {}
        
        // Make column headers sticky within the scrollable wrapper
        const stickifyHeaders = () => {
            try {
                const leftH = wrapper.querySelector('.match-left h4');
                const rightH = wrapper.querySelector('.match-right h4');
                [leftH, rightH].forEach(h => {
                    if (!h) return;
                    h.style.position = 'sticky';
                    h.style.top = '0px';
                    h.style.zIndex = '5';
                    h.style.background = '#ffffff';
                    h.style.padding = '8px 6px 8px 0';
                    h.style.marginBottom = '10px';
                    h.style.boxShadow = '0 2px 0 rgba(0,0,0,0.05)';
                });
            } catch(_) {}
        };
        stickifyHeaders();

        // After attaching, decide if we need an inner scrollbar (avoid double scroll)
        const adjustMatchHeight = () => {
            const bottomNav = document.getElementById('bottom-navigation');
            const boundary = bottomNav ? bottomNav.getBoundingClientRect().top : (window.innerHeight || document.documentElement.clientHeight);
            const rect = wrapper.getBoundingClientRect();
            const buffer = 12;
            const available = Math.max(140, boundary - rect.top - buffer);
            const needsScroll = wrapper.scrollHeight > available + 4; // tolerate rounding
            if (needsScroll) {
                hint.style.display = 'block';
                wrapper.style.overflowY = 'auto';
                wrapper.style.maxHeight = available + 'px';
                wrapper.style.paddingRight = '6px';
                const navH = bottomNav ? bottomNav.offsetHeight : 64;
                wrapper.style.paddingBottom = (navH + 24) + 'px';
                wrapper.style.position = 'relative';
                const examContent = document.getElementById('exam-content');
                if (examContent) examContent.style.overflow = 'hidden';
                const answerPanel = document.getElementById('answer-panel');
                if (answerPanel) {
                    answerPanel.style.overflowY = 'hidden';
                    answerPanel.style.paddingBottom = (navH + 16) + 'px';
                }
                this.currentOptionsListEl = wrapper;
                this.adjustOptionsListHeight();
            } else {
                hint.style.display = 'none';
                wrapper.style.overflowY = '';
                wrapper.style.maxHeight = '';
                wrapper.style.paddingRight = '';
                wrapper.style.paddingBottom = '';
                const answerPanel = document.getElementById('answer-panel');
                if (answerPanel) answerPanel.style.overflowY = 'hidden';
            }
        };
        // Initial compute and after layout settles
        adjustMatchHeight();
        requestAnimationFrame(adjustMatchHeight);
        setTimeout(adjustMatchHeight, 60);
        
        // Add event listeners for the select dropdowns
        const selects = container.querySelectorAll('.match-select');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                this.updateMatchAnswers();
            });
        });
    }
    
    updateMatchAnswers() {
        const selects = document.querySelectorAll('.match-select');
        const matchAnswers = {};
        
        selects.forEach(select => {
            const leftItem = select.getAttribute('data-left');
            const selectedValue = select.value;
            if (selectedValue) {
                matchAnswers[leftItem] = selectedValue;
            }
        });
        
        // Store the match answers
        this.userAnswers.set(this.currentQuestionIndex, matchAnswers);
        this.updateCounters();
        this.updateQuestionNumberHighlights();
    }

    restorePreviousAnswer() {
        const savedAnswer = this.userAnswers.get(this.currentQuestionIndex);
        if (savedAnswer) {
            // Handle single choice MCQ answers (string)
            if (typeof savedAnswer === 'string') {
                const radio = document.querySelector(`input[name="answer"][value="${savedAnswer}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.closest('.answer-option').classList.add('selected');
                }
            }
            // Handle multiple choice answers (array)
            else if (Array.isArray(savedAnswer)) {
                savedAnswer.forEach(option => {
                    const checkbox = document.querySelector(`input[name="answer"][value="${option}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.closest('.answer-option').classList.add('selected');
                    }
                });
            }
            // Handle Match question answers (object)
            else if (typeof savedAnswer === 'object') {
                const selects = document.querySelectorAll('.match-select');
                selects.forEach(select => {
                    const leftItem = select.getAttribute('data-left');
                    if (savedAnswer[leftItem]) {
                        select.value = savedAnswer[leftItem];
                    }
                });
            }
        }
    }

    updateAnswerHighlights() {
        document.querySelectorAll('.answer-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.classList.toggle('selected', radio.checked);
        });
    }

    updateBookmarkButton() {
        const btn = document.getElementById('bookmark-btn');
        const icon = document.getElementById('bookmark-icon');
        const isBookmarked = this.bookmarkedQuestions.has(this.currentQuestionIndex);
        if (!btn || !icon) return;
        btn.classList.toggle('active', isBookmarked);
        // Added explicit bookmarked class to match CSS requirement
        btn.classList.toggle('bookmarked', isBookmarked);
        icon.textContent = isBookmarked ? '📌' : '☐';
    }

    updateQuestionNumberHighlights() {
        const buttons = document.querySelectorAll('.question-num-btn');
        buttons.forEach((btn, index) => {
            btn.classList.remove('current', 'answered', 'bookmarked');
            
            if (index === this.currentQuestionIndex) {
                btn.classList.add('current');
            } else if (this.userAnswers.has(index)) {
                btn.classList.add('answered');
            }
            
            if (this.bookmarkedQuestions.has(index)) {
                btn.classList.add('bookmarked');
            }
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
    }

    updateCounters() {
        const answeredCount = this.userAnswers.size;
        const bookmarkedCount = this.bookmarkedQuestions.size;
        const remaining = this.questions.length - answeredCount;
        const percentage = Math.round((answeredCount / this.questions.length) * 100);
        
        // Update individual counters
        const answeredEl = document.getElementById('answered-count');
        const bookmarkedEl = document.getElementById('bookmarked-count');
        
        if (answeredEl) answeredEl.textContent = `${answeredCount}/${this.questions.length}`;
        if (bookmarkedEl) bookmarkedEl.textContent = bookmarkedCount;
        
        // Update nav info with enhanced statistics
        const navInfo = document.getElementById('nav-info');
        if (navInfo) {
            const candidateLabel = (function(){ try { return localStorage.getItem('candidateLabel') || 'Examinee'; } catch(_) { return 'Examinee'; } })();
            const candidateSeg = this.candidateName && String(this.candidateName).trim().length > 0
                ? ` | <span class="stat-item candidate-name"><span style="opacity:0.85;">${this.escapeHtml(String(candidateLabel))}:</span> <strong>${this.escapeHtml(String(this.candidateName))}</strong></span>`
                : '';
            navInfo.innerHTML = `
                <span class="stat-item">
                    <strong>${answeredCount}/${this.questions.length}</strong> answered 
                    <span class="percentage">(${percentage}%)</span>
                </span> |
                <span class="stat-item">
                    <strong>${bookmarkedCount}</strong> bookmarked
                </span> |
                <span class="stat-item">
                    <strong>${remaining}</strong> remaining
                </span>${candidateSeg}
            `;
        }
    }

    // Navigation methods
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.displayQuestion(this.currentQuestionIndex - 1);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.displayQuestion(this.currentQuestionIndex + 1);
        }
    }

    goToQuestion(index) {
        this.displayQuestion(index);
    }

    toggleBookmark() {
        if (this.bookmarkedQuestions.has(this.currentQuestionIndex)) {
            this.bookmarkedQuestions.delete(this.currentQuestionIndex);
        } else {
            this.bookmarkedQuestions.add(this.currentQuestionIndex);
        }
        
        this.updateBookmarkButton();
        this.updateQuestionNumberHighlights();
        this.updateCounters();
    }

    clearCurrentAnswer() {
        const radios = document.querySelectorAll('input[name="answer"]');
        radios.forEach(radio => radio.checked = false);
        
        this.userAnswers.delete(this.currentQuestionIndex);
        this.updateAnswerHighlights();
        this.updateCounters();
        this.updateQuestionNumberHighlights();
    }

    // Timer methods
    startExamTimer() {
        this.examStartTime = Date.now();
        this.updateTimerDisplay();
        
        this.examTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer').textContent = display;
        
        // Change color when time is running low
        const timerDisplay = document.getElementById('timer-display');
        if (this.timeRemaining <= 300) { // Last 5 minutes
            timerDisplay.style.background = '#dc3545';
        } else if (this.timeRemaining <= 600) { // Last 10 minutes
            timerDisplay.style.background = '#fd7e14';
        }
    }

    timeUp() {
        clearInterval(this.examTimer);
    // ...removed debug alert...
        this.submitExam();
    }

    // Exam completion methods
    showFinishModal() {
        const modal = document.getElementById('finish-modal');
        const answered = this.userAnswers.size;
        const unanswered = this.questions.length - answered;
        const bookmarked = this.bookmarkedQuestions.size;
        
        document.getElementById('summary-answered').textContent = answered;
        document.getElementById('summary-unanswered').textContent = unanswered;
        document.getElementById('summary-bookmarked').textContent = bookmarked;
        
        modal.style.display = 'flex';
    }

    hideFinishModal() {
        document.getElementById('finish-modal').style.display = 'none';
    }

    async submitExam() {
        this.examCompleted = true;
        clearInterval(this.examTimer);
        
        // Calculate results
        const results = this.calculateResults();
        
        // Show results modal
        this.showResults(results);
        
        // Hide finish modal
        this.hideFinishModal();
    }

    calculateResults() {
        let correctCount = 0;
        let totalAnswered = this.userAnswers.size;
        
        
        
        this.userAnswers.forEach((answer, questionIndex) => {
            const question = this.questions[questionIndex];
            
            // Get the correct answer (use 'answer' field since 'correct_answer' is undefined)
            const correctAnswer = question.answer || question.correct_answer || question.correct || question.correctAnswer;
            
            let isCorrect = false;
            let userAnswerText = answer;
            
            // Handle different answer formats based on question type
            if (question.question_type === 'Match' || question.type === 'match') {
                // For matching questions, user answer is already an object
                userAnswerText = answer;
            } else if (Array.isArray(answer)) {
                // For multiple choice questions, convert array of letters to array of option texts
                userAnswerText = answer.map(letter => {
                    if (typeof letter === 'string' && letter.length === 1 && /[A-Z]/i.test(letter)) {
                        const optionField = `option_${letter.toLowerCase()}`;
                        let optionText = question[optionField] || 
                                        question[`option${letter}`] || 
                                        question[letter.toLowerCase()] || 
                                        question[`choice_${letter.toLowerCase()}`];
                        
                        // Try from options array if field lookup failed
                        if (!optionText && question.options && Array.isArray(question.options)) {
                            const optionIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
                            if (optionIndex >= 0 && optionIndex < question.options.length) {
                                optionText = question.options[optionIndex];
                            }
                        }
                        return optionText || letter;
                    }
                    return letter;
                });
            } else if (typeof answer === 'string' && answer.length === 1 && /[A-Z]/i.test(answer)) {
                // For single choice MCQ questions, convert letter (A, B, C, D) to full option text
                const optionField = `option_${answer.toLowerCase()}`;
                userAnswerText = question[optionField] || 
                                question[`option${answer}`] || 
                                question[answer.toLowerCase()] || 
                                question[`choice_${answer.toLowerCase()}`];
                
                // If we couldn't find the option text, try from the options array
                if (!userAnswerText && question.options && Array.isArray(question.options)) {
                    const optionIndex = answer.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
                    if (optionIndex >= 0 && optionIndex < question.options.length) {
                        userAnswerText = question.options[optionIndex];
                    }
                }
            } else {
                // For other question types, use as-is
                userAnswerText = answer;
            }
            
            // Compare the user's answer with the correct answer based on question type
            if (question.question_type === 'Match' || question.type === 'match') {
                // For matching questions, compare objects
                if (typeof correctAnswer === 'object' && typeof userAnswerText === 'object') {
                    // Normalize both objects for comparison
                    const normalizeMatchAnswer = (obj) => {
                        const normalized = {};
                        Object.keys(obj).forEach(key => {
                            normalized[key.trim()] = obj[key].toString().trim();
                        });
                        return normalized;
                    };
                    
                    const normalizedCorrect = normalizeMatchAnswer(correctAnswer);
                    const normalizedUser = normalizeMatchAnswer(userAnswerText);
                    
                    // Check if all pairs match
                    const correctKeys = Object.keys(normalizedCorrect);
                    const userKeys = Object.keys(normalizedUser);
                    
                    isCorrect = correctKeys.length === userKeys.length &&
                               correctKeys.every(key => 
                                   normalizedCorrect[key] === normalizedUser[key]
                               );
                } else {
                    isCorrect = false;
                }
            } else if (Array.isArray(correctAnswer) && Array.isArray(userAnswerText)) {
                // For multiple choice questions, compare arrays
                const normalizeArray = (arr) => arr.map(item => item.toString().trim().toLowerCase()).sort();
                isCorrect = JSON.stringify(normalizeArray(correctAnswer)) === 
                           JSON.stringify(normalizeArray(userAnswerText));
            } else if (typeof correctAnswer === 'string' && typeof userAnswerText === 'string') {
                // For single choice questions, compare strings
                isCorrect = correctAnswer.trim().toLowerCase() === userAnswerText.trim().toLowerCase();
            } else {
                // Fallback comparison
                isCorrect = correctAnswer === userAnswerText;
            }
            // (Removed per-answer debug object output)
            
            if (isCorrect) {
                correctCount++;
                
            } else {
                
            }
        });
        
        const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        
    return {
            totalQuestions: this.questions.length,
            totalAnswered,
            correctCount,
            percentage,
            timeSpent: this.examDuration * 60 - this.timeRemaining
        };
    }

    showResults(results) {
        const modal = document.getElementById('results-modal');
        
        document.getElementById('final-score').textContent = results.percentage;
        document.getElementById('correct-answers').textContent = results.correctCount;
        document.getElementById('total-answered').textContent = results.totalAnswered;
        
        // Add detailed breakdown
        const breakdown = document.getElementById('results-breakdown');
        const timeSpentMinutes = Math.floor(results.timeSpent / 60);
        const timeSpentSeconds = results.timeSpent % 60;
        
        breakdown.innerHTML = `
            <p><strong>Total Questions:</strong> ${results.totalQuestions}</p>
            <p><strong>Answered:</strong> ${results.totalAnswered}</p>
            <p><strong>Unanswered:</strong> ${results.totalQuestions - results.totalAnswered}</p>
            <p><strong>Correct:</strong> ${results.correctCount}</p>
            <p><strong>Incorrect:</strong> ${results.totalAnswered - results.correctCount}</p>
            <p><strong>Time Spent:</strong> ${timeSpentMinutes}m ${timeSpentSeconds}s</p>
            <p><strong>Bookmarked:</strong> ${this.bookmarkedQuestions.size}</p>
        `;

        // Inject candidate name into the results header area
        try {
            const scoreDisplay = document.getElementById('score-display');
            if (scoreDisplay) {
                let candidateLine = document.getElementById('candidate-name-result');
                const label = (function(){ try { return localStorage.getItem('candidateLabel') || 'Examinee'; } catch(_) { return 'Examinee'; } })();
                const safeName = this.escapeHtml(String(this.candidateName || ''));
                if (!candidateLine) {
                    candidateLine = document.createElement('p');
                    candidateLine.id = 'candidate-name-result';
                    candidateLine.style.marginTop = '0';
                    candidateLine.style.marginBottom = '8px';
                    candidateLine.style.fontSize = '0.95em';
                    candidateLine.innerHTML = `<strong>${this.escapeHtml(String(label))}:</strong> ${safeName || '<em>(not provided)</em>'}`;
                    scoreDisplay.insertAdjacentElement('afterbegin', candidateLine);
                } else {
                    candidateLine.innerHTML = `<strong>${this.escapeHtml(String(label))}:</strong> ${safeName || '<em>(not provided)</em>'}`;
                }
            }
        } catch(_) { /* noop */ }
        
        modal.style.display = 'flex';
    }

    downloadPdfReport() {
        if (this._pdfOpening) {
            
            return;
        }
        this._pdfOpening = true;
        
        // Build an HTML report and open in new tab (blob URL) with auto-print
        const results = this.calculateResults();
        const ts = new Date();
        const pad = (n) => String(n).padStart(2,'0');
        const fileStamp = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}_${pad(ts.getHours())}-${pad(ts.getMinutes())}-${pad(ts.getSeconds())}`;
        const docTitle = `Exam_Report_${fileStamp}`;

        // Gather per-question details
        let questionsHtml = '';
        this.questions.forEach((q, i) => {
            try {
                const rawUser = this.userAnswers.get(i);
                const correctAnswer = q.answer || q.correct_answer || q.correct || q.correctAnswer;
                let userAnswerText = rawUser;

                // Transform user answer to text similar to calculateResults
                if (Array.isArray(rawUser)) {
                    userAnswerText = rawUser.map(letter => {
                        if (typeof letter === 'string' && letter.length === 1 && /[A-Z]/i.test(letter)) {
                            const optionField = `option_${letter.toLowerCase()}`;
                            let optionText = q[optionField] || q[`option${letter}`] || q[letter.toLowerCase()] || q[`choice_${letter.toLowerCase()}`];
                            if (!optionText && Array.isArray(q.options)) {
                                const idx = letter.charCodeAt(0) - 65;
                                if (idx >= 0 && idx < q.options.length) optionText = q.options[idx];
                            }
                            return optionText || letter;
                        }
                        return letter;
                    }).join(', ');
                } else if (typeof rawUser === 'string' && rawUser.length === 1 && /[A-Z]/i.test(rawUser)) {
                    const optField = `option_${rawUser.toLowerCase()}`;
                    userAnswerText = q[optField] || q[`option${rawUser}`] || q[rawUser.toLowerCase()] || q[`choice_${rawUser.toLowerCase()}`];
                    if (!userAnswerText && Array.isArray(q.options)) {
                        const oIdx = rawUser.charCodeAt(0) - 65;
                        if (oIdx >= 0 && oIdx < q.options.length) userAnswerText = q.options[oIdx];
                    }
                    if (!userAnswerText) userAnswerText = rawUser; // fallback
                }

                // For object (Match) answers, convert to readable text
                if (rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)) {
                    userAnswerText = Object.entries(rawUser).map(([l,r]) => `${l} → ${r}`).join('; ');
                }
                // Compute correctness including match object deep compare (case-insensitive)
                const isCorrect = (function() {
                    // Helpers to normalize answers for comparison
                    const getOptionTextByLetter = (letter) => {
                        if (!letter || typeof letter !== 'string') return null;
                        const L = letter.trim().toUpperCase();
                        if (!/^[A-Z]$/.test(L)) return null;
                        let text = null;
                        // Prefer options array when present
                        if (Array.isArray(q.options)) {
                            const idx = L.charCodeAt(0) - 65; // A->0
                            if (idx >= 0 && idx < q.options.length) text = q.options[idx];
                        }
                        // Fallback to individual fields if needed
                        if (!text) {
                            const field = `option_${L.toLowerCase()}`;
                            text = q[field] || q[`option${L}`] || q[L.toLowerCase()] || q[`choice_${L.toLowerCase()}`] || null;
                        }
                        return (typeof text === 'string') ? text : null;
                    };
                    const toTextIfLetter = (val) => {
                        if (typeof val === 'string' && val.trim().length === 1 && /[A-F]/i.test(val.trim())) {
                            const mapped = getOptionTextByLetter(val.trim());
                            return mapped ?? val; // if no mapping, keep original
                        }
                        return val;
                    };
                    const normalizeArrayToTexts = (arr) => Array.isArray(arr) ? arr.map(toTextIfLetter) : arr;
                    const normSet = (arr) => arr
                        .map(x => String(x).trim().toLowerCase())
                        .sort();
                    // Match questions (object of pairs)
                    if (correctAnswer && typeof correctAnswer === 'object' && !Array.isArray(correctAnswer) && rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)) {
                        const cKeys = Object.keys(correctAnswer);
                        // All left keys must be answered & match ignoring case/whitespace
                        return cKeys.length > 0 && cKeys.every(k => {
                            const exp = String(correctAnswer[k]).trim().toLowerCase();
                            const got = rawUser[k] != null ? String(rawUser[k]).trim().toLowerCase() : null;
                            return exp === got;
                        });
                    }
                    if (Array.isArray(correctAnswer) && Array.isArray(rawUser)) {
                        // Normalize both arrays to option texts if any values are letters (A-F)
                        const corrTexts = normalizeArrayToTexts(correctAnswer);
                        const userTexts = normalizeArrayToTexts(rawUser);
                        return JSON.stringify(normSet(corrTexts)) === JSON.stringify(normSet(userTexts));
                    } else if (typeof correctAnswer === 'string' && typeof userAnswerText === 'string') {
                        const cNorm = toTextIfLetter(correctAnswer) ?? correctAnswer;
                        const uNorm = toTextIfLetter(userAnswerText) ?? userAnswerText;
                        return String(cNorm).trim().toLowerCase() === String(uNorm).trim().toLowerCase();
                    } else {
                        return correctAnswer === rawUser;
                    }
                })();
                const bookmarked = this.bookmarkedQuestions.has(i);
                const status = rawUser ? (isCorrect ? 'Correct' : 'Incorrect') : 'Unanswered';
                const showCorrectLine = !isCorrect; // show correct if wrong or unanswered
                const options = q.options || q.answers || q.choices || null;
                let optionsMarkup = '';
                if ((q.type === 'match' || q.question_type === 'Match') && (q.matchPairs || q.match_pairs)) {
                    const pairs = q.matchPairs || q.match_pairs;
                    const userObj = (rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)) ? rawUser : {};
                    const rows = Object.keys(pairs).map(left => {
                        const correctRight = pairs[left];
                        const userRight = userObj[left];
                        const rowCorrect = userRight != null && String(userRight).trim().toLowerCase() === String(correctRight).trim().toLowerCase();
                        return `<tr class="${rowCorrect ? 'correct-row' : 'incorrect-row'}"><td>${this.escapeHtml(left)}</td><td>${this.escapeHtml(correctRight)}</td><td>${userRight ? this.escapeHtml(userRight) : '<em>-</em>'}</td></tr>`;
                    }).join('');
                    optionsMarkup = `<table class="match-table"><thead><tr><th>Left</th><th>Correct Match</th><th>Your Match</th></tr></thead><tbody>${rows}</tbody></table>`;
                } else if (Array.isArray(options)) {
                    optionsMarkup = `<ol class="options">${options.map(opt => `<li>${this.escapeHtml(String(opt))}</li>`).join('')}</ol>`;
                }
                // Build correct answer line string for match objects
                let correctAnswerText = '';
                if (showCorrectLine) {
                    if (correctAnswer && typeof correctAnswer === 'object' && !Array.isArray(correctAnswer)) {
                        correctAnswerText = Object.entries(correctAnswer).map(([l,r]) => `${l} → ${r}`).join('; ');
                    } else {
                        correctAnswerText = Array.isArray(correctAnswer)? correctAnswer.join(', ') : String(correctAnswer);
                    }
                }
                const isMatchQuestion = (q.type === 'match' || q.question_type === 'Match') && (q.matchPairs || q.match_pairs);
                const answerLineMarkup = isMatchQuestion ? '' : `<div class="answer-line">Your answer: <strong>${rawUser != null ? this.escapeHtml(String(userAnswerText)) : '<em>(none)</em>'}</strong></div>`;
                const correctLineMarkup = isMatchQuestion ? '' : (showCorrectLine ? `<div class=\"correct-line\">Correct answer: <strong>${this.escapeHtml(correctAnswerText)}</strong></div>` : '');
                questionsHtml += `
                <div class=\"question-block ${isCorrect ? 'correct' : 'incorrect'}\">
                    <div class=\"q-header\">
                        <span class=\"q-number\">Q${i+1}</span>
                        <span class=\"q-status ${status.toLowerCase()}\">${status}${bookmarked ? ' • Bookmarked' : ''}</span>
                    </div>
                    <div class=\"q-text\">${this.escapeHtml(q.question_text || q.question || '')}</div>
                    ${optionsMarkup}
                    ${answerLineMarkup}
                    ${correctLineMarkup}
                </div>`;
            } catch(err) {
                console.error('[PDF] Error building question block', i, err);
            }
        });

        const timeSpent = results.timeSpent;
        const timeSpentMinutes = Math.floor(timeSpent / 60);
        const timeSpentSeconds = timeSpent % 60;

    const labelForPdf = (function(){ try { return localStorage.getItem('candidateLabel') || 'Examinee'; } catch(_) { return 'Examinee'; } })();
    const summaryHtml = `
            <div class="summary">
                <h1>Exam Report</h1>
        <p><strong>${this.escapeHtml(String(labelForPdf))}:</strong> ${this.escapeHtml(String(this.candidateName || '')) || '(not provided)'}</p>
                <p><strong>Date:</strong> ${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}</p>
                <p><strong>Duration (configured):</strong> ${this.examDuration} minutes</p>
                <p><strong>Time Spent:</strong> ${timeSpentMinutes}m ${timeSpentSeconds}s</p>
                <p><strong>Score:</strong> ${results.percentage}% (${results.correctCount}/${results.totalAnswered} answered correct)</p>
                <p><strong>Total Questions:</strong> ${results.totalQuestions}</p>
                <p><strong>Answered:</strong> ${results.totalAnswered}</p>
                <p><strong>Unanswered:</strong> ${results.totalQuestions - results.totalAnswered}</p>
                <p><strong>Incorrect:</strong> ${results.totalAnswered - results.correctCount}</p>
                <p><strong>Bookmarked:</strong> ${this.bookmarkedQuestions.size}</p>
            </div>`;

        const style = `
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
                h1 { margin-top:0; }
                .summary { border:1px solid #ccc; padding:16px; border-radius:6px; background:#f8f9fa; }
                .question-block { page-break-inside: avoid; border:1px solid #ddd; border-left:5px solid #888; padding:12px 14px 10px; margin:16px 0; border-radius:4px; }
                .question-block.correct { border-left-color:#2e7d32; }
                .question-block.incorrect { border-left-color:#c62828; }
                .q-header { display:flex; gap:12px; font-size:12px; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
                .q-number { font-weight:bold; color:#555; }
                .q-status.correct { color:#2e7d32; }
                .q-status.incorrect { color:#c62828; }
                .q-status.unanswered { color:#6a1b9a; }
                .q-text { font-size:14px; margin:4px 0 8px; line-height:1.4; }
                ol.options { margin:4px 0 8px 20px; padding:0; }
                ol.options li { margin:2px 0; font-size:13px; }
                .answer-line, .correct-line { font-size:12.5px; margin:2px 0; }
                .correct-line { color:#1b5e20; }
                table.match-table { width:100%; border-collapse:collapse; margin:6px 0 8px; font-size:12.5px; }
                table.match-table th, table.match-table td { border:1px solid #bbb; padding:4px 6px; vertical-align:top; }
                table.match-table th { background:#e0e0e0; text-align:left; }
                                table.match-table tr.correct-row td { background:#e8f5e9; }
                                table.match-table tr.incorrect-row td { background:#ffebee; }
                                /* Add strong visual accents that survive print even if backgrounds are stripped */
                                table.match-table tr.incorrect-row td:first-child { border-left: 4px solid #c62828; }
                                table.match-table tr.correct-row td:first-child { border-left: 4px solid #2e7d32; }
                                @media print {
                                    .no-print { display:none !important; }
                                    /* Force browsers to keep background colors on print when possible */
                                    html, body, .summary, .question-block, table.match-table tr.correct-row td, table.match-table tr.incorrect-row td, table.match-table th {
                                        -webkit-print-color-adjust: exact; print-color-adjust: exact;
                                    }
                                    table.match-table th { background:#e0e0e0 !important; }
                                    table.match-table tr.correct-row td { background:#e8f5e9 !important; }
                                    table.match-table tr.incorrect-row td { background:#ffebee !important; }
                                }
            </style>`;

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title>${style}</head><body>${summaryHtml}<hr>${questionsHtml}</body></html>`;

        try {
            const autoPrintScript = `<script>document.title='${docTitle}';setTimeout(()=>{try{window.print();}catch(e){console.error(e);} },300);<\/script>`;
            const fullHtml = html.replace('</body>',''+autoPrintScript+'\n</body>');
            const blob = new Blob([fullHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank', 'noopener,noreferrer');
            if (!win) {
                URL.revokeObjectURL(url);
                this._pdfOpening = false;
                // Silently log; user preferred no visible warning toast
                
                return;
            }
            // When tab is closed or after some time, revoke URL
            const revokeLater = () => { try { URL.revokeObjectURL(url); } catch(_) {} this._pdfOpening = false; };
            setTimeout(revokeLater, 5000);
        } catch (err) {
            console.error('[PDF] Blob open failed:', err);
            this._pdfOpening = false;
            this.showTransientNotice('Failed to create PDF tab. Check console for details.', { type: 'error' });
        }
    }

    // Basic HTML escaping helper for PDF/print content
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Read candidate name from cookie/localStorage as a fallback
    getCandidateNameFromCookie() {
        try {
            const nameEQ = encodeURIComponent('candidateName') + '=';
            const parts = document.cookie.split(';');
            for (let c of parts) {
                c = c.trim();
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length));
                }
            }
        } catch(_) { /* ignore */ }
        try {
            const v = localStorage.getItem('candidateName');
            return v ? String(v) : '';
        } catch(_) { return ''; }
    }

    /**
     * Display a small transient notification (toast) instead of using alert().
     * opts: { type: 'info' | 'warning' | 'error', durationMs?: number }
     */
    showTransientNotice(message, opts = {}) {
        try {
            const { type = 'info', durationMs = 5000 } = opts;
            // Reuse existing one if present
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;font-family:Arial,sans-serif;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            const colors = {
                info: '#1976d2',
                warning: '#f57c00',
                error: '#c62828'
            };
            const bg = colors[type] || colors.info;
            toast.style.cssText = `background:${bg};color:#fff;padding:10px 14px;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:13px;line-height:1.3;opacity:0;transform:translateY(-6px);transition:opacity .25s,transform .25s;max-width:320px;`;
            toast.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">`+
                `<span style="flex:1;">${this.escapeHtml(String(message))}</span>`+
                `<button type="button" aria-label="Dismiss" style="background:rgba(255,255,255,.25);border:none;color:#fff;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:12px;">×</button>`+
                `</div>`;
            container.appendChild(toast);
            requestAnimationFrame(()=>{ toast.style.opacity='1'; toast.style.transform='translateY(0)'; });
            const btn = toast.querySelector('button');
            const removeToast = () => {
                toast.style.opacity='0';
                toast.style.transform='translateY(-6px)';
                setTimeout(()=>toast.remove(), 260);
            };
            btn.addEventListener('click', removeToast);
            setTimeout(removeToast, durationMs);
        } catch(e) {
            // Fallback silently if DOM not ready
            
        }
    }

    backToOptions() {
        
        
        if (!this.examCompleted) {
            // Show custom HTML dialog instead of JavaScript alert
            this.showExitConfirmDialog();
        } else {
            this.returnToOptions();
        }
    }

    showExitConfirmDialog() {
        // Remove any existing modal first
        const existingModal = document.getElementById('exit-confirm-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal dialog with higher z-index and better event handling
        const modal = document.createElement('div');
        modal.id = 'exit-confirm-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: Arial, sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            z-index: 1000000;
            position: relative;
        `;

        const confirmButton = document.createElement('button');
        confirmButton.innerHTML = 'Yes, Exit Exam';
        confirmButton.style.cssText = `
            background: #d32f2f;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            margin-right: 15px;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.innerHTML = 'Continue Exam';
        cancelButton.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
        `;

        dialog.innerHTML = `
            <h3 style="margin-top: 0; color: #d32f2f; margin-bottom: 20px;">⚠️ Exit Exam?</h3>
            <p style="margin-bottom: 15px; line-height: 1.4; color: #333;">
                Are you sure you want to exit the exam?<br>
                <strong>Your progress will be lost.</strong>
            </p>
                <p style="margin-bottom: 25px; line-height: 1.3; color: #666; font-size: 0.9em;">
                    <em>This action will return you to the main screen.</em>
                </p>
            <div style="display: flex; gap: 15px; justify-content: center;"></div>
        `;

        const buttonContainer = dialog.querySelector('div');
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);

        modal.appendChild(dialog);

        // Before showing confirm dialog, detach beforeunload so that navigation after confirm cannot trigger a prompt
        this.detachBeforeUnload();
        // Add event listeners before appending to DOM
        confirmButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.remove();
                // Mark global exit flag to skip any other beforeunload logic
                window.__examExitInProgress = true;
                this.allowNavigation = true;
                // Remove handler immediately & null reference
                this.detachBeforeUnload();
                // Proceed
                this.returnToOptions();
        });

        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.remove();
            // Re-attach protection if user canceled and exam still active
            if (!this.examCompleted) {
                this.attachBeforeUnload();
            }
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Prevent any default browser behavior
        modal.addEventListener('beforeunload', (e) => {
            e.preventDefault();
        });

        document.body.appendChild(modal);

        // Focus on the cancel button by default
        setTimeout(() => {
            cancelButton.focus();
        }, 100);
    }

    returnToOptions() {
        
        
        // Clean up the exam state first
        this.examCompleted = true;
        this.allowNavigation = true;
        // Ensure any beforeunload handlers are removed (idempotent)
        this.suppressBeforeUnload();
        
        // Clear the exam timer
        if (this.examTimer) {
            clearInterval(this.examTimer);
            this.examTimer = null;
        }
        
        // Clean up session storage
        sessionStorage.removeItem('examData');
        sessionStorage.removeItem('returnToOptions');
        sessionStorage.removeItem('dbState');
        
        if (window.AppState) {
            window.AppState.isExamMode = false;
        }
        
        // Remove our beforeunload handler
        // (Already handled by suppressBeforeUnload, but keep as fallback no-op)
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
        window.onbeforeunload = null;
        
        
        
        // Simple, direct navigation - user starts fresh
        window.location.href = 'mocktest.html';
    }

    /**
     * Explicitly suppress the browser beforeunload confirmation.
     * Safe to call multiple times.
     */
    suppressBeforeUnload() {
        try {
            this.allowNavigation = true;
            if (this.beforeUnloadHandler) {
                window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            }
            window.onbeforeunload = null;
        } catch (e) {
            
        }
    }
    


    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
    }
    
    showLoadingError(message) {
        console.error('🚨 Loading Error:', message);
        
        const errorElement = document.getElementById('loading-error');
        if (errorElement) {
            errorElement.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>⚠️ Loading Error</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; cursor: pointer;">
                        🔄 Try Again
                    </button>
                    <button onclick="window.history.back()" style="padding: 10px 20px; margin: 10px; cursor: pointer;">
                        ← Go Back
                    </button>
                </div>
            `;
            errorElement.style.display = 'block';
        }
        
        // ...removed debug alert fallback...
    }
    
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show error in question area
        const questionText = document.getElementById('question-text');
        if (questionText) {
            questionText.textContent = `Initialization Error: ${error.message || 'Unknown error'}. Please return to options and try again.`;
        }
        
        // Enable back button
        const backButton = document.getElementById('back-to-options');
        if (backButton) {
            backButton.style.display = 'block';
            backButton.onclick = () => {
                window.location.href = 'mocktest.html';
            };
        }
    }
}

// Early refresh-exit detection: if previous load set the refresh exit flag, redirect before engine instantiation
(function(){
  try {
    if (sessionStorage.getItem('examExitByRefresh') === '1') {
      sessionStorage.removeItem('examExitByRefresh');
      // Optional message storage (can be read on mocktest.html to show notice)
      sessionStorage.setItem('examExitMessage','Exam ended due to page refresh.');
      window.location.replace('mocktest.html');
    }
  } catch(_) {}
})();

// Duplicate DOMContentLoaded initialization removed; exam.html handles instantiation.
// Global one-time alert suppression for legacy "Popup blocked" message
// ...removed global alert suppression for legacy "Popup blocked" message...