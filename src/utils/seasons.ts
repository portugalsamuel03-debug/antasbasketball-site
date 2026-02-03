export const generateSeasonOptions = (startYear = 2015, endYear = 2035) => {
    const seasons = [];
    for (let year = startYear; year < endYear; year++) {
        seasons.push(`${year}/${year + 1}`);
    }
    return seasons.reverse(); // Newest first
};

export const SEASON_OPTIONS = generateSeasonOptions();
