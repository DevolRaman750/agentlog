/**
 * Utility functions for generating execution run names
 */

/**
 * Generates a clean re-run name with timestamp instead of appending "(Re-run)" infinitely.
 * This prevents database column overflow issues and provides clear timestamps.
 * 
 * Examples:
 * - "My Agent Task" -> "My Agent Task (Re-run 13:45:30)"
 * - "My Agent Task (Re-run)" -> "My Agent Task (Re-run 13:45:30)"
 * - "My Agent Task (Re-run 12:30:15)" -> "My Agent Task (Re-run 13:45:30)"
 * 
 * @param originalName The original execution run name
 * @returns A new name with timestamp-based re-run suffix
 */
export const generateRerunName = (originalName: string): string => {
  const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS format
  
  // Extract the base name by removing any existing "(Re-run...)" or similar suffixes
  const baseNameMatch = originalName.match(/^(.*?)(?:\s*\((?:Re-run|re-run).*\))?$/);
  const baseName = baseNameMatch ? baseNameMatch[1].trim() : originalName;
  
  // Ensure the total length doesn't exceed database limits (varchar(255))
  const suffix = ` (Re-run ${timestamp})`;
  const maxBaseNameLength = 255 - suffix.length;
  const truncatedBaseName = baseName.length > maxBaseNameLength 
    ? baseName.substring(0, maxBaseNameLength).trim() 
    : baseName;
  
  return `${truncatedBaseName}${suffix}`;
};

/**
 * Validates that an execution name will fit in the database column
 * @param name The execution name to validate
 * @returns true if the name is valid, false if it's too long
 */
export const validateExecutionNameLength = (name: string): boolean => {
  return name.length <= 255;
};