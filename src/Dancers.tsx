import { HTMLProps } from "react";

const sqrt3 = Math.sqrt(3);

export function Lark({
  pxPerPace,
  label,
  fill,
  ...props
}: HTMLProps<SVGSVGElement> & {
  label: string;
  fill?: string;
  pxPerPace: number;
}) {
  // empty red-bordered circle with radial red line
  return (
    <svg width={pxPerPace} height={pxPerPace} {...props}>
      <circle
        cx={pxPerPace / 2}
        cy={pxPerPace / 2}
        r={pxPerPace / 2}
        stroke="red"
        strokeWidth=""
        fill={fill}
      />
      <line
        x1={pxPerPace / 2}
        y1={pxPerPace / 2}
        x2={pxPerPace}
        y2={pxPerPace / 2}
        stroke="red"
        strokeWidth="2"
      />
      <text
        x={pxPerPace / 2}
        y={pxPerPace / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="red"
      >
        {label}
      </text>
    </svg>
  );
}

export function Robin({
  pxPerPace,
  label,
  fill,
  ...props
}: HTMLProps<SVGSVGElement> & {
  label: string;
  fill?: string;
  pxPerPace: number;
}) {
  // empty blue-bordered equilateral triangle with blue line from center to top
  return (
    <svg width={pxPerPace} height={pxPerPace} {...props}>
      <polygon
        points={`${pxPerPace},${pxPerPace / 2} ${pxPerPace / 4},${
          pxPerPace / 2 + (pxPerPace / 4) * sqrt3
        } ${pxPerPace / 4},${pxPerPace / 2 - (pxPerPace / 4) * sqrt3}`}
        stroke="blue"
        strokeWidth="1"
        fill={fill}
      />
      <line
        x1={pxPerPace / 2}
        y1={pxPerPace / 2}
        x2={pxPerPace}
        y2={pxPerPace / 2}
        stroke="blue"
        strokeWidth="2"
      />
      <text
        x={pxPerPace / 2}
        y={pxPerPace / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="blue"
      >
        {label}
      </text>
    </svg>
  );
}
