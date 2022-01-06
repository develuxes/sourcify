type ButtonProps = {
  children: string;
  href?: string;
  type?: string;
  className?: string;
};
const Button = ({ children, href, type, className }: ButtonProps) => {
  let bg = "bg-ceruleanBlue-500";
  let hoverBg = "hover:bg-ceruleanBlue-600";
  let textColor = "text-white";

  if (type === "secondary") {
    bg = "bg-ceruleanBlue-100";
    hoverBg = "hover:bg-ceruleanBlue-200";
    textColor = "text-ceruleanBlue-500";
  }

  console.log(bg);
  console.log(hoverBg);
  return (
    <button
      className={`mt-4 py-3 px-4 ${bg} ${hoverBg} disabled:hover:bg-ceruleanBlue-500 focus:ring-ceruleanBlue-300 focus:ring-offset-ceruleanBlue-100 ${textColor} transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg disabled:opacity-50 disabled:cursor-default uppercase ${className}`}
    >
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      ) : (
        { children }
      )}
    </button>
  );
};

export default Button;
