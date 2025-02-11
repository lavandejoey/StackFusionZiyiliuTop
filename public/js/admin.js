// /js/admin.js
// data structure example:[{
//    email: "wuyuwuyu2020@outlook.com",
//    ip: "77.204.104.84",
//    location: "Paris, FR",
//    time: 1737752079000,
//    label: "freedom",
//    protocol: "tcp",
//    domain: "www.gstatic.com",
//    server: "DE"
//  },
// ......]

// Global variable for storing log data progressively
let allVisitLogData = [];

// Chart canvas and related elements for user stats chart
const allDataUser = document.getElementById("all-by-user");
const allDataUserRange = document.getElementById("all-by-user-range");
const allDataUserRangeValue = document.getElementById("all-by-user-range-value");
let allDataChart = null; // Reference to the chart instance

// Initialize range display
allDataUserRangeValue.textContent = `${allDataUserRange.value} D`;

// Range input handler
allDataUserRange.addEventListener("input", async () => {
    allDataUserRangeValue.textContent = `${allDataUserRange.value} D`;
    await drawAllDataDailyUserChart();
});

// Time aggregation function
function determineTimeScale(range) {
    if (range <= 2) return 'hours';
    if (range <= 180) return 'days';
    // if (range <= 270) return 'weeks';
    return 'months';
}

// Main chart drawing function
async function drawAllDataDailyUserChart() {
    const range = parseInt(allDataUserRange.value);
    const timeScale = determineTimeScale(range);

    // Filter data for selected time range (86400000 ms = 24 hours)
    const cutoffTime = Date.now() - range * 86400000;
    const filteredData = allVisitLogData.filter(log => log.time >= cutoffTime);

    // Create time buckets for each user
    // Map<email, Map<bucketKey, visitCount>>
    const userBuckets = new Map();

    filteredData.forEach(log => {
        const date = new Date(log.time);
        let bucketKey;

        // Determine bucket key based on time scale
        switch (timeScale) {
            case 'hours':
                bucketKey = new Date(date).setMinutes(0, 0, 0);
                break;
            case 'days':
                bucketKey = new Date(date).setHours(0, 0, 0, 0);
                break;
            case 'weeks':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                bucketKey = weekStart.setHours(0, 0, 0, 0);
                break;
            case 'months':
                bucketKey = new Date(date.getFullYear(), date.getMonth()).getTime();
                break;
        }
        if (!userBuckets.has(log.email)) {
            userBuckets.set(log.email, new Map());
        }
        const userMap = userBuckets.get(log.email);
        if (!userMap.has(bucketKey)) {
            userMap.set(bucketKey, 0);
        }
        userMap.set(bucketKey, userMap.get(bucketKey) + 1);
    });
    const allBucketKeys = [...new Set([...userBuckets.values()].flatMap(userMap => Array.from(userMap.keys())))].sort((a, b) => a - b);
    const labels = allBucketKeys.map(timestamp => {
        const date = new Date(parseInt(timestamp));
        switch (timeScale) {
            case 'hours':
                return date.toLocaleTimeString([], {hour: '2-digit'});
            case 'days':
                return date.toLocaleDateString([], {weekday: 'short', day: 'numeric'});
            case 'weeks':
                return `Week ${Math.ceil(date.getDate() / 7)}`;
            case 'months':
                return date.toLocaleDateString([], {month: 'short'});
        }
    });
    const datasets = [];
    userBuckets.forEach((userMap, email) => {
        const data = allBucketKeys.map(bucketKey => userMap.get(bucketKey) || 0);
        datasets.push({
            label: email,
            data: data,
            borderColor: getColorFromEmail(email),
            tension: 0.1,
            fill: false
        });
    });
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction: {mode: 'index'},
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                }
            }
        }
    };
    if (allDataChart) {
        allDataChart.destroy();
    }
    allDataChart = new Chart(allDataUser, config);
}

// Function to generate a consistent color from email
function getColorFromEmail(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = (hash >> 0) & 0xFF;
    const g = (hash >> 8) & 0xFF;
    const b = (hash >> 16) & 0xFF;
    return `rgb(${r % 200}, ${g % 200}, ${b % 200})`;
}

// Table and filter elements for logs
const domainsTable = document.getElementById("logs-table");
const domainSearchInput = document.getElementById("domainSearchInput");
const emailFilter = document.getElementById("emailFilter");
const serverFilter = document.getElementById("serverFilter");

const sortIcons = {
    neutral: "bi bi-arrow-down-up",
    ascending: "bi bi-arrow-up",
    descending: "bi bi-arrow-down"
};

