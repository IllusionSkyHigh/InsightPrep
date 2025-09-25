// Database Filter Panel Module - Enhanced with MCQ categorization
// This preserves all the exact Golden 22 functionality and UI plus enhanced question type filtering

/**
 * Analyze all questions and categorize them into enhanced question types
 * @returns {Array} Array of type objects with {name, originalTypes, count, description}
 */
function analyzeAndCategorizeQuestionTypes() {
  try {
    console.log('🔍 Starting enhanced question type analysis...');
    
    // Check if database is available
    if (!AppState.database) {
      console.warn('❌ AppState.database is not available');
      return [];
    }
    
    // Get all questions with their types
    const questionsRes = AppState.database.exec("SELECT id, question_type FROM questions");
    
    console.log('📊 Query result:', questionsRes);
    
    if (!questionsRes[0]?.values) {
      console.warn('❌ No question data found in database');
      return [];
    }
    
    const questions = questionsRes[0].values;
    console.log(`📝 Found ${questions.length} questions to analyze`);
    
    // Dynamic type counting - preserve all original types and add enhanced subcategories
    const typeCounts = {};
    const typeMapping = {};
    
    questions.forEach((row, index) => {
      const [questionId, questionType] = row;
      
      if (index < 5) {
        console.log(`🔍 Question ${index + 1}:`, { questionId, questionType });
      }
      
      // Helper function to add type to mapping
      const addToMapping = (enhancedType, originalType) => {
        if (!typeMapping[enhancedType]) {
          typeMapping[enhancedType] = new Set();
        }
        typeMapping[enhancedType].add(originalType);
      };
      
      // Determine if this is an MCQ-type question that needs subcategorization
      const isMCQType = questionType === 'MCQ' || questionType === 'MCQ-Scenario' || 
                        questionType === 'Cohort-05-MCQ' || questionType === 'MCQ-Multiple';
      
      if (isMCQType) {
        // For MCQ types, check how many correct answers exist to create subcategories
        // This matches the exact logic used by test-engine.js and database-filter-panel.js
        try {
          const correctCountRes = AppState.database.exec(`SELECT COUNT(*) FROM options WHERE question_id = ${questionId} AND is_correct = 1`);
          const correctCount = correctCountRes[0]?.values[0][0] || 0;
          
          // Also get all options for debugging
          const allOptionsRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${questionId}`);
          const allOptions = allOptionsRes[0]?.values || [];
          
          if (index < 10) {
            console.log(`🔢 Question ${questionId} (${questionType}):`);
            console.log(`   Correct count: ${correctCount}`);
            console.log(`   All options:`, allOptions.map(([text, correct]) => `${correct ? '✓' : ' '} ${text.substring(0, 30)}`));
          }
          
          // Check if it's True/False by examining options
          const optionsRes = AppState.database.exec(`SELECT option_text FROM options WHERE question_id = ${questionId}`);
          const options = optionsRes[0]?.values.map(v => v[0]) || [];
          
          if (isTrueFalseQuestionByOptions(options)) {
            const enhancedType = `${questionType} - True or False`;
            typeCounts[enhancedType] = (typeCounts[enhancedType] || 0) + 1;
            addToMapping(enhancedType, questionType);
            if (index < 5) console.log(`✅ Categorized as ${enhancedType}`);
          } else if (correctCount > 1) {
            const enhancedType = `${questionType} - Multiple Correct`;
            typeCounts[enhancedType] = (typeCounts[enhancedType] || 0) + 1;
            addToMapping(enhancedType, questionType);
            if (index < 10) console.log(`✅ Categorized as ${enhancedType} (${correctCount} correct answers)`);
          } else {
            const enhancedType = `${questionType} - Single Correct`;
            typeCounts[enhancedType] = (typeCounts[enhancedType] || 0) + 1;
            addToMapping(enhancedType, questionType);
            if (index < 10) console.log(`✅ Categorized as ${enhancedType} (${correctCount} correct answers)`);
          }
        } catch (e) {
          console.error(`Error analyzing question ${questionId}:`, e);
          // Fallback to basic type
          typeCounts[questionType] = (typeCounts[questionType] || 0) + 1;
          addToMapping(questionType, questionType);
        }
      } else {
        // Non-MCQ types - preserve as-is
        typeCounts[questionType] = (typeCounts[questionType] || 0) + 1;
        addToMapping(questionType, questionType);
        if (index < 5) console.log(`✅ Preserved original type: ${questionType}`);
      }
    });
    
    // Convert to array format with only non-zero counts
    const result = [];
    console.log('📊 Final type counts:', typeCounts);
    console.log('🗂️ Type mappings:', Object.fromEntries(
      Object.entries(typeMapping).map(([k, v]) => [k, Array.from(v)])
    ));
    
    Object.entries(typeCounts).forEach(([typeName, count]) => {
      if (count > 0) {
        result.push({
          name: typeName,
          originalTypes: Array.from(typeMapping[typeName]),
          count: count,
          description: getTypeDescription(typeName)
        });
      }
    });
    
    console.log('✅ Enhanced types result:', result);
    return result;
    
  } catch (error) {
    console.error('Error analyzing question types:', error);
    // Fallback - return empty array if analysis fails
    return [];
  }
}

/**
 * Check if a question appears to be True/False based on array of options
 */
function isTrueFalseQuestionByOptions(options) {
  if (!options || options.length !== 2) return false;
  
  const option1 = options[0].toLowerCase().trim();
  const option2 = options[1].toLowerCase().trim();
  
  return (
    (option1 === 'true' && option2 === 'false') ||
    (option1 === 'false' && option2 === 'true') ||
    (option1 === 't' && option2 === 'f') ||
    (option1 === 'f' && option2 === 't')
  );
}

/**
 * Check if a question appears to be True/False based on options (legacy)
 */
function isTrueFalseQuestion(optionA, optionB, optionC, optionD) {
  const options = [optionA, optionB, optionC, optionD].filter(opt => opt && opt.trim());
  
  if (options.length !== 2) return false;
  
  const option1 = options[0].toLowerCase().trim();
  const option2 = options[1].toLowerCase().trim();
  
  return (
    (option1 === 'true' && option2 === 'false') ||
    (option1 === 'false' && option2 === 'true') ||
    (option1 === 'yes' && option2 === 'no') ||
    (option1 === 'no' && option2 === 'yes') ||
    (option1 === 't' && option2 === 'f') ||
    (option1 === 'f' && option2 === 't')
  );
}

/**
 * Check if question has multiple choice options (more than 2 meaningful options)
 */
function hasMultipleChoiceOptions(optionA, optionB, optionC, optionD) {
  const options = [optionA, optionB, optionC, optionD].filter(opt => opt && opt.trim().length > 1);
  return options.length >= 3;
}

/**
 * Get description for each question type
 */
function getTypeDescription(typeName) {
  const descriptions = {
    'MCQ - Single Correct': 'Multiple choice with one correct answer',
    'MCQ - Multiple Correct': 'Multiple choice with multiple correct answers',
    'True or False': 'Binary choice questions',
    'Assertion-Reason': 'Statement and reason evaluation',
    'Match the Following': 'Pairing exercises',
    'Other': 'Other question formats'
  };
  return descriptions[typeName] || '';
}

function buildDbFilterPanel(topics, types, skipRestore = false) {
  const panel = document.getElementById("filter-panel");
  panel.innerHTML = "";
  
  // Declare the update function in the scope where it can be accessed
  let updateSelectedTypesCountDB;
  
  // Store types globally so updateMaxQuestions can access it
  window.currentDatabaseTypes = types;
  
  // Store topicSubtopicMap globally for tooltip access
  window.topicSubtopicMap = null;

  // Get saved state before building DOM to prevent flickering
  const savedState = AppState.savedDbOptions;
  const shouldRestore = !skipRestore && savedState;
  
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
  
  // Store globally for tooltip access
  window.topicSubtopicMap = topicSubtopicMap;

  const wrapper = document.createElement("div");
  wrapper.className = "filter-panel";

  // Add database name display at the top (EXACT GOLDEN 22)
  if (AppState.dbFileName) {
    const dbNameDiv = document.createElement("div");
    dbNameDiv.className = "db-name-display";
    dbNameDiv.style.cssText = "margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; font-weight: bold; color: #1565c0; display: flex; justify-content: space-between; align-items: center;";
    
    // Database name on the left
    const dbNameSpan = document.createElement("span");
    dbNameSpan.innerHTML = `📄 Database: <span style="color: #0d47a1;">${AppState.dbFileName}</span>`;
    
    // Start Test button on the right (THE GREEN BUTTON FROM GOLDEN 22)
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

  // Add total question count display at the top (GOLDEN 22)
  const totalCountRes = AppState.database.exec('SELECT COUNT(*) FROM questions');
  const totalQuestions = totalCountRes[0]?.values[0][0] || 0;
  AppState.dbTotalQuestions = totalQuestions; // Store for later use
  const totalCountDiv = document.createElement("div");
  totalCountDiv.id = "db-total-question-count";
  totalCountDiv.style = "margin-bottom: 10px; font-size: 1.1em; color: #0078d7; font-weight: bold; text-align: center;";
  totalCountDiv.textContent = `Total questions in database: ${totalQuestions}`;
  wrapper.appendChild(totalCountDiv);

  // Topics with nested subtopics (DATABASE MODE) - EXACT GOLDEN 22
  const topicDiv = document.createElement("div");
  topicDiv.className = "filter-section";
  topicDiv.innerHTML = "<h3>Select Topics & Subtopics (Database)</h3>";
  
  // Select All checkbox - respect saved state
  const selectAllDiv = document.createElement("div");
  selectAllDiv.style.marginBottom = "15px";
  selectAllDiv.style.borderBottom = "1px solid #ddd";
  selectAllDiv.style.paddingBottom = "10px";
  const selectAllLabel = document.createElement("label");
  selectAllLabel.style.fontWeight = "bold";
  
  // Determine initial state based on saved options
  const allTopicsChecked = shouldRestore ? 
    (savedState.allTopicsSelected !== undefined ? savedState.allTopicsSelected : true) : true;
  
  selectAllLabel.innerHTML = `<input type="checkbox" id="select-all-topics-db" ${allTopicsChecked ? 'checked' : ''}> Select All Topics & Subtopics`;
  selectAllDiv.appendChild(selectAllLabel);
  topicDiv.appendChild(selectAllDiv);

  // Create hierarchical structure (EXACT GOLDEN 22)
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
    
    // Topic checkbox with question count - respect saved state
    const topicLabel = document.createElement("label");
    topicLabel.style.fontWeight = "bold";
    topicLabel.style.display = "block";
    
    // Determine if this topic should be checked based on saved state
    let topicChecked = true; // default
    if (shouldRestore && !savedState.allTopicsSelected) {
      // Check if any subtopics of this topic are selected
      topicChecked = savedState.selectedSubtopics && 
        savedState.selectedSubtopics.some(s => s.topic === topic);
    }
    
    topicLabel.innerHTML = `<input type="checkbox" class="topic-checkbox" value="${topic}" ${topicChecked ? 'checked' : ''}> ${topic} <span style="color: #666; font-weight: normal;">(${topicQuestionCount} question${topicQuestionCount === 1 ? '' : 's'})</span>`;
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
      
      // Determine if this subtopic should be checked based on saved state
      let subtopicChecked = true; // default
      if (shouldRestore && !savedState.allTopicsSelected) {
        subtopicChecked = savedState.selectedSubtopics && 
          savedState.selectedSubtopics.some(s => s.topic === topic && s.subtopic === subtopic);
      }
      
      subtopicLabel.innerHTML = `<input type="checkbox" class="subtopic-checkbox" data-topic="${topic}" value="${subtopic}" ${subtopicChecked ? 'checked' : ''}> ${subtopic} <span style="color: #666;">(${subtopicQuestionCount} question${subtopicQuestionCount === 1 ? '' : 's'})</span>`;
      subtopicsDiv.appendChild(subtopicLabel);
    });
    
    topicItemDiv.appendChild(subtopicsDiv);
    topicContainer.appendChild(topicItemDiv);
  });
  
  topicDiv.appendChild(topicContainer);
  
  // After restoration, update parent topic checkbox states to reflect subtopic selections
  if (shouldRestore && !savedState.allTopicsSelected) {
    setTimeout(() => {
      const topicCheckboxes = topicDiv.querySelectorAll('.topic-checkbox');
      topicCheckboxes.forEach(topicCb => {
        const topic = topicCb.value;
        const relatedSubtopics = topicDiv.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
        const checkedSubtopics = Array.from(relatedSubtopics).filter(cb => cb.checked);
        
        if (checkedSubtopics.length === relatedSubtopics.length) {
          // All subtopics checked
          topicCb.checked = true;
          topicCb.indeterminate = false;
        } else if (checkedSubtopics.length > 0) {
          // Some subtopics checked (partial selection)
          topicCb.checked = false;
          topicCb.indeterminate = true;
        } else {
          // No subtopics checked
          topicCb.checked = false;
          topicCb.indeterminate = false;
        }
      });
      
      // Also update the "Select All Topics & Subtopics" checkbox state
      const selectAllCheckbox = topicDiv.querySelector('#select-all-topics-db');
      if (selectAllCheckbox) {
        const allSubtopics = topicDiv.querySelectorAll('.subtopic-checkbox');
        const checkedSubtopics = Array.from(allSubtopics).filter(cb => cb.checked);
        
        if (checkedSubtopics.length === allSubtopics.length) {
          // All subtopics checked
          selectAllCheckbox.checked = true;
          selectAllCheckbox.indeterminate = false;
        } else if (checkedSubtopics.length > 0) {
          // Some subtopics checked (partial selection)
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = true;
        } else {
          // No subtopics checked
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = false;
        }
      }
    }, 10);
  }
  
  // Setup topic/subtopic checkboxes
  setupTopicSubtopicCheckboxesDb(topicDiv, updateMaxQuestions);
  
  // Add listener to also update type counts when topics change
  setTimeout(() => {
    const topicCheckboxes = topicDiv.querySelectorAll(".topic-checkbox, .subtopic-checkbox, #select-all-topics-db");
    topicCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        // Trigger type count update when topics change
        setTimeout(() => {
          if (typeof updateSelectedTypesCountDB === 'function') {
            updateSelectedTypesCountDB();
          }
        }, 50);
      });
    });
  }, 300);
  
  wrapper.appendChild(topicDiv);

  // Types section with enhanced MCQ categorization
  const typeDiv = document.createElement("div");
  typeDiv.className = "filter-section";
  typeDiv.innerHTML = "<h3>Select Question Types</h3>";
  
  // Analyze questions and create enhanced type categories with fallback
  let enhancedTypes = analyzeAndCategorizeQuestionTypes();
  
  // Store globally for access by update functions
  window.currentEnhancedTypes = enhancedTypes;
  
  // Fallback to original types if enhanced analysis failed or returned empty
  if (!enhancedTypes || enhancedTypes.length === 0) {
    console.warn('⚠️ Enhanced type analysis failed, using original types as fallback');
    console.log('📋 Original types from parameter:', types);
    
    // Get actual counts for each original type
    enhancedTypes = types.map(t => {
      let count = 0;
      try {
        const countRes = AppState.database.exec(`SELECT COUNT(*) FROM questions WHERE question_type = '${t}'`);
        count = countRes[0]?.values[0][0] || 0;
      } catch (e) {
        console.error(`Error counting questions for type ${t}:`, e);
      }
      
      return {
        name: t,
        originalTypes: [t],
        count: count,
        description: ''
      };
    });
    
    console.log('✅ Fallback types with counts:', enhancedTypes);
  }
  
  // Calculate total questions for filtered types only
  let totalFilteredQuestions = 0;
  const typeCountsArray = []; // Make this accessible to updateQuestionTypeCounts
  
  console.log('🔢 Calculating total filtered questions from enhanced types:', enhancedTypes);
  enhancedTypes.forEach(typeInfo => {
    console.log(`➕ Adding ${typeInfo.count} from ${typeInfo.name}`);
    totalFilteredQuestions += typeInfo.count;
    typeCountsArray.push(typeInfo.count);
  });
  
  console.log('📊 Total filtered questions:', totalFilteredQuestions);
  
  // Create enhanced type mapping for search functions
  window.enhancedTypeMapping = {};
  enhancedTypes.forEach(typeInfo => {
    typeInfo.originalTypes.forEach(originalType => {
      if (!window.enhancedTypeMapping[originalType]) {
        window.enhancedTypeMapping[originalType] = [];
      }
      window.enhancedTypeMapping[originalType].push(typeInfo.name);
    });
  });
  
  // Determine initial state for "All Types" checkbox based on saved state
  const allTypesChecked = shouldRestore ? 
    (savedState.allTypesSelected !== undefined ? savedState.allTypesSelected : true) : true;
  
  const allTypes = document.createElement("label");
  allTypes.innerHTML = `<input type=\"checkbox\" value=\"ALL\" ${allTypesChecked ? 'checked' : ''}> Selected Types <span style="color: #666; font-weight: normal;">(${totalFilteredQuestions} question${totalFilteredQuestions === 1 ? '' : 's'})</span>`;
  typeDiv.appendChild(allTypes);
  
  enhancedTypes.forEach((typeInfo, index) => {
    const typeQuestionCount = typeInfo.count;
    const l = document.createElement("label");
    l.style.display = "block";
    l.style.marginLeft = "20px"; // Indent the individual type checkboxes
    
    // Determine if this individual type should be checked based on saved state
    let typeChecked = true; // default
    if (shouldRestore && !savedState.allTypesSelected) {
      // Check if this enhanced type was selected OR if any of the original types were selected
      typeChecked = savedState.selectedTypes && (
        savedState.selectedTypes.includes(typeInfo.name) || 
        typeInfo.originalTypes.some(origType => savedState.selectedTypes.includes(origType))
      );
    }
    
    // Store original types as data attribute for filtering
    const originalTypesStr = typeInfo.originalTypes.join(',');
    
    l.innerHTML = `<input type=\"checkbox\" value=\"${typeInfo.name}\" data-original-types=\"${originalTypesStr}\" ${typeChecked ? 'checked' : ''}> ${typeInfo.name} <span style="color: #666; font-weight: normal;">(${typeQuestionCount} question${typeQuestionCount === 1 ? '' : 's'})</span>`;
    typeDiv.appendChild(l);
  });
  
  // Setup all checkbox functionality
  setupAllCheckbox(typeDiv);
  
  // Update the Selected Types count after initial setup
  setTimeout(() => {
    if (typeof updateSelectedTypesCountDB === 'function') {
      updateSelectedTypesCountDB();
    }
  }, 100);
  
  // After restoration, update "Selected Types" checkbox visual state to reflect individual selections
  if (shouldRestore && !savedState.allTypesSelected) {
    setTimeout(() => {
      const typeCheckboxes = typeDiv.querySelectorAll('input[type="checkbox"]');
      const allTypesCheckbox = typeCheckboxes[0]; // First checkbox is "Selected Types"
      const individualTypeCheckboxes = Array.from(typeCheckboxes).slice(1); // Skip the first "Selected Types" checkbox
      
      if (allTypesCheckbox && individualTypeCheckboxes.length > 0) {
        const checkedIndividualTypes = individualTypeCheckboxes.filter(cb => cb.checked);
        
        if (checkedIndividualTypes.length === individualTypeCheckboxes.length) {
          // All individual types checked
          allTypesCheckbox.checked = true;
          allTypesCheckbox.indeterminate = false;
        } else if (checkedIndividualTypes.length > 0) {
          // Some individual types checked (partial selection)
          allTypesCheckbox.checked = false;
          allTypesCheckbox.indeterminate = true;
        } else {
          // No individual types checked
          allTypesCheckbox.checked = false;
          allTypesCheckbox.indeterminate = false;
        }
      }
    }, 10);
  }
  
  // Function to update "Selected Types" count based on checked question types (Database mode) - EXACT GOLDEN 22
  updateSelectedTypesCountDB = function() {
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
          // Extract count from text like "(40 questions)" or "(1 question)"
          const match = span.textContent.match(/\((\d+)\s+question/);
          if (match) {
            const count = parseInt(match[1]);
            totalSelectedCount += count;
            console.log("Adding", count, "from", cb.value); // Debug log
          } else {
            console.log("No match found for span text:", span.textContent); // Debug log
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
  }; // End of updateSelectedTypesCountDB function
  
  // Store the function globally so other event handlers can access it
  window.currentUpdateFunction = updateSelectedTypesCountDB;
  
  // Function to update question type counts based on selected topics/subtopics (Enhanced for new types)
  function updateQuestionTypeCounts() {
    // Get selected topic/subtopic combinations
    const selectAllTopics = document.getElementById("select-all-topics-db");
    
    if (selectAllTopics && selectAllTopics.checked) {
      // All topics and subtopics selected - restore original enhanced counts
      const enhancedTypes = window.currentEnhancedTypes || [];
      enhancedTypes.forEach((typeInfo) => {
        const typeLabel = typeDiv.querySelector(`input[value="${typeInfo.name}"]`);
        if (typeLabel && typeLabel.parentElement) {
          const span = typeLabel.parentElement.querySelector('span');
          if (span) {
            span.textContent = `(${typeInfo.count} question${typeInfo.count === 1 ? '' : 's'})`;
          }
        }
      });
    } else {
      // Build query based on individual subtopic selections
      const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
      
      if (selectedSubtopics.length === 0) {
        // No subtopics selected - show 0 for all enhanced types
        const enhancedTypes = window.currentEnhancedTypes || [];
        enhancedTypes.forEach((typeInfo) => {
          const typeLabel = typeDiv.querySelector(`input[value="${typeInfo.name}"]`);
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
      
      // Re-analyze questions with topic/subtopic filtering to get correct enhanced type counts
      const filteredQuestionsRes = AppState.database.exec(`SELECT id, question_type FROM questions WHERE ${conditions.join(' OR ')}`);
      
      if (filteredQuestionsRes[0]?.values) {
        const filteredQuestions = filteredQuestionsRes[0].values;
        console.log(`🔍 Re-analyzing ${filteredQuestions.length} filtered questions for enhanced types`);
        
        // Reset all enhanced type counts to 0
        const enhancedTypes = window.currentEnhancedTypes || [];
        const newTypeCounts = {};
        
        // Re-analyze each filtered question using the same logic as initial analysis
        filteredQuestions.forEach((row) => {
          const [questionId, questionType] = row;
          
          // Helper function to add type to new counts
          const addToNewCounts = (enhancedType) => {
            newTypeCounts[enhancedType] = (newTypeCounts[enhancedType] || 0) + 1;
          };
          
          // Determine if this is an MCQ-type question that needs subcategorization
          const isMCQType = questionType === 'MCQ' || questionType === 'MCQ-Scenario' || 
                            questionType === 'Cohort-05-MCQ' || questionType === 'MCQ-Multiple';
          
          if (isMCQType) {
            // For MCQ types, check how many correct answers exist to create subcategories
            try {
              const correctCountRes = AppState.database.exec(`SELECT COUNT(*) FROM options WHERE question_id = ${questionId} AND is_correct = 1`);
              const correctCount = correctCountRes[0]?.values[0][0] || 0;
              
              // Check if it's True/False by examining options
              const optionsRes = AppState.database.exec(`SELECT option_text FROM options WHERE question_id = ${questionId}`);
              const options = optionsRes[0]?.values.map(v => v[0]) || [];
              
              if (isTrueFalseQuestionByOptions(options)) {
                addToNewCounts(`${questionType} - True or False`);
              } else if (correctCount > 1) {
                addToNewCounts(`${questionType} - Multiple Correct`);
                console.log(`🔄 Update: Question ${questionId} (${questionType}) → Multiple Correct (${correctCount} correct)`);
              } else {
                addToNewCounts(`${questionType} - Single Correct`);
              }
            } catch (e) {
              console.error(`Error analyzing question ${questionId}:`, e);
              // Fallback to basic type
              addToNewCounts(questionType);
            }
          } else {
            // Non-MCQ types - preserve as-is
            addToNewCounts(questionType);
          }
        });
        
        // Update the display for each enhanced type
        enhancedTypes.forEach((typeInfo) => {
          const count = newTypeCounts[typeInfo.name] || 0;
          const typeLabel = typeDiv.querySelector(`input[value="${typeInfo.name}"]`);
          if (typeLabel && typeLabel.parentElement) {
            const span = typeLabel.parentElement.querySelector('span');
            if (span) {
              span.textContent = `(${count} question${count === 1 ? '' : 's'})`;
            }
          }
        });
        
        
      }
    }
    
    // Update the "Selected Types" count to reflect only checked types
    if (typeof updateSelectedTypesCountDB === 'function') {
      updateSelectedTypesCountDB();
    }
  }
  
  // Attach listeners to topic/type checkboxes (EXACT GOLDEN 22)
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
  
  // Add event listeners to individual type checkboxes to update "Selected Types" count (EXACT GOLDEN 22)
  setTimeout(() => {
    
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    
    typeChecks.forEach((cb, i) => {
      if (i > 0) { // Skip the first "Selected Types" checkbox
        
        cb.addEventListener('change', () => {
          
          updateSelectedTypesCountDB();
        });
      }
    });
  }, 200);
  
  // Initialize the type count (call immediately)
  setTimeout(() => {
    if (typeof updateSelectedTypesCountDB === 'function') {
      updateSelectedTypesCountDB();
    }
  }, 250);
  
  wrapper.appendChild(typeDiv);

  // Explanation & Reference Display (EXACT GOLDEN 22) - respect saved state
  const expDiv = document.createElement("div");
  expDiv.className = "filter-section";
  expDiv.innerHTML = "<h3>Explanation & Reference Display</h3>";
  
  // Determine saved explanation mode
  const savedExpMode = shouldRestore && savedState.explanationMode ? savedState.explanationMode : 2;
  
  expDiv.innerHTML += `
    <label><input type=\"radio\" name=\"expMode\" value=\"1\" ${savedExpMode === 1 ? 'checked' : ''}> Only when wrong</label><br>
    <label><input type=\"radio\" name=\"expMode\" value=\"2\" ${savedExpMode === 2 ? 'checked' : ''}> Both when right and wrong</label><br>
    <label><input type=\"radio\" name=\"expMode\" value=\"3\" ${savedExpMode === 3 ? 'checked' : ''}> Do not display explanations</label>
  `;

  wrapper.appendChild(expDiv);

  // Test Behavior Options (EXACT GOLDEN 22) - respect saved state
  const behaviorDiv = document.createElement("div");
  behaviorDiv.className = "filter-section";
  behaviorDiv.innerHTML = "<h3>Test Behavior Options</h3>";
  
  // Determine saved behavior options
  const savedBehavior = shouldRestore && savedState.behaviorOptions ? savedState.behaviorOptions : {
    allowTryAgain: true,
    showTopicSubtopic: true,
    showImmediateResult: true,
    showCorrectAnswer: true
  };
  
  // Determine if Try Again should be disabled based on immediate result setting
  const tryAgainDisabled = !savedBehavior.showImmediateResult;
  const tryAgainChecked = savedBehavior.allowTryAgain && !tryAgainDisabled; // Can't be checked if disabled
  
  behaviorDiv.innerHTML += `
    <label><input type="checkbox" id="tryAgainOptionDb" ${tryAgainChecked ? 'checked' : ''} ${tryAgainDisabled ? 'disabled' : ''}> Allow "Try Again" for incorrect answers</label><br>
    <label><input type="checkbox" id="topicRevealOptionDb" ${savedBehavior.showTopicSubtopic ? 'checked' : ''}> Show Topic/Subtopic when answering</label><br>
    <label><input type="checkbox" id="immediateResultOptionDb" ${savedBehavior.showImmediateResult ? 'checked' : ''}> Show result immediately after each answer</label><br>
    <label><input type="checkbox" id="correctAnswerOptionDb" ${savedBehavior.showCorrectAnswer ? 'checked' : ''}> Show correct answer when wrong</label>
    <div style="margin-top: 8px; padding: 8px; background: #f0f8ff; border-radius: 4px; font-size: 0.9em; color: #666;">
      <em>Note: If "immediate result" is OFF, results and selected options will be revealed after the final score</em>
    </div>
  `;

  wrapper.appendChild(behaviorDiv);

  // Test Mode Selection section
  const testModeDiv = document.createElement("div");
  testModeDiv.className = "filter-section";
  testModeDiv.style.marginTop = "10px";
  
  // Determine saved test mode
  const savedTestMode = shouldRestore && savedState.testMode ? savedState.testMode : 'learning';
  
  testModeDiv.innerHTML = `
    <h3>Test Mode</h3>
    <label><input type="radio" name="testMode" value="learning" ${savedTestMode === 'learning' ? 'checked' : ''}> Learning Mode (Interactive practice with full feedback)</label><br>
    <label><input type="radio" name="testMode" value="exam" ${savedTestMode === 'exam' ? 'checked' : ''}> Exam Practice Mode (Timed simulation with minimal feedback)</label>
    
    <div style="margin-top: 10px; padding: 12px; background: #fff3cd; border-radius: 6px; font-size: 0.9em; color: #856404; line-height: 1.4; display: flex; gap: 20px;">
      <div style="flex: 1;">
        <strong>🎓 Learning Mode:</strong><br>
        • Interactive study session with full feedback<br>
        • Try again options and immediate explanations<br>
        • Uses Test Behavior Options settings above<br>
        • Unlimited questions allowed
      </div>
      
      <div style="flex: 1;">
        <strong>⏱️ Exam Practice:</strong><br>
        • Realistic timed exam simulation<br>
        • <u>Ignores Test Behavior Options</u> (no try again, delayed feedback)<br>
        • Limited to maximum 100 questions<br>
        • Designed for focused exam preparation
      </div>
    </div>
  `;

  wrapper.appendChild(testModeDiv);

  // Add test mode change handlers to update number of questions limit and show/hide exam duration
  setTimeout(() => {
    const testModeRadios = document.querySelectorAll('input[name="testMode"]');
    const examDurationSection = document.getElementById('exam-duration-section');
    const numInput = document.getElementById('numQuestions');
    
    // Function to update calculated exam duration
    function updateCalculatedDuration() {
      const durationValueSpan = document.getElementById('duration-value');
      if (durationValueSpan && numInput) {
        const numQuestions = parseInt(numInput.value) || 10;
        const calculatedDuration = Math.round(numQuestions * 1.5);
        durationValueSpan.textContent = calculatedDuration;
      }
    }
    
    // Function to update exam duration visibility
    function updateExamDurationVisibility() {
      const examModeRadio = document.querySelector('input[name="testMode"][value="exam"]');
      if (examDurationSection) {
        const isExamMode = examModeRadio && examModeRadio.checked;
        examDurationSection.style.display = isExamMode ? 'block' : 'none';
        if (isExamMode) {
          updateCalculatedDuration();
        }
      }
    }
    
    // Set initial state
    updateExamDurationVisibility();
    
    // Add listeners to test mode radios
    testModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        console.log('Test mode changed to:', radio.value);
        // Update exam duration visibility and calculation
        updateExamDurationVisibility();
        // Update max questions when test mode changes
        if (typeof updateMaxQuestions === 'function') {
          updateMaxQuestions();
        }
      });
    });
    
    // Add listener to number of questions input to update duration
    if (numInput) {
      numInput.addEventListener('input', () => {
        const examModeRadio = document.querySelector('input[name="testMode"][value="exam"]');
        if (examModeRadio && examModeRadio.checked) {
          updateCalculatedDuration();
        }
      });
    }
  }, 0);

  // Add immediate result option change handler (DB mode) - EXACT GOLDEN 22
  setTimeout(() => {
    const immediateResultCheckbox = document.getElementById("immediateResultOptionDb");
    const correctAnswerCheckbox = document.getElementById("correctAnswerOptionDb");
    const tryAgainCheckbox = document.getElementById("tryAgainOptionDb");
    const explanationRadios = expDiv.querySelectorAll('input[name="expMode"]');
    
    if (immediateResultCheckbox && tryAgainCheckbox && correctAnswerCheckbox) {
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
          if (explanationRadios[2] && explanationRadios[2].checked) {
            // If explanations were set to "none", change to a reasonable default
            explanationRadios[1].checked = true; // "Both when right and wrong"
          }
        }
      });
    }
  }, 0);

  // Number of Questions section (EXACT GOLDEN 22) - respect saved state
  const numDiv = document.createElement("div");
  numDiv.className = "filter-section";
  
  // Determine saved number of questions
  const savedNumQuestions = shouldRestore && savedState.numQuestions ? savedState.numQuestions : 10;
  
  numDiv.innerHTML = `<h3>Number of Questions</h3><input type=\"number\" id=\"numQuestions\" min=\"1\" max=\"1000\" value=\"${savedNumQuestions}\"> <span id=\"maxQuestionsInfo\" style=\"margin-left:10px; color:#0078d7; font-weight:bold;\"></span><button id=\"answerAllBtnDb\" style=\"margin-left:10px; background:#4caf50; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.85em; cursor:pointer; font-weight:bold; display:none;\" title=\"Set question count to maximum available\">Answer all</button>`;

  wrapper.appendChild(numDiv);

  // Add input validation event listener for number of questions
  setTimeout(() => {
    const numInput = document.getElementById("numQuestions");
    if (numInput) {
      numInput.addEventListener("input", function() {
        const maxQuestions = parseInt(this.max) || 1000;
        const currentValue = parseInt(this.value) || 0;
        
        console.log(`Input validation: current=${currentValue}, max=${maxQuestions}`);
        
        // Enforce minimum value (must be at least 1)
        if (currentValue < 1) {
          console.log("Value too small, setting to 1");
          this.value = 1;
        }
        
        // Enforce maximum value (cannot exceed available questions)
        if (currentValue > maxQuestions) {
          console.log(`Value too large (${currentValue} > ${maxQuestions}), setting to ${maxQuestions}`);
          this.value = maxQuestions;
        }
        
        // Update tooltip after validation
        updateBalancedTooltip();
      });
      
      // Also add blur event for additional validation
      numInput.addEventListener("blur", function() {
        const maxQuestions = parseInt(this.max) || 1000;
        const currentValue = parseInt(this.value) || 0;
        
        console.log(`Blur validation: current=${currentValue}, max=${maxQuestions}`);
        
        if (currentValue < 1) {
          console.log("Blur: Value too small, setting to 1");
          this.value = 1;
        } else if (currentValue > maxQuestions) {
          console.log(`Blur: Value too large (${currentValue} > ${maxQuestions}), setting to ${maxQuestions}`);
          this.value = maxQuestions;
        }
      });
    }
  }, 0);

  // Selection Mode and Exam Duration section - create flex container
  const modeAndDurationContainer = document.createElement("div");
  modeAndDurationContainer.className = "filter-section";
  modeAndDurationContainer.style.marginTop = "10px";
  modeAndDurationContainer.style.display = "flex";
  modeAndDurationContainer.style.gap = "20px";
  modeAndDurationContainer.style.alignItems = "flex-start";
  
  // Selection Mode section (left side)
  const modeDiv = document.createElement("div");
  modeDiv.style.flex = "1";
  
  // Determine saved selection mode
  const savedSelectionMode = shouldRestore && savedState.selectionMode ? savedState.selectionMode : 'random';
  
  modeDiv.innerHTML = `
    <h3>Selection Mode</h3>
    <label><input type="radio" name="selectionMode" value="random" ${savedSelectionMode === 'random' ? 'checked' : ''}> Random (default)</label><br>
    <label><input type="radio" name="selectionMode" value="balanced" ${savedSelectionMode === 'balanced' ? 'checked' : ''}> Balanced (1 per subtopic, then random)</label>
  `;
  
  // Exam Duration section (right side) - initially hidden
  const examDurationDiv = document.createElement("div");
  examDurationDiv.id = "exam-duration-section";
  examDurationDiv.style.flex = "1";
  examDurationDiv.style.display = "none"; // Initially hidden
  
  examDurationDiv.innerHTML = `
    <h3>Exam Duration</h3>
    <div id="calculated-duration" style="font-size: 1.1em; font-weight: bold; color: #0078d7;">
      <span id="duration-value">15</span> minutes
    </div>
    <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
      (Number of questions × 1.5 minutes)
    </div>
  `;
  
  modeAndDurationContainer.appendChild(modeDiv);
  modeAndDurationContainer.appendChild(examDurationDiv);
  wrapper.appendChild(modeAndDurationContainer);

  // Start button and button container (EXACT GOLDEN 22)
  const startBtn = document.createElement("button");
  startBtn.textContent = "Start Test";
  
  // Add the main Start Test button click handler
  startBtn.addEventListener("click", () => {
    console.log("=== Main Start Test button clicked ===");
    
    // Read behavior options from checkboxes and update AppState (EXACT GOLDEN 22)
    const tryAgainCb = document.getElementById('tryAgainOptionDb');
    const topicRevealCb = document.getElementById('topicRevealOptionDb');
    const immediateResultCb = document.getElementById('immediateResultOptionDb');
    const correctAnswerCb = document.getElementById('correctAnswerOptionDb');
    
    if (tryAgainCb) AppState.allowTryAgain = tryAgainCb.checked;
    if (topicRevealCb) AppState.showTopicSubtopic = topicRevealCb.checked;
    if (immediateResultCb) AppState.showImmediateResult = immediateResultCb.checked;
    if (correctAnswerCb) AppState.showCorrectAnswer = correctAnswerCb.checked;
    
    // Read explanation mode from radio buttons
    const expRadio = document.querySelector('input[name="expMode"]:checked');
    if (expRadio) {
      AppState.explanationMode = parseInt(expRadio.value);
    }
    
    // Save current options state before starting test (consistent with JSON mode)
    if (typeof saveOptionsState === 'function') {
      saveOptionsState();
    } else {
      console.warn('saveOptionsState function not found - state persistence may not work properly');
    }
    
    // Get selected types
    let selectedTypes = [];
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    
    // Helper function to map enhanced type back to database type
    const mapEnhancedToDbType = (enhancedType) => {
      if (window.enhancedTypeMapping) {
        for (const [dbType, enhanced] of Object.entries(window.enhancedTypeMapping)) {
          if (enhanced.includes(enhancedType)) {
            return dbType;
          }
        }
      }
      // If no mapping found, return as-is (for non-enhanced types)
      return enhancedType;
    };
    
    if (typeChecks[0].checked) {
      // "All Types" is checked - get all available types
      if (window.currentDatabaseTypes && window.currentDatabaseTypes.length > 0) {
        selectedTypes = [...window.currentDatabaseTypes];
      } else {
        // Fallback: extract from individual checkboxes and map to DB types
        const dbTypes = new Set();
        for (let i = 1; i < typeChecks.length; i++) {
          if (typeChecks[i].value && typeChecks[i].value !== 'ALL') {
            const dbType = mapEnhancedToDbType(typeChecks[i].value);
            dbTypes.add(dbType);
          }
        }
        selectedTypes = [...dbTypes];
      }
    } else {
      // Individual types selected - map enhanced types back to database types
      const dbTypes = new Set();
      typeChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked && cb.value !== 'ALL') {
          const dbType = mapEnhancedToDbType(cb.value);
          dbTypes.add(dbType);
        }
      });
      selectedTypes = [...dbTypes];
    }
    
    if (selectedTypes.length === 0) {
      alert("Please select at least one question type.");
      return;
    }
    
    // Get database query parameters
    const selectAllTopics = document.getElementById("select-all-topics-db");
    let sql;
    
    if (selectAllTopics && selectAllTopics.checked) {
      // All topics and subtopics selected
      sql = `SELECT * FROM questions WHERE question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
    } else {
      // Build query based on individual subtopic selections
      const selectedSubtopics = document.querySelectorAll(".subtopic-checkbox:checked");
      
      if (selectedSubtopics.length === 0) {
        alert("Please select at least one topic/subtopic.");
        return;
      }
      
      // Build conditions for each selected topic/subtopic combination
      const conditions = [];
      selectedSubtopics.forEach(subtopicCb => {
        const topic = subtopicCb.dataset.topic;
        const subtopic = subtopicCb.value;
        conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
      });
      
      sql = `SELECT * FROM questions WHERE (${conditions.join(' OR ')}) AND question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
    }
    
    console.log("Database query:", sql);
    
    const result = AppState.database.exec(sql);
    const allQuestions = result[0] ? result[0].values : [];
    
    if (allQuestions.length === 0) {
      alert("No questions found matching your criteria. Please adjust your filters.");
      return;
    }
    
    // Convert database rows to question objects (Golden 22 style)
    const columns = result[0].columns;
    let questions = allQuestions.map(row => {
      const question = {};
      columns.forEach((col, index) => {
        question[col] = row[index];
      });
      return question;
    });
    
    console.log(`Found ${questions.length} raw questions from database`);
    
    // Process each question to add options and standardize format (following Golden 22 logic)
    questions = questions.map(q => {
      // Set basic fields for compatibility
      q.question = q.question_text; // Standardize question text field
      
      // Process different question types
      if (q.question_type === 'MCQ' || q.question_type === 'MCQ-Scenario' || q.question_type === 'Cohort-05-MCQ' || q.question_type === 'MCQ-Multiple') {
        // Fetch options from options table
        const optRes = AppState.database.exec(`SELECT option_text, is_correct FROM options WHERE question_id = ${q.id} ORDER BY id`);
        q.options = optRes[0]?.values?.map(v => v[0]) || [];
        
        // Get correct answers (handle both string and integer values for is_correct)
        q.answer = optRes[0]?.values?.filter(v => v[1] === 1 || v[1] === "1")?.map(v => v[0]) || [];
        
        // Set type based on number of correct answers BEFORE converting single answers
        if (q.question_type === 'MCQ-Multiple') {
          q.type = 'multiple';
        } else {
          q.type = (Array.isArray(q.answer) && q.answer.length > 1) ? 'multiple' : 'single';
        }
        
        // Debug logging for type determination
        if (q.id <= 10 || (Array.isArray(q.answer) && q.answer.length > 1)) {
          console.log(`Question ${q.id} type determination:`, {
            question_type: q.question_type,
            answer_array: q.answer,
            answer_count: Array.isArray(q.answer) ? q.answer.length : 'not array',
            determined_type: q.type
          });
        }
        
        // For single choice, convert array to single value AFTER type determination
        if (q.type === 'single' && q.answer.length === 1) {
          q.answer = q.answer[0];
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
        console.log(`Match question ${q.id} processing:`, {
          queryResult: matchRes,
          hasValues: matchRes[0]?.values ? true : false,
          valueCount: matchRes[0]?.values?.length || 0
        });
        
        if (matchRes[0]?.values) {
          q.matchPairs = {};
          matchRes[0].values.forEach(([left, right]) => {
            q.matchPairs[left] = right;
          });
          q.options = ["Refer to match pairs"]; // Placeholder for compatibility
          q.answer = q.matchPairs;
          
          console.log(`Match question ${q.id} final setup:`, {
            type: q.type,
            matchPairs: q.matchPairs,
            pairCount: Object.keys(q.matchPairs).length
          });
        } else {
          console.warn(`No match pairs found for question ${q.id}`);
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
    
    console.log(`Question processing complete: ${questions.length} questions loaded`);
    
    // Apply enhanced type filtering if individual enhanced types were selected
    if (!typeChecks[0].checked) {
      // Individual enhanced types were selected - filter the processed questions
      const selectedEnhancedTypes = [];
      typeChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked && cb.value !== 'ALL') {
          selectedEnhancedTypes.push(cb.value);
        }
      });
      
      console.log('Filtering by enhanced types:', selectedEnhancedTypes);
      
      if (selectedEnhancedTypes.length > 0) {
        const originalCount = questions.length;
        questions = questions.filter(q => {
          // Check if this question matches any of the selected enhanced types
          for (const enhancedType of selectedEnhancedTypes) {
            if (enhancedType.includes(' - ')) {
              const baseType = enhancedType.split(' - ')[0];
              if (q.question_type === baseType) {
                if (enhancedType.includes('Multiple Correct')) {
                  // Should have multiple correct answers (array with length > 1)
                  if (Array.isArray(q.answer) && q.answer.length > 1) return true;
                } else if (enhancedType.includes('Single Correct')) {
                  // Should have single correct answer and not be True/False
                  if (q.type === 'single' && q.options && q.options.length > 2) return true;
                } else if (enhancedType.includes('True or False')) {
                  // Should be True/False type
                  if (q.options && q.options.length === 2 && 
                      ((q.options[0].toLowerCase() === 'true' && q.options[1].toLowerCase() === 'false') ||
                       (q.options[0].toLowerCase() === 'false' && q.options[1].toLowerCase() === 'true'))) {
                    return true;
                  }
                }
              }
            } else {
              // Direct type match (non-enhanced)
              if (q.question_type === enhancedType) return true;
            }
          }
          return false;
        });
        
        console.log(`Enhanced type filtering: ${originalCount} → ${questions.length} questions`);
      }
    }
    
    // Store all questions (no filtering)
    AppState.currentInvalidQuestions = [];
    
    console.log(`Found ${questions.length} questions matching criteria after enhanced filtering`);
    
    // Get number of questions and selection mode
    const numInput = document.getElementById("numQuestions");
    const numQuestions = Math.min(parseInt(numInput.value) || 10, questions.length);
    const mode = modeDiv.querySelector('input[name="selectionMode"]:checked').value;
    
    // Store database mode flag
    AppState.isDbMode = true;
    
    // Apply selection mode and create final question set
    let chosenQuestions;
    if (mode === 'random') {
      chosenQuestions = shuffle(questions).slice(0, numQuestions);
    } else if (mode === 'balanced') {
      chosenQuestions = balancedSelection(questions, numQuestions);
    } else {
      chosenQuestions = questions.slice(0, numQuestions);
    }
    
    console.log(`Selected ${chosenQuestions.length} questions using ${mode} mode`);
    
    // Store last query parameters for restart functionality
    AppState.lastDbQueryParams = {
      selectedTypes: selectedTypes,
      selectedTopics: Array.from(topicDiv.querySelectorAll('.topic-checkbox:checked')).map(cb => cb.value),
      mode: mode,
      selectionMode: mode, // Add this for compatibility with rerunDatabaseTest
      numQuestions: numQuestions,
      explanationMode: AppState.explanationMode,
      isAllTopicsSelected: selectAllTopics && selectAllTopics.checked,
      selectedSubtopics: null,
      // Add behavior options that rerunDatabaseTest expects
      allowTryAgain: AppState.allowTryAgain,
      showTopicSubtopic: AppState.showTopicSubtopic,
      showImmediateResult: AppState.showImmediateResult,
      showCorrectAnswer: AppState.showCorrectAnswer
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
      console.log("=== ABOUT TO START TEST ===");
      console.log("Final chosen questions count:", chosenQuestions.length);
      
      // Check test mode selection
      const testModeRadio = document.querySelector('input[name="testMode"]:checked');
      const testMode = testModeRadio ? testModeRadio.value : 'learning';
      
      if (testMode === 'exam') {
        // Exam Practice Mode - navigate to exam.html
        console.log("Starting Exam Practice Mode");
        
        // Calculate exam duration based on number of questions (1.5 minutes per question)
        const examDuration = Math.round(chosenQuestions.length * 1.5);
        
        // Store exam data in sessionStorage for exam-engine.js
        const examData = {
          questions: chosenQuestions,
          startTime: new Date().toISOString(),
          mode: 'exam',
          duration: examDuration,
          // Store database state for proper restoration
          dbFileName: AppState.dbFileName,
          dbTopics: AppState.dbTopics,
          dbTypes: AppState.dbTypes
        };
        sessionStorage.setItem('examData', JSON.stringify(examData));
        
        // Navigate to exam page
        window.location.href = 'exam.html';
      } else {
        // Learning Mode - use existing test-engine.js flow
        console.log("Starting Learning Mode");
        panel.innerHTML = ""; // Clear filter panel before starting test
        document.getElementById("restart").style.display = "none"; // Hide restart until questions are shown
        document.getElementById("restart-bottom").style.display = "none";
        startTest(chosenQuestions);
      }
    }, 500);
  });
  
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
      
      // Get selected question types (with enhanced type mapping)
      const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
      
      // Helper function to map enhanced type back to database type
      const mapEnhancedToDbType = (enhancedType) => {
        if (window.enhancedTypeMapping) {
          for (const [dbType, enhanced] of Object.entries(window.enhancedTypeMapping)) {
            if (enhanced.includes(enhancedType)) {
              return dbType;
            }
          }
        }
        return enhancedType;
      };
      
      if (typeChecks[0].checked) {
        selectedTypes = window.currentDatabaseTypes || types;
      } else {
        const dbTypes = new Set();
        typeChecks.forEach((cb, i) => {
          if (i > 0 && cb.checked && cb.value !== 'ALL') {
            const dbType = mapEnhancedToDbType(cb.value);
            dbTypes.add(dbType);
          }
        });
        selectedTypes = [...dbTypes];
      }
      
      const numInput = document.getElementById("numQuestions");
      const requestedCount = Math.max(1, parseInt(numInput.value) || 10);
      
      // Calculate distribution preview for SOPHISTICATED BALANCED MODE (DATABASE)
      // Check available questions based on subtopic selections
      const selectAllTopics = document.getElementById("select-all-topics-db");
      let availableQuestionCount = 0;
      
      if (selectAllTopics && selectAllTopics.checked) {
        // All topics and subtopics selected
        if (selectedTypes.length > 0) {
          const countSql = `SELECT COUNT(*) FROM questions WHERE question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
          const countRes = AppState.database.exec(countSql);
          availableQuestionCount = countRes[0]?.values[0][0] || 0;
        }
      } else {
        // Count based on individual subtopic selections
        const selectedSubtopics = topicDiv.querySelectorAll(".subtopic-checkbox:checked");
        
        if (selectedSubtopics.length > 0 && selectedTypes.length > 0) {
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
          ? Array.from(window.topicSubtopicMap?.keys() || []).reduce((total, topic) => total + (window.topicSubtopicMap?.get(topic)?.size || 0), 0)
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
    
    // Reset types - check "All Types" and trigger change to select all individual types
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    typeChecks.forEach((cb, i) => {
      if (i === 0) {
        // Check "All Types" and trigger change event to select all individual types
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      }
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
    const numInput = document.getElementById("numQuestions");
    if (numInput) {
      numInput.value = 10;
    }
    
    // Reset selection mode to random
    const selectionModeRadios = modeDiv.querySelectorAll("input[name=selectionMode]");
    selectionModeRadios.forEach(radio => {
      radio.checked = radio.value === "random";
    });
    
    // Update tooltip after resetting to random mode
    updateBalancedTooltip();
    
    // Update the Selected Types count and max questions
    if (typeof updateSelectedTypesCountDB === 'function') {
      updateSelectedTypesCountDB();
    }
    updateMaxQuestions();
    
    console.log("Reset all DB options to defaults");
  });
  
  buttonContainer.appendChild(resetBtn);
  
  // Create placeholder for "View Invalid Questions" button 
  const viewInvalidBtnPlaceholder = document.createElement("span");
  viewInvalidBtnPlaceholder.id = "viewInvalidBtnContainer";
  buttonContainer.appendChild(viewInvalidBtnPlaceholder);
  
  buttonContainer.appendChild(startBtnContainer);
  
  wrapper.appendChild(buttonContainer);
  
  // Connect the top "Start Test" button to trigger the main button's click event
  const topStartTestBtn = window.topStartTestButton;
  if (topStartTestBtn) {
    // Update the onclick handler to trigger the main button
    topStartTestBtn.onclick = () => {
      console.log("Top Start Test button clicked - delegating to main button");
      console.log("Main startBtn exists:", !!startBtn);
      console.log("Main startBtn disabled:", startBtn.disabled);
      startBtn.click(); // Simply trigger the main start button's click
    };
  }
  
  // Initialize the orange button by calling updateMaxQuestions
  setTimeout(() => {
    updateMaxQuestions();
    // Initialize the Selected Types count
    if (typeof updateSelectedTypesCountDB === 'function') {
      updateSelectedTypesCountDB();
    }
  }, 100);
  
  // Restore options state if coming back from learning mode
  if (shouldRestore && typeof restoreOptionsState === 'function') {
    setTimeout(() => {
      console.log('Database filter panel calling restoreOptionsState...');
      restoreOptionsState();
    }, 200); // Delay to ensure DOM is fully built
  }
  
  panel.appendChild(wrapper);
}

// Balanced selection algorithm for database mode
function balancedSelection(questions, targetCount) {
  // Group questions by topic/subtopic combination
  const groups = {};
  questions.forEach(q => {
    const key = `${q.topic}::${q.subtopic || 'General'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(q);
  });
  
  const groupKeys = Object.keys(groups);
  const selected = [];
  
  // First pass: one question per group
  groupKeys.forEach(key => {
    if (selected.length < targetCount && groups[key].length > 0) {
      const randomIndex = Math.floor(Math.random() * groups[key].length);
      selected.push(groups[key].splice(randomIndex, 1)[0]);
    }
  });
  
  // Second pass: fill remaining slots randomly from remaining questions
  const remaining = [];
  Object.values(groups).forEach(group => remaining.push(...group));
  
  while (selected.length < targetCount && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(randomIndex, 1)[0]);
  }
  
  return selected;
}

// Helper functions that are part of the Golden 22 implementation
function setupTopicSubtopicCheckboxesDb(container, updateCallback) {
  const selectAllCheckbox = container.querySelector("#select-all-topics-db");
  const topicCheckboxes = container.querySelectorAll(".topic-checkbox");
  const subtopicCheckboxes = container.querySelectorAll(".subtopic-checkbox");

  // Select All functionality
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", () => {
      const isChecked = selectAllCheckbox.checked;
      topicCheckboxes.forEach(cb => cb.checked = isChecked);
      subtopicCheckboxes.forEach(cb => cb.checked = isChecked);
      if (updateCallback) updateCallback();
    });
  }

  // Topic checkbox functionality
  topicCheckboxes.forEach(topicCb => {
    topicCb.addEventListener("change", () => {
      const topic = topicCb.value;
      const relatedSubtopics = container.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
      relatedSubtopics.forEach(subtopicCb => {
        subtopicCb.checked = topicCb.checked;
      });
      updateSelectAllState();
      if (updateCallback) updateCallback();
    });
  });

  // Subtopic checkbox functionality
  subtopicCheckboxes.forEach(subtopicCb => {
    subtopicCb.addEventListener("change", () => {
      const topic = subtopicCb.dataset.topic;
      const relatedSubtopics = container.querySelectorAll(`.subtopic-checkbox[data-topic="${topic}"]`);
      const topicCheckbox = container.querySelector(`.topic-checkbox[value="${topic}"]`);
      
      if (topicCheckbox) {
        const allChecked = Array.from(relatedSubtopics).every(cb => cb.checked);
        const someChecked = Array.from(relatedSubtopics).some(cb => cb.checked);
        topicCheckbox.checked = allChecked;
        topicCheckbox.indeterminate = someChecked && !allChecked;
      }
      
      updateSelectAllState();
      if (updateCallback) updateCallback();
    });
  });

  function updateSelectAllState() {
    if (selectAllCheckbox) {
      const allSubtopicsChecked = Array.from(subtopicCheckboxes).every(cb => cb.checked);
      const someSubtopicsChecked = Array.from(subtopicCheckboxes).some(cb => cb.checked);
      selectAllCheckbox.checked = allSubtopicsChecked;
      selectAllCheckbox.indeterminate = someSubtopicsChecked && !allSubtopicsChecked;
    }
  }
}

