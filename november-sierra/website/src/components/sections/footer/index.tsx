import { GITHUB_ICON_PATH } from "@/lib/constants";

export const Footer: React.FC = () => {
  return (
    <footer className="px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <a
          aria-label="GitHub"
          className="github-link text-ns-text-muted transition-colors duration-200"
          href="https://github.com/mmcxii/november-sierra"
          rel="noopener noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" fill="currentColor" height={24} viewBox="0 0 24 24" width={24}>
            <path d={GITHUB_ICON_PATH} />
          </svg>
        </a>

        <p className="text-ns-footer-text text-center text-sm">
          {"\u00A9 2026 November Sierra \u00B7 Built in the Pacific Northwest"}
        </p>
      </div>
    </footer>
  );
};
