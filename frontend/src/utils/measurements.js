// frontend/src/utils/measurements.js

export const convertBraToInches = (braSizeInput) => {
    // Matches patterns like "36C", "32DD"
    const match = braSizeInput.toUpperCase().trim().match(/(\d+)([A-Z]+)/);

    if (!match) return null; // Invalid format

    const band = parseInt(match[1]);
    const cup = match[2];

    const cupValues = {
        'AA': 0.5, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'DD': 5, 'E': 6, 'F': 7
    };

    const cupAdded = cupValues[cup] || 2; // Default to B cup if unknown

    return band + cupAdded; // e.g., 36 + 3 (C) = 39 inches
}