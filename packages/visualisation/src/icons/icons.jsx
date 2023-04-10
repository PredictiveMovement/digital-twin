import React from 'react'

const Rabbit = (props) => {
  return (
    <svg
      width={26}
      height={27}
      viewBox="0 0 26 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.293 3.882c-2.754-2.364-8.89-6.106-11.404-2.155-1.601 2.517.878 2.235 3.825 1.9 2.837-.321 6.107-.693 6.59 1.333.989 4.13-6.015 2.334-7.9 1.616-1.886-.718-6.017.718-6.914 4.849a10.327 10.327 0 00-.242 1.817 2.156 2.156 0 10.025.917c.138 1.404.718 2.096 1.114 2.294 1.497.18 4.544.664 4.76 1.167.269.629-.36 2.065-1.437 2.784-1.078.718-.09 1.706.898 1.616 1.077 0 3.86 0 4.49.988.146.23.307.515.481.82.57 1.006 1.275 2.247 2.032 2.592.79.359 1.826.389 2.245.359.628-1.317.7-4.382-4.04-6.106 4.74-1.868 5.626-7.542 5.477-10.146 1.796 1.796 4.759.718 5.118.27.359-.45.449-2.066 0-3.952-.36-1.508-3.682-2.753-5.118-2.963z"
        fill="#fff"
      />
      <path
        d="M13.648 11.515c1.946 1.077 4.633 4.292-.18 8.53"
        stroke="#fff"
        strokeLinecap="round"
      />
      <circle cx={23.705} cy={8.372} r={0.898} fill="#fff" />
    </svg>
  )
}

const Snail = (props) => {
  return (
    <svg
      width={39}
      height={24}
      viewBox="0 0 39 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx={16.5} cy={10.5} r={9.5} fill="#fff" />
      <path
        d="M31.5 5.5c-2.167 5.333-7.5 17-15.5 16-12.492-1.562-14 0-14 0"
        stroke="#fff"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path d="M30 1l2 3.5L38 1" stroke="#fff" strokeLinecap="round" />
    </svg>
  )
}

export { Rabbit, Snail }
