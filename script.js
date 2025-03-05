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
                let elapsedMinutes = (timestamp - previousTime) / (1000 * 60);
                timeElapsed = elapsedMinutes > 60 ? `${Math.floor(elapsedMinutes / 60)} hrs ${Math.round(elapsedMinutes % 60)} mins` : `${elapsedMinutes.toFixed(2)} mins`;
            }
            previousTime = timestamp;

            // Anonymize sender
            if (!(sender in senderMap)) {
                senderMap[sender] = `Sender ${senderCounter}`;
                senderCounter++;
            }
            let anonSender = senderMap[sender];

            if (!senderStats[anonSender]) {
                senderStats[anonSender] = { count: 0, totalLength: 0, messageTimes: [] };
            }
            senderStats[anonSender].count += 1;
            senderStats[anonSender].totalLength += message.length;
            senderStats[anonSender].messageTimes.push(timestamp);

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
        let messageIntervals = senderStats[anonSender].messageTimes.map((t, i, arr) => i > 0 ? (t - arr[i - 1]) / (1000 * 60) : 0).slice(1);
        let meanInterval = messageIntervals.length > 0 ? messageIntervals.reduce((a, b) => a + b, 0) / messageIntervals.length : 0;
        let stdDev = messageIntervals.length > 1 ? Math.sqrt(messageIntervals.map(x => Math.pow(x - meanInterval, 2)).reduce((a, b) => a + b, 0) / messageIntervals.length) : 0;
        
        senderStatsHTML += `<p><strong>${anonSender}</strong>: ${senderStats[anonSender].count} messages, Avg Length: ${avgLength.toFixed(2)} characters</p>`;
        senderStatsHTML += `<p>Mean Time Between Messages: ${meanInterval.toFixed(2)} mins, Std Dev: ${stdDev.toFixed(2)} mins</p>`;
    });

    const analysisText = `Total Messages: ${totalMessages}\nAverage Message Length: ${averageMessageLength.toFixed(2)} characters\nAverage Time Between Messages: ${avgTimeBetween.toFixed(2)} minutes\n\n${senderStatsHTML.replace(/<[^>]+>/g, '')}`;
    document.getElementById("downloadAnalysis").setAttribute("data-content", analysisText);

    resultsDiv.innerHTML = `
        <h2>Chat Analysis Results</h2>
        <p><strong>Total Messages:</strong> ${totalMessages}</p>
        <p><strong>Average Message Length:</strong> ${averageMessageLength.toFixed(2)} characters</p>
        <p><strong>Average Time Between Messages:</strong> ${avgTimeBetween.toFixed(2)} minutes</p>
        ${senderStatsHTML}
    `;
}

function downloadAnalysis() {
    const data = document.getElementById("downloadAnalysis").getAttribute("data-content");
    const blob = new Blob([data], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat_analysis.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
