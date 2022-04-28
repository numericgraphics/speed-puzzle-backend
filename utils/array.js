exports.getCollectionPropertyValue = (arr, property) => {
    return arr.map(a => a[property]);
}