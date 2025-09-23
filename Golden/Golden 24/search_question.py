#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('DB Files/EdLEAP-Leadership Questions.db')
cursor = conn.cursor()

# Search for the question about professional learning communities
cursor.execute('SELECT id, question_text FROM questions WHERE question_text LIKE "%professional learning communities%" OR question_text LIKE "%strengthens professional%"')
questions = cursor.fetchall()

for qid, qtext in questions:
    print(f'ID {qid}: {qtext}')
    cursor.execute('SELECT option_text, is_correct FROM options WHERE question_id = ? ORDER BY id', (qid,))
    options = cursor.fetchall()
    for i, (opt_text, is_correct) in enumerate(options):
        marker = '✓' if is_correct else ' '
        print(f'  {marker} {opt_text}')
    print()

conn.close()