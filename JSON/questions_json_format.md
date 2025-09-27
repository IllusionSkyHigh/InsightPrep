# JSON format for questions and exports (current)

This document describes the JSON that the app can import and the payload it exports from the Options page “Export to JSON” button.

Accepted roots (both are valid during import):
- Object with a questions array: { meta?: object, questions: Question[] }
- Bare array of questions: Question[]

Notes
- If an object root is used, the app preserves and may emit a meta block with export details.
- When importing, the app accepts either shape (object.questions or direct array).

Top-level export payload (produced by Export to JSON)

```json
{
  "meta": {
    "source": "database",          
    "dbFileName": "questions.db",  
    "exportedAt": "2025-09-27T11:22:33.456Z",
    "count": 25,                    
    "mode": "random"               
  },
  "questions": [
    { /* Question objects, see schema below */ }
  ]
}
```

Question object schema

Required fields
- question: string – The prompt/text.
- type: "single" | "multiple" | "match" | "assertion"

Recommended fields
- topic: string
- subtopic: string

Optional (commonly present)
- id: number | string
- options: string[] – Required for single, multiple, assertion, and True/False
- answer:
  - string for type="single" or type="assertion"
  - string[] for type="multiple"
  - for type="match", the app accepts either: matchPairs object OR answer set to that object
- matchPairs: { [left: string]: string } – Preferred for type="match"
- explanation: string
- reference: string

Preserved DB fields
- When exporting from a database, items include extra fields (e.g., question_type) carried over from the DB. These are ignored by JSON mode and safe to keep.

Question type details and examples

1) MCQ – single correct
- type = "single"
- answer is a single string
```json
{
  "id": 2,
  "topic": "History",
  "subtopic": "Indian Independence",
  "type": "single",
  "question": "Who was the first President of India?",
  "options": ["Jawaharlal Nehru", "Dr. Rajendra Prasad", "S. Radhakrishnan", "Mahatma Gandhi"],
  "answer": "Dr. Rajendra Prasad",
  "explanation": "Dr. Rajendra Prasad served from 1950 to 1962.",
  "reference": "Indian Polity"
}
```

2) MCQ – multiple correct
- type = "multiple"
- answer is an array of strings (2 or more)
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

3) Assertion–Reason
- type = "assertion"
- options should contain the 4 standard patterns
- answer is a single string equal to one of the options
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
  "explanation": "The Earth revolves around the Sun; the stated reason is false.",
  "reference": "NCERT Science"
}
```

4) Match-the-Following
- type = "match"
- provide matchPairs; answer can be omitted OR set equal to matchPairs
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
  "explanation": "Standard scientist-to-discovery pairs.",
  "reference": "Science Encyclopedia"
}
```

5) True/False
- Represent as type = "single" with options ["True","False"] and a string answer
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

Import rules and validation
- Root may be an object with questions or a bare array of questions.
- For match questions, the app reads correct pairs from matchPairs or from answer if it’s an object.
- Extra fields are ignored safely.
- Keep JSON valid UTF-8, no trailing commas.

Export details
- Produced when clicking “Export to JSON” on the Options page (available when the page is opened with ?json in the URL).
- meta.mode is one of: "random", "balanced", or "sequential" (first N).
- meta.count is the number of questions actually exported.

Tips
- Use unique ids when possible (helps round-tripping between DB and JSON).
- Prefer matchPairs for match questions; answer-as-object is still accepted.
- Provide explanation/reference when available; the UI displays them in learning mode.

