const apiKey = "792a3a8ac28a9b582972ca94";
let exchangeRateList =
	JSON.parse(localStorage.getItem("exchangeRateList")) || [];
let currentExchangeRate;
const amountInput = document.getElementById("amountInput");
const amountOutput = document.getElementById("amountOutput");
const currencySelectInput = document.getElementById("deviseInput");
const currencySelectOutput = document.getElementById("deviseOutput");

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

async function handleAmountInput() {
	const currentTime = new Date().getTime();
	if (currencySelectInput.value != "" && currencySelectOutput.value != "") {
		const inputCurrency = currencySelectInput.value.slice(0, 3);
		const outputCurrency = currencySelectOutput.value.slice(0, 3);
		if (inputCurrency !== outputCurrency) {
			const foundEntry = exchangeRateList.some(
				(entry) =>
					(entry.inputCurrency === inputCurrency &&
						entry.outputCurrency === outputCurrency) ||
					(entry.inputCurrency === outputCurrency &&
						entry.outputCurrency === inputCurrency)
			);
			let timeSinceEntry;
			if (foundEntry) {
				timeSinceEntry = currentTime - foundEntry.date;
			}
			if (!foundEntry || timeSinceEntry > 86400000) {
				try {
					const response = await fetch(
						`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${inputCurrency}/${outputCurrency}`
					);
					const data = await response.json();
					const exchangeRate = data.conversion_rate;

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
					if (amountInput.value != "") {
						amountOutput.value = (
							parseFloat(amountInput.value) * exchangeRate
						).toFixed(2);
					}
				} catch (error) {
					console.error("Error fetching exchange rate:", error);
				}
			} else {
				console.log("Existing entry");
				const entrySame = exchangeRateList.find(
					(entry) =>
						(entry.inputCurrency === inputCurrency &&
							entry.outputCurrency === outputCurrency) ||
						(entry.inputCurrency === outputCurrency &&
							entry.outputCurrency === inputCurrency)
				);
				let exchangeRate;
				if (entrySame.inputCurrency === inputCurrency) {
					exchangeRate = entrySame.exchangeRate;
				} else {
					exchangeRate = 1 / entrySame.exchangeRate;
				}
				amountOutput.value = (
					parseFloat(amountInput.value) * exchangeRate
				).toFixed(2);
			}
		} else {
			console.log("Same currency");
			amountOutput.value = amountInput.value;
		}
	} else {
		console.log("No currency selected");
		amountOutput.value = "";
	}
}

amountInput.addEventListener("input", handleAmountInput);
currencySelectInput.addEventListener("change", handleAmountInput);
currencySelectOutput.addEventListener("change", handleAmountInput);
