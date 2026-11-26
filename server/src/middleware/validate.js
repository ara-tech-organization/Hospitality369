const ApiError = require('../utils/ApiError');

/**
 * Validate req[source] against a zod schema. Replaces the source with the parsed
 * (trimmed / coerced / stripped-of-unknown-keys) value.
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return next(ApiError.badRequest('Please correct the highlighted fields', { fields }));
  }
  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  next();
};

module.exports = validate;