const sortKeys = {
    time: "time",
    email: "email",
    domain: "domain"
};

let sortKey = sortKeys.time;
let sortOrder = "desc";
const sortButtons = [
    {button: document.getElementById("sortTimeBtn"), key: sortKeys.time},
    {button: document.getElementById("sortEmailBtn"), key: sortKeys.email},
    {button: document.getElementById("sortDomainBtn"), key: sortKeys.domain}
];

// Function to render the logs table
function renderLogsTable(data, table) {
    table.querySelector("tbody").innerHTML = "";
    let [key, order] = [sortKey, sortOrder];
    data.sort((a, b) => {
        if (order === "asc") {
            return a[key] > b[key] ? 1 : -1;
        } else {
            return a[key] < b[key] ? 1 : -1;
        }
    });
    data.forEach(log => {
        if (emailFilter.value !== "all" && log.email !== emailFilter.value) return;
        if (serverFilter.value !== "all" && log.server !== serverFilter.value) return;
        if (domainSearchInput.value !== "" && !log.domain.includes(domainSearchInput.value)) return;
        const row = document.createElement("tr");
        row.innerHTML = `
      <td class="text-nowrap text-truncate">${new Date(log.time).toUTCString().slice(5, 22)}</td>
      <td class="text-nowrap text-truncate">${log.email}</td>
      <td class="text-nowrap text-truncate">${log.ip}</td>
      <td class="text-nowrap text-truncate">${log.location}</td>
      <td class="text-nowrap text-truncate">${log.domain}</td>
      <td class="text-nowrap text-truncate">${log.server}</td>
    `;
        table.querySelector("tbody").appendChild(row);
    });
}

// Attach listeners to filters and sort buttons once DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    // Populate the email filter dropdown
    const emailSet = new Set();
    allVisitLogData.forEach(log => {
        emailSet.add(log.email);
    });
    emailSet.forEach(email => {
        const option = document.createElement("option");
        option.value = email;
        option.textContent = email;
        emailFilter.appendChild(option);
    });

    [domainSearchInput, emailFilter, serverFilter].forEach(filter => {
        filter.addEventListener("change", () => {
            renderLogsTable(allVisitLogData, domainsTable);
        });
        filter.addEventListener("input", () => {
            renderLogsTable(allVisitLogData, domainsTable);
        });
    });

    function toggleSortOrder(clickedKey) {
        if (sortKey === clickedKey) {
            sortOrder = sortOrder === "asc" ? "desc" : "asc";
        } else {
            sortKey = clickedKey;
            sortOrder = "asc";
        }
        sortButtons.forEach(({button, key}) => {
            const icon = button.querySelector("i");
            if (key === sortKey) {
                icon.className = sortOrder === "asc" ? sortIcons.ascending : sortIcons.descending;
            } else {
                icon.className = sortIcons.neutral;
            }
        });
        renderLogsTable(allVisitLogData, domainsTable);
    }

    sortButtons.forEach(({button, key}) => {
        button.addEventListener("click", () => toggleSortOrder(key));
    });

    // Initial render of table and chart
    renderLogsTable(allVisitLogData, domainsTable);
    drawAllDataDailyUserChart();

    // Set up Server-Sent Events to receive log data progressively.
    const eventSource = new EventSource("/admin/logs-stream");
    eventSource.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            if (data.error) {
                console.error("Error processing file " + data.file + ": " + data.error);
            } else {
                // Append new logs and update UI
                allVisitLogData = allVisitLogData.concat(data.logs);
                renderLogsTable(allVisitLogData, domainsTable);
                drawAllDataDailyUserChart();
            }
        } catch (err) {
            console.error("Error parsing SSE data: ", err);
        }
    };
    eventSource.addEventListener("end", function (event) {
        console.log("Log streaming completed.");
        eventSource.close();
    });
    eventSource.onerror = function (err) {
        console.error("EventSource failed:", err);
        eventSource.close();
    };
});

// Define the tab switcher
// document.querySelectorAll("[data-bs-toggle="tab"]").forEach(button => {
//     button.addEventListener("click", function (event) {
//         const target = this.getAttribute("data-bs-target");
//         const tabPane = document.querySelector(target);
//         if (tabPane) {
//             // Hide all tab panes
//             document.querySelectorAll(".tab-pane").forEach(pane => {
//                 pane.classList.remove("show", "active");
//             });
//             // Show the target tab pane
//             tabPane.classList.add("show", "active");
//         }
//     });
// });