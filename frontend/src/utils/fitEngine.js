// Map letter sizes to numerical scale for weighted average calculations
const SIZE_WEIGHTS = {
    'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'PLUS': 7
};

const NUM_TO_SIZE = {
    1: 'XXS', 2: 'XS', 3: 'S', 4: 'M', 5: 'L', 6: 'XL', 7: 'PLUS'
};

/**
 * Calculates consensus predicted size based on array of reference items
 */
export function calculatePredictedSize(fitItems = []) {
    if (!fitItems || fitItems.length === 0) return 'S'; // Default baseline

    // Count frequency of letter sizes vs denim waist sizes
    const letterWeights = [];
    const waistSizes = [];

    fitItems.forEach(item => {
        const sz = (item.size || '').toUpperCase().trim();
        if (SIZE_WEIGHTS[sz]) {
            letterWeights.push(SIZE_WEIGHTS[sz]);
        } else if (!isNaN(parseInt(sz))) {
            waistSizes.push(parseInt(sz));
        }
    });

    if (letterWeights.length === 0) return 'S';

    // Compute average size weight
    const avgWeight = Math.round(
        letterWeights.reduce((a, b) => a + b, 0) / letterWeights.length
    );

    return NUM_TO_SIZE[avgWeight] || 'S';
}

/**
 * Compares an item's size against the user's predicted consensus size
 */
export function evaluateFitCompatibility(itemSize, predictedSize) {
    const normItem = (itemSize || 'S').toUpperCase().trim();
    const normPred = (predictedSize || 'S').toUpperCase().trim();

    if (normItem === normPred) {
        return { isIdeal: true, message: `✓ FIT PREDICTOR: Ideal fit for your baseline (Size ${normItem})` };
    }

    const itemWeight = SIZE_WEIGHTS[normItem] || 3;
    const predWeight = SIZE_WEIGHTS[normPred] || 3;

    if (itemWeight < predWeight) {
        return { isIdeal: false, message: `⚠️ FIT PREDICTOR: Not ideal — item is Size ${normItem} (may run smaller than your baseline Size ${normPred})` };
    } else {
        return { isIdeal: false, message: `⚠️ FIT PREDICTOR: Not ideal — item is Size ${normItem} (may run larger than your baseline Size ${normPred})` };
    }
}