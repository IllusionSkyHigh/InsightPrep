# 📘 Question Insertion Guide (with Subquery Style Inserts)

This guide documents how to insert questions, options, and match pairs into the database.
It follows the **Leadership DB conventions** and uses the **`question_text` subquery style** to avoid hardcoding IDs.

---

## 1. MCQ (Single Correct)

* **questions**

```sql
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES (
  'Who was the first President of India?',
  'MCQ',
  'History',
  'Indian Independence',
  'Indian Polity',
  'Dr. Rajendra Prasad was India’s first President, serving from 1950 to 1962.'
);
```

* **options**
  (use `SELECT id FROM questions WHERE question_text = ...`)

```sql
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text = 'Who was the first President of India?'), 'Jawaharlal Nehru', 0),
((SELECT id FROM questions WHERE question_text = 'Who was the first President of India?'), 'Dr. Rajendra Prasad', 1),
((SELECT id FROM questions WHERE question_text = 'Who was the first President of India?'), 'S. Radhakrishnan', 0),
((SELECT id FROM questions WHERE question_text = 'Who was the first President of India?'), 'Mahatma Gandhi', 0);
```

---

## 2. MCQ (Multiple Correct)

* **questions**

```sql
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES (
  'Which of the following are continents?',
  'MCQ-Multiple',
  'Geography',
  'World Geography',
  'World Atlas',
  'Asia, Europe, and Australia are continents; Greenland is not.'
);
```

* **options**

```sql
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text = 'Which of the following are continents?'), 'Asia', 1),
((SELECT id FROM questions WHERE question_text = 'Which of the following are continents?'), 'Europe', 1),
((SELECT id FROM questions WHERE question_text = 'Which of the following are continents?'), 'Greenland', 0),
((SELECT id FROM questions WHERE question_text = 'Which of the following are continents?'), 'Australia', 1);
```

---

## 3. Assertion–Reason

* **questions**

```sql
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES (
  'Assertion (A): The Earth revolves around the Sun. Reason (R): The Sun orbits the Earth once a year.',
  'AssertionReason',
  'Science',
  'Physics',
  'NCERT Science',
  'The Earth revolves around the Sun, but the Sun does not orbit the Earth.'
);
```

* **options**

```sql
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text = 'Assertion (A): The Earth revolves around the Sun. Reason (R): The Sun orbits the Earth once a year.'), 'A and R are true, R explains A', 0),
((SELECT id FROM questions WHERE question_text = 'Assertion (A): The Earth revolves around the Sun. Reason (R): The Sun orbits the Earth once a year.'), 'A and R are true, R does not explain A', 0),
((SELECT id FROM questions WHERE question_text = 'Assertion (A): The Earth revolves around the Sun. Reason (R): The Sun orbits the Earth once a year.'), 'A is true, R is false', 1),
((SELECT id FROM questions WHERE question_text = 'Assertion (A): The Earth revolves around the Sun. Reason (R): The Sun orbits the Earth once a year.'), 'A is false, R is true', 0);
```

---

## 4. Match-the-Following

* **questions**

```sql
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES (
  'Match scientists with their discoveries.',
  'Match',
  'Science',
  'Famous Scientists',
  'Science Encyclopedia',
  'Newton, Einstein, Pasteur, and Darwin are linked with their contributions.'
);
```

* **options (dummy row)**

```sql
INSERT INTO options (question_id, option_text, is_correct)
VALUES (
  (SELECT id FROM questions WHERE question_text = 'Match scientists with their discoveries.'),
  'Refer to match pairs',
  1
);
```

* **match\_pairs**

```sql
INSERT INTO match_pairs (question_id, left_text, right_text) VALUES
((SELECT id FROM questions WHERE question_text = 'Match scientists with their discoveries.'), 'Newton', 'Law of Gravitation'),
((SELECT id FROM questions WHERE question_text = 'Match scientists with their discoveries.'), 'Einstein', 'Theory of Relativity'),
((SELECT id FROM questions WHERE question_text = 'Match scientists with their discoveries.'), 'Pasteur', 'Germ Theory'),
((SELECT id FROM questions WHERE question_text = 'Match scientists with their discoveries.'), 'Darwin', 'Theory of Evolution');
```

---

## 5. True/False

* **questions**

```sql
INSERT INTO questions (question_text, question_type, topic, subtopic, reference, explanation)
VALUES (
  'The human body has 206 bones.',
  'MCQ',
  'Science',
  'Human Biology',
  'Biology',
  'An adult human skeleton typically consists of 206 bones.'
);
```

* **options**

```sql
INSERT INTO options (question_id, option_text, is_correct) VALUES
((SELECT id FROM questions WHERE question_text = 'The human body has 206 bones.'), 'True', 1),
((SELECT id FROM questions WHERE question_text = 'The human body has 206 bones.'), 'False', 0);
```

---

## Question Types in DB Mode

In database (DB) mode, the `questions` table uses a `question_type` field to distinguish between different types of questions. The supported values are:

- `MCQ`                — Multiple Choice Question
- `MCQ-Scenario`       — Scenario-based MCQ
- `Cohort-05-MCQ`      — Special cohort MCQ
- `TrueFalse`          — True/False question
- `Match`              — Match the Following
- `AssertionReason`    — Assertion-Reason type question

**Note:**
- For assertion type questions, the value is `AssertionReason` (not `assertion` or `Assertion-Reason`).
- The code checks for `question_type === 'AssertionReason'` to identify assertion-reason questions in DB mode.

Example row:

| id  | question_type     | question_text                                      |
|-----|-------------------|----------------------------------------------------|
| 101 | AssertionReason   | Assertion (A): ... Reason (R): ...                 |

Make sure your data uses these exact values for the `question_type` field to ensure correct behavior.

> - The `MCQ` question_type is used for both single correct and multi correct MCQs. The distinction is handled by the number of correct answers in the options, not by a different type value.

---

# ✅ Structuring Rules

1. Always insert into **`questions`** first.
2. For **`options`** and **`match_pairs`**, never hardcode IDs → always use:

   ```sql
   (SELECT id FROM questions WHERE question_text = '<exact text>')
   ```
3. **Question Types** (case-sensitive!):

   * `"MCQ"` → single-correct
   * `"MCQ-Multiple"` → multiple-correct
   * `"Assertion"` → assertion–reason
   * `"Match"` → match-the-following (must also insert `"Refer to match pairs"`)
4. **Topics/Subtopics** must be non-NULL.
5. **Explanations/References** should always be filled in.

> **Note:**
> - Only `MCQ` is valid for multiple choice questions. Do not use `MCQ_MULTIPLE`, `MCQ-MULTIPLE`, or any other variant.


