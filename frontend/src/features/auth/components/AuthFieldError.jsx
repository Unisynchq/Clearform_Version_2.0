const AuthFieldError = ({ id, message }) => {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[12px] text-[#c74e43] leading-[18px]">
      {message}
    </p>
  );
};

export default AuthFieldError;
