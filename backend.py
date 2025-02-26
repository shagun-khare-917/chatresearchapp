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

    try:
        chat_data = process_chat(filepath)
        return jsonify(chat_data)
    except Exception as e:
        return jsonify({'error': f'Failed to process chat: {str(e)}'}), 500

def process_chat(filepath):
    chat_data = []
    previous_time = None

    with open(filepath, 'r', encoding='utf-8') as file:
        for line in file:
            # Regex to parse lines in the format: [timestamp] sender: message
            match = re.match(r'\[(.*?)\] (.*?): (.*)', line)
            if match:
                timestamp = match.group(1)
                message = match.group(3)
                
                # Clean and parse the timestamp
                timestamp = timestamp.replace("\u202f", " ").strip()
                try:
                    time_obj = datetime.strptime(timestamp, "%m/%d/%y, %I:%M:%S %p")
                except ValueError as e:
                    print(f"Error parsing timestamp: {timestamp}. Error: {e}")
                    continue

                # Calculate time elapsed
                time_elapsed = None
                if previous_time:
                    elapsed = time_obj - previous_time
                    total_minutes = round(elapsed.total_seconds() / 60, 2)
                    if total_minutes >= 60:
                        hours = int(total_minutes // 60)
                        minutes = int(total_minutes % 60)
                        time_elapsed = f"{hours} hrs {minutes} mins"
                    else:
                        time_elapsed = f"{total_minutes} mins"
                previous_time = time_obj

                # Calculate message length
                message_length = len(message)

                # Append anonymized data
                chat_data.append({
                    'time': time_obj.strftime("%H:%M:%S"),
                    'time_elapsed': time_elapsed if time_elapsed else "N/A",
                    'message_length': message_length
                })

    return analyze_messages(chat_data)

def analyze_messages(messages):
    total_messages = len(messages)
    avg_msg_length = sum(msg['message_length'] for msg in messages) / total_messages if total_messages else 0
    
    # Calculate average time between messages
    time_diffs = [msg['time_elapsed'] for msg in messages if msg['time_elapsed'] != "N/A"]
    avg_time_between = sum([float(t.split()[0]) for t in time_diffs if "mins" in t]) / len(time_diffs) if time_diffs else 0

    stats = {
        'total_messages': total_messages,
        'average_message_length': round(avg_msg_length, 2),
        'average_time_between_messages': round(avg_time_between, 2)
    }
    return stats

if __name__ == '__main__':
    app.run(debug=True)
