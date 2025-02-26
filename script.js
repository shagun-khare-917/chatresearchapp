function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const resultsDiv = document.getElementById('results');

    if (fileInput.files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    resultsDiv.innerHTML = "<p>Uploading and analyzing chat...</p>";

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        resultsDiv.innerHTML = `
            <h2>Chat Analysis Results</h2>
            <p><strong>Total Messages:</strong> ${data.total_messages}</p>
            <p><strong>Average Message Length:</strong> ${data.average_message_length.toFixed(2)} characters</p>
            <p><strong>Sender 1 Messages:</strong> ${data.sender_1_count}</p>
            <p><strong>Sender 2 Messages:</strong> ${data.sender_2_count}</p>
            <p><strong>Average Time Between Messages:</strong> ${data.average_time_between_messages} minutes</p>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        resultsDiv.innerHTML = "<p>Error processing chat. Please try again.</p>";
    });
}