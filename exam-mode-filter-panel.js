// Enhanced Database Filter Panel Module with Exam Mode Support
// Extends the existing database filter panel to support exam practice mode

class ExamModeFilterPanel {
  constructor() {
    this.isExamMode = false;
    this.maxExamQuestions = 50;
  }

  // Create the mode toggle section
  createModeToggleSection() {
    const modeDiv = document.createElement("div");
    modeDiv.className = "filter-section exam-mode-section";
    modeDiv.innerHTML = `
      <h3>Study Mode Selection</h3>
      <div class="mode-toggle-container">
        <div class="mode-toggle">
          <input type="radio" id="learning-mode" name="study-mode" value="learning" checked>
          <label for="learning-mode" class="mode-toggle-label">
            <span class="mode-icon">📚</span>
            <span class="mode-title">Learning Mode</span>
            <span class="mode-description">Practice with immediate feedback and explanations</span>
          </label>
        </div>
        
        <div class="mode-toggle">
          <input type="radio" id="exam-mode" name="study-mode" value="exam">
          <label for="exam-mode" class="mode-toggle-label">
            <span class="mode-icon">⏱️</span>
            <span class="mode-title">Exam Practice Mode</span>
            <span class="mode-description">Timed exam simulation with final scoring</span>
          </label>
        </div>
      </div>
    `;

    return modeDiv;
  }

  // Create exam-specific options
  createExamOptionsSection() {
    const examDiv = document.createElement("div");
    examDiv.className = "filter-section exam-options-section";
    examDiv.id = "exam-options-section";
    examDiv.style.display = "none";
    
    examDiv.innerHTML = `
      <h3>Exam Settings</h3>
      
      <div class="exam-option-group">
        <label for="exam-duration">Exam Duration (minutes):</label>
        <div class="exam-duration-container">
          <input type="number" id="exam-duration" min="15" max="180" value="60" step="15">
          <div class="exam-duration-presets">
            <button type="button" class="duration-preset" data-minutes="30">30 min</button>
            <button type="button" class="duration-preset" data-minutes="45">45 min</button>
            <button type="button" class="duration-preset" data-minutes="60">60 min</button>
            <button type="button" class="duration-preset" data-minutes="90">90 min</button>
            <button type="button" class="duration-preset" data-minutes="120">2 hours</button>
          </div>
        </div>
      </div>
      
      <div class="exam-info-box">
        <div class="exam-info-icon">ℹ️</div>
        <div class="exam-info-content">
          <strong>Exam Mode Features:</strong>
          <ul>
            <li>Maximum 50 questions per exam</li>
            <li>Split-screen interface (question | answers)</li>
            <li>Question navigation and bookmarking</li>
            <li>No immediate feedback during exam</li>
            <li>Timed completion with countdown</li>
            <li>Comprehensive results at the end</li>
            <li>PDF report generation</li>
          </ul>
        </div>
      </div>
    `;

    return examDiv;
  }

  // Update the number of questions section for exam mode
  updateNumberOfQuestionsSection(numDiv, maxQuestions) {
    if (!numDiv) return;

    const numInput = numDiv.querySelector('#numQuestions');
    const maxQuestionsInfo = numDiv.querySelector('#maxQuestionsInfo');
    const answerAllBtn = numDiv.querySelector('#answerAllBtnDb');

    if (this.isExamMode) {
      // Limit to 50 questions in exam mode
      const examMaxQuestions = Math.min(maxQuestions, this.maxExamQuestions);
      
      if (numInput) {
        numInput.max = examMaxQuestions;
        if (parseInt(numInput.value) > examMaxQuestions) {
          numInput.value = examMaxQuestions;
        }
      }

      if (maxQuestionsInfo) {
        maxQuestionsInfo.innerHTML = `<span style="color: #d32f2f; font-weight: bold;">Exam Mode: Max ${examMaxQuestions} questions</span>`;
      }

      // Update quick selection buttons for exam mode
      this.updateExamQuickButtons(numDiv, examMaxQuestions);
      
      // Hide original "Answer all" button in exam mode
      if (answerAllBtn) {
        answerAllBtn.style.display = 'none';
      }
    } else {
      // Learning mode - restore original functionality
      if (numInput) {
        numInput.max = maxQuestions;
      }

      if (maxQuestionsInfo) {
        maxQuestionsInfo.innerHTML = `Max: ${maxQuestions} questions available`;
      }

      // Remove exam quick buttons
      this.removeExamQuickButtons(numDiv);
      
      // Show original "Answer all" button
      if (answerAllBtn) {
        answerAllBtn.style.display = 'inline-block';
      }
    }
  }

