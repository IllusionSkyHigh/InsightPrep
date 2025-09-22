-- ================================
-- 3 Final MCQs for Full Taxonomy Coverage
-- ================================

-- 1. TALIS/OECD perspectives
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES ('According to TALIS/OECD studies, which factor is most strongly associated with improved teaching quality across countries?', 'MCQ', 'School Leadership Research & Frameworks', 'TALIS/OECD perspectives', 'OECD TALIS – Teacher Leadership',
'TALIS/OECD research emphasizes that effective professional development and collaborative practices directly improve teaching quality.');
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text='According to TALIS/OECD studies, which factor is most strongly associated with improved teaching quality across countries?'), 'High-quality professional development', 1),
((SELECT id FROM questions WHERE question_text='According to TALIS/OECD studies, which factor is most strongly associated with improved teaching quality across countries?'), 'Charisma of school leaders', 0),
((SELECT id FROM questions WHERE question_text='According to TALIS/OECD studies, which factor is most strongly associated with improved teaching quality across countries?'), 'Strict bureaucratic compliance', 0),
((SELECT id FROM questions WHERE question_text='According to TALIS/OECD studies, which factor is most strongly associated with improved teaching quality across countries?'), 'Competition among teachers', 0);

-- 2. Succession planning
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES ('Which leadership practice ensures smooth transitions by preparing future leaders within the school?', 'MCQ', 'Leadership Practices & Processes', 'Succession planning', 'Presentation – Leadership Processes',
'Succession planning involves identifying and developing potential leaders to ensure continuity and sustainability in school leadership.');
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text='Which leadership practice ensures smooth transitions by preparing future leaders within the school?'), 'Succession planning', 1),
((SELECT id FROM questions WHERE question_text='Which leadership practice ensures smooth transitions by preparing future leaders within the school?'), 'Quick fix reforms', 0),
((SELECT id FROM questions WHERE question_text='Which leadership practice ensures smooth transitions by preparing future leaders within the school?'), 'Instructional monitoring', 0),
((SELECT id FROM questions WHERE question_text='Which leadership practice ensures smooth transitions by preparing future leaders within the school?'), 'Charisma-based leadership', 0);

-- 3. Emotional literacy in schools
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES ('Which concept refers to helping students and staff recognize, understand, and express emotions effectively within the school?', 'MCQ', 'Emotional Intelligence & Empathy', 'Emotional literacy in schools', 'Goleman / Roots of Empathy',
'Emotional literacy in schools involves developing the ability to identify, express, and manage emotions constructively, fostering empathy and positive relationships.');
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text='Which concept refers to helping students and staff recognize, understand, and express emotions effectively within the school?'), 'Emotional literacy', 1),
((SELECT id FROM questions WHERE question_text='Which concept refers to helping students and staff recognize, understand, and express emotions effectively within the school?'), 'Transactional compliance', 0),
((SELECT id FROM questions WHERE question_text='Which concept refers to helping students and staff recognize, understand, and express emotions effectively within the school?'), 'Charisma-driven reform', 0),
((SELECT id FROM questions WHERE question_text='Which concept refers to helping students and staff recognize, understand, and express emotions effectively within the school?'), 'Defensive routines', 0);
