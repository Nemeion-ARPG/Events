class RandomItemRoller {
    constructor(items) {
        this.items = items;
    }

    getWeightedRandomItem(items) {
        console.log('getWeightedRandomItem called with items:', items);
        
        // Filter valid items first
        const validItems = items.filter(item => item.name && item.link);
        console.log('Valid items after filtering:', validItems);
        
        if (validItems.length === 0) {
            console.error('No valid items found with name and link');
            return null;
        }

        // Calculate total weight
        const totalWeight = validItems.reduce((sum, item) => sum + item.weight, 0);
        console.log('Total weight:', totalWeight);
        
        // Get a random value within the total weight
        let random = Math.random() * totalWeight;
        console.log('Random value:', random);
        
        let cumulativeWeight = 0;
        
        // Find the item that corresponds to this weight using cumulative probability
        for (const item of validItems) {
            cumulativeWeight += item.weight;
            console.log('Current cumulative weight:', cumulativeWeight, 'for item:', item.name);
            if (random <= cumulativeWeight) {
                console.log('Selected item:', item);
                return item;
            }
        }
        
        // Fallback to last item (shouldn't happen due to cumulative weights)
        console.log('Falling back to last item');
        return validItems[validItems.length - 1];
    }

    rollMultiple(category) {
        console.log('Starting rollMultiple for category:', category);
        console.log('Initial items array:', this.items);
        
        if (this.items.length === 0) {
            console.error('No items available in main list');
            return ["No items available"];
        }

        const results = [];
        
        // Get currency items (1-10 items)
        const currencyCategory = category + 'currency';
        console.log('Attempting to roll currency from:', currencyCategory);
        console.log('Currency list:', itemLists[currencyCategory]);
        
        // Roll for currency item
        const currencyItem = this.getWeightedRandomItem(itemLists[currencyCategory]);
        console.log('Rolled currency item:', currencyItem);
        
        if (currencyItem) {
            // Generate random amount between 1 and 10
            const currencyAmount = Math.floor(Math.random() * 10) + 1;
            // Add the same currency item multiple times based on the random amount
            for (let i = 0; i < currencyAmount; i++) {
                results.push(currencyItem);
            }
        }

        // Get 1-2 regular festival items
        const festivalItemCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < festivalItemCount; i++) {
            const festivalItem = this.getWeightedRandomItem(this.items);
            if (festivalItem) {
                results.push(festivalItem);
            }
        }
        
        return results;
    }
}

function getRandomWeightedMessage(category, messageType) {
    const categoryData = categoryMessages[category];
    const messages = categoryData?.[messageType];

    if (!messages || messages.length === 0) {
        return "No message available.";
    }

    const weightedArray = [];
    messages.forEach(message => {
        for (let i = 0; i < message.weight; i++) {
            weightedArray.push(message.text);
        }
    });

    const randomIndex = Math.floor(Math.random() * weightedArray.length);
    return weightedArray[randomIndex];
}

function rollItem() {
    console.log('Starting roll process...');
    const selectedCategory = document.querySelector('input[name="category"]:checked').value;
    const selectedMessageType = document.querySelector('input[name="subcategory"]:checked')?.value;
    
    console.log('Selected category:', selectedCategory);
    console.log('Selected message type:', selectedMessageType);
    
    // Use the selected category for items
    const itemCategory = selectedCategory;

    // Make sure we have both regular and currency lists
    const currencyCategory = itemCategory + 'currency';
    console.log('Checking lists...');
    console.log('Main list:', itemLists[itemCategory]);
    console.log('Currency list:', itemLists[currencyCategory]);
    
    if (!itemLists[itemCategory]) {
        console.error('No main item list found for category:', itemCategory);
        return;
    }
    if (!itemLists[currencyCategory]) {
        console.error('No currency list found for category:', currencyCategory);
        return;
    }
    // Validate that both lists have items
    if (itemLists[itemCategory].length === 0) {
        console.error('Main item list is empty for category:', itemCategory);
        return;
    }
    if (itemLists[currencyCategory].length === 0) {
        console.error('Currency list is empty for category:', currencyCategory);
        return;
    }
    
    const roller = new RandomItemRoller(itemLists[itemCategory]);
    let message = getRandomWeightedMessage(selectedCategory, selectedMessageType);
    
    // Get the custom prefix if it exists
    const customPrefix = document.getElementById('customPrefix').value.trim();
    if (customPrefix) {
        // Add the custom prefix in bold and a space before the message
        message = `<strong>${customPrefix}</strong> ${message}`;
    }

    // Count duplicates
    const itemCounts = roller.rollMultiple(itemCategory).reduce((acc, item) => {
        acc[item.name] = acc[item.name] || { count: 0, link: item.link };
        acc[item.name].count++;
        return acc;
    }, {});

    // Convert counted items to HTML
    const rolledItems = Object.entries(itemCounts)
        .map(([name, data]) => {
            const countText = `x ${data.count} &nbsp;`; // Always show count, even for single items
            return `- &nbsp; ${countText} <a href="${data.link}" target="_blank">${name}</a><br>`;
        })
        .join("");
    
    const resultHtml = `
        <p><i>${message}</i></p>
        <br>
        ${rolledItems}<p><strong>Don't forget to redeem your items!</strong></p>
    `;
    document.getElementById("result").innerHTML = resultHtml + `
        <button onclick="copyResults()" class="copy-button">Copy Results</button>
    `;
}

