export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      // console.log(error)
      return next(error);
    });
  };
};

export const globalErrorHandler = (error, req, res, next) => {
  return res.status(error.cause || 500).json({
    message: error.message,
    error,
    stack: error.stack,
  });
};
