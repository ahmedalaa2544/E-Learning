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

export default mergeSort;
