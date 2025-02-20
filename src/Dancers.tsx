import { HTMLProps } from "react";

const sqrt3 = Math.sqrt(3);

export function Lark({
  scale,
  label,
  fill,
  ...props
}: HTMLProps<SVGSVGElement> & {
  label: string;
  fill?: string;
  scale: number;
}) {
  // empty red-bordered circle with radial red line
  return (
    <svg width={scale} height={scale} {...props}>
      <circle
        cx={scale / 2}
        cy={scale / 2}
        r={scale / 2}
        stroke="red"
        strokeWidth=""
        fill={fill}
      />
      <line
        x1={scale / 2}
        y1={scale / 2}
        x2={scale}
        y2={scale / 2}
        stroke="red"
        strokeWidth="2"
      />
      <text
        x={scale / 2}
        y={scale / 2}
        textAnchor="middle"
        dominantBaseline="hanging"
        fontSize="10"
        fill="red"
      >
        {label}
      </text>
    </svg>
  );
}

export function Robin({
  scale,
  label,
  fill,
  ...props
}: HTMLProps<SVGSVGElement> & {
  label: string;
  fill?: string;
  scale: number;
}) {
  // empty blue-bordered equilateral triangle with blue line from center to top
  return (
    <svg width={scale} height={scale} {...props}>
      <polygon
        points={`${scale},${scale / 2} ${scale / 4},${
          scale / 2 + (scale / 4) * sqrt3
        } ${scale / 4},${scale / 2 - (scale / 4) * sqrt3}`}
        stroke="blue"
        strokeWidth="1"
        fill={fill}
      />
      <line
        x1={scale / 2}
        y1={scale / 2}
        x2={scale}
        y2={scale / 2}
        stroke="blue"
        strokeWidth="2"
      />
      <text
        x={scale / 2}
        y={scale / 2}
        textAnchor="middle"
        dominantBaseline="hanging"
        fontSize="10"
        fill="blue"
      >
        {label}
      </text>
    </svg>
  );
}