  // Update quick selection buttons for exam mode
  updateExamQuickButtons(numDiv, maxQuestions) {
    // Remove existing exam buttons
    this.removeExamQuickButtons(numDiv);

    // Create exam quick buttons container
    const examButtonsContainer = document.createElement('div');
    examButtonsContainer.className = 'exam-quick-buttons';
    examButtonsContainer.innerHTML = '<span style="margin-right: 10px; font-size: 0.9em; color: #666;">Quick select:</span>';

    // Define button values based on available questions
    const buttonValues = [10, 20, 30, 40, 50].filter(val => val <= maxQuestions);
    
    buttonValues.forEach(value => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exam-quick-btn';
      btn.textContent = value.toString();
      btn.title = `Set ${value} questions`;
      btn.onclick = () => {
        const numInput = numDiv.querySelector('#numQuestions');
        if (numInput) {
          numInput.value = value;
          // Trigger change event to update any dependent elements
          numInput.dispatchEvent(new Event('input'));
        }
      };
      examButtonsContainer.appendChild(btn);
    });

    // Add "Max" button if max is less than 50
    if (maxQuestions < 50) {
      const maxBtn = document.createElement('button');
      maxBtn.type = 'button';
      maxBtn.className = 'exam-quick-btn exam-quick-btn-max';
      maxBtn.textContent = `Max (${maxQuestions})`;
      maxBtn.title = `Set maximum available questions (${maxQuestions})`;
      maxBtn.onclick = () => {
        const numInput = numDiv.querySelector('#numQuestions');
        if (numInput) {
          numInput.value = maxQuestions;
          numInput.dispatchEvent(new Event('input'));
        }
      };
      examButtonsContainer.appendChild(maxBtn);
    }

