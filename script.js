const apiKey = "5d99ee095d120b559f4db2db";
let exchangeRateList =
	JSON.parse(localStorage.getItem("exchangeRateList")) || [];
window.addEventListener("load", async () => {
	try {
		const response = await fetch(
			`https://v6.exchangerate-api.com/v6/${apiKey}/codes`
		);
		const data = await response.json();
		const currencies = data.supported_codes;
		console.log(currencies);
		addCurrencyOptions(currencies);
	} catch (error) {
		console.error("Error fetching currencies:", error);
	}
});

function addCurrencyOptions(currencies) {
	const currencySelectInput = document.getElementById("deviseInput");
	const currencySelectOutput = document.getElementById("deviseOutput");
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

document.getElementById("amountInput").addEventListener("input", async () => {
	console.log(document.getElementById("deviseInput").value);
	console.log(exchangeRateList);
	if (
		document.getElementById("deviseInput").value != "" &&
		document.getElementById("deviseOutput").value != ""
	) {
		const inputCurrency = document
			.getElementById("deviseInput")
			.value.slice(0, 3);
		const outputCurrency = document
			.getElementById("deviseOutput")
			.value.slice(0, 3);
		if (
			!exchangeRateList.some(
				(entry) =>
					(entry.inputCurrency === inputCurrency &&
						entry.outputCurrency === outputCurrency) ||
					(entry.inputCurrency === outputCurrency &&
						entry.outputCurrency === inputCurrency)
			)
		) {
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
					date: new Date().toISOString().split("T")[0],
				};
				exchangeRateList.push(newEntry);
				localStorage.setItem(
					"exchangeRateList",
					JSON.stringify(exchangeRateList)
				);

				const amountOutput = document.getElementById("amountOutput");
				amountOutput.innerHTML = (
					document.getElementById("amountInput").value * exchangeRate
				).toFixed(2);
			} catch (error) {
				console.error("Error fetching exchange rate:", error);
			}
		} else {
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
			const amountOutput = document.getElementById("amountOutput");
			amountOutput.innerHTML = (
				document.getElementById("amountInput").value * exchangeRate
			).toFixed(2);
		}
	}
});