function setupAllCheckbox(container) {
  const checkboxes = container.querySelectorAll("input[type=checkbox]");
  const allCheckbox = checkboxes[0]; // First checkbox is "All Types"
  
  if (allCheckbox) {
    allCheckbox.addEventListener("change", () => {
      const isChecked = allCheckbox.checked;
      for (let i = 1; i < checkboxes.length; i++) {
        checkboxes[i].checked = isChecked;
      }
      // Trigger count update when "All Types" is changed
      setTimeout(() => {
        if (window.currentUpdateFunction) {
          window.currentUpdateFunction();
        }
      }, 10);
    });

    // Individual checkbox listeners
    for (let i = 1; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener("change", () => {
        const allIndividualChecked = Array.from(checkboxes).slice(1).every(cb => cb.checked);
        const someIndividualChecked = Array.from(checkboxes).slice(1).some(cb => cb.checked);
        allCheckbox.checked = allIndividualChecked;
        allCheckbox.indeterminate = someIndividualChecked && !allIndividualChecked;
        
        // Trigger count update when individual types are changed
        setTimeout(() => {
          if (window.currentUpdateFunction) {
            window.currentUpdateFunction();
          }
        }, 10);
      });
    }
  }
}

function updateMaxQuestions() {
  // Prevent recursive calls when we programmatically change the input value
  if (updateMaxQuestions.isUpdating) return;
  updateMaxQuestions.isUpdating = true;
  
  // Remove any existing quick selection buttons at the start to prevent stale buttons
  const existingQuickButtons = document.querySelectorAll(".quick-select-btn");
  existingQuickButtons.forEach(btn => btn.remove());
  
  console.log("updateMaxQuestions called - calculating actual available questions");
  
  // Get selected question types - find the types section more reliably
  let selectedTypes = [];
  
  // Find the types section by looking for the section with "Select Question Types" heading
  const allSections = document.querySelectorAll('.filter-section');
  let typeDiv = null;
  for (const section of allSections) {
    if (section.innerHTML.includes('Select Question Types')) {
      typeDiv = section;
      break;
    }
  }
  
  if (typeDiv) {
    const typeChecks = typeDiv.querySelectorAll("input[type=checkbox]");
    console.log("Found type checkboxes:", typeChecks.length);
    
    // Helper function to map enhanced type back to database type
    const mapEnhancedToDbType = (enhancedType) => {
      if (window.enhancedTypeMapping) {
        for (const [dbType, enhanced] of Object.entries(window.enhancedTypeMapping)) {
          if (enhanced.includes(enhancedType)) {
            return dbType;
          }
        }
      }
      return enhancedType;
    };
    
    if (typeChecks.length > 0 && typeChecks[0].checked) {
      // "All Types" is checked - get all available types from the global types array
      if (window.currentDatabaseTypes && window.currentDatabaseTypes.length > 0) {
        selectedTypes = [...window.currentDatabaseTypes]; // Use the stored types array
        console.log("All types selected:", selectedTypes);
      } else {
        // Fallback: extract from individual checkboxes and map to DB types
        const dbTypes = new Set();
        for (let i = 1; i < typeChecks.length; i++) {
          if (typeChecks[i].value && typeChecks[i].value !== 'ALL') {
            const dbType = mapEnhancedToDbType(typeChecks[i].value);
            dbTypes.add(dbType);
          }
        }
        selectedTypes = [...dbTypes];
      }
    } else {
      // Individual enhanced types selected - need to filter based on the enhanced type logic
      // Instead of using the database types, we need to calculate the questions that match the enhanced criteria
      const selectedEnhancedTypes = [];
      typeChecks.forEach((cb, i) => {
        if (i > 0 && cb.checked && cb.value !== 'ALL') {
          selectedEnhancedTypes.push(cb.value);
          console.log("Individual enhanced type selected:", cb.value);
        }
      });
      
      // For enhanced types, we need to use a different approach - calculate on the fly
      if (selectedEnhancedTypes.length > 0) {
        // Mark that we're using enhanced type filtering
        selectedTypes = null; // Special marker to indicate enhanced filtering
        window.selectedEnhancedTypes = selectedEnhancedTypes;
      } else {
        selectedTypes = []; // No types selected
      }
    }
  }
  
  console.log("Selected types:", selectedTypes);
  console.log("Selected enhanced types:", window.selectedEnhancedTypes);
  
  // Check if we have either traditional types or enhanced types selected
  const hasSelectedTypes = (selectedTypes && selectedTypes.length > 0) || 
                          (window.selectedEnhancedTypes && window.selectedEnhancedTypes.length > 0);
  
  if (!hasSelectedTypes) {
    document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available (no question types selected)";
    const answerAllBtnDb = document.getElementById("answerAllBtnDb");
    if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
    
    // Remove quick selection buttons when no types selected
    const existingQuickButtons = document.querySelectorAll(".quick-select-btn");
    existingQuickButtons.forEach(btn => btn.remove());
    
    const numInput = document.getElementById("numQuestions");
    if (numInput) {
      numInput.max = 0;
      if (parseInt(numInput.value) > 0) numInput.value = 0;
    }
    updateMaxQuestions.isUpdating = false;
    return;
  }
  
  // Get selected topic/subtopic combinations
  const selectAllTopics = document.getElementById("select-all-topics-db");
  let matchingQuestions = [];
  
  // For enhanced type filtering, we need to analyze questions individually
  if (selectedTypes === null && window.selectedEnhancedTypes) {
    console.log("Using enhanced type filtering");
    
    // First get all questions that match topic/subtopic criteria
    let sql;
    if (selectAllTopics && selectAllTopics.checked) {
      // All topics selected - get all questions
      sql = `SELECT id, question_type FROM questions`;
    } else {
      // Build query based on individual subtopic selections
      const selectedSubtopics = document.querySelectorAll(".subtopic-checkbox:checked");
      
      if (selectedSubtopics.length === 0) {
        document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available (no subtopics selected)";
        const answerAllBtnDb = document.getElementById("answerAllBtnDb");
        if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
        
        const numInput = document.getElementById("numQuestions");
        if (numInput) {
          numInput.max = 0;
          if (parseInt(numInput.value) > 0) numInput.value = 0;
        }
        updateMaxQuestions.isUpdating = false;
        return;
      }
      
      // Build conditions for selected topics/subtopics
      const conditions = [];
      selectedSubtopics.forEach(subtopicCb => {
        const topic = subtopicCb.dataset.topic;
        const subtopic = subtopicCb.value;
        conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
      });
      
      sql = `SELECT id, question_type FROM questions WHERE ${conditions.join(' OR ')}`;
    }
    
    console.log("Getting questions for enhanced filtering:", sql);
    const questionsRes = AppState.database.exec(sql);
    const allQuestions = questionsRes[0]?.values || [];
    
    // Now filter by enhanced types
    allQuestions.forEach(([questionId, questionType]) => {
      const isMCQType = questionType === 'MCQ' || questionType === 'MCQ-Scenario' || 
                        questionType === 'Cohort-05-MCQ' || questionType === 'MCQ-Multiple';
      
      window.selectedEnhancedTypes.forEach(enhancedType => {
        let matches = false;
        
        if (enhancedType.includes(' - ')) {
          // Enhanced MCQ type
          const baseType = enhancedType.split(' - ')[0];
          if (questionType === baseType) {
            if (enhancedType.includes('True or False')) {
              // Check if it's True/False
              const optionsRes = AppState.database.exec(`SELECT option_text FROM options WHERE question_id = ${questionId}`);
              const options = optionsRes[0]?.values.map(v => v[0]) || [];
              matches = isTrueFalseQuestionByOptions(options);
            } else if (enhancedType.includes('Multiple Correct')) {
              // Check if it has multiple correct answers
              const correctCountRes = AppState.database.exec(`SELECT COUNT(*) FROM options WHERE question_id = ${questionId} AND is_correct = 1`);
              const correctCount = correctCountRes[0]?.values[0][0] || 0;
              matches = (correctCount > 1);
            } else if (enhancedType.includes('Single Correct')) {
              // Check if it has single correct answer
              const correctCountRes = AppState.database.exec(`SELECT COUNT(*) FROM options WHERE question_id = ${questionId} AND is_correct = 1`);
              const correctCount = correctCountRes[0]?.values[0][0] || 0;
              
              // Also check it's not True/False
              const optionsRes = AppState.database.exec(`SELECT option_text FROM options WHERE question_id = ${questionId}`);
              const options = optionsRes[0]?.values.map(v => v[0]) || [];
              const isTrueFalse = isTrueFalseQuestionByOptions(options);
              
              matches = (correctCount === 1 && !isTrueFalse);
            }
          }
        } else {
          // Non-enhanced type (direct match)
          matches = (questionType === enhancedType);
        }
        
        if (matches) {
          matchingQuestions.push(questionId);
        }
      });
    });
    
    // Remove duplicates
    matchingQuestions = [...new Set(matchingQuestions)];
    
  } else {
    // Traditional type filtering
    let sql;
    if (selectAllTopics && selectAllTopics.checked) {
      sql = `SELECT id FROM questions WHERE question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
    } else {
      const selectedSubtopics = document.querySelectorAll(".subtopic-checkbox:checked");
      
      if (selectedSubtopics.length === 0) {
        document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available (no subtopics selected)";
        const answerAllBtnDb = document.getElementById("answerAllBtnDb");
        if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
        
        const numInput = document.getElementById("numQuestions");
        if (numInput) {
          numInput.max = 0;
          if (parseInt(numInput.value) > 0) numInput.value = 0;
        }
        updateMaxQuestions.isUpdating = false;
        return;
      }
      
      const conditions = [];
      selectedSubtopics.forEach(subtopicCb => {
        const topic = subtopicCb.dataset.topic;
        const subtopic = subtopicCb.value;
        conditions.push(`(topic = '${escapeSQL(topic)}' AND subtopic = '${escapeSQL(subtopic)}')`);
      });
      
      sql = `SELECT id FROM questions WHERE (${conditions.join(' OR ')}) AND question_type IN (${selectedTypes.map(t => `'${escapeSQL(t)}'`).join(',')})`;
    }
    
    const questionsRes = AppState.database.exec(sql);
    matchingQuestions = questionsRes[0]?.values.map(v => v[0]) || [];
  }
  
  console.log("Matching questions found:", matchingQuestions.length);
  
  if (!AppState.database) {
    console.error("No database available");
    updateMaxQuestions.isUpdating = false;
    return;
  }
  
  try {
    if (matchingQuestions.length === 0) {
      document.getElementById("maxQuestionsInfo").textContent = "Max: 0 questions available for selection";
      const answerAllBtnDb = document.getElementById("answerAllBtnDb");
      if (answerAllBtnDb) answerAllBtnDb.style.display = "none";
      const numInput = document.getElementById("numQuestions");
      if (numInput) {
        numInput.max = 0;
        if (parseInt(numInput.value) > 0) numInput.value = 0;
      }
      updateMaxQuestions.isUpdating = false;
      return;
    }
    
    // Get full question details for validation
    const questionIds = matchingQuestions.join(',');
    const res = AppState.database.exec(`SELECT * FROM questions WHERE id IN (${questionIds})`);
    let allQuestions = res[0]?.values.map(row => {
      const obj = {};
      res[0].columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    }) || [];
    
    // Perform comprehensive validation like Golden 22
    let validQuestions = [];
    let invalidQuestions = [];
    
    console.log(`=== VALIDATION DEBUG ===`);
    console.log(`SQL query returned ${allQuestions.length} questions`);
    
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
      const conflictOptionsResult = AppState.database.exec(conflictingOptionsSQL);
      if (conflictOptionsResult[0]?.values) {
        conflictOptionsResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, option_text, correctness, reason] = row;
          invalidQuestions.push({
            id, question_text, question_type, topic, subtopic, 
            reason: `${reason} - "${option_text}" has correctness values: ${correctness}`
          });
        });
      }
    } catch (e) { console.log("Error checking conflicting options:", e); }
    
    // 1.3 Duplicate match_pairs (exact same left_text and right_text)
    try {
      const duplicateMatchPairsSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, m.left_text, m.right_text,
               COUNT(*) as dup_count, 'Duplicate match pair' as reason
        FROM questions q
        JOIN match_pairs m ON q.id = m.question_id
        GROUP BY q.id, m.left_text, m.right_text
        HAVING COUNT(*) > 1
      `;
      const dupMatchPairsResult = AppState.database.exec(duplicateMatchPairsSQL);
      if (dupMatchPairsResult[0]?.values) {
        dupMatchPairsResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, left_text, right_text, dup_count, reason] = row;
          invalidQuestions.push({
            id, question_text, question_type, topic, subtopic, 
            reason: `${reason} - "${left_text}" → "${right_text}" (${dup_count} times)`
          });
        });
      }
    } catch (e) { console.log("Error checking duplicate match_pairs:", e); }
    
    // 1.4 Duplicate left_text in match_pairs
    try {
      const duplicateLeftSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, m.left_text,
               COUNT(*) as dup_count, 'Duplicate left text in match_pairs' as reason
        FROM questions q
        JOIN match_pairs m ON q.id = m.question_id
        GROUP BY q.id, m.left_text
        HAVING COUNT(*) > 1
      `;
      const dupLeftResult = AppState.database.exec(duplicateLeftSQL);
      if (dupLeftResult[0]?.values) {
        dupLeftResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, left_text, dup_count, reason] = row;
          invalidQuestions.push({
            id, question_text, question_type, topic, subtopic, 
            reason: `${reason} - "${left_text}" appears ${dup_count} times`
          });
        });
      }
    } catch (e) { console.log("Error checking duplicate left text:", e); }
    
    // 1.5 Duplicate right_text in match_pairs
    try {
      const duplicateRightSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, m.right_text,
               COUNT(*) as dup_count, 'Duplicate right text in match_pairs' as reason
        FROM questions q
        JOIN match_pairs m ON q.id = m.question_id
        GROUP BY q.id, m.right_text
        HAVING COUNT(*) > 1
      `;
      const dupRightResult = AppState.database.exec(duplicateRightSQL);
      if (dupRightResult[0]?.values) {
        dupRightResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, right_text, dup_count, reason] = row;
          invalidQuestions.push({
            id, question_text, question_type, topic, subtopic, 
            reason: `${reason} - "${right_text}" appears ${dup_count} times`
          });
        });
      }
    } catch (e) { console.log("Error checking duplicate right text:", e); }
    
    // === ANOMALIES → Need Review ===
    
    // 2.1 MCQ questions with no correct answers
    try {
      const noCorrectAnswersSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 'MCQ with no correct answers' as reason
        FROM questions q
        WHERE q.question_type IN ('MCQ','MCQ-Multiple','MCQ-Scenario','Cohort-05-MCQ')
        AND NOT EXISTS (SELECT 1 FROM options o WHERE o.question_id = q.id AND (o.is_correct = 1 OR o.is_correct = '1'))
      `;
      const noCorrectResult = AppState.database.exec(noCorrectAnswersSQL);
      if (noCorrectResult[0]?.values) {
        noCorrectResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, reason] = row;
          invalidQuestions.push({ id, question_text, question_type, topic, subtopic, reason });
        });
      }
    } catch (e) { console.log("Error checking no correct answers:", e); }
    
    // 2.2 MCQ questions with all correct answers
    try {
      const allCorrectAnswersSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 'MCQ with all answers marked correct' as reason
        FROM questions q
        WHERE q.question_type IN ('MCQ','MCQ-Multiple','MCQ-Scenario','Cohort-05-MCQ')
        AND EXISTS (SELECT 1 FROM options o WHERE o.question_id = q.id)
        AND NOT EXISTS (SELECT 1 FROM options o WHERE o.question_id = q.id AND (o.is_correct = 0 OR o.is_correct = '0'))
      `;
      const allCorrectResult = AppState.database.exec(allCorrectAnswersSQL);
      if (allCorrectResult[0]?.values) {
        allCorrectResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, reason] = row;
          invalidQuestions.push({ id, question_text, question_type, topic, subtopic, reason });
        });
      }
    } catch (e) { console.log("Error checking all correct answers:", e); }
    
    // 2.3 TrueFalse questions with multiple correct answers
    try {
      const multipleCorrectTFSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 'TrueFalse with multiple correct answers' as reason
        FROM questions q
        WHERE q.question_type = 'TrueFalse'
        AND (SELECT COUNT(*) FROM options o WHERE o.question_id = q.id AND (o.is_correct = 1 OR o.is_correct = '1')) > 1
      `;
      const multipleTFResult = AppState.database.exec(multipleCorrectTFSQL);
      if (multipleTFResult[0]?.values) {
        multipleTFResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, reason] = row;
          invalidQuestions.push({ id, question_text, question_type, topic, subtopic, reason });
        });
      }
    } catch (e) { console.log("Error checking multiple correct TF:", e); }
    
    // 2.4 Questions with insufficient options
    try {
      const insufficientOptionsSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 
               COUNT(o.id) as option_count, 'Insufficient options' as reason
        FROM questions q
        LEFT JOIN options o ON q.id = o.question_id
        WHERE q.question_type IN ('MCQ','MCQ-Multiple','MCQ-Scenario','Cohort-05-MCQ','TrueFalse','AssertionReason')
        GROUP BY q.id, q.question_text, q.question_type, q.topic, q.subtopic
        HAVING COUNT(o.id) < 2
      `;
      const insufficientResult = AppState.database.exec(insufficientOptionsSQL);
      if (insufficientResult[0]?.values) {
        insufficientResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, option_count, reason] = row;
          invalidQuestions.push({ 
            id, question_text, question_type, topic, subtopic, 
            reason: `${reason} (only ${option_count} option${option_count === 1 ? '' : 's'})` 
          });
        });
      }
    } catch (e) { console.log("Error checking insufficient options:", e); }
    
    // 2.5 Orphan questions with no associated records
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
    
    // 2.6 Match questions with insufficient match_pairs
    try {
      const insufficientMatchPairsSQL = `
        SELECT q.id, q.question_text, q.question_type, q.topic, q.subtopic, 
               COUNT(m.id) as pair_count, 'Insufficient match_pairs' as reason
        FROM questions q
        LEFT JOIN match_pairs m ON q.id = m.question_id
        WHERE q.question_type = 'Match'
        GROUP BY q.id, q.question_text, q.question_type, q.topic, q.subtopic
        HAVING COUNT(m.id) < 2
      `;
      const insufficientMatchResult = AppState.database.exec(insufficientMatchPairsSQL);
      if (insufficientMatchResult[0]?.values) {
        insufficientMatchResult[0].values.forEach(row => {
          const [id, question_text, question_type, topic, subtopic, pair_count, reason] = row;
          invalidQuestions.push({ 
            id, question_text, question_type, topic, subtopic, 
            reason: `${reason} (only ${pair_count} pair${pair_count === 1 ? '' : 's'})` 
          });
        });
      }
    } catch (e) { console.log("Error checking insufficient match_pairs:", e); }
    
    // Collect all valid questions (those not flagged as invalid)
    const invalidQuestionIds = new Set(invalidQuestions.map(q => q.id));
    allQuestions.forEach(q => {
      if (!invalidQuestionIds.has(q.id)) {
        validQuestions.push(q);
      }
    });
    
    console.log(`Valid questions: ${validQuestions.length}, Invalid: ${invalidQuestions.length}`);
    
    const totalValidQuestions = validQuestions.length;
    
    // Store invalid questions for the button
    AppState.currentInvalidQuestions = invalidQuestions;
    
    // Update the max questions info
    document.getElementById("maxQuestionsInfo").textContent = `Max: ${totalValidQuestions} question${totalValidQuestions === 1 ? '' : 's'} available for selection`;
    
    // Check if we're in exam practice mode
    const examModeRadio = document.querySelector('input[name="testMode"][value="exam"]');
    const isExamMode = examModeRadio && examModeRadio.checked;
    
    // Calculate effective maximum for the current mode
    const effectiveMax = isExamMode ? Math.min(100, totalValidQuestions) : totalValidQuestions;
    
    // Update the "Answer all" button and create quick selection buttons
    const answerAllBtnDb = document.getElementById("answerAllBtnDb");
    if (answerAllBtnDb && totalValidQuestions > 0) {
      if (isExamMode) {
        answerAllBtnDb.textContent = `Answer ${effectiveMax}`;
        answerAllBtnDb.title = `Set question count to maximum for exam mode (${effectiveMax})`;
      } else {
        answerAllBtnDb.textContent = `Answer all ${totalValidQuestions}`;
        answerAllBtnDb.title = `Set question count to maximum available (${totalValidQuestions})`;
      }
      answerAllBtnDb.style.display = "inline-block";
      answerAllBtnDb.onclick = () => {
        const numInput = document.getElementById("numQuestions");
        if (numInput) {
          numInput.value = effectiveMax;
          // Update exam duration if in exam mode
          if (isExamMode) {
            const durationValueSpan = document.getElementById('duration-value');
            if (durationValueSpan) {
              const calculatedDuration = Math.round(effectiveMax * 1.5);
              durationValueSpan.textContent = calculatedDuration;
            }
          }
        }
      };
      
      // Create quick selection buttons next to "Answer all" button
      // Remove any existing quick selection buttons first
      const existingQuickButtons = document.querySelectorAll(".quick-select-btn");
      existingQuickButtons.forEach(btn => btn.remove());
      
      // Only create quick selection buttons if there are questions available
      if (totalValidQuestions > 0) {
        // Generate quick selection values based on mode
        const quickSelectionValues = [];
        
        if (isExamMode) {
          // For exam mode: descending from available max down to 10 (50, 40, 30, 20, 10)
          const examQuickValues = [50, 40, 30, 20, 10];
          examQuickValues.forEach(value => {
            if (value <= effectiveMax) {
              quickSelectionValues.push(value);
            }
          });
        } else {
          // For learning mode: original logic
          if (totalValidQuestions > 50) {
            // If maxcount > 50, start from 50 and go down to 10 (already descending)
            for (let i = 50; i >= 10; i -= 10) {
              if (i <= totalValidQuestions) {
                quickSelectionValues.push(i);
              }
            }
          } else {
            // If maxcount <= 50, generate buttons for multiples of 10 in descending order
            for (let i = Math.floor(totalValidQuestions / 10) * 10; i >= 10; i -= 10) {
              quickSelectionValues.push(i);
            }
          }
        }
        
        // Create and insert quick selection buttons
        quickSelectionValues.forEach(value => {
          const quickBtn = document.createElement("button");
          quickBtn.textContent = value.toString();
          quickBtn.className = "quick-select-btn";
          quickBtn.style.cssText = "margin-left: 5px; background: #4caf50; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; cursor: pointer; font-weight: bold;";
          quickBtn.title = `Set question count to ${value}`;
          quickBtn.onclick = () => {
            const numInput = document.getElementById("numQuestions");
            if (numInput) {
              numInput.value = value;
              // Update exam duration if in exam mode
              const examModeCheck = document.querySelector('input[name="testMode"][value="exam"]');
              if (examModeCheck && examModeCheck.checked) {
                const durationValueSpan = document.getElementById('duration-value');
                if (durationValueSpan) {
                  const calculatedDuration = Math.round(value * 1.5);
                  durationValueSpan.textContent = calculatedDuration;
                }
              }
            }
          };
          
          // Insert button after the "Answer all" button
          answerAllBtnDb.parentNode.insertBefore(quickBtn, answerAllBtnDb.nextSibling);
        });
      }
      
    } else if (answerAllBtnDb) {
      answerAllBtnDb.style.display = "none";
      // Also hide quick selection buttons when no questions available
      const existingQuickButtons = document.querySelectorAll(".quick-select-btn");
      existingQuickButtons.forEach(btn => btn.remove());
    }
    
    // Update the number input max value
    const numInput = document.getElementById("numQuestions");
    if (numInput) {
      // Check if exam practice mode is selected to limit to max 100
      const examModeRadio = document.querySelector('input[name="testMode"][value="exam"]');
      const isExamMode = examModeRadio && examModeRadio.checked;
      
      // Set max based on mode: exam mode max 100, learning mode unlimited
      const effectiveMax = isExamMode ? Math.min(100, totalValidQuestions) : totalValidQuestions;
      numInput.max = effectiveMax;
      
      // Auto-adjust the value if it exceeds the new maximum
      const currentValue = parseInt(numInput.value) || 0;
      if (currentValue < 1) {
        numInput.value = Math.min(10, effectiveMax);
      } else if (currentValue > effectiveMax) {
        numInput.value = effectiveMax;
      }
      
      // Update exam duration if in exam mode and value was changed
      if (isExamMode) {
        const durationValueSpan = document.getElementById('duration-value');
        if (durationValueSpan) {
          const numQuestions = parseInt(numInput.value) || 10;
          const calculatedDuration = Math.round(numQuestions * 1.5);
          durationValueSpan.textContent = calculatedDuration;
        }
      }
    }
    
    // Create/update the "View Invalid Questions" button
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
    
  } catch (error) {
    console.error("Error calculating max questions:", error);
    document.getElementById("maxQuestionsInfo").textContent = "Max: Error calculating available questions";
  }
  
  // Update balanced tooltip if in balanced mode
  if (typeof updateBalancedTooltip === 'function') {
    updateBalancedTooltip();
  }
  
  // Reset the flag
  updateMaxQuestions.isUpdating = false;
}

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Export for use in main.js
window.buildDbFilterPanel = buildDbFilterPanel;