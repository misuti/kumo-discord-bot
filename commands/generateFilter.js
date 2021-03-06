const getEqualFilter = (child, value) => obj => obj[child] && obj[child].toUpperCase().trim() === value.toUpperCase().trim(); // = operator
const getIncludeFilter = (child, value) => obj => obj[child] && obj[child].toUpperCase().includes(value.toUpperCase()); // includes operator
const getNameFilter = (filterGen, value) => {
    let filters = [];
    for (let lang of ["code", "en", "cn", "jp", "kr"]) filters.push(filterGen(lang, value));
    return obj => {
        for (let filter of filters) if (filter(obj.names)) return true;
        return false;
    };
};

const METHOD_INDEX = {
    'equals': getEqualFilter,
    '=': getEqualFilter,
    'includes': getIncludeFilter,
    '>': getIncludeFilter,
};

function generateFilter(raw) {
    let args = raw.toLowerCase().trim().replace(/\s{2,}/g, ' ').split(/, ?/g);
    let filters = [];
    for (let arg of args) {
        if (!arg) continue; // Empty string
        let groups = arg.match(/(?<name>name|nationality|rarity|id|class|hullType)\s*(?<method>=|equals|includes|>)\s*(?<value>(?:[^\s\\]|\\\s)+)/);
        if (!groups) continue; // Empty match
        groups = groups.groups;
        if (!groups.name || !groups.method || !groups.value) continue; // Not enough params
        groups.value = groups.value.replace(/\\ /g, ' '); // Unescape
        let filterGen = METHOD_INDEX[groups.method];
        if (!filterGen) continue; // This should not be possible
        if (groups.name === "name") filters.push(getNameFilter(filterGen, groups.value));
        else filters.push(filterGen(groups.name, groups.value));
    }
    return obj => {
        for (let filter of filters)
            if (!filter(obj)) return false;
        return true;
    };
}

exports.generateFilter = generateFilter;
