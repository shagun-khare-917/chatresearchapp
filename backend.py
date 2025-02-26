from flask import Flask, request, jsonify
import os
import re
from datetime import datetime

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    chat_data = process_chat(filepath)
    return jsonify(chat_data)

def process_chat(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        chat_lines = f.readlines()

    messages = []
    sender1, sender2 = None, None
    timestamps = []
    
    message_pattern = re.compile(r'^\[(.*?)\] (.*?): (.*)$')

    for line in chat_lines:
        match = message_pattern.match(line.strip())
        if match:
            timestamp_str, sender, message = match.groups()
            timestamp = datetime.strptime(timestamp_str, "%m/%d/%y, %I:%M:%S %p")
            timestamps.append(timestamp)

            if sender1 is None:
                sender1 = sender
            elif sender2 is None and sender != sender1:
                sender2 = sender

            anon_sender = 'Sender 1' if sender == sender1 else 'Sender 2'
            messages.append({'sender': anon_sender, 'message': message.strip(), 'timestamp': timestamp})

    stats = analyze_messages(messages, timestamps)
    return stats

def analyze_messages(messages, timestamps):
    total_messages = len(messages)
    sender1_msgs = [msg for msg in messages if msg['sender'] == 'Sender 1']
    sender2_msgs = [msg for msg in messages if msg['sender'] == 'Sender 2']

    avg_msg_length = sum(len(msg['message']) for msg in messages) / total_messages if total_messages else 0
    
    # Calculate time differences
    if len(timestamps) > 1:
        time_diffs = [(timestamps[i] - timestamps[i - 1]).seconds / 60 for i in range(1, len(timestamps))]
        avg_time_between = sum(time_diffs) / len(time_diffs)
    else:
        avg_time_between = 0

    stats = {
        'total_messages': total_messages,
        'average_message_length': avg_msg_length,
        'sender_1_count': len(sender1_msgs),
        'sender_2_count': len(sender2_msgs),
        'average_time_between_messages': round(avg_time_between, 2)
    }
    return stats

if __name__ == '__main__':
    app.run(debug=True)