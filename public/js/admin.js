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

// Chart canvas
const allDataUser = document.getElementById("all-by-user");
const allDataUserRange = document.getElementById("all-by-user-range");
const allDataUserRangeValue = document.getElementById("all-by-user-range-value");
let allDataChart = null; // Keep reference to chart instance

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
    const userBuckets = new Map(); // Map<email, Map<bucketKey, visitCount>>

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

        // Initialize user data if not exists
        if (!userBuckets.has(log.email)) {
            userBuckets.set(log.email, new Map());
        }

        const userMap = userBuckets.get(log.email);
        if (!userMap.has(bucketKey)) {
            userMap.set(bucketKey, 0);
        }

        // Increment visit count for this user's bucket
        userMap.set(bucketKey, userMap.get(bucketKey) + 1);
    });

    // Sort bucket keys and generate chart labels
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

    // Create datasets for each user with consistent colors
    const datasets = [];
    userBuckets.forEach((userMap, email) => {
        const data = allBucketKeys.map(bucketKey => userMap.get(bucketKey) || 0); // Fill missing buckets with 0

        datasets.push({
            label: email,
            data: data,
            borderColor: getColorFromEmail(email), // Consistent color based on email
            tension: 0.1,
            fill: false
        });
    });

    // Chart configuration
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

    // Destroy previous chart instance if exists
    if (allDataChart) {
        allDataChart.destroy();
    }

    // Create new chart
    allDataChart = new Chart(allDataUser, config);
}

// Function to generate a consistent color from email
function getColorFromEmail(email) {
    // Simple hash function to create a pseudo-random color
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = (hash >> 0) & 0xFF;
    const g = (hash >> 8) & 0xFF;
    const b = (hash >> 16) & 0xFF;

    return `rgb(${r % 200}, ${g % 200}, ${b % 200})`; // Limit to avoid too bright colors
}

document.addEventListener("DOMContentLoaded", function () {
    //=========================
    // Users Visit Statistics
    //=========================
    drawAllDataDailyUserChart()
});

//================================================================
// Table
const domainsTable = document.getElementById("logs-table");
// Filters
const domainSearchInput = document.getElementById("domainSearchInput");
const emailFilter = document.getElementById("emailFilter");
const serverFilter = document.getElementById("serverFilter");
// Sort buttons
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

document.addEventListener("DOMContentLoaded", function () {
    // Define the email filter dropdown values
    const emailSet = new Set([]);
    allVisitLogData.forEach(log => {
        emailSet.add(log.email);
    });
    emailSet.forEach(email => {
        const option = document.createElement("option");
        option.value = email;
        option.textContent = email;
        emailFilter.appendChild(option);
    });

    //=========================
    // Logs Table
    //=========================
    // Listen to filters
    [domainSearchInput, emailFilter, serverFilter].forEach(filter => {
        filter.addEventListener("change", () => {
            renderLogsTable(allVisitLogData, domainsTable);
        });
        filter.addEventListener("input", () => {
            renderLogsTable(allVisitLogData, domainsTable);
        });
    });
    // Listen to sort buttons
    // Function to toggle and update the sort order and icons
    function toggleSortOrder(clickedKey) {
        // Toggle order if the same key is clicked; otherwise reset to ascending
        if (sortKey === clickedKey) {
            sortOrder = sortOrder === "asc" ? "desc" : "asc";
        } else {
            sortKey = clickedKey;
            sortOrder = "asc"; // Reset to ascending order
        }

        // Update icons
        sortButtons.forEach(({button, key}) => {
            const icon = button.querySelector("i");
            if (key === sortKey) {
                icon.className = sortOrder === "asc" ? sortIcons.ascending : sortIcons.descending;
            } else {
                icon.className = sortIcons.neutral;
            }
        });

        // Trigger table re-render with new sort order
        renderLogsTable(allVisitLogData, domainsTable);
    }

    // Attach click listeners to sort buttons
    sortButtons.forEach(({button, key}) => {
        button.addEventListener("click", () => toggleSortOrder(key));
    });

    function renderLogsTable(data, table) {
        // Clear the table
        table.querySelector("tbody").innerHTML = "";
        let [key, order] = [sortKey, sortOrder];

        // Sort the data
        data.sort((a, b) => {
            if (order === "asc") {
                return a[key] > b[key] ? 1 : -1;
            } else {
                return a[key] < b[key] ? 1 : -1;
            }
        });

        // Render the table
        data.forEach(log => {
            // Filter by email
            if (emailFilter.value !== "all" && log.email !== emailFilter.value) {
                return;
            }
            // Filter by server
            if (serverFilter.value !== "all" && log.server !== serverFilter.value) {
                return;
            }
            // Filter by domain
            if (domainSearchInput.value !== "" && !log.domain.includes(domainSearchInput.value)) {
                return;
            }

            const row = document.createElement("tr");
            // use utc time in UTC [DD MMM YYYY HH:MM:SS] format
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

    // Initial table render
    renderLogsTable(allVisitLogData, domainsTable);
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