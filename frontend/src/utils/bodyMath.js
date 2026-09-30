// Base reference measurements in inches for the default standard 3D mannequin
const BASE_MEASUREMENTS = {
    bust: 34.0,
    waist: 26.0,
    hips: 36.0,
    height: 65.0
};

export function calculateAvatarScales(userMeasurements) {
    const bust = parseFloat(userMeasurements?.bust) || BASE_MEASUREMENTS.bust;
    const waist = parseFloat(userMeasurements?.waist) || BASE_MEASUREMENTS.waist;
    const hips = parseFloat(userMeasurements?.hips) || BASE_MEASUREMENTS.hips;

    return {
        scaleX: (bust / BASE_MEASUREMENTS.bust + hips / BASE_MEASUREMENTS.hips) / 2,
        scaleY: 1.0,
        scaleZ: waist / BASE_MEASUREMENTS.waist,
        easeDeltas: {
            bustEase: bust - BASE_MEASUREMENTS.bust,
            waistEase: waist - BASE_MEASUREMENTS.waist,
            hipsEase: hips - BASE_MEASUREMENTS.hips
        }
    };
}