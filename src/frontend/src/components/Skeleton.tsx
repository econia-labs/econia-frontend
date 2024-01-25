import React, { useEffect, useState } from "react";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
const CustomSkeleton = (props: SkeletonProps) => {
  const [client, setClient] = useState(false);

  useEffect(() => {
    setClient(true);
  }, []);

  if (!client) {
    return null;
  }
  return <Skeleton {...props} />;
};

export default CustomSkeleton;
