"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface User {
  userImage: string;
  id?: string | number;
}

interface CircularUserImagesProps {
  users: User[];
  size?: number; // Size of each image in pixels
  radius?: number; // Radius of the circle in pixels
}

export default function CircularUserImages({
  users,
  size = 64,
  radius = 120,
}: CircularUserImagesProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev - 0.5) % 360); // Counterclockwise rotation
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  if (!users || users.length === 0) {
    return null;
  }

  const angleStep = (2 * Math.PI) / users.length;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: `${radius * 2 + size}px`,
        height: `${radius * 2 + size}px`,
      }}
    >
      {users.map((user, index) => {
        const baseAngle = index * angleStep - Math.PI / 2;
        const currentAngle = baseAngle + (rotation * Math.PI) / 180;
        const x = radius * Math.cos(currentAngle) + radius;
        const y = radius * Math.sin(currentAngle) + radius;

        // Rotate image based on its position on the circle
        // At top (angle = -90°): rotation = 0° (upright)
        // At right (angle = 0°): rotation = 90°
        // At bottom (angle = 90°): rotation = 180° (upside down)
        // At left (angle = 180°): rotation = 270°
        const rotationDeg = (currentAngle * 180) / Math.PI + 90;

        return (
          <div
            key={user.id || index}
            className="absolute hover:scale-110 hover:z-10"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: `rotate(${rotationDeg}deg)`,
            }}
          >
            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
              <Image
                src={user.userImage}
                alt="User avatar"
                fill
                className="object-cover"
                sizes={`${size}px`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
