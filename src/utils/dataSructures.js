/**
 * Perform a merge sort on an array of objects based on a specified property.
 *
 * @param {Array} arr - The array to be sorted.
 * @param {string} sortBy - The property by which the objects should be sorted.
 * @returns {Array} - The sorted array.
 */
export const mergeSort = (arr, sortBy) => {
  // Base case: If the array has 1 or 0 elements, it is already sorted
  if (arr.length <= 1) return arr;

  // Find the middle index of the array
  let mid = Math.floor(arr.length / 2);

  // Recursively sort the left and right halves of the array
  let left = mergeSort(arr.slice(0, mid), sortBy);
  let right = mergeSort(arr.slice(mid), sortBy);

  // Merge the sorted left and right halves
  return merge(left, right, sortBy);
};

/**
 * Merge two arrays of objects based on a specified property for sorting.
 *
 * @param {Array} left - The left array to merge.
 * @param {Array} right - The right array to merge.
 * @param {string} sortBy - The property by which the objects should be sorted.
 * @returns {Array} - The merged and sorted array.
 */
const merge = (left, right, sortBy) => {
  let sortedArr = [];

  // Continue merging until one of the arrays is empty
  while (left.length && right.length) {
    // Compare objects based on the specified property for sorting
    if (left[0][sortBy] < right[0][sortBy]) {
      sortedArr.push(left.shift());
    } else {
      sortedArr.push(right.shift());
    }
  }

  // Add the remaining elements from both arrays to the result
  return [...sortedArr, ...left, ...right];
};

/**
 * Perform a merge sort on an array of objects based on a specified property in descending order.
 *
 * @param {Array} arr - The array to be sorted.
 * @param {string} sortBy - The property by which the objects should be sorted.
 * @returns {Array} - The sorted array.
 */
export const mergeSortDescending = (arr, sortBy) => {
  // Base case: If the array has 1 or 0 elements, it is already sorted
  if (arr.length <= 1) return arr;

  // Find the middle index of the array
  let mid = Math.floor(arr.length / 2);

  // Recursively sort the left and right halves of the array
  let left = mergeSortDescending(arr.slice(0, mid), sortBy);
  let right = mergeSortDescending(arr.slice(mid), sortBy);

  // Merge the sorted left and right halves
  return mergeDescending(left, right, sortBy);
};

/**
 * Merge two arrays of objects based on a specified property for sorting in descending order.
 *
 * @param {Array} left - The left array to merge.
 * @param {Array} right - The right array to merge.
 * @param {string} sortBy - The property by which the objects should be sorted.
 * @returns {Array} - The merged and sorted array.
 */
const mergeDescending = (left, right, sortBy) => {
  let sortedArr = [];

  // Continue merging until one of the arrays is empty
  while (left.length && right.length) {
    // Compare objects based on the specified property for sorting in descending order
    if (left[0][sortBy] > right[0][sortBy]) {
      sortedArr.push(left.shift());
    } else {
      sortedArr.push(right.shift());
    }
  }

  // Add the remaining elements from both arrays to the result
  return [...sortedArr, ...left, ...right];
};

/**
 * Find the maximum value of a specified property within an array of objects.
 *
 * @param {Array} arr - The array of objects to search.
 * @param {string} prop - The property within each object to find the maximum value of.
 * @returns {number} - The maximum value found for the specified property, or 0 if the array is empty.
 */
export const findMax = (arr, prop) => {
  // Initialize max to 0 to handle the case of an empty array.
  let max = 0;

  // Iterate through each element in the array.
  for (const element of arr) {
    // Compare the specified property of the current element with the current max value.
    if (element[prop] > max) {
      // If the property value is greater, update the max value.
      max = element[prop];
    }
  }

  // Return the maximum value found for the specified property.
  return max;
};

export const calculateDuration = (str) => {
  // Split the string into an array of words
  const wordsArray = str.split(/\s+/);

  // Filter out empty strings (in case of consecutive spaces)
  const filteredWordsArray = wordsArray.filter((word) => word.length > 0);

  let duration = filteredWordsArray.length / 200;
  if (duration < 1) {
    duration = 1;
  }
  // Return the duration of words
  return duration;
};

export default mergeSort;
