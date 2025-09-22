# 📘 JSON Format for Questions Da```json
{
  "id": 2,
  "topic": "History",
  "subtopic": "Indian Independence",
  "type": "single",
  "question": "Who was the first President of India?",
  "options": ["Jawaharlal Nehru", "Dr. Rajendra Prasad", "S. Radhakrishnan", "Mahatma Gandhi"],
  "answer": "Dr. Rajendra Prasad",
  "explanation": "Dr. Rajendra Prasad was India's first President, serving from 1950 to 1962.",
  "reference": "Indian Polity"
}
``` 1. Base Structure

```json
{
  "title": "General Knowledge Quiz",
  "questions": [
    {
      "id": 1,
      "topic": "Science",
      "subtopic": "Astronomy",
      "type": "single",
      "question": "Which planet is known as the Red Planet?",
      "options": ["Jupiter", "Mars", "Venus", "Saturn"],
      "answer": "Mars",
      "explanation": "Mars appears red due to iron oxide dust on its surface.",
      "reference": "NCERT Science"
    }
  ]
}
```

---

## 2. Question Types

### MCQ (Single Correct)

* Use `"type": "single"`.
* `"answer"` is a **single string**.
* Only one correct answer allowed.

```json
{
  "id": 2,
  "topic": "History",
  "type": "single",
  "question": "Who was the first President of India?",
  "options": ["Jawaharlal Nehru", "Dr. Rajendra Prasad", "S. Radhakrishnan", "Mahatma Gandhi"],
  "answer": "Dr. Rajendra Prasad",
  "explanation": "Dr. Rajendra Prasad was India’s first President, serving from 1950 to 1962.",
  "reference": "Indian Polity"
}
```

---

### MCQ (Multiple Correct)

* Use `"type": "multiple"`.
* `"answer"` is an **array of strings** (to support multiple correct answers).
* At least two entries in `answer`.

```json
{
  "id": 3,
  "topic": "Geography",
  "subtopic": "World Geography",
  "type": "multiple",
  "question": "Which of the following are continents?",
  "options": ["Asia", "Europe", "Greenland", "Australia"],
  "answer": ["Asia", "Europe", "Australia"],
  "explanation": "Asia, Europe, and Australia are continents; Greenland is not.",
  "reference": "World Atlas"
}
```

---

### Assertion–Reason

* Use `"type": "assertion"`.
* Options must always include the **four standard patterns**.
* `"answer"` is a single string containing the correct option.

```json
{
  "id": 5,
  "topic": "Science",
  "subtopic": "Physics",
  "type": "assertion",
  "question": "Assertion (A): The Earth revolves around the Sun. Reason (R): The Sun orbits the Earth once a year.",
  "options": [
    "A and R are true, R explains A",
    "A and R are true, R does not explain A",
    "A is true, R is false",
    "A is false, R is true"
  ],
  "answer": "A is true, R is false",
  "explanation": "The Earth revolves around the Sun, but the Sun does not orbit the Earth. The reason is false.",
  "reference": "NCERT Science"
}
```

---

### Match-the-Following

* Use `"type": "match"`.
* Must include a `"matchPairs"` object with left–right key-value pairs.

```json
{
  "id": 7,
  "topic": "Science",
  "subtopic": "Famous Scientists",
  "type": "match",
  "question": "Match scientists with their discoveries.",
  "matchPairs": {
    "Newton": "Law of Gravitation",
    "Einstein": "Theory of Relativity",
    "Pasteur": "Germ Theory",
    "Darwin": "Theory of Evolution"
  },
  "explanation": "Newton, Einstein, Pasteur, and Darwin are linked with their contributions.",
  "reference": "Science Encyclopedia"
}
```

---

### True/False

* Store as `"type": "single"` with options `["True","False"]`.
* `"answer"` is `"True"` or `"False"`.

```json
{
  "id": 8,
  "topic": "Science",
  "subtopic": "Human Biology",
  "type": "single",
  "question": "The human body has 206 bones.",
  "options": ["True", "False"],
  "answer": "True",
  "explanation": "An adult human skeleton typically consists of 206 bones.",
  "reference": "Biology"
}
```

---

## 3. Guidelines

* **Mandatory fields**:
  `question`, `type`, `topic`, `explanation`
* **Recommended fields**:
  - `id` (recommended for import/export consistency; if omitted, DB autoincrement can assign it)
  - `subtopic` (recommended for better organization and filtering; if omitted, defaults to "General")
* **Optional field**:
  `reference`
* **Children**:

  * `options[]` for MCQ, assertion, true/false
  * `matchPairs` object for Match-the-Following
* **Topic Organization**:
  - `topic`: Main category (e.g., "Science", "History", "Geography")
  - `subtopic`: Subcategory within the topic (e.g., "Physics", "Chemistry", "Astronomy" under "Science")
  - The subtopic field enables hierarchical filtering in the test interface
  - If subtopic is not provided, it defaults to "General"
* **Distinguish clearly** between single vs multiple MCQ:

  * `"type": "single"` → `answer` is string
  * `"type": "multiple"` → `answer` is array of strings
* **Keep JSON valid** (lint with `jq`, VSCode, or online tools).

---

