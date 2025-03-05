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
    let senderStats = {};
    let senderMap = {};
    let senderCounter = 1;

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

            // Anonymize sender
            if (!(sender in senderMap)) {
                senderMap[sender] = `Sender ${senderCounter}`;
                senderCounter++;
            }
            let anonSender = senderMap[sender];

            if (!senderStats[anonSender]) {
                senderStats[anonSender] = { count: 0, totalLength: 0 };
            }
            senderStats[anonSender].count += 1;
            senderStats[anonSender].totalLength += message.length;

            messages.push({ sender: anonSender, message, timestamp, timeElapsed });
        }
    });

    displayStatistics(messages, senderStats);
}

function displayStatistics(messages, senderStats) {
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

    let senderStatsHTML = "<h3>Sender Statistics</h3>";
    Object.keys(senderStats).forEach(anonSender => {
        let avgLength = senderStats[anonSender].totalLength / senderStats[anonSender].count;
        senderStatsHTML += `<p><strong>${anonSender}</strong>: ${senderStats[anonSender].count} messages, Avg Length: ${avgLength.toFixed(2)} characters</p>`;
    });

    resultsDiv.innerHTML = `
        <h2>Chat Analysis Results</h2>
        <p><strong>Total Messages:</strong> ${totalMessages}</p>
        <p><strong>Average Message Length:</strong> ${averageMessageLength.toFixed(2)} characters</p>
        <p><strong>Average Time Between Messages:</strong> ${avgTimeBetween.toFixed(2)} minutes</p>
        ${senderStatsHTML}
    `;
}
