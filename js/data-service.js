// data-service.js
// Responsible for loading category JSON files and returning arrays.
// Professional: uses a simple cache so files are fetched once.

const DataService = (function(){
  const basePath = 'data';
  const categories = {
    nature: 'nature.json',
    science: 'science.json',
    society: 'society.json',
    history: 'history.json'
  };

  const cache = {};

  async function fetchCategory(cat) {
    if (!categories[cat]) return [];
    if (cache[cat]) return cache[cat];
    const url = `${basePath}/${categories[cat]}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    const arr = await res.json();
    cache[cat] = arr;
    return arr;
  }

  // when 'all' requested, fetch all categories and merge
  async function fetchAllMixed() {
    const keys = Object.keys(categories);
    const promises = keys.map(k => fetchCategory(k));
    const lists = await Promise.all(promises);
    const merged = lists.flat();
    return merged;
  }

  // public
  return {
    fetchCategory,
    fetchAllMixed,
    categoryKeys: () => Object.keys(categories)
  };
})();
