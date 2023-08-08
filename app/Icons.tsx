import { SVGProps, useId } from "react"

export const IconAudio = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="18"
    viewBox="0 0 16 18"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.80489 5.50007H2C1.72386 5.50007 1.5 5.72393 1.5 6.00007V12.0001C1.5 12.2762 1.72386 12.5001 2 12.5001H3.53544L7 15.3347V2.76141L3.80489 5.50007ZM3 14.0001L6.86676 17.1638C7.51969 17.698 8.5 17.2335 8.5 16.3898V1.6743C8.5 0.819942 7.49788 0.359033 6.84921 0.915039L3.25 4.00007H2C0.895431 4.00007 0 4.8955 0 6.00007V12.0001C0 13.1046 0.895431 14.0001 2 14.0001H3Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.0607 7.93941C10.7794 7.65811 10.3978 7.50007 10 7.50007V6.00007C10.7956 6.00007 11.5587 6.31615 12.1213 6.87875C12.6839 7.44136 13 8.20442 13 9.00007C13 9.79572 12.6839 10.5588 12.1213 11.1214C11.5587 11.684 10.7956 12.0001 10 12.0001V10.5001C10.3978 10.5001 10.7794 10.342 11.0607 10.0607C11.342 9.77943 11.5 9.3979 11.5 9.00007C11.5 8.60225 11.342 8.22072 11.0607 7.93941Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.182 5.81809C12.3381 4.97418 11.1935 4.50008 10 4.50008L10 3.00008C11.5913 3.00008 13.1174 3.63222 14.2426 4.75743C15.3679 5.88265 16 7.40878 16 9.00007C16 10.5914 15.3679 12.1175 14.2426 13.2427C13.1174 14.3679 11.5913 15.0001 10 15.0001L10 13.5001C11.1935 13.5001 12.3381 13.026 13.182 12.1821C14.0259 11.3381 14.5 10.1935 14.5 9.00007C14.5 7.8066 14.0259 6.66201 13.182 5.81809Z"
      fill="currentColor"
    />
  </svg>
)

export const IconPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.30469 0.31066C5.7189 0.31066 6.05469 0.646447 6.05469 1.06066L6.05469 4.5533L9.54733 4.5533C9.96154 4.5533 10.2973 4.88909 10.2973 5.3033C10.2973 5.71751 9.96154 6.0533 9.54733 6.0533L6.05469 6.0533V9.54594C6.05469 9.96015 5.7189 10.2959 5.30469 10.2959C4.89047 10.2959 4.55469 9.96015 4.55469 9.54594V6.0533L1.06205 6.0533C0.647833 6.0533 0.312047 5.71751 0.312047 5.3033C0.312047 4.88909 0.647833 4.5533 1.06205 4.5533L4.55469 4.5533L4.55469 1.06066C4.55469 0.646447 4.89047 0.31066 5.30469 0.31066Z"
      fill="currentColor"
    />
  </svg>
)

export const IconDuplicate = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 5.5H4C2.61929 5.5 1.5 6.61929 1.5 8V12C1.5 13.3807 2.61929 14.5 4 14.5H8C9.38071 14.5 10.5 13.3807 10.5 12V8C10.5 6.61929 9.38071 5.5 8 5.5ZM4 4C1.79086 4 0 5.79086 0 8V12C0 14.2091 1.79086 16 4 16H8C10.2091 16 12 14.2091 12 12V8C12 5.79086 10.2091 4 8 4H4Z"
        fill="currentColor"
      />
      <path
        d="M5.25 7.75C5.25 7.33579 5.58579 7 6 7C6.41421 7 6.75 7.33579 6.75 7.75V12.25C6.75 12.6642 6.41421 13 6 13C5.58579 13 5.25 12.6642 5.25 12.25V7.75Z"
        fill="currentColor"
      />
      <path
        d="M8.25 9.25C8.66421 9.25 9 9.58579 9 10C9 10.4142 8.66421 10.75 8.25 10.75H3.75C3.33579 10.75 3 10.4142 3 10C3 9.58579 3.33579 9.25 3.75 9.25H8.25Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.04378 1.5C7.14152 1.5 6.31856 2.01549 5.92481 2.8273L4.57519 2.1727C5.21973 0.843822 6.56684 0 8.04378 0H12C14.2091 0 16 1.79086 16 4V7.98444C16 9.49995 15.1879 10.8993 13.8721 11.6512L13.1279 10.3488C13.9764 9.86397 14.5 8.96167 14.5 7.98444V4C14.5 2.61929 13.3807 1.5 12 1.5H8.04378Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const IconMagic = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
  const filterId = "magic-filter"

  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path
          data-magic-id="circle"
          d="M8.5 12C7.67925 12 7 12.6651 7 13.5C7 14.3349 7.66509 15 8.5 15C9.33491 15 10 14.3349 10 13.5C10 12.6651 9.32075 12 8.5 12Z"
          fill="currentColor"
        />
        <path
          data-magic-id="tiny-circle"
          d="M14.5 17C14.2264 17 14 17.2217 14 17.5C14 17.7783 14.2217 18 14.5 18C14.7783 18 15 17.7783 15 17.5C15 17.2217 14.7736 17 14.5 17Z"
          fill="currentColor"
        />
        <path
          data-magic-id="sparkle"
          d="M19.6604 9.00124L16.3242 7.67725L14.9934 4.34007C14.811 3.88664 14.173 3.88664 13.9907 4.34007L12.678 7.67725L9.34183 9.00124C8.88606 9.1826 8.88606 9.81739 9.34183 9.99876L12.678 11.3228L13.9907 14.6599C14.173 15.1134 14.811 15.1134 14.9934 14.6599L16.306 11.3228L19.6422 9.99876C20.1162 9.81739 20.1162 9.1826 19.6604 9.00124Z"
          fill="currentColor"
        />
        <defs>
          <filter
            id={filterId}
            x="3"
            y="2"
            width="19"
            height="19"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="3.5"
              result="effect1_foregroundBlur_339_100314"
            />
          </filter>
        </defs>
      </svg>
    </>
  )
}