    // Insert after the number input
    const numInput = numDiv.querySelector('#numQuestions');
    if (numInput && numInput.parentNode) {
      numInput.parentNode.insertBefore(examButtonsContainer, numInput.nextSibling);
    }
  }

  // Remove exam quick buttons
  removeExamQuickButtons(numDiv) {
    const existingButtons = numDiv.querySelector('.exam-quick-buttons');
    if (existingButtons) {
      existingButtons.remove();
    }
  }

  // Update start button text and behavior
  updateStartButton(startBtn) {
    if (!startBtn) return;

    if (this.isExamMode) {
      startBtn.textContent = "Start Exam";
      startBtn.className = "exam-start-btn";
      startBtn.style.background = "#d32f2f";
      startBtn.style.borderColor = "#d32f2f";
    } else {
      startBtn.textContent = "Start Test";
      startBtn.className = "";
      startBtn.style.background = "#0078d7";
      startBtn.style.borderColor = "transparent";
    }
  }

  // Toggle explanation and reference display section
  toggleExplanationSection(expDiv, show) {
    if (!expDiv) return;

    if (show) {
      expDiv.style.display = "block";
      expDiv.style.opacity = "1";
      expDiv.querySelectorAll('input').forEach(input => {
        input.disabled = false;
      });
    } else {
      expDiv.style.display = "none";
      expDiv.style.opacity = "0.5";
      expDiv.querySelectorAll('input').forEach(input => {
        input.disabled = true;
      });
    }
  }

  // Update test behavior options for exam mode
  updateTestBehaviorSection(behaviorDiv, isExamMode) {
    if (!behaviorDiv) return;

    if (isExamMode) {
      // Replace with exam-specific behavior options
      const examBehaviorHTML = `
        <h3>Exam Behavior Options</h3>
        <div class="exam-behavior-note">
          <div class="exam-behavior-icon">⚠️</div>
          <div class="exam-behavior-text">
            <strong>Exam Mode Behavior:</strong><br>
            • No immediate feedback during the exam<br>
            • Results shown only after completion<br>
            • Questions can be bookmarked for review<br>
            • Navigation allowed until final submission<br>
            • Comprehensive report generated at the end
          </div>
        </div>
      `;
      behaviorDiv.innerHTML = examBehaviorHTML;
      
      // Disable all behavior checkboxes
      behaviorDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.disabled = true;
      });
    } else {
      // This will be handled by the original buildDbFilterPanel function
      // We just need to ensure checkboxes are re-enabled
      behaviorDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.disabled = false;
      });
    }
  }

  // Setup mode toggle event listeners
  setupModeToggleListeners(wrapper) {
    const learningModeRadio = wrapper.querySelector('#learning-mode');
    const examModeRadio = wrapper.querySelector('#exam-mode');
    const examOptionsSection = wrapper.querySelector('#exam-options-section');
    const expDiv = Array.from(wrapper.querySelectorAll('.filter-section')).find(div => 
                    div.querySelector('h3')?.textContent.includes('Explanation'));
    const behaviorDiv = Array.from(wrapper.querySelectorAll('.filter-section')).find(div => 
                       div.querySelector('h3')?.textContent.includes('Behavior'));

    if (learningModeRadio) {
      learningModeRadio.addEventListener('change', () => {
        if (learningModeRadio.checked) {
          this.isExamMode = false;
          if (examOptionsSection) examOptionsSection.style.display = 'none';
          this.toggleExplanationSection(expDiv, true);
          this.updateTestBehaviorSection(behaviorDiv, false);
          this.updateNumberOfQuestionsForModeChange(wrapper);
          this.updateStartButtonForModeChange(wrapper);
        }
      });
    }

    if (examModeRadio) {
      examModeRadio.addEventListener('change', () => {
        if (examModeRadio.checked) {
          this.isExamMode = true;
          if (examOptionsSection) examOptionsSection.style.display = 'block';
          this.toggleExplanationSection(expDiv, false);
          this.updateTestBehaviorSection(behaviorDiv, true);
          this.updateNumberOfQuestionsForModeChange(wrapper);
          this.updateStartButtonForModeChange(wrapper);
        }
      });
    }

    // Setup duration preset buttons
    this.setupDurationPresets(wrapper);
  }

  // Setup duration preset buttons
  setupDurationPresets(wrapper) {
    const durationPresets = wrapper.querySelectorAll('.duration-preset');
    const durationInput = wrapper.querySelector('#exam-duration');

    durationPresets.forEach(preset => {
      preset.addEventListener('click', () => {
        const minutes = parseInt(preset.dataset.minutes);
        if (durationInput) {
          durationInput.value = minutes;
        }
        
        // Remove active class from all presets
        durationPresets.forEach(p => p.classList.remove('active'));
        // Add active class to clicked preset
        preset.classList.add('active');
      });
    });

    // Set initial active state
    if (durationInput) {
      const currentValue = parseInt(durationInput.value);
      durationPresets.forEach(preset => {
        if (parseInt(preset.dataset.minutes) === currentValue) {
          preset.classList.add('active');
        }
      });
    }
  }

  // Update number of questions when mode changes
  updateNumberOfQuestionsForModeChange(wrapper) {
    const numDiv = Array.from(wrapper.querySelectorAll('.filter-section')).find(div => 
                   div.querySelector('h3')?.textContent.includes('Number of Questions'));
    
    if (numDiv) {
      // Get current max questions (this should be calculated based on current filters)
      const maxQuestionsInfo = numDiv.querySelector('#maxQuestionsInfo');
      const currentMaxText = maxQuestionsInfo?.textContent || '';
      const maxMatch = currentMaxText.match(/(\d+)/);
      const maxQuestions = maxMatch ? parseInt(maxMatch[1]) : 1000;
      
      this.updateNumberOfQuestionsSection(numDiv, maxQuestions);
    }
  }

  // Update start button when mode changes
  updateStartButtonForModeChange(wrapper) {
    const startBtn = wrapper.querySelector('button[textContent="Start Test"], button[textContent="Start Exam"]') ||
                     Array.from(wrapper.querySelectorAll('button')).find(btn => 
                       btn.textContent.includes('Start Test') || btn.textContent.includes('Start Exam'));
    
    this.updateStartButton(startBtn);
  }

  // Get exam mode styles
  getExamModeFilterStyles() {
    return `
      /* Exam Mode Filter Panel Styles */
      .exam-mode-section {
        background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
        border: 2px solid #42a5f5;
        margin-bottom: 20px;
      }

      .mode-toggle-container {
        display: flex;
        gap: 15px;
        margin-top: 15px;
      }

      .mode-toggle {
        flex: 1;
      }

      .mode-toggle input[type="radio"] {
        display: none;
      }

      .mode-toggle-label {
        display: block;
        padding: 20px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
        background: white;
      }

      .mode-toggle input[type="radio"]:checked + .mode-toggle-label {
        border-color: #0078d7;
        background: #f0f8ff;
        box-shadow: 0 2px 8px rgba(0,120,215,0.2);
      }

      .mode-toggle-label:hover {
        border-color: #42a5f5;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .mode-icon {
        font-size: 2em;
        display: block;
        margin-bottom: 10px;
      }

      .mode-title {
        font-weight: bold;
        font-size: 1.1em;
        color: #333;
        display: block;
        margin-bottom: 8px;
      }

      .mode-description {
        font-size: 0.9em;
        color: #666;
        line-height: 1.4;
      }

      /* Exam Options Section */
      .exam-options-section {
        background: #fff3e0;
        border: 2px solid #ff9800;
      }

      .exam-option-group {
        margin-bottom: 20px;
      }

      .exam-option-group label {
        display: block;
        font-weight: bold;
        margin-bottom: 8px;
        color: #333;
      }

      .exam-duration-container {
        display: flex;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
      }

      #exam-duration {
        width: 80px;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1em;
      }

      .exam-duration-presets {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .duration-preset {
        background: #f5f5f5;
        border: 1px solid #ddd;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.2s;
      }

      .duration-preset:hover {
        background: #e0e0e0;
        border-color: #bbb;
      }

      .duration-preset.active {
        background: #0078d7;
        color: white;
        border-color: #0078d7;
      }

      .exam-info-box {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        background: #e8f4f8;
        border: 1px solid #4fc3f7;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }

      .exam-info-icon {
        font-size: 1.5em;
        margin-top: 2px;
      }

      .exam-info-content {
        flex: 1;
        line-height: 1.5;
      }

      .exam-info-content ul {
        margin: 10px 0 0 20px;
        padding: 0;
      }

      .exam-info-content li {
        margin-bottom: 5px;
        font-size: 0.9em;
      }

      /* Exam Quick Buttons */
      .exam-quick-buttons {
        margin: 10px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .exam-quick-btn {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85em;
        transition: all 0.2s;
        min-width: 35px;
      }

      .exam-quick-btn:hover {
        background: #e9ecef;
        border-color: #adb5bd;
      }

      .exam-quick-btn-max {
        background: #28a745;
        color: white;
        border-color: #28a745;
      }

      .exam-quick-btn-max:hover {
        background: #218838;
        border-color: #1e7e34;
      }

      /* Exam Start Button */
      .exam-start-btn {
        background: #d32f2f !important;
        border-color: #d32f2f !important;
        font-weight: bold;
        position: relative;
      }

      .exam-start-btn:hover {
        background: #b71c1c !important;
        border-color: #b71c1c !important;
      }

      .exam-start-btn::before {
        content: "⏱️ ";
        margin-right: 5px;
      }

      /* Exam Behavior Note */
      .exam-behavior-note {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #fff3e0;
        border: 1px solid #ffcc02;
        border-radius: 6px;
        padding: 15px;
        margin-top: 10px;
      }

      .exam-behavior-icon {
        font-size: 1.3em;
        margin-top: 2px;
      }

      .exam-behavior-text {
        flex: 1;
        line-height: 1.4;
        font-size: 0.9em;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .mode-toggle-container {
          flex-direction: column;
        }

        .exam-duration-container {
          flex-direction: column;
          align-items: flex-start;
        }

        .exam-duration-presets {
          width: 100%;
          justify-content: flex-start;
        }

        .exam-quick-buttons {
          justify-content: flex-start;
        }
      }
    `;
  }

  // Inject exam mode filter styles
  injectFilterStyles() {
    if (document.getElementById('exam-mode-filter-styles')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'exam-mode-filter-styles';
    styleElement.textContent = this.getExamModeFilterStyles();
    document.head.appendChild(styleElement);
  }
}

// Create global instance
window.examModeFilterPanel = new ExamModeFilterPanel();

// Inject styles when module loads
window.examModeFilterPanel.injectFilterStyles();