// API endpoint for fetching cryptocurrency market data from CoinGecko
const API_ENDPOINT = 'https://api.coingecko.com/api/v3/coins/markets';

// DOM element references (grabbing elements from HTML by their ID)
const cryptoContainer = document.getElementById('crypto-container');       // Container to render the list of coins
const selectedContainer = document.getElementById('selected-container');   // Container to render selected coins
const show24hCheckbox = document.getElementById('toggle-24h');             // Checkbox to toggle 24h change display
const sortDropdown = document.getElementById('sort-dropdown');             // Dropdown to select sorting order
const compareBtn = document.getElementById('compare-button');              // Button to trigger coin comparison

// Load selected coins from localStorage if available; fallback to empty array
// JSON.parse converts the stored JSON string back into an array
let selectedCoins = JSON.parse(localStorage.getItem('selectedCoins')) || [];

// Load user preferences (whether to show 24h change, and sorting order)
// If nothing is stored, use default preferences
let userPrefs = JSON.parse(localStorage.getItem('userPrefs')) || {
  show24h: false,
  sortOrder: 'market_cap_desc',  // Default sort: highest market cap first
};

// Apply saved user preferences to UI components
show24hCheckbox.checked = userPrefs.show24h;   // Set checkbox state based on saved preference
sortDropdown.value = userPrefs.sortOrder;      // Set dropdown to saved sorting preference

/**
 * Fetches cryptocurrency data from CoinGecko API and renders both the full list
 * and the list of selected coins for comparison.
 * Uses async/await for handling asynchronous API call.
 */
async function loadData() {
  // Fetch coin market data from API with query parameters:
  // vs_currency = usd, sort order from userPrefs, limit 50 coins, page 1
  const res = await fetch(`${API_ENDPOINT}?vs_currency=usd&order=${userPrefs.sortOrder}&per_page=50&page=1`);

  // Convert the response into JSON format (array of coin objects)
  const coins = await res.json();

  // Call functions to display the coins on the page
  renderCryptoList(coins);     // Display all coins
  renderSelected(coins);       // Display only selected coins
}

/**
 * Renders a list of all cryptocurrencies from the API into the main UI container.
 * @param {Array} coins - Array of coin objects returned from the API
 */
function renderCryptoList(coins) {
  cryptoContainer.innerHTML = '';  // Clear any previously displayed coins

  // Loop through each coin and render its details
  coins.forEach((coin, index) => {
    const div = document.createElement('div');              // Create a new <div> for the coin
    div.className = `crypto-card row-${index % 3}`;         // Add class with dynamic row style (optional styling based on row)

    // Use template literals to inject coin data into HTML
    div.innerHTML = `
      <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
      <p>Price: $${coin.current_price}</p>
      ${userPrefs.show24h ? `<p>24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%</p>` : ''}
      <p>Market Cap: $${coin.market_cap.toLocaleString()}</p>
    `;

    // Add click handler to allow toggling selection of the coin
    div.onclick = () => toggleCoin(coin.id);

    // Add the created coin card to the main container
    cryptoContainer.appendChild(div);
  });
}

/**
 * Toggles selection of a coin when clicked.
 * Adds coin to selection if not selected (max 5), or removes it if already selected.
 * @param {string} id - Unique identifier of the coin
 */
function toggleCoin(id) {
  if (selectedCoins.includes(id)) {
    // If coin is already selected, remove it using filter()
    selectedCoins = selectedCoins.filter(c => c !== id);
  } else if (selectedCoins.length < 5) {
    // If fewer than 5 coins are selected, add the new coin
    selectedCoins.push(id);
  } else {
    // If user tries to select more than 5 coins, show an alert
    alert('You can only compare up to 5 coins.');
  }

  // Save updated selections and preferences to localStorage
  updateLocal();

  // Refresh coin list and selected list
  loadData();
}

/**
 * Renders the section that shows the selected coins for comparison.
 * @param {Array} coins - The full array of coin data from the API
 */
function renderSelected(coins) {
  selectedContainer.innerHTML = ''; // Clear existing content

  // Filter the coin list to get only selected coins (by ID match)
  const selectedData = coins.filter(c => selectedCoins.includes(c.id));

  // Loop through selected coins and render them in the comparison section
  selectedData.forEach(coin => {
    const div = document.createElement('div');     // Create a new <div> for each selected coin
    div.className = 'selected-card';               // Apply a CSS class for styling

    // Create HTML with coin details and a "Remove" button
    div.innerHTML = `
      <strong>${coin.name}</strong>
      <p>Price: $${coin.current_price}</p>
      ${userPrefs.show24h ? `<p>24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%</p>` : ''}
      <button onclick="removeCoin('${coin.id}')">Remove</button>
    `;

    // Append to selected container
    selectedContainer.appendChild(div);
  });

  // Enable or disable the Compare button based on how many coins are selected
  compareBtn.disabled = selectedCoins.length !== 5;
}

/**
 * Removes a coin from the selected list.
 * Called when the user clicks the "Remove" button on a selected coin.
 * @param {string} id - The coin's unique identifier
 */
function removeCoin(id) {
  // Use filter() to remove the coin from selectedCoins
  selectedCoins = selectedCoins.filter(c => c !== id);

  // Update localStorage and re-render UI
  updateLocal();
  loadData();
}

/**
 * Updates localStorage with the current selectedCoins array and user preferences.
 * This allows the selection and settings to persist across page reloads.
 */
function updateLocal() {
  localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));  // Convert array to JSON string
  localStorage.setItem('userPrefs', JSON.stringify(userPrefs));          // Save preferences as string
}

// --- Event Listeners ---

// Event: Toggle 24h change visibility when checkbox is changed
show24hCheckbox.addEventListener('change', () => {
  userPrefs.show24h = show24hCheckbox.checked;  // Update preference
  updateLocal();                                // Save to localStorage
  loadData();                                   // Refresh UI
});

// Event: Change sorting order of the coin list when dropdown is changed
sortDropdown.addEventListener('change', () => {
  userPrefs.sortOrder = sortDropdown.value;     // Update sort order
  updateLocal();                                // Save to localStorage
  loadData();                                   // Refresh UI
});

// Event: Show alert with selected coin IDs when compare button is clicked
compareBtn.addEventListener('click', () => {
  alert(`Comparing: ${selectedCoins.join(', ')}`);  // Join array into comma-separated string
});

// --- Initial Load ---

// Call loadData() once when the page loads to fetch and display the data
loadData();

// Automatically refresh coin data every 60 seconds (60000ms) using setInterval()
setInterval(loadData, 60000);
