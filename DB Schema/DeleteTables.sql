PRAGMA foreign_keys = OFF;

DELETE FROM match_pairs;
DELETE FROM options;
DELETE FROM questions;

VACUUM; -- optional: shrink DB after clearing

PRAGMA foreign_keys = ON;
