#!/usr/bin/env python3
import sqlite3

# Connect to Testing.db
db_path = r"d:\Projects\MockTest\DB Files\Testing.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the first question with all its data
print("=== FIRST QUESTION DATA ===")
cursor.execute("SELECT * FROM questions WHERE id = 1;")
question = cursor.fetchone()
columns = [description[0] for description in cursor.description]
q_dict = dict(zip(columns, question))
print("Question data:", q_dict)

print("\n=== OPTIONS FOR QUESTION 1 ===")
cursor.execute("SELECT option_text, is_correct FROM options WHERE question_id = 1 ORDER BY id;")
options = cursor.fetchall()
print("Options:", options)

print("\n=== MATCH PAIRS FOR QUESTION 1 ===")
cursor.execute("SELECT left_text, right_text FROM match_pairs WHERE question_id = 1;")
matches = cursor.fetchall()
print("Match pairs:", matches)

conn.close()