// Api key for the exchange rate API
const apiKey = "";

// List of invalid characters for the input field
const invalidChars = ["-", "e", "+", "E"];

// Initialize the exchange rate list by looking at local storage or creating an empty list
let exchangeRateList =
	JSON.parse(localStorage.getItem("exchangeRateList")) || [];
let currentExchangeRate;

const amountInput = document.getElementById("amountInput");
const amountOutput = document.getElementById("amountOutput");
const currencySelectInput = document.getElementById("deviseInput");
const currencySelectOutput = document.getElementById("deviseOutput");
const exchangeRateDisplay = document.getElementById("currencyRate");

/* On page load, if local storage does not contain the list of currencies,
fetch the list of supported currencies from the API and store it in local storage
*/
window.addEventListener("load", async () => {
	if ("currencies" in localStorage) {
		const currencies = JSON.parse(localStorage.getItem("currencies"));
		addCurrencyOptions(currencies);
	} else {
		try {
			const response = await fetch(
				`https://v6.exchangerate-api.com/v6/${apiKey}/codes`
			);
			const data = await response.json();
			const currencies = data.supported_codes;
			localStorage.setItem("currencies", JSON.stringify(currencies));
			addCurrencyOptions(currencies);
		} catch (error) {
			console.error("Error fetching currencies:", error);
		}
	}
});

// Function to add the list of currencies to the select inputs
function addCurrencyOptions(currencies) {
	currencies.forEach((currency) => {
		const optionInput = document.createElement("option");
		optionInput.value = currency;
		optionInput.textContent = currency;
		currencySelectInput.appendChild(optionInput);
		const optionOutput = document.createElement("option");
		optionOutput.value = currency;
		optionOutput.textContent = currency;
		currencySelectOutput.appendChild(optionOutput);
	});
}

// Event listener for the swap button to swap the input and output currencies
document.getElementById("swap_button").addEventListener("click", () => {
	const inputCurrency = currencySelectInput.value;
	const outputCurrency = currencySelectOutput.value;
	currencySelectInput.value = outputCurrency;
	currencySelectOutput.value = inputCurrency;
	if (inputCurrency && outputCurrency) {
		amountInput.value = parseFloat(amountOutput.value);
		if (currentExchangeRate !== undefined) {
			currentExchangeRate = 1 / currentExchangeRate;
		}
		handleAmountInput();
	}
});

// Function to display and hide the exchange rate between the two selected currencies
function displayExchangeRate(firstCurrency, secondCurrency, exchangeRate) {
	if (firstCurrency != "") {
		const displayedCurrency = 1 * exchangeRate;
		exchangeRateDisplay.innerHTML = `1 ${firstCurrency} = ${displayedCurrency.toFixed(
			3
		)} ${secondCurrency}`;
		exchangeRateDisplay.classList.add("show");
	} else {
		exchangeRateDisplay.innerHTML = "";
		exchangeRateDisplay.classList.remove("show");
	}
}

// Function to handle conversion of the input amount to the output amount
async function handleAmountInput() {
	// Get the current time in milliseconds
	const currentTime = new Date().getTime();
	// Check if both select inputs have a currency selected
	if (currencySelectInput.value != "" && currencySelectOutput.value != "") {
		// Get the first three letters of the selected currencies
		const inputCurrency = currencySelectInput.value.slice(0, 3);
		const outputCurrency = currencySelectOutput.value.slice(0, 3);
		// Check if the selected currencies are different
		if (inputCurrency !== outputCurrency) {
			// Check if the exchange rate between the two currencies is already in the list
			const foundEntry = exchangeRateList.some(
				(entry) =>
					(entry.inputCurrency === inputCurrency &&
						entry.outputCurrency === outputCurrency) ||
					(entry.inputCurrency === outputCurrency &&
						entry.outputCurrency === inputCurrency)
			);
			let timeSinceEntry;
			// If the exchange rate is in the list, check if it is older than 24 hours
			if (foundEntry) {
				timeSinceEntry = currentTime - foundEntry.date;
			}
			// If the exchange rate is not in the list or is older than 24 hours, fetch the exchange rate from the API
			if (!foundEntry || timeSinceEntry > 86400000) {
				try {
					const response = await fetch(
						`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${inputCurrency}/${outputCurrency}`
					);
					const data = await response.json();
					const exchangeRate = data.conversion_rate;

					// Add the new exchange rate to the list, store it in local storage and add it to exchangeRateList
					const newEntry = {
						inputCurrency: inputCurrency,
						outputCurrency: outputCurrency,
						exchangeRate: exchangeRate,
						date: new Date().getTime(),
					};
					exchangeRateList.push(newEntry);
					localStorage.setItem(
						"exchangeRateList",
						JSON.stringify(exchangeRateList)
					);
					currentExchangeRate = exchangeRate;

					// Update the output amount
					if (amountInput.value != "") {
						amountOutput.value = (
							parseFloat(amountInput.value) * exchangeRate
						).toFixed(2);
					}
				} catch (error) {
					console.error("Error fetching exchange rate:", error);
				}
			} else {
				//console.log("Existing entry");
				// If the exchange rate is in the list and is not older than 24 hours, get the exchange rate from the list
				const entrySame = exchangeRateList.find(
					(entry) =>
						(entry.inputCurrency === inputCurrency &&
							entry.outputCurrency === outputCurrency) ||
						(entry.inputCurrency === outputCurrency &&
							entry.outputCurrency === inputCurrency)
				);
				let exchangeRate;
				// Check if the input currency is the same as the first currency in the list entry, otherwise invert the exchange rate
				if (entrySame.inputCurrency === inputCurrency) {
					exchangeRate = entrySame.exchangeRate;
				} else {
					exchangeRate = 1 / entrySame.exchangeRate;
				}
				currentExchangeRate = exchangeRate;
				// Update the output amount
				amountOutput.value = (
					parseFloat(amountInput.value) * exchangeRate
				).toFixed(2);
			}
		} else {
			//console.log("Same currency");
			currentExchangeRate = 1;
			// If the input and output currencies are the same, set the output amount to the input amount
			amountOutput.value = amountInput.value;
		}
		// Display the exchange rate between the two currencies
		displayExchangeRate(inputCurrency, outputCurrency, currentExchangeRate);
	} else {
		//console.log("No currency selected");
		amountOutput.value = "";
		// If no currency is selected, hide the exchange rate display
		displayExchangeRate("", "", 0);
	}
}

// Event listener to prevent invalid characters in the input field
amountInput.addEventListener("keypress", function (event) {
	if (invalidChars.includes(event.key)) {
		event.preventDefault();
	}
});
// Event listeners for the input fields and select inputs to calculate the output amount
amountInput.addEventListener("input", handleAmountInput);
currencySelectInput.addEventListener("change", handleAmountInput);
currencySelectOutput.addEventListener("change", handleAmountInput);

// Event listeners to add the invalid class to the select inputs if no currency is selected
currencySelectInput.addEventListener("change", function () {
	if (currencySelectInput.value == "") {
		currencySelectInput.classList.add("invalid");
	} else currencySelectInput.classList.remove("invalid");
});

currencySelectOutput.addEventListener("change", function () {
	if (currencySelectOutput.value == "") {
		currencySelectOutput.classList.add("invalid");
	} else currencySelectOutput.classList.remove("invalid");
});