function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.toggle('show');
}

function toggleSecondaryDropdown() {
    const dropdown = document.getElementById('secondaryDropdown');
    dropdown.classList.toggle('show');
}

function updateSecondaryDropdown(category) {
    const secondaryMenu = document.getElementById('secondaryDropdownMenu');
    
    // Clear previous options
    secondaryMenu.innerHTML = '';
    
    // Get available message categories for the selected category
    const messageCategories = categoryMessages[category] || {};
    const options = Object.keys(messageCategories).map(key => {
        // Format the label to be more user-friendly
        let label = key.charAt(0).toUpperCase() + key.slice(1);  // Capitalize first letter
        // Replace specific strings with more friendly names
        switch(key) {
            case 'harvestfestival':
                label = 'Festival Participation';
                break;
            case 'harvestcurrency':
                label = 'Currency Collection';
                break;
            default:
                // For others, just replace camelCase with spaces and capitalize
                label = label.replace(/([A-Z])/g, ' $1').trim();
        }
        return {
            value: key,
            label: label
        };
    });
    
    if (options.length === 0) {
        // If no category is selected, show the placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = 'Please select a category first';
        secondaryMenu.appendChild(placeholder);
    } else {
        // Add options to secondary dropdown
        options.forEach(option => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'subcategory';
            input.value = option.value;
            label.appendChild(input);
            label.appendChild(document.createTextNode(' ' + option.label));
            secondaryMenu.appendChild(label);
        });
        
        // Select first option by default
        if (secondaryMenu.querySelector('input')) {
            secondaryMenu.querySelector('input').checked = true;
        }
    }
}

function copyResults() {
    const resultDiv = document.getElementById("result");
    const htmlContent = resultDiv.innerHTML.replace(/<button.*?<\/button>/g, ''); // Remove the copy button from copied content
    
    // Create a Blob with HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const plainText = resultDiv.innerText.replace('Copy Results', '').trim(); // Remove button text
    
    // Create a ClipboardItem with both HTML and plain text formats
    const data = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([plainText], { type: 'text/plain' })
    });
    
    navigator.clipboard.write([data]).then(() => {
        const copyButton = resultDiv.querySelector('.copy-button');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy content: ', err);
        // Fallback to plain text if HTML copy fails
        navigator.clipboard.writeText(plainText).then(() => {
            const copyButton = resultDiv.querySelector('.copy-button');
            copyButton.textContent = 'Copied (Plain Text)';
            setTimeout(() => {
                copyButton.textContent = 'Copy Results';
            }, 2000);
        });
    });
}

document.addEventListener('click', function (e) {
    const primaryDropdown = document.querySelector('.dropdown');
    const secondaryDropdown = document.getElementById('secondaryDropdown');
    
    if (!primaryDropdown.contains(e.target)) {
        primaryDropdown.classList.remove('show');
    }
    
    if (secondaryDropdown && !secondaryDropdown.contains(e.target)) {
        secondaryDropdown.classList.remove('show');
    }
});
  