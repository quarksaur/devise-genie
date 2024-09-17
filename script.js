const apiKey = "";
let exchangeRateList =
	JSON.parse(localStorage.getItem("exchangeRateList")) || [];
let currentExchangeRate;
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

document.getElementById("swap_button").addEventListener("click", () => {
	const inputCurrency = document.getElementById("deviseInput").value;
	const outputCurrency = document.getElementById("deviseOutput").value;
	document.getElementById("deviseInput").value = outputCurrency;
	document.getElementById("deviseOutput").value = inputCurrency;
	if (inputCurrency && outputCurrency) {
		console.log(document.getElementById("amountOutput").value);
		document.getElementById("amountInput").value = parseFloat(
			document.getElementById("amountOutput").innerHTML
		);
		if (currentExchangeRate !== undefined) {
			currentExchangeRate = 1 / currentExchangeRate;
		}
		handleAmountInput();
	}
});

async function handleAmountInput() {
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
		if (inputCurrency !== outputCurrency) {
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
				const amountOutput = document.getElementById("amountOutput");
				amountOutput.innerHTML = (
					document.getElementById("amountInput").value * exchangeRate
				).toFixed(2);
			}
		} else {
			console.log("Same currency");
			document.getElementById("amountOutput").innerHTML =
				document.getElementById("amountInput").value;
		}
	} else {
		console.log("No currency selected");
		document.getElementById("amountOutput").innerHTML = "Converted result";
	}
}

document
	.getElementById("amountInput")
	.addEventListener("input", handleAmountInput);

document
	.getElementById("deviseInput")
	.addEventListener("change", handleAmountInput);
document
	.getElementById("deviseOutput")
	.addEventListener("change", handleAmountInput);
