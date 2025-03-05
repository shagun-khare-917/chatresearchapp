function analyzeChat() {
    const chatInput = document.getElementById("chatInput").value;
    const resultsDiv = document.getElementById("results");

    if (!chatInput.trim()) {
        alert("Please paste chat history before analyzing.");
        return;
    }

    const chatLines = chatInput.split("\n");
    const messagePattern = /^\[(.*?)\] (.*?): (.*)$/;
    let messages = [];
    let previousTime = null;

    chatLines.forEach(line => {
        const match = messagePattern.exec(line);
        if (match) {
            let timestampStr = match[1].replace("\u202f", " ").trim();
            let sender = match[2];
            let message = match[3];

            let timestamp = new Date(timestampStr);
            if (isNaN(timestamp)) return;

            let timeElapsed = "N/A";
            if (previousTime) {
                let elapsedMinutes = Math.round((timestamp - previousTime) / (1000 * 60));
                timeElapsed = elapsedMinutes > 60 ? `${Math.floor(elapsedMinutes / 60)} hrs ${elapsedMinutes % 60} mins` : `${elapsedMinutes} mins`;
            }
            previousTime = timestamp;

            messages.push({ sender, message, timestamp, timeElapsed });
        }
    });

    displayStatistics(messages);
}

function displayStatistics(messages) {
    const resultsDiv = document.getElementById("results");
    
    if (messages.length === 0) {
        resultsDiv.innerHTML = "<p>No valid messages found.</p>";
        return;
    }

    const totalMessages = messages.length;
    const averageMessageLength = messages.reduce((sum, msg) => sum + msg.message.length, 0) / totalMessages;
    const avgTimeBetween = messages
        .filter(msg => msg.timeElapsed !== "N/A")
        .map(msg => parseFloat(msg.timeElapsed))
        .reduce((sum, val, _, arr) => sum + val / arr.length, 0);

    resultsDiv.innerHTML = `
        <h2>Chat Analysis Results</h2>
        <p><strong>Total Messages:</strong> ${totalMessages}</p>
        <p><strong>Average Message Length:</strong> ${averageMessageLength.toFixed(2)} characters</p>
        <p><strong>Average Time Between Messages:</strong> ${avgTimeBetween.toFixed(2)} minutes</p>
    `;
}