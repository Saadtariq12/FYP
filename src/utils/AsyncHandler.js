const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)); //if promise not resolve then catch error
  };
};

export { asyncHandler };
