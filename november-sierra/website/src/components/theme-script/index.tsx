export const ThemeScript: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{if(localStorage.getItem("ns-theme")==="fog"){document.documentElement.setAttribute("data-theme","fog")}}catch(e){}})()`,
      }}
      suppressHydrationWarning
    />
  );
};
