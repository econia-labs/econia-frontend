export const ExitIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  id,
}) => {
  return (
    <svg
      width="17"
      height="13"
      viewBox="0 0 17 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      id={id}
    >
      <g clipPath="url(#clip0_5168_6230)">
        <path
          d="M6.79064 6.97449L14.1614 6.95776"
          stroke="white"
          strokeLinecap="square"
        />
        <path
          d="M10.814 3.38672L14.4018 6.97457L10.814 10.5624"
          stroke="white"
          strokeLinecap="square"
        />
      </g>
      <line
        x1="0.858643"
        y1="1.38599"
        x2="9.26695"
        y2="1.38599"
        stroke="white"
      />
      <line x1="0.858643" y1="11.7" x2="9.26695" y2="11.7" stroke="white" />
      <line
        x1="0.957764"
        y1="12.2"
        x2="0.957763"
        y2="0.966275"
        stroke="white"
      />
      <defs>
        <clipPath id="clip0_5168_6230">
          <rect
            width="8.07272"
            height="8.07272"
            fill="white"
            transform="translate(16.3044 6.97437) rotate(135)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
