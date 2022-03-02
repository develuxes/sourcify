type AppIconNameProps = {
  img?: string;
  name: string;
  href?: string;
  rounded?: boolean;
  children?: string;
  Svg?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
};
const AppIconName = ({ img, name, href, rounded, Svg }: AppIconNameProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col mx-6 my-2 hover:text-ceruleanBlue-500"
    >
      {img && (
        <img
          src={img}
          className={`h-20 self-center transition-opacity ease-in-out p-1 ${
            rounded ? "rounded-full" : ""
          }`}
          alt={`${name} logo`}
        />
      )}
      {Svg && (
        <Svg
          className={`h-20 w-20 self-center transition-opacity ease-in-out p-1 ${
            rounded ? "rounded-full" : ""
          }`}
        />
      )}
      <div className="text-center mt-2 ">{name}</div>
    </a>
  );
};

export default AppIconName;
