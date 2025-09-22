--
-- File generated with SQLiteStudio v3.4.17 on Tue Sep 16 21:56:09 2025
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: match_pairs
DROP TABLE IF EXISTS match_pairs;
CREATE TABLE IF NOT EXISTS match_pairs (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL,
    left_text TEXT NOT NULL,
    right_text TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Table: options
DROP TABLE IF EXISTS options;
CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Table: questions
DROP TABLE IF EXISTS questions;
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, question_text TEXT NOT NULL, question_type TEXT NOT NULL, explanation TEXT, reference TEXT, topic TEXT NOT NULL, subtopic TEXT NOT NULL);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
