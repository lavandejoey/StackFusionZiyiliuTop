// /js/admin.js
// Global variable for storing log data progressively
let allVisitLogData = [];

// Global variable for tracking which emails are hidden (filtered out)
// When an email is in this set, its data is hidden from both chart and table.
let hiddenEmails = new Set();

// Chart canvas element
const allDataUser = document.getElementById("logs-plot");
let allDataChart = null; // Reference to the chart instance

// Filter inputs: domain, server, and time period (start and end dates)
// NOTE: The email filter has been removed because we will use the chart legend for that.
const domainSearchInput = document.getElementById("domainSearchInput");
const serverFilter = document.getElementById("serverFilter");
const startDateInput = document.getElementById("startDateFilter");
const endDateInput = document.getElementById("endDateFilter");

// Sorting configuration for the logs table
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

// Determine time scale based on range (in days)
function determineTimeScale(rangeDays) {
    if (rangeDays <= 2) return 'hours';
    if (rangeDays <= 180) return 'days';
    return 'months';
}

// Function to generate a consistent color from an email
function getColorFromEmail(email, alpha = 0.8) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = (hash >> 0) & 0xFF;
    const g = (hash >> 8) & 0xFF;
    const b = (hash >> 16) & 0xFF;
    return `rgba(${r % 200}, ${g % 200}, ${b % 200}, ${alpha})`;
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedUpdate = debounce(() => {
    renderLogsTable(allVisitLogData, document.getElementById("logs-table"));
    drawAllDataDailyUserChart();
}, 500);

// Main chart drawing function
function drawAllDataDailyUserChart() {
    const startDateStr = startDateInput.value;
    const endDateStr = endDateInput.value;
    const startTimestamp = new Date(startDateStr).getTime();
    // Include the entire end date by adding nearly 24 hours (minus 1 ms)
    const endTimestamp = new Date(endDateStr).getTime() + 86399999;
    const rangeDays = (endTimestamp - startTimestamp) / 86400000;
    const timeScale = determineTimeScale(rangeDays);

    // Filter logs based on selected time period
    const filteredData = allVisitLogData.filter(log => log.time >= startTimestamp && log.time <= endTimestamp);

    // Create time buckets for each user
    const userBuckets = new Map();
    filteredData.forEach(log => {
        const date = new Date(log.time);
        let bucketKey;
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

    // Generate sorted bucket keys and chart labels
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

    // Create datasets for each user.
    // Only include the data, but mark datasets hidden if their email is toggled off.
    const datasets = [];
    userBuckets.forEach((userMap, email) => {
        const data = allBucketKeys.map(bucketKey => userMap.get(bucketKey) || 0);
        datasets.push({
            label: email,
            data: data,
            borderColor: getColorFromEmail(email),
            tension: 0.1,
            fill: false,
            hidden: hiddenEmails.has(email)  // set dataset hidden if this email is toggled off
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
            plugins: {
                legend: {
                    // When clicking on a legend item, toggle that email's filter.
                    onClick: function (e, legendItem, legend) {
                        const chart = legend.chart;
                        const email = chart.data.datasets[legendItem.datasetIndex].label;
                        // Toggle the email in the hiddenEmails set
                        if (hiddenEmails.has(email)) {
                            hiddenEmails.delete(email);
                        } else {
                            hiddenEmails.add(email);
                        }
                        debouncedUpdate();
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left'
                },
            }
        }
    };

    // If a chart already exists, destroy it before drawing a new one.
    if (allDataChart) {
        allDataChart.data.labels = labels;
        allDataChart.data.datasets = datasets;
        allDataChart.update();
    } else {
        allDataChart = new Chart(allDataUser, config);
    }
}

// Function to render the logs table
function renderLogsTable(data, table) {
    const tbody = table.querySelector("tbody");
    const startTimestamp = new Date(startDateInput.value).getTime();
    const endTimestamp = new Date(endDateInput.value).getTime() + 86399999;
    let filteredData = data.filter(log => {
        if (log.time < startTimestamp || log.time > endTimestamp) return false;
        if (serverFilter.value !== "all" && log.server !== serverFilter.value) return false;
        if (domainSearchInput.value !== "" && !log.domain.includes(domainSearchInput.value)) return false;
        if (hiddenEmails.has(log.email)) return false;
        return true;
    });

    // Sort the filtered data
    filteredData.sort((a, b) => {
        if (sortOrder === "asc") {
            return a[sortKey] > b[sortKey] ? 1 : -1;
        } else {
            return a[sortKey] < b[sortKey] ? 1 : -1;
        }
    });

    // Build the rows as a single HTML string
    let rowsHTML = "";
    filteredData.forEach(log => {
        rowsHTML += `
          <tr>
            <td class="text-nowrap text-truncate-20 text-center">${new Date(log.time).toUTCString().slice(5, 22)}</td>
            <td class="text-nowrap text-truncate-20 text-center">
              <span class="badge" style="background-color: ${getColorFromEmail(log.email, 0.8)}">${log.email}</span>
            </td>
            <td class="text-nowrap text-truncate-16 text-center">${log.ip}</td>
            <td class="text-nowrap text-truncate text-center">${log.location}</td>
            <td class="text-nowrap text-truncate-30 user-select-all">${log.domain}</td>
            <td class="text-nowrap text-truncate-6 text-center">${log.server}</td>
          </tr>
        `;
    });
    tbody.innerHTML = rowsHTML;
}

// Attach event listeners and initialize after DOM loads
document.addEventListener("DOMContentLoaded", function () {
    // Attach listeners to filter inputs (except for the removed email filter)
    [domainSearchInput, serverFilter, startDateInput, endDateInput].forEach(filter => {
        filter.addEventListener("change", debouncedUpdate);
        filter.addEventListener("input", debouncedUpdate);
    });

    // Sorting button listeners
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
        renderLogsTable(allVisitLogData, document.getElementById("logs-table"));
    }

    sortButtons.forEach(({button, key}) => {
        button.addEventListener("click", () => toggleSortOrder(key));
    });

    // Initial render of table and chart
    debouncedUpdate();

    // Set up Server-Sent Events to receive log data progressively
    const eventSource = new EventSource("/admin/logs-stream");
    eventSource.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            if (data.error) {
                console.error("Error processing file " + data.file + ": " + data.error);
            } else {
                allVisitLogData = allVisitLogData.concat(data.logs);
                debouncedUpdate();
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

    // Floating Back-to-Top button functionality
    const backToTopBtn = document.getElementById("backToTopBtn");
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
    window.addEventListener("scroll", () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    });
});
