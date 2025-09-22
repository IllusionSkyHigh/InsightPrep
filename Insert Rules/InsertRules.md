# 📘 Question Insertion Guide (SQL Reference)

This guide defines **how to insert records** into the database for each question type.
It aligns with the **Leadership DB** structure, so the app can recognize and display all question types correctly.

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

```sql
INSERT INTO options (question_id, option_text, is_correct) VALUES
(<id>, 'Jawaharlal Nehru', 0),
(<id>, 'Dr. Rajendra Prasad', 1),
(<id>, 'S. Radhakrishnan', 0),
(<id>, 'Mahatma Gandhi', 0);
```

---

## 2. Assertion–Reason

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

* **options** (always the same 4 patterns)

```sql
INSERT INTO options (question_id, option_text, is_correct) VALUES
(<id>, 'A and R are true, R explains A', 0),
(<id>, 'A and R are true, R does not explain A', 0),
(<id>, 'A is true, R is false', 1),
(<id>, 'A is false, R is true', 0);
```

---

## 3. Match-the-Following

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

* **options** (dummy record)

```sql
INSERT INTO options (question_id, option_text, is_correct)
VALUES (<id>, 'Refer to match pairs', 1);
```

* **match\_pairs**

```sql
INSERT INTO match_pairs (question_id, left_text, right_text) VALUES
(<id>, 'Newton', 'Law of Gravitation'),
(<id>, 'Einstein', 'Theory of Relativity'),
(<id>, 'Pasteur', 'Germ Theory'),
(<id>, 'Darwin', 'Theory of Evolution');
```

---

## 4. True/False

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
(<id>, 'True', 1),
(<id>, 'False', 0);
```

---

# ✅ Rules & Conventions

1. **Question Types**

   * `"MCQ"` → Single correct answer.
   * `"AssertionReason"` → Assertion–Reason format.
   * `"Match"` → Match-the-following.
   * **True/False** is stored as `"MCQ"` with two options.

- The `MCQ` question_type is used for both single correct and multi correct MCQs. The distinction is handled by the number of correct answers in the options, not by a different type value.

2. **Match Questions**

   * Must include one dummy option `"Refer to match pairs"` in `options`.
   * All left–right pairs must be in `match_pairs`.

3. **Options**

   * Each option = one row in `options`.
   * `is_correct = 1` marks correct ones (can be multiple for MCQ-Multiple).

4. **Topic & Subtopic**

   * Always provide both for filtering and organization.
   * Avoid `NULL` values.

5. **References & Explanations**

   * `reference` = source (book, article, case).
   * `explanation` = why the answer is correct.

---


