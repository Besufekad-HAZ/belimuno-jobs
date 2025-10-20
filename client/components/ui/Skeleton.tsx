import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The width of the skeleton. Defaults to '100%'.
   */
  width?: string | number;
  /**
   * The height of the skeleton. Defaults to '1em'.
   */
  height?: string | number;
  /**
   * The shape of the skeleton. 'rect' for rectangle (default), 'circle' for circle.
   */
  shape?: 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1em',
  shape = 'rect',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-md';

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${shapeClass} ${className}`}
      style={baseStyles}
      {...props}
    />
  );
};

export { Skeleton };
export default Skeleton;