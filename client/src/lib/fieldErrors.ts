// Field name -> first error message, e.g. { title: 'Title is required' }.
// Produced by validate() in the browser and by the API's 400 responses.
export type FieldErrors = Record<string, string>;
