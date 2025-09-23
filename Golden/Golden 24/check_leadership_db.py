#!/usr/bin/env python3
import sqlite3
import os

# Connect to EdLEAP-Leadership Questions.db
db_path = r"d:\Projects\MockTest\DB Files\EdLEAP-Leadership Questions.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get schema
    print("=== DATABASE SCHEMA ===")
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(table[0])
        print()
    
    # Get question types
    print("=== QUESTION TYPES ===")
    cursor.execute("SELECT DISTINCT question_type FROM questions;")
    types = cursor.fetchall()
    for qtype in types:
        print(f"- {qtype[0]}")
    
    # Get question count by type
    print("\n=== QUESTION COUNT BY TYPE ===")
    cursor.execute("SELECT question_type, COUNT(*) FROM questions GROUP BY question_type;")
    counts = cursor.fetchall()
    for qtype, count in counts:
        print(f"{qtype}: {count} questions")
    
    # Get topics
    print("\n=== TOPICS ===")
    cursor.execute("SELECT DISTINCT topic FROM questions;")
    topics = cursor.fetchall()
    for topic in topics:
        print(f"- {topic[0]}")
    
    # Check if subtopic column exists
    print("\n=== SUBTOPICS ===")
    try:
        cursor.execute("SELECT DISTINCT subtopic FROM questions;")
        subtopics = cursor.fetchall()
        for subtopic in subtopics:
            print(f"- {subtopic[0]}")
    except sqlite3.OperationalError:
        print("No subtopic column found")
    
    # Sample questions with their data
    print("\n=== SAMPLE QUESTIONS ===")
    cursor.execute("SELECT id, question_type, question_text FROM questions LIMIT 3;")
    samples = cursor.fetchall()
    for qid, qtype, qtext in samples:
        print(f"ID {qid} ({qtype}): {qtext[:100]}...")
        
        # Get options for this question
        cursor.execute("SELECT option_text, is_correct FROM options WHERE question_id = ? ORDER BY id;", (qid,))
        options = cursor.fetchall()
        if options:
            print(f"  Options: {len(options)} found")
            for opt_text, is_correct in options:
                marker = "✓" if is_correct else " "
                print(f"    {marker} {opt_text}")
        
        # Get match pairs if any
        cursor.execute("SELECT left_text, right_text FROM match_pairs WHERE question_id = ?;", (qid,))
        matches = cursor.fetchall()
        if matches:
            print(f"  Match pairs: {len(matches)} found")
            for left, right in matches:
                print(f"    {left} → {right}")
        print()
    
    conn.close()
else:
    print(f"Database not found at: {db_path}